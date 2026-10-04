import asyncio
import hashlib
import json
import logging
import sqlite3
import threading
import time
from pathlib import Path

import httpx
import numpy as np

from core.bm25 import BM25
from core.innovations_client import InnovationsClient
from core.ranking import rrf
from core.vector_store import VectorStore

logger = logging.getLogger(__name__)

SNAPSHOT_TTL_SECONDS = 60  # co ile najpóźniej odświeżamy listę pomysłów z serwisu innovations
WEIGHTS = {"vector": 1.0, "bm25": 1.0}
# Pomysłów jest mało, więc ranking zawsze coś zwróci — próg odcina pomysły niezwiązane z zapytaniem.
# Podobieństwo cosinusowe (text-embedding-3-large), skalibrowane na danych demo (automations/fill_ideas.py):
MIN_SIMILARITY = 0.45  # trafne dopasowania ~0.50–0.70, szum ~0.37–0.44, zapytania spoza tematu < 0.38
# Cały pomysł vs cały pomysł (analiza szkicu) ma wyższe podobieństwo tła — tu duplikaty ~0.78–0.80, szum ~0.53–0.60
DOCUMENT_MIN_SIMILARITY = 0.65
EMBED_BATCH = 100


class IdeasUnavailable(Exception):
    pass


def idea_text(idea: dict) -> str:
    parts = [
        idea.get("title"),
        f"Problem: {idea['problem']}" if idea.get("problem") else None,
        f"Dla kogo: {idea['customGroup']}" if idea.get("customGroup") else None,
        idea.get("summary"),
        f"Co nowego: {idea['novelty']}" if idea.get("novelty") else None,
    ]
    return "\n".join(p for p in parts if p)


class IdeasSearch:
    """Wyszukiwanie semantyczne opublikowanych pomysłów (fiszek) z serwisu innovations.

    Bez osobnego indeksu: lista pomysłów jest pobierana z GET /api/ideas (tylko PUBLISHED) i trzymana w pamięci
    do SNAPSHOT_TTL_SECONDS, a embeddingi liczone tylko dla nowych/zmienionych treści (cache w SQLite).
    Wystarcza do kilku tysięcy pomysłów; przy większej skali — stały indeks w Chroma.
    """

    def __init__(self, client: InnovationsClient, store: VectorStore, cache_path: Path):
        self._client, self._store = client, store
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(cache_path, check_same_thread=False)
        self._db_lock = threading.Lock()
        with self._db_lock:
            self._db.execute("CREATE TABLE IF NOT EXISTS idea_embeddings (hash TEXT PRIMARY KEY, vector TEXT)")
        self._refresh_lock = asyncio.Lock()
        self._ideas: list[dict] = []
        self._vectors = np.zeros((0, 0))
        self._bm25: BM25 | None = None
        self._loaded_at = 0.0

    def close(self) -> None:
        self._db.close()

    async def count(self) -> int:
        await self._refresh()
        return len(self._ideas)

    async def search(self, query: str, limit: int = 5, stage: int | None = None,
                     embedding: list[float] | None = None, min_similarity: float = MIN_SIMILARITY) -> list[dict]:
        """Pomysły podobne do zapytania. Rzuca IdeasUnavailable, gdy serwis innovations nie odpowiada."""
        await self._refresh()
        if not self._ideas:
            return []
        query_vector = np.asarray(embedding if embedding is not None else await self._store.embed(query))
        similarity = self._vectors @ query_vector  # wektory OpenAI są znormalizowane — iloczyn = cosinus

        allowed = [i for i, idea in enumerate(self._ideas)
                   if similarity[i] >= min_similarity and (stage is None or idea.get("stage") == stage)]
        allowed_set = set(allowed)
        bm25_scores = self._bm25.scores(query) if self._bm25 else {}
        rankings = {
            "vector": sorted(allowed, key=lambda i: -similarity[i]),
            "bm25": [i for i, _ in sorted(bm25_scores.items(), key=lambda x: -x[1]) if i in allowed_set],
        }
        return [self._hit(i, score, float(similarity[i])) for i, score in rrf(rankings, WEIGHTS)[:limit]]

    # ------------------------------------------------------------------ wewnętrzne

    async def _refresh(self) -> None:
        if time.monotonic() - self._loaded_at < SNAPSHOT_TTL_SECONDS:
            return
        async with self._refresh_lock:
            if time.monotonic() - self._loaded_at < SNAPSHOT_TTL_SECONDS:
                return
            try:
                ideas = await self._client.published_ideas()
            except httpx.HTTPError as e:
                if not self._loaded_at:
                    raise IdeasUnavailable(str(e)) from e
                logger.warning("Nie udało się odświeżyć pomysłów (zostaje poprzednia lista): %s", e)
                return
            texts = [idea_text(idea) for idea in ideas]
            vectors = await self._embeddings(texts)
            self._ideas = ideas
            self._vectors = np.asarray(vectors) if vectors else np.zeros((0, 0))
            self._bm25 = BM25(texts) if texts else None
            self._loaded_at = time.monotonic()

    async def _embeddings(self, texts: list[str]) -> list[list[float]]:
        hashes = [hashlib.sha256(f"{self._store.embedding_model}\n{t}".encode()).hexdigest() for t in texts]
        cached = await asyncio.to_thread(self._cached_vectors, hashes)
        missing = [(h, t) for h, t in dict(zip(hashes, texts)).items() if h not in cached]
        for start in range(0, len(missing), EMBED_BATCH):
            batch = missing[start:start + EMBED_BATCH]
            vectors = await self._store.embed_many([t for _, t in batch])
            new = dict(zip((h for h, _ in batch), vectors))
            await asyncio.to_thread(self._store_vectors, new)
            cached.update(new)
        if missing:
            logger.info("Policzono embeddingi %d nowych/zmienionych pomysłów", len(missing))
        return [cached[h] for h in hashes]

    def _cached_vectors(self, hashes: list[str]) -> dict[str, list[float]]:
        found = {}
        with self._db_lock:
            for start in range(0, len(hashes), 900):
                part = hashes[start:start + 900]
                rows = self._db.execute(
                    f"SELECT hash, vector FROM idea_embeddings WHERE hash IN ({','.join('?' * len(part))})", part)
                found.update((h, json.loads(v)) for h, v in rows)
        return found

    def _store_vectors(self, vectors: dict[str, list[float]]) -> None:
        with self._db_lock:
            self._db.executemany("INSERT OR REPLACE INTO idea_embeddings VALUES (?, ?)",
                                 [(h, json.dumps(v)) for h, v in vectors.items()])
            self._db.commit()

    def _hit(self, index: int, score: float, similarity: float) -> dict:
        idea = self._ideas[index]
        return {
            "id": idea["id"],
            "title": idea["title"],
            "summary": idea.get("summary"),
            "problem": idea.get("problem"),
            "custom_group": idea.get("customGroup"),
            "stage": idea.get("stage"),
            "by_municipality": idea.get("byMunicipality"),
            "created_at": idea.get("createdAt"),
            "score": score,
            "similarity": round(similarity, 4),
        }
