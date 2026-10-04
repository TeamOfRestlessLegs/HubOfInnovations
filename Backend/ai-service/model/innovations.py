from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000, examples=["jak pomóc samotnym seniorom na wsi"])
    category: str | None = Field(None, pattern=r"^[a-z0-9-]+$", examples=["dla-seniorow"])
    limit: int = Field(5, ge=1, le=20)
    include_details: bool = Field(True, description="dołącz opis i linki z serwisu innovations")


class Fragment(BaseModel):
    text: str
    source: str
    file: str
    page: int | None
    score: float


class LearnMoreLink(BaseModel):
    name: str
    url: str
    pages: int | None = None


class InnovationLinks(BaseModel):
    source: str | None  # podstrona innowacji na rops.krakow.pl
    video: str | None
    materials: str | None  # ZIP z materiałami
    learn_more: list[LearnMoreLink]  # PDF-y "dowiedz się więcej"


class InnovationHit(BaseModel):
    id: str
    category_slug: str
    slug: str
    title: str
    category: str
    url: str
    score: float
    fragments: list[Fragment]
    # szczegóły z serwisu innovations — None, gdy include_details=false albo serwis niedostępny
    short_description: str | None = None
    description_md: str | None = None
    links: InnovationLinks | None = None
    documents_count: int | None = None  # dokumenty w materiałach (ZIP)


class SearchResponse(BaseModel):
    results: list[InnovationHit]
    details_available: bool = True  # False = serwis innovations nie odpowiedział, wyniki bez szczegółów
