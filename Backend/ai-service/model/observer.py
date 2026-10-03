from pydantic import BaseModel, Field


class Commune(BaseModel):
    id: int
    name: str
    type: str | None            # "miejska" / "wiejska" / "miasto na prawach powiatu" / None (miejsko-wiejska)
    county: str                 # powiat; miasta na prawach powiatu: "m. Kraków"
    teryt: str | None
    label: str                  # np. "Tarnów (gmina wiejska, powiat tarnowski)"


class IndicatorValue(BaseModel):
    """Wartość wskaźnika dla gminy (albo powiatu, gdy brak danych gminnych — level="powiat")."""
    code: str | None
    name: str
    area: str | None
    value: float | None
    unit: str
    year: int | None
    voivodeship_average: float | None
    rank: int | None             # 1 = największa skala problemu
    units_compared: int
    change: float | None         # względem comparison_year
    comparison_year: int | None
    comparison: str | None       # "powyżej średniej" / "zbliżone do średniej" / "poniżej średniej"
    level: str
    territorial_unit: str
    higher_is_worse: bool | None
    description: str
    url: str
    details: dict
    average_method: str
    downloaded_at: str | None
    source: str


class CommuneDetails(Commune):
    indicators: list[IndicatorValue]


class ProblemScale(BaseModel):
    commune: Commune
    area: str
    area_name: str
    no_data: bool
    message: str
    indicators: list[IndicatorValue]


class Area(BaseModel):
    key: str
    name: str
    description: str
    indicators_with_data: int


class ObserverStatus(BaseModel):
    communes: int
    indicators: int
    values: int
    vector_index: bool
    embedding_model: str


class IndicatorSearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000, examples=["młodzi wyjeżdżają, wieś się wyludnia"])
    commune_id: int | None = Field(None, ge=1, description="Z gminą: tylko wskaźniki z wartościami dla tej gminy")
    limit: int = Field(5, ge=1, le=20)
    local_data_only: bool = Field(True, description="Bez gminy: tylko wskaźniki, które mają w bazie dane gmin/powiatów")


class IndicatorHit(BaseModel):
    indicator_id: int | None    # id wskaźnika w Obserwatorze (wyszukiwanie bez gminy)
    code: str | None            # ustawiony, gdy wskaźnik jest w Dane/config/wskazniki.yaml
    name: str
    category: str
    levels: str
    has_values: bool
    score: float                # podobieństwo 0..1
    value: IndicatorValue | None  # wartość dla gminy (wyszukiwanie z commune_id)


class IndicatorSearchResponse(BaseModel):
    results: list[IndicatorHit]


class AreaSuggestRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000, examples=["babcia nie umie obsługiwać telefonu"])
    limit: int = Field(3, ge=1, le=7)


class AreaHit(BaseModel):
    key: str
    name: str
    score: float
    indicators_with_data: int
    has_data: bool
    note: str                   # niepusta, gdy obszar nie ma danych w Obserwatorze


class AreaSuggestResponse(BaseModel):
    results: list[AreaHit]
