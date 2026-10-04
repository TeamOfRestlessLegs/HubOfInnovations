from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from core.deps import Innovations, Store
from core.vector_store import InnovationNotFound
from model.innovations import Category, InnovationDetail, InnovationList, SearchRequest, SearchResponse

innovationsRoute = APIRouter(prefix="/innovations", tags=["innovations"])

Slug = Annotated[str, Path(pattern=r"^[a-z0-9-]+$", max_length=200)]


@innovationsRoute.get("", response_model=InnovationList)
async def listInnovations(
    store: Store,
    category: Annotated[str | None, Query(pattern=r"^[a-z0-9-]+$", max_length=200)] = None,
    q: Annotated[str | None, Query(min_length=2, max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 24,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> InnovationList:
    """Biblioteka Innowacji ROPS do przeglądania (bez OpenAI): alfabetycznie albo – z `q` – wg słów kluczowych."""
    total, results = store.browse(category, q, limit, offset)
    return InnovationList(total=total, results=results)


@innovationsRoute.get("/categories", response_model=list[Category])
async def listCategories(store: Store) -> list[Category]:
    """Kategorie Biblioteki z liczbą innowacji."""
    return store.categories()


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


@innovationsRoute.get("/{category}/{slug}", response_model=InnovationDetail)
async def innovationDetail(category: Slug, slug: Slug, store: Store) -> InnovationDetail:
    """Pełny opis innowacji i lista materiałów (PDF) – np. dla Middlemana i karty w Zasobniku."""
    try:
        return InnovationDetail(**await store.detail(f"{category}/{slug}"))
    except InnovationNotFound:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono innowacji {category}/{slug}")
