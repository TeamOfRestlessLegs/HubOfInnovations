"""Schematy analiz innowacji.

*LLM — to, co model MUSI zwrócić (structured outputs: wszystkie pola wymagane, brak danych = null / pusta lista).
Fakty wskazują źródła przez `source_ids` — numery fragmentów [S1], [S2]… z kontekstu; plik i stronę
dokleja serwis (model nie przepisuje nazw plików, więc nie może ich zmyślić).
"""

from typing import Literal

from pydantic import BaseModel, Field

# ------------------------------------------------------------------ odpowiedź LLM: analiza jednej innowacji

StageName = Literal["diagnoza", "projektowanie", "prototyp", "testowanie", "wdrozenie", "inne"]
PlaceType = Literal["miasto", "wies", "gmina", "powiat", "region", "instytucja", "inne"]
PlaceRole = Literal["testowanie", "siedziba_innowatora", "wdrozenie", "inne"]
Setting = Literal["miasto", "wies", "mieszane", "nieokreslone"]


class SourcedText(BaseModel):
    text: str
    source_ids: list[int]


class Stage(BaseModel):
    stage: StageName
    description: str
    source_ids: list[int]


class BudgetItem(BaseModel):
    name: str
    amount_pln: float | None
    source_ids: list[int]


class Budget(BaseModel):
    total_pln: float | None
    items: list[BudgetItem]
    note: str | None
    source_ids: list[int]


class Partner(BaseModel):
    name: str
    role: str | None
    source_ids: list[int]


class Place(BaseModel):
    name: str
    type: PlaceType
    role: PlaceRole
    source_ids: list[int]


class Origin(BaseModel):
    problem: SourcedText | None
    innovator: SourcedText | None
    program: str | None
    stages: list[Stage]


class Resources(BaseModel):
    budget: Budget | None
    staff: list[SourcedText]
    equipment: list[SourcedText]
    partners: list[Partner]


class Location(BaseModel):
    places: list[Place]
    setting: Setting


class Testing(BaseModel):
    participants: int | None
    participants_description: str | None
    duration: str | None
    results: SourcedText | None
    source_ids: list[int]


class Replication(BaseModel):
    requirements: list[SourcedText]
    risks: list[SourcedText]


class InnovationAnalysisLLM(BaseModel):
    summary: str
    origin: Origin
    resources: Resources
    location: Location
    testing: Testing
    replication: Replication


# ------------------------------------------------------------------ odpowiedź LLM: synteza podobnych projektów

class ComparisonLLM(BaseModel):
    overview: str
    common_partners: list[str]
    common_staff: list[str]
    common_resources: list[str]
    what_worked: list[str]
    common_risks: list[str]
    recommendations: list[str]


# ------------------------------------------------------------------ API

class Source(BaseModel):
    id: int
    kind: str  # profil | opis | pdf_dowiedz_sie_wiecej | pdf_materialy
    file: str | None
    page: int | None
    excerpt: str


class DataCoverage(BaseModel):
    budget: bool
    location: bool
    testing: bool
    partners: bool
    innovator: bool


class InnovationAnalysis(InnovationAnalysisLLM):
    id: str
    title: str
    category: str
    url: str
    data_coverage: DataCoverage
    sources: list[Source]
    warnings: list[str]  # np. odrzucone kwoty, których nie ma w dokumentach
    model: str
    generated_at: str


class AnalysisByNameRequest(BaseModel):
    name: str = Field(min_length=2, max_length=300, examples=["Szlakiem ludzi bezdomnych"])


class Candidate(BaseModel):
    id: str
    title: str
    category: str


class AmbiguousNameResponse(BaseModel):
    """409 z POST /innovations/analysis — nazwa pasuje do kilku innowacji."""
    detail: str
    candidates: list[Candidate]


class ComparisonRow(BaseModel):
    id: str
    title: str
    similarity: float
    budget_pln: float | None
    participants: int | None
    setting: Setting
    places: list[str]
    duration: str | None
    partners: list[str]
    summary: str


class Comparison(ComparisonLLM):
    base_id: str | None  # innowacja wyjściowa (wariant "podobne do") albo None (benchmark)
    compared: list[ComparisonRow]
    typical_budget: str  # liczone z danych, nie przez LLM
    model: str
    generated_at: str


class BenchmarkRequest(BaseModel):
    description: str = Field(min_length=20, max_length=3000, examples=[
        "Chcemy zorganizować pomoc dla osób w kryzysie bezdomności w małej gminie wiejskiej, mamy 2 pracowników OPS."])
    category: str | None = Field(None, pattern=r"^[a-z0-9-]+$")
    limit: int = Field(4, ge=2, le=6)
