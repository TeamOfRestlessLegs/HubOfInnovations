from typing import Annotated

import openai
from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import JSONResponse

from core.deps import Analyzer, Innovations, Store
from core.vector_store import InnovationNotFound
from model.analysis import (
    AmbiguousNameResponse, AnalysisByNameRequest, BenchmarkRequest, Candidate, Comparison, InnovationAnalysis,
)
from model.innovations import SearchRequest, SearchResponse

innovationsRoute = APIRouter(prefix="/innovations", tags=["innovations"])

Slug = Annotated[str, Path(pattern=r"^[a-z0-9-]+$", max_length=200)]


@innovationsRoute.post("/search", response_model=SearchResponse)
async def searchInnovations(body: SearchRequest, store: Store, innovations: Innovations) -> SearchResponse:
    """Wyszukiwanie semantyczne — innowacje z cytatami, opisem i linkami (z serwisu innovations)."""
    results = await store.search(body.query, body.limit, body.category)
    details_available = await innovations.enrich(results) if body.include_details else True
    return SearchResponse(results=results, details_available=details_available)


@innovationsRoute.get("/{category}/{slug}/similar", response_model=SearchResponse)
async def similarInnovations(
    category: Slug,
    slug: Slug,
    store: Store,
    innovations: Innovations,
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
    include_details: bool = True,
) -> SearchResponse:
    """Innowacje podobne do wskazanej (np. /innovations/dla-seniorow/kody-qr-na-pomoc-seniorom/similar)."""
    try:
        results = await store.similar(f"{category}/{slug}", limit)
    except InnovationNotFound:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono innowacji {category}/{slug}")
    details_available = await innovations.enrich(results) if include_details else True
    return SearchResponse(results=results, details_available=details_available)


# ---------------------------------------------------------------------- analizy (core/analyzer.py)

NAME_MATCH_MIN_GAP = 0.15  # o ile pierwszy wynik musi wyprzedzać drugi, żeby uznać nazwę za jednoznaczną

AMBIGUOUS = {409: {"model": AmbiguousNameResponse,
                   "description": "Nazwa pasuje do kilku innowacji — wybierz jedną z `candidates`"}}


@innovationsRoute.post("/analysis", response_model=InnovationAnalysis, responses=AMBIGUOUS)
async def analyzeInnovationByName(body: AnalysisByNameRequest, store: Store, analyzer: Analyzer):
    """Analiza innowacji po nazwie: jak powstała, jakie środki wykorzystała, gdzie była realizowana."""
    resolved = await _resolve_name(body.name, store)
    if isinstance(resolved, list):
        return _ambiguous(resolved, store)
    return await _analyze(resolved, analyzer)


@innovationsRoute.post("/benchmark", response_model=Comparison)
async def benchmarkIdea(body: BenchmarkRequest, store: Store, analyzer: Analyzer):
    """Porównanie WŁASNEGO pomysłu z podobnymi, przetestowanymi innowacjami — wzorce, zasoby, ryzyka, rekomendacje."""
    hits = await store.search(body.description, body.limit, body.category)
    if not hits:
        raise HTTPException(status_code=404, detail="Nie znaleziono podobnych innowacji")
    return await _compare(analyzer, [(h["id"], h["score"]) for h in hits], user_description=body.description)


@innovationsRoute.get("/{category}/{slug}/analysis", response_model=InnovationAnalysis)
async def analyzeInnovation(category: Slug, slug: Slug, analyzer: Analyzer):
    """Analiza innowacji: jak powstała, jakie środki wykorzystała, gdzie była realizowana (ze źródłami)."""
    return await _analyze(f"{category}/{slug}", analyzer)


@innovationsRoute.get("/{category}/{slug}/similar/analysis", response_model=Comparison)
async def analyzeSimilarInnovations(
    category: Slug,
    slug: Slug,
    store: Store,
    analyzer: Analyzer,
    limit: Annotated[int, Query(ge=2, le=6)] = 4,
):
    """Jak podobne projekty to zrobiły: porównanie budżetów, miejsc, partnerów + wspólne wzorce i ryzyka."""
    innovation_id = f"{category}/{slug}"
    try:
        similar = await store.similar(innovation_id, limit)
    except InnovationNotFound:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono innowacji {innovation_id}")
    return await _compare(analyzer, [(h["id"], h["score"]) for h in similar], base_id=innovation_id)


async def _resolve_name(name: str, store) -> str | list[str]:
    """Id innowacji albo lista kandydatów, gdy nazwa jest niejednoznaczna."""
    by_title = store.find_by_title(name)
    if len(by_title) == 1:
        return by_title[0]
    if len(by_title) > 1:
        return by_title
    # wyszukiwanie wektorowe zawsze coś zwróci — bez żadnego wspólnego słowa traktujemy nazwę jako nieznaną
    hits = await store.search(name, 5) if store.has_keyword_match(name) else []
    if not hits:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono innowacji o nazwie „{name}”")
    if len(hits) == 1 or hits[0]["score"] - hits[1]["score"] >= NAME_MATCH_MIN_GAP:
        return hits[0]["id"]
    return [h["id"] for h in hits]


def _ambiguous(innovation_ids: list[str], store) -> JSONResponse:
    candidates = [Candidate(id=i, **store.innovation_meta(i)) for i in innovation_ids]
    body = AmbiguousNameResponse(
        detail="Nazwa pasuje do kilku innowacji — podaj dokładniejszą nazwę albo użyj GET /innovations/{category}/{slug}/analysis",
        candidates=candidates,
    )
    return JSONResponse(status_code=409, content=body.model_dump())


async def _analyze(innovation_id: str, analyzer) -> dict:
    try:
        return await analyzer.analyze(innovation_id)
    except InnovationNotFound:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono innowacji {innovation_id}")
    except (openai.OpenAIError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=f"Analiza nie powiodła się: {e}")


async def _compare(analyzer, ranked, base_id=None, user_description=None) -> dict:
    try:
        return await analyzer.compare(ranked, base_id=base_id, user_description=user_description)
    except (openai.OpenAIError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=f"Analiza nie powiodła się: {e}")
