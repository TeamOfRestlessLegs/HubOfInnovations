from typing import Literal

from pydantic import BaseModel, Field

from model.innovations import InnovationHit


class IdeaSearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000, examples=["transport dla seniorów na wsi"])
    limit: int = Field(5, ge=1, le=20)
    stage: int | None = Field(None, ge=1)


class IdeaHit(BaseModel):
    id: int
    title: str
    summary: str | None
    problem: str | None
    custom_group: str | None
    stage: int | None
    by_municipality: bool | None
    created_at: str | None
    score: float  # ranking 0..1 (RRF)
    similarity: float  # podobieństwo cosinusowe do zapytania


class IdeaSearchResponse(BaseModel):
    results: list[IdeaHit]
    ideas_available: bool = True  # False = serwis innovations nie odpowiedział


class IdeaDraft(BaseModel):
    """Szkic pomysłu z formularza — te same pola co CreateIdeaCommand w serwisie innovations."""
    title: str = Field(min_length=3, max_length=150)
    problem: str | None = Field(None, max_length=5000)
    custom_group: str | None = Field(None, max_length=200)
    summary: str = Field(min_length=10, max_length=5000)
    novelty: str | None = Field(None, max_length=5000)
    limit: int = Field(5, ge=1, le=10, description="ile podobnych innowacji i pomysłów zwrócić")


# ------------------------------------------------------------------ odpowiedź LLM (structured outputs)

SolutionType = Literal["usluga", "aplikacja", "urzadzenie", "model_pracy", "materialy", "wydarzenie", "inne"]
Setting = Literal["miasto", "wies", "mieszane", "nieokreslone"]


class CategoryPickLLM(BaseModel):
    slug: str
    reason: str


class IdeaProfile(BaseModel):
    target_group: str | None
    solution_type: SolutionType
    setting: Setting
    keywords: list[str]


class IdeaFeedback(BaseModel):
    missing: list[str]  # czego brakuje w opisie
    suggestions: list[str]  # jak go poprawić


class IdeaAnalysisLLM(BaseModel):
    categories: list[CategoryPickLLM]
    profile: IdeaProfile
    feedback: IdeaFeedback


# ------------------------------------------------------------------ API

class CategorySuggestion(BaseModel):
    slug: str
    name: str
    reason: str


class IdeaAnalysisResponse(BaseModel):
    categories: list[CategorySuggestion]  # 1–2, najlepiej pasująca pierwsza
    profile: IdeaProfile
    feedback: IdeaFeedback
    related_innovations: list[InnovationHit]  # przetestowane innowacje z biblioteki ROPS
    similar_ideas: list[IdeaHit]  # już zgłoszone (opublikowane) pomysły
    ideas_available: bool  # False = nie udało się sprawdzić pomysłów (serwis innovations niedostępny)
    details_available: bool  # False = innowacje bez opisu i linków (serwis innovations niedostępny)
    model: str
