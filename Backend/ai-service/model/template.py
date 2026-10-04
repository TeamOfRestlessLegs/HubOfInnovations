from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, Field

from model.assistant import CallInfo

IdeaKey = Literal["problem", "opis", "istota", "grupy", "szuka", "powiat", "etap"]

# Model bywa niedbały: null zamiast "" / [], liczby jako id – przyjmujemy to, kod i tak czyści wynik
Text = Annotated[str, BeforeValidator(lambda v: "" if v is None else str(v))]
Ids = Annotated[list[str], BeforeValidator(lambda v: [str(x) for x in v] if isinstance(v, list) else [])]


# ------------------------------------------------------------------ zapytanie

class CanvasQuestion(BaseModel):
    """Pytanie Canvy innowacji (katalog z frontu) – model łączy z nimi pola wzoru."""
    id: str = Field(min_length=1, max_length=60)
    title: str = Field(max_length=200)
    section: str = Field("", max_length=100)


class TemplateRequest(BaseModel):
    # Wzór wniosku: PDF jako data URL („data:application/pdf;base64,…”) albo samo base64; maks. ok. 3 MB
    pdf: str = Field(min_length=20, max_length=4_200_000)
    call: CallInfo = Field(default_factory=CallInfo)
    canvas_questions: list[CanvasQuestion] = Field(default_factory=list, max_length=80)


# ------------------------------------------------------------------ odpowiedź modelu
# Dopytania model wpisuje wprost w pole, którego dotyczą – bez odsyłaczy po id (mylił je).

class QuestionDraft(BaseModel):
    text: Text
    hint: Text = ""


class FieldDraft(BaseModel):
    id: Text = ""
    label: Text
    anchor: Text = ""       # początek nagłówka pola skopiowany ze wzoru – po nim szukamy miejsca na odpowiedź
    after: Text = ""        # ostatnie słowa nagłówka / instrukcji pola – odpowiedź wstawiamy pod nimi
    instruction: Text = ""
    limit: Annotated[int | None, BeforeValidator(lambda v: v if isinstance(v, int) or v is None else _int(v))] = None
    canvas: Ids = []
    idea: Ids = []
    questions: Annotated[list[QuestionDraft], BeforeValidator(lambda v: v if isinstance(v, list) else [])] = []


class TemplateDraft(BaseModel):
    fields: list[FieldDraft]


def _int(v) -> int | None:
    digits = "".join(c for c in str(v) if c.isdigit())
    return int(digits) if digits else None


# ------------------------------------------------------------------ odpowiedź API

class TemplateQuestion(BaseModel):
    id: str
    text: str
    hint: str = ""


class Slot(BaseModel):
    """Miejsce na odpowiedź w oryginalnym PDF (punkty, od góry strony). `y == y_end` – wstawienie pod tekstem,
    `box` – pusta ramka ze wzoru [y, y_end] do zastąpienia ramką z odpowiedzią."""
    page: int
    y: float
    y_end: float
    x0: float
    x1: float
    box: bool


class PageLayout(BaseModel):
    width: float
    height: float
    top: float              # nad tym – nagłówek strony (logotypy), powtarzany na stronach dodatkowych
    bottom: float           # pod tym – stopka
    cuts: list[float]       # przerwy między wierszami – tu wolno przeciąć stronę
    last: float             # koniec treści strony (dalej tylko margines)
    x0: float
    x1: float


class TemplateField(BaseModel):
    id: str
    label: str
    instruction: str
    limit: int
    canvas: list[str]
    idea: list[str]
    questions: list[str]        # id z `TemplateAnalysis.questions`
    anchor: str                 # nagłówek i koniec instrukcji ze wzoru – z nich liczony `slot` (core.layout)
    after: str
    slot: Slot | None           # None – nie znaleźliśmy miejsca we wzorze (odpowiedź trafi na stronę dodatkową)


class TemplateAnalysis(BaseModel):
    fields: list[TemplateField]
    questions: list[TemplateQuestion]   # o co dopytać wnioskodawcę (wspólne dla pól, bez duplikatów)
    layout: list[PageLayout]            # układ stron wzoru – do wypełnienia oryginalnego PDF
    pages: int
    form_fields: int        # pola formularza AcroForm znalezione w PDF (0 = zwykły dokument)
    checks: list[str]       # co poprawił kod (nieznane powiązania, limity domyślne)
    model: str
