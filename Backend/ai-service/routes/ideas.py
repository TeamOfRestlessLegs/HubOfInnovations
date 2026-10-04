import openai
from fastapi import APIRouter, HTTPException

from core.deps import IdeaAnalyzerDep, Ideas
from core.ideas_search import IdeasUnavailable
from model.ideas import IdeaAnalysisResponse, IdeaDraft, IdeaSearchRequest, IdeaSearchResponse

ideasRoute = APIRouter(prefix="/ideas", tags=["ideas"])


@ideasRoute.post("/search", response_model=IdeaSearchResponse)
async def searchIdeas(body: IdeaSearchRequest, ideas: Ideas) -> IdeaSearchResponse:
    """Wyszukiwanie semantyczne opublikowanych pomysłów mieszkańców (fiszek)."""
    try:
        results = await ideas.search(body.query, body.limit, body.stage)
    except IdeasUnavailable:
        return IdeaSearchResponse(results=[], ideas_available=False)
    return IdeaSearchResponse(results=results)


@ideasRoute.post("/analyze", response_model=IdeaAnalysisResponse)
async def analyzeIdea(body: IdeaDraft, analyzer: IdeaAnalyzerDep) -> IdeaAnalysisResponse:
    """Analiza szkicu pomysłu (formularz): kategorie, wskazówki dla autora, podobne innowacje i pomysły."""
    try:
        return await analyzer.analyze(body.model_dump(), body.limit)
    except (openai.OpenAIError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=f"Analiza nie powiodła się: {e}")
