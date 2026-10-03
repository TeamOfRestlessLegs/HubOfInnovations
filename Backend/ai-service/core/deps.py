from typing import Annotated

from fastapi import Depends, Request

from core.vector_store import VectorStore


def get_store(request: Request) -> VectorStore:
    return request.app.state.store


Store = Annotated[VectorStore, Depends(get_store)]
