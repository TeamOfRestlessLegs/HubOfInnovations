from fastapi import APIRouter, HTTPException, Request

from core.assistant import AssistantUnavailable, draft_application, suggest_field
from core.deps import OpenAIClient
from core.template import TemplateUnreadable, analyze_template
from model.assistant import Draft, DraftRequest, FieldRequest, FieldSuggestion
from model.template import TemplateAnalysis, TemplateRequest

# Asystent wniosku: propozycje odpowiedzi do pól wniosku naboru i Canvy – autor każdą akceptuje albo odrzuca sam.
# Kod pilnuje limitów znaków; model nie może wymyślać faktów.
assistantRoute = APIRouter(prefix="/asystent", tags=["asystent"])

DEFAULT_MODEL = "gpt-4o-mini"


def _model(request: Request) -> str:
    return getattr(request.app.state, "assistant_model", DEFAULT_MODEL)


@assistantRoute.post("/wniosek", response_model=Draft)
async def draftApplication(body: DraftRequest, request: Request, client: OpenAIClient) -> Draft:
    """Propozycje treści dla wszystkich pól wniosku – z fiszki, Canvy i pod kryteria naboru."""
    try:
        return await draft_application(client, _model(request), body)
    except AssistantUnavailable as e:
        raise HTTPException(status_code=503, detail=f"Asystent niedostępny: {e}")


@assistantRoute.post("/wzor", response_model=TemplateAnalysis)
async def analyzeTemplate(body: TemplateRequest, request: Request, client: OpenAIClient) -> TemplateAnalysis:
    """Wzór wniosku naboru (PDF) → pola do wypełnienia (z limitami i instrukcjami), powiązane z pytaniami Canvy
    i fiszką, oraz pytania, o które trzeba dopytać wnioskodawcę. ROPS zatwierdza wynik przy ogłaszaniu naboru."""
    try:
        return await analyze_template(client, _model(request), body)
    except TemplateUnreadable as e:
        raise HTTPException(status_code=422, detail=str(e))
    except AssistantUnavailable as e:
        raise HTTPException(status_code=503, detail=f"Asystent niedostępny: {e}")


@assistantRoute.post("/pole", response_model=FieldSuggestion)
async def suggestField(body: FieldRequest, request: Request, client: OpenAIClient) -> FieldSuggestion:
    """Propozycja dla jednego pola (wniosku albo Canvy); z `previous` + `instruction` – poprawka na prośbę autora
    („krócej”, „dodaj, że pomaga nam KGW”)."""
    try:
        return await suggest_field(client, _model(request), body)
    except AssistantUnavailable as e:
        raise HTTPException(status_code=503, detail=f"Asystent niedostępny: {e}")
