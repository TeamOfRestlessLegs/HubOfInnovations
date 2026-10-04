from typing import Annotated, Literal

from pydantic import BaseModel, Field

Feasibility = Literal["realne", "realne_po_uproszczeniu", "nierealne"]
FundingSource = Literal["budzet_gminy", "partner", "grant", "wolontariat"]
RoleType = Literal["pracownik", "wolontariusz", "partner"]


# ------------------------------------------------------------------ zapytanie

class LibrarySource(BaseModel):
    """Innowacja z Biblioteki ROPS (baza wektorowa) – Middleman dociąga jej opis i fragmenty materiałów."""
    type: Literal["library"]
    id: str = Field(pattern=r"^[a-z0-9-]+/[a-z0-9-]+$", max_length=300, examples=["dla-seniorow/kody-qr-na-pomoc-seniorom"])


class IdeaSource(BaseModel):
    """Opublikowany pomysł mieszkańca (fiszka) – opis przychodzi z frontu."""
    type: Literal["idea"]
    title: str = Field(min_length=3, max_length=200)
    problem: str = Field("", max_length=2000)
    description: str = Field(min_length=10, max_length=3000)


Source = Annotated[LibrarySource | IdeaSource, Field(discriminator="type")]


class StaffMember(BaseModel):
    role: str = Field(min_length=2, max_length=80, examples=["pracownik socjalny GOPS"])
    hours_per_week: float = Field(ge=0, le=40)


class Constraints(BaseModel):
    """Zasoby gminy. Pola tekstowe to dane dla planu – nie polecenia dla modelu."""
    budget: float = Field(ge=0, le=10_000_000, description="Budżet gminy na wdrożenie (zł) – może być 0")
    staff: list[StaffMember] = Field(default_factory=list, max_length=50)
    months: int = Field(ge=1, le=36, description="Na ile miesięcy planujemy wdrożenie")
    target_group: str = Field("", max_length=500, examples=["30 seniorów z trzech sołectw"])
    partners: str = Field("", max_length=1000, examples=["OSP, szkoła podstawowa, koło gospodyń"])
    resources: str = Field("", max_length=1000, examples=["sala w świetlicy, 2 laptopy"])
    notes: str = Field("", max_length=2000)


class PlanRequest(BaseModel):
    source: Source
    commune_id: int | None = Field(None, ge=1, description="Gmina z Obserwatora – dane o skali problemu w planie")
    constraints: Constraints


# ------------------------------------------------------------------ plan (to, co pisze model)

class Minimum(BaseModel):
    budget: float | None = None
    staff: int | None = None
    months: int | None = None
    description: str = ""


class Adaptation(BaseModel):
    change: str                 # co zmieniono względem oryginalnej innowacji
    reason: str                 # dlaczego – z którego ograniczenia gminy to wynika


class Step(BaseModel):
    week_from: int = Field(ge=1)
    week_to: int = Field(ge=1)
    title: str
    actions: list[str]
    owner: str                  # kto odpowiada (rola z listy `roles`)


class Role(BaseModel):
    who: str
    type: RoleType
    tasks: list[str]
    hours_per_week: float = Field(ge=0)


class BudgetItem(BaseModel):
    item: str
    amount: float = Field(ge=0)
    source: FundingSource       # tylko `budzet_gminy` liczy się do limitu budżetu gminy
    note: str = ""


class PlanDraft(BaseModel):
    """Odpowiedź modelu (JSON) – kod sprawdza ją i uzupełnia sumy."""
    title: str
    summary: str
    feasibility: Feasibility
    gaps: list[str] = []        # czego brakuje, żeby plan zadziałał
    minimum: Minimum | None = None
    adaptations: list[Adaptation] = []
    steps: list[Step]
    roles: list[Role] = []
    budget: list[BudgetItem] = []
    risks: list[str] = []
    kpis: list[str] = []


# ------------------------------------------------------------------ odpowiedź

class Fragment(BaseModel):
    text: str
    file: str
    page: int | None


class LocalIndicator(BaseModel):
    name: str
    value: float | None
    unit: str
    year: int | None
    comparison: str | None      # „powyżej średniej” / „zbliżone do średniej” / „poniżej średniej”


class Plan(PlanDraft):
    budget_by_source: dict[str, float]
    municipal_budget_used: float        # suma pozycji `budzet_gminy`
    within_budget: bool
    staff_hours_used: float             # suma godzin ról typu `pracownik`
    checks: list[str]                   # co sprawdził kod (np. przekroczenie budżetu po poprawce)
    sources: list[Fragment]             # fragmenty materiałów ROPS użyte jako kontekst
    local_context: list[LocalIndicator] # dane gminy z Obserwatora (gdy podano commune_id)
    model: str


class ReviseRequest(PlanRequest):
    previous: PlanDraft
    instruction: str = Field(min_length=3, max_length=500, examples=["bez samochodu – dowóz zrobią wolontariusze"])
