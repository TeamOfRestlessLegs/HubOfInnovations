from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from core.deps import Observer
from core.observer_store import CommuneNotFound, SearchUnavailable
from model.observer import (
    Area, AreaSuggestRequest, AreaSuggestResponse, Commune, CommuneDetails, IndicatorSearchRequest,
    IndicatorSearchResponse, ObserverStatus, ProblemScale,
)

# Dane z Internetowego Obserwatora Statystyk Społecznych ROPS Kraków – zasięg: tylko województwo małopolskie.
# Ranking: miejsce 1 = największa skala problemu w regionie.
observerRoute = APIRouter(prefix="/observer", tags=["observer"])

CommuneId = Annotated[int, Path(ge=1)]
AreaKey = Annotated[str, Query(pattern=r"^[a-z_]+$", max_length=50, examples=["starzenie_sie"])]


def _not_found(commune_id: int) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Nie znaleziono gminy o id {commune_id}")


def _unavailable(e: SearchUnavailable) -> HTTPException:
    return HTTPException(status_code=503, detail=f"Wyszukiwanie wektorowe Obserwatora niedostępne: {e}")


@observerRoute.get("/status", response_model=ObserverStatus)
async def observerStatus(observer: Observer) -> ObserverStatus:
    """Ile gmin, wskaźników i wartości jest w bazie, czy jest indeks wektorowy i jaki jest zasięg danych (Małopolska)."""
    return ObserverStatus(**await observer.status())


@observerRoute.get("/areas", response_model=list[Area])
async def listAreas(observer: Observer) -> list[Area]:
    """Obszary wyzwań (Dane/config/obszary_wyzwan.yaml). has_data=false: brak wskaźników gminnych w Obserwatorze –
    obszar zostaje na liście (to wyzwania z Mapy ROPS), a `note` mówi, skąd wziąć liczby."""
    return [Area(**a) for a in await observer.areas()]


@observerRoute.post("/areas/suggest", response_model=AreaSuggestResponse)
async def suggestAreas(body: AreaSuggestRequest, observer: Observer) -> AreaSuggestResponse:
    """Obszar wyzwania dla opisu problemu (wyszukiwanie wektorowe)."""
    try:
        return AreaSuggestResponse(results=await observer.suggest_areas(body.query, body.limit))
    except SearchUnavailable as e:
        raise _unavailable(e)


@observerRoute.get("/communes", response_model=list[Commune])
async def listCommunes(
    observer: Observer,
    search: Annotated[str | None, Query(max_length=100, examples=["Tarnów"])] = None,
    county: Annotated[str | None, Query(max_length=100, examples=["tarnowski"])] = None,
    type: Annotated[str | None, Query(max_length=50, examples=["wiejska"])] = None,
) -> list[Commune]:
    """Gminy Małopolski; filtr po fragmencie nazwy (także bez polskich znaków), powiecie i typie."""
    return [Commune(**g) for g in await observer.communes(search, county, type)]


@observerRoute.get("/communes/{commune_id}", response_model=CommuneDetails)
async def communeDetails(commune_id: CommuneId, observer: Observer) -> CommuneDetails:
    """Gmina ze wskaźnikami z konfiguracji: najnowszy rok, średnia województwa, miejsce w rankingu, zmiana."""
    try:
        return CommuneDetails(**await observer.commune(commune_id))
    except CommuneNotFound:
        raise _not_found(commune_id)


@observerRoute.get("/communes/{commune_id}/scale", response_model=ProblemScale)
async def problemScale(commune_id: CommuneId, area: AreaKey, observer: Observer) -> ProblemScale:
    """Skala problemu w gminie dla obszaru wyzwania (np. ?area=starzenie_sie). Bez danych: no_data=true i komunikat."""
    try:
        return ProblemScale(**await observer.problem_scale(commune_id, area))
    except CommuneNotFound:
        raise _not_found(commune_id)


@observerRoute.get("/communes/{commune_id}/similar", response_model=list[Commune])
async def similarCommunes(
    commune_id: CommuneId, observer: Observer, limit: Annotated[int, Query(ge=1, le=10)] = 3,
) -> list[Commune]:
    """Gminy o najbardziej podobnych wskaźnikach — np. gdzie szukać wdrożeń tej samej innowacji."""
    try:
        return [Commune(**g) for g in await observer.similar_communes(commune_id, limit)]
    except CommuneNotFound:
        raise _not_found(commune_id)


@observerRoute.post("/indicators/search", response_model=IndicatorSearchResponse)
async def searchIndicators(body: IndicatorSearchRequest, observer: Observer) -> IndicatorSearchResponse:
    """Wskaźniki z całego katalogu Obserwatora pasujące do opisu problemu (wyszukiwanie wektorowe).
    Z commune_id — tylko wskaźniki z wartościami dla tej gminy, razem z wartością i porównaniem."""
    try:
        results = await observer.search_indicators(body.query, body.limit, body.commune_id, body.local_data_only)
    except CommuneNotFound:
        raise _not_found(body.commune_id)
    except SearchUnavailable as e:
        raise _unavailable(e)
    return IndicatorSearchResponse(results=results)
