from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI

from core.config import get_settings
from core.vector_store import VectorStore
from routes.innovations import innovationsRoute


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    openai = AsyncOpenAI(api_key=settings.openai_key)
    app.state.openai = openai
    app.state.store = VectorStore(
        settings.vector_db_path, settings.collection, settings.profiles_collection, openai
    )
    yield
    await openai.close()


app = FastAPI(
    title="ai service",
    lifespan=lifespan
)

app.include_router(innovationsRoute)


@app.get("/health")
async def health(request: Request) -> JSONResponse:
    store = request.app.state.store
    return JSONResponse(
        content={
            "status": "OK",
            "service": "ai-service",
            "vector_db": {**await store.count(), "embedding_model": store.embedding_model},
        },
        status_code=200
    )
