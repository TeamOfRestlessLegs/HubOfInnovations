from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000, examples=["jak pomóc samotnym seniorom na wsi"])
    category: str | None = Field(None, pattern=r"^[a-z0-9-]+$", examples=["dla-seniorow"])
    limit: int = Field(5, ge=1, le=20)


class Fragment(BaseModel):
    text: str
    source: str 
    file: str
    page: int | None
    score: float


class InnovationHit(BaseModel):
    id: str
    category_slug: str
    slug: str
    title: str
    category: str
    url: str
    score: float
    fragments: list[Fragment]


class SearchResponse(BaseModel):
    results: list[InnovationHit]
