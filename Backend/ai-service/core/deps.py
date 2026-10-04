from typing import Annotated

from fastapi import Depends, HTTPException, Request

from core.analyzer import InnovationAnalyzer
from core.idea_analyzer import IdeaAnalyzer
from core.ideas_search import IdeasSearch
from core.innovations_client import InnovationsClient
from core.observer_store import ObserverStore
from core.vector_store import VectorStore


def get_store(request: Request) -> VectorStore:
    return request.app.state.store


Store = Annotated[VectorStore, Depends(get_store)]


def get_observer(request: Request) -> ObserverStore:
    observer = request.app.state.observer
    if observer is None:
        raise HTTPException(status_code=503, detail=f"Obserwator niedostępny: {request.app.state.observer_error}")
    return observer


Observer = Annotated[ObserverStore, Depends(get_observer)]


def get_innovations(request: Request) -> InnovationsClient:
    return request.app.state.innovations


Innovations = Annotated[InnovationsClient, Depends(get_innovations)]


def get_analyzer(request: Request) -> InnovationAnalyzer:
    return request.app.state.analyzer


Analyzer = Annotated[InnovationAnalyzer, Depends(get_analyzer)]


def get_ideas(request: Request) -> IdeasSearch:
    return request.app.state.ideas


Ideas = Annotated[IdeasSearch, Depends(get_ideas)]


def get_idea_analyzer(request: Request) -> IdeaAnalyzer:
    return request.app.state.idea_analyzer


IdeaAnalyzerDep = Annotated[IdeaAnalyzer, Depends(get_idea_analyzer)]
