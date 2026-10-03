from fastapi import FastAPI
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="ai service",
    lifespan=lifespan
)

@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(
        content={
            "status":"OK",
            "service":"ai-service"
        },
        status_code=200
    )