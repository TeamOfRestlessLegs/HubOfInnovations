from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from core.deps import Store
from core.vector_store import InnovationNotFound
from model.innovations import SearchRequest, SearchResponse

innovationsRoute = APIRouter(prefix="/innovations", tags=["innovations"])

Slug = Annotated[str, Path(pattern=r"^[a-z0-9-]+$", max_length=200)]


@innovationsRoute.post("/search", response_model=SearchResponse)
async def searchInnovations(body: SearchRequest, store: Store) -> SearchResponse:
    """Wyszukiwanie semantyczne — zwraca innowacje (nie pojedyncze fragmenty) z najlepiej pasującymi cytatami."""
    results = await store.search(body.query, body.limit, body.category)
    return SearchResponse(results=results)


@innovationsRoute.get("/{category}/{slug}/similar", response_model=SearchResponse)
async def similarInnovations(
    category: Slug,
    slug: Slug,
    store: Store,
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
) -> SearchResponse:
    """Innowacje podobne do wskazanej (np. /innovations/dla-seniorow/kody-qr-na-pomoc-seniorom/similar)."""
    try:
        results = await store.similar(f"{category}/{slug}", limit)
    except InnovationNotFound:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono innowacji {category}/{slug}")
    return SearchResponse(results=results)
