from fastapi import APIRouter, HTTPException, Request

from core.deps import OpenAIClient, OptionalAnalyzer, OptionalObserver, Store
from core.middleman import MiddlemanUnavailable, make_plan
from core.observer_store import CommuneNotFound
from core.vector_store import InnovationNotFound
from model.middleman import Plan, PlanRequest, ReviseRequest

# Middleman Innowacji (moduł VII): plan wdrożenia innowacji z Biblioteki ROPS albo pomysłu mieszkańców,
# dopasowany do budżetu, ludzi i czasu konkretnej gminy. Kod pilnuje budżetu i godzin – model nie może ich przekroczyć.
middlemanRoute = APIRouter(prefix="/middleman", tags=["middleman"])

DEFAULT_MODEL = "gpt-4o-mini"


async def _plan(body: PlanRequest, request: Request, client, store, observer, analyzer, previous=None, instruction=None) -> Plan:
    model = getattr(request.app.state, "middleman_model", DEFAULT_MODEL)
    try:
        return await make_plan(client, model, body, store, observer, previous, instruction, analyzer)
    except InnovationNotFound:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono innowacji {body.source.id}")
    except CommuneNotFound:
        raise HTTPException(status_code=404, detail=f"Nie znaleziono gminy o id {body.commune_id}")
    except MiddlemanUnavailable as e:
        raise HTTPException(status_code=503, detail=f"Middleman niedostępny: {e}")


@middlemanRoute.post("/plan", response_model=Plan)
async def createPlan(body: PlanRequest, request: Request, client: OpenAIClient, store: Store,
                     observer: OptionalObserver, analyzer: OptionalAnalyzer) -> Plan:
    """Plan wdrożenia: etapy tydzień po tygodniu, role, budżet ze źródłami finansowania, adaptacje względem
    oryginału, ryzyka, wskaźniki i ocena wykonalności (realne / realne_po_uproszczeniu / nierealne)."""
    return await _plan(body, request, client, store, observer, analyzer)


@middlemanRoute.post("/plan/revise", response_model=Plan)
async def revisePlan(body: ReviseRequest, request: Request, client: OpenAIClient, store: Store,
                     observer: OptionalObserver, analyzer: OptionalAnalyzer) -> Plan:
    """Poprawka planu poleceniem urzędnika („bez samochodu”, „taniej o 20%”) – te same kontrole co przy tworzeniu."""
    return await _plan(body, request, client, store, observer, analyzer, body.previous, body.instruction)
