import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
import uvicorn

from core.analysis_cache import AnalysisCache
from core.analyzer import InnovationAnalyzer
from core.config import get_settings
from core.innovations_client import InnovationsClient
from core.observer_store import ObserverStore
from core.vector_store import VectorStore
from routes.innovations import innovationsRoute
from routes.observer import observerRoute


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    openai = AsyncOpenAI(api_key=settings.openai_key)
    app.state.openai = openai
    app.state.store = VectorStore(
        settings.vector_db_path, settings.collection, settings.profiles_collection, openai
    )
    app.state.innovations = InnovationsClient(settings.innovations_api_url, settings.innovations_timeout)
    analysis_cache = AnalysisCache(settings.analysis_db_path)
    app.state.analyzer = InnovationAnalyzer(app.state.store, openai, analysis_cache, settings.analysis_model)
    # Obserwator jest opcjonalny: bez bazy / pakietu splot_dane działa reszta serwisu, a /observer zwraca 503
    app.state.observer, app.state.observer_error, warm_up = None, None, None
    try:
        app.state.observer = ObserverStore(settings.splot_dane_dir, settings.observer_db_path)
        # model embeddingów Obserwatora ładuje się w tle – pierwsze wyszukiwanie nie czeka
        warm_up = asyncio.create_task(asyncio.to_thread(app.state.observer.warm_up))
    except RuntimeError as e:
        app.state.observer_error = str(e)
        logging.getLogger(__name__).warning("Obserwator niedostępny: %s", e)
    yield
    if warm_up:
        warm_up.cancel()
    await app.state.innovations.close()
    analysis_cache.close()
    await openai.close()


app = FastAPI(
    title="ai service",
    lifespan=lifespan
)

app.include_router(innovationsRoute)
app.include_router(observerRoute)


@app.get("/health")
async def health(request: Request) -> JSONResponse:
    store = request.app.state.store
    return JSONResponse(
        content={
            "status": "OK",
            "service": "ai-service",
            "vector_db": {**await store.count(), "embedding_model": store.embedding_model},
            "observer": await observer.status() if (observer := request.app.state.observer)
            else {"error": request.app.state.observer_error},
        },
        status_code=200
    )

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )