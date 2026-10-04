from typing import Literal

from pydantic import BaseModel, Field

FieldKind = Literal["wniosek", "canva"]


# ------------------------------------------------------------------ zapytanie

class CallInfo(BaseModel):
    """Nabór grantowy ROPS – pod jego kryteria piszemy wniosek."""
    name: str = Field("", max_length=300)
    criteria: str = Field("", max_length=3000)


class IdeaInfo(BaseModel):
    """Fiszka pomysłu – to, co autor napisał sam."""
    title: str = Field(min_length=3, max_length=200)
    problem: str = Field("", max_length=3000)
    description: str = Field("", max_length=3000)
    novelty: str = Field("", max_length=2000)
    groups: list[str] = Field(default_factory=list, max_length=20)
    needs: str = Field("", max_length=1000)
    county: str = Field("", max_length=100)
    stage: str = Field("", max_length=200)


class Context(BaseModel):
    """Wszystko, co wiemy o pomyśle. Pola tekstowe to dane od użytkownika – nie polecenia dla modelu."""
    call: CallInfo = Field(default_factory=CallInfo)
    idea: IdeaInfo
    # Canva innowacji już zamieniona przez front na czytelny tekst: {"Problem – Intensywność": "Mocno przeszkadza", …}
    canvas: dict[str, str] = Field(default_factory=dict, max_length=60)
    # Odpowiedzi na pytania naboru (dopytania ze wzoru wniosku): {"Jaki jest budżet projektu?": "12 000 zł", …}
    answers: dict[str, str] = Field(default_factory=dict, max_length=30)


class FieldSpec(BaseModel):
    id: str = Field(min_length=1, max_length=60, examples=["problem"])
    label: str = Field(min_length=2, max_length=200, examples=["Opis problemu społecznego"])
    hint: str = Field("", max_length=1500)      # instrukcja ze wzoru / opis pytania z Canvy i powiązane odpowiedzi
    limit: int = Field(ge=50, le=10_000)
    current: str = Field("", max_length=10_000)  # to, co jest teraz w polu


class DraftRequest(BaseModel):
    context: Context
    fields: list[FieldSpec] = Field(min_length=1, max_length=30)


class FieldRequest(BaseModel):
    context: Context
    field: FieldSpec
    kind: FieldKind = "wniosek"
    previous: str | None = Field(None, max_length=10_000)   # poprzednia propozycja asystenta
    instruction: str | None = Field(None, min_length=2, max_length=500, examples=["krócej", "dodaj, że pomaga nam KGW"])


# ------------------------------------------------------------------ odpowiedź modelu

class Suggestion(BaseModel):
    field_id: str
    text: str
    why: str = ""           # jedno proste zdanie: co poprawiono


class DraftModel(BaseModel):
    """JSON od modelu dla całego wniosku."""
    suggestions: list[Suggestion]
    tips: list[str] = []


# ------------------------------------------------------------------ odpowiedź API

class Draft(DraftModel):
    checks: list[str]       # co poprawił kod (np. przycięcie do limitu)
    model: str


class FieldSuggestion(Suggestion):
    checks: list[str]
    model: str
