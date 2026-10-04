from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from core.deps import Innovations, Store
from core.vector_store import InnovationNotFound
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
