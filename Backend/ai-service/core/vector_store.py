import asyncio
import re
from pathlib import Path

import chromadb
from openai import AsyncOpenAI

from core.bm25 import BM25

MAX_FRAGMENTS = 3
CHUNK_CANDIDATES = 100  # ile fragmentów bierzemy pod uwagę przy rankingu innowacji
PROFILE_CANDIDATES = 50

# Reciprocal Rank Fusion: łączy rankingi z różnych metod bez porównywania ich surowych wyników.
# Wagi dobrane na tests/eval_search.py — zmieniaj je razem z uruchomieniem evala.
RRF_K = 60
WEIGHTS = {"profile": 1.0, "bm25": 1.0, "chunks": 0.5}


class InnovationNotFound(Exception):
    pass


class VectorStore:
    """Wyszukiwanie innowacji: hybryda (wektor + BM25) na profilach innowacji + fragmenty jako dowody.

    Dwie kolekcje Chroma (budowane przez automations/build_vector_db.py):
      - profile: 1 dokument na innowację (tytuł, kategoria, opis) — odpowiada na "która innowacja",
        niezależnie od tego, ile stron PDF-ów ma dana innowacja,
      - fragmenty: opisy + PDF-y pocięte na kawałki — cytaty i dodatkowy sygnał dla pytań o szczegóły.
    """

    def __init__(self, path: Path, chunks_collection: str, profiles_collection: str, openai: AsyncOpenAI):
        if not path.exists():
            raise RuntimeError(f"Brak bazy wektorowej w {path} — uruchom automations/build_vector_db.py")
        client = chromadb.PersistentClient(path=str(path))
        try:
            self._chunks = client.get_collection(chunks_collection)
            self._profiles = client.get_collection(profiles_collection)
        except Exception as e:
            raise RuntimeError(f"Brak kolekcji w {path} ({e}) — przebuduj bazę: automations/build_vector_db.py")
        self._model = self._chunks.metadata["embedding_model"]
        if self._profiles.metadata["embedding_model"] != self._model:
            raise RuntimeError("Kolekcje zbudowane różnymi modelami embeddingów — przebuduj bazę")
        self._openai = openai

        profiles = self._profiles.get(include=["documents", "metadatas"])
        self._profile_ids: list[str] = profiles["ids"]
        self._profile_meta: dict[str, dict] = dict(zip(profiles["ids"], profiles["metadatas"]))
        self._profile_docs: dict[str, str] = dict(zip(profiles["ids"], profiles["documents"]))
        self._bm25 = BM25(profiles["documents"])

    @property
    def embedding_model(self) -> str:
        return self._model

    async def count(self) -> dict[str, int]:
        chunks, profiles = await asyncio.gather(
            asyncio.to_thread(self._chunks.count), asyncio.to_thread(self._profiles.count))
        return {"innovations": profiles, "chunks": chunks}

    async def embed(self, text: str) -> list[float]:
        response = await self._openai.embeddings.create(model=self._model, input=text)
        return response.data[0].embedding

    async def search(self, query: str, limit: int = 5, category: str | None = None) -> list[dict]:
        embedding = await self.embed(query)
        where = {"kategoria_slug": category} if category else None

        profile_result, chunk_result = await asyncio.gather(
            asyncio.to_thread(self._profiles.query, query_embeddings=[embedding],
                              n_results=min(PROFILE_CANDIDATES, len(self._profile_ids)), where=where,
                              include=["metadatas"]),
            asyncio.to_thread(self._chunks.query, query_embeddings=[embedding],
                              n_results=CHUNK_CANDIDATES, where=where, include=["metadatas"]),
        )
        rankings = {
            "profile": profile_result["ids"][0],
            "bm25": self._bm25_ranking(query, category),
            "chunks": list(dict.fromkeys(m["innowacja_id"] for m in chunk_result["metadatas"][0])),
        }
        fused = self._rrf(rankings)[:limit]
        return await self._hits(fused, embedding)

    async def similar(self, innovation_id: str, limit: int = 5) -> list[dict]:
        """Innowacje podobne do danej — po wektorze jej profilu (bez wywołań OpenAI)."""
        profile = await asyncio.to_thread(self._profiles.get, ids=[innovation_id], include=["embeddings"])
        if len(profile["ids"]) == 0:
            raise InnovationNotFound(innovation_id)
        embedding = list(profile["embeddings"][0])
        result = await asyncio.to_thread(
            self._profiles.query, query_embeddings=[embedding], n_results=limit,
            where={"innowacja_id": {"$ne": innovation_id}}, include=["distances"],
        )
        ranked = [(i, round(1 - d, 4)) for i, d in zip(result["ids"][0], result["distances"][0])]
        return await self._hits(ranked, embedding)

    def browse(self, category: str | None, query: str | None, limit: int, offset: int) -> tuple[int, list[dict]]:
        """Przeglądanie Biblioteki bez OpenAI: alfabetycznie albo (z `query`) wg BM25 na profilach."""
        if query:
            ids = self._bm25_ranking(query, category)
        else:
            ids = sorted(self._profile_ids, key=lambda i: self._profile_meta[i]["tytul"].lower())
            if category:
                ids = [i for i in ids if self._profile_meta[i]["kategoria_slug"] == category]
        return len(ids), [self._summary(i) for i in ids[offset:offset + limit]]

    def categories(self) -> list[dict]:
        counts: dict[str, dict] = {}
        for meta in self._profile_meta.values():
            c = counts.setdefault(meta["kategoria_slug"], {"slug": meta["kategoria_slug"], "name": meta["kategoria"], "count": 0})
            c["count"] += 1
        return sorted(counts.values(), key=lambda c: c["name"])

    async def detail(self, innovation_id: str) -> dict:
        """Pełny opis innowacji (dokument profilu) i lista materiałów (PDF-y) z kolekcji fragmentów."""
        if innovation_id not in self._profile_meta:
            raise InnovationNotFound(innovation_id)
        chunks = await asyncio.to_thread(self._chunks.get, where={"innowacja_id": innovation_id}, include=["metadatas"])
        materials = {}
        for meta in chunks["metadatas"]:
            if meta["zrodlo"] != "opis":
                materials.setdefault(meta["plik_nazwa"], {"file": meta["plik_nazwa"], "source": meta["zrodlo"]})
        return {**self._summary(innovation_id), "description": self._description(innovation_id),
                "materials": list(materials.values())}

    async def query_context(self, innovation_id: str, query: str, limit: int = 6) -> list[dict]:
        """Fragmenty opisu i materiałów innowacji najbliższe zapytaniu – kontekst dla Middlemana."""
        if innovation_id not in self._profile_meta:
            raise InnovationNotFound(innovation_id)
        return await self._fragments(innovation_id, await self.embed(query), limit)

    # ------------------------------------------------------------------ dla analiz (core/analyzer.py)

    def innovation_ids(self) -> list[str]:
        return list(self._profile_ids)

    def has_keyword_match(self, query: str) -> bool:
        """Czy którekolwiek słowo zapytania występuje w profilach innowacji (BM25)."""
        return bool(self._bm25.scores(query))

    def innovation_meta(self, innovation_id: str) -> dict:
        meta = self._profile_meta[innovation_id]
        return {"title": meta["tytul"], "category": meta["kategoria"]}

    def find_by_title(self, name: str) -> list[str]:
        """Innowacje, których tytuł (albo slug) pasuje do nazwy: najpierw dokładnie, potem przez zawieranie."""
        wanted = _normalize(name)
        exact = [i for i, m in self._profile_meta.items()
                 if _normalize(m["tytul"]) == wanted or i.split("/", 1)[1] == name.strip().lower()]
        if exact:
            return exact
        return [i for i, m in self._profile_meta.items() if wanted and wanted in _normalize(m["tytul"])]

    async def profile(self, innovation_id: str) -> dict:
        result = await asyncio.to_thread(self._profiles.get, ids=[innovation_id], include=["documents"])
        if len(result["ids"]) == 0:
            raise InnovationNotFound(innovation_id)
        meta = self._profile_meta[innovation_id]
        return {"id": innovation_id, "title": meta["tytul"], "category": meta["kategoria"],
                "url": meta["url"], "text": result["documents"][0]}

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        response = await self._openai.embeddings.create(model=self._model, input=texts)
        return [d.embedding for d in sorted(response.data, key=lambda d: d.index)]

    async def context(self, innovation_id: str, query_embeddings: list[list[float]], per_query: int) -> list[dict]:
        """Fragmenty jednej innowacji najlepiej pasujące do każdego z zapytań (bez duplikatów, w kolejności zapytań)."""
        results = await asyncio.gather(*(
            asyncio.to_thread(self._chunks.query, query_embeddings=[embedding], n_results=per_query,
                              where={"innowacja_id": innovation_id}, include=["documents", "metadatas"])
            for embedding in query_embeddings
        ))
        fragments: dict[str, dict] = {}
        for result in results:
            for chunk_id, doc, meta in zip(result["ids"][0], result["documents"][0], result["metadatas"][0]):
                fragments.setdefault(chunk_id, {
                    "text": doc.split("\n\n", 1)[-1],
                    "kind": meta["zrodlo"],
                    "file": meta["plik_nazwa"],
                    "page": meta["strona"] or None,
                })
        return list(fragments.values())

    # ------------------------------------------------------------------ wewnętrzne

    def _description(self, innovation_id: str) -> str:
        """Dokument profilu bez dwóch pierwszych linii (tytuł, kategoria)."""
        return self._profile_docs.get(innovation_id, "").split("\n", 2)[-1].strip()

    def _summary(self, innovation_id: str) -> dict:
        meta = self._profile_meta[innovation_id]
        category_slug, slug = innovation_id.split("/", 1)
        # skrót jako zwykły tekst: bez znaczników Markdown (#, >, *, linki) i z pojedynczymi spacjami
        description = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", self._description(innovation_id))
        description = " ".join(re.sub(r"[#>*_`|]+", " ", description).split())
        return {
            "id": innovation_id, "category_slug": category_slug, "slug": slug, "title": meta["tytul"],
            "category": meta["kategoria"], "url": meta["url"],
            "summary": description[:300] + ("…" if len(description) > 300 else ""),
        }

    def _bm25_ranking(self, query: str, category: str | None) -> list[str]:
        scores = self._bm25.scores(query)
        ranked = sorted(scores.items(), key=lambda item: -item[1])
        ids = [self._profile_ids[i] for i, _ in ranked]
        if category:
            ids = [i for i in ids if self._profile_meta[i]["kategoria_slug"] == category]
        return ids

    @staticmethod
    def _rrf(rankings: dict[str, list[str]]) -> list[tuple[str, float]]:
        """Wynik 0..1: 1 = innowacja pierwsza we wszystkich rankingach."""
        scores: dict[str, float] = {}
        for name, ids in rankings.items():
            for rank, innovation_id in enumerate(ids):
                scores[innovation_id] = scores.get(innovation_id, 0) + WEIGHTS[name] / (RRF_K + rank + 1)
        best_possible = sum(WEIGHTS.values()) / (RRF_K + 1)
        return sorted(((i, round(s / best_possible, 4)) for i, s in scores.items()), key=lambda x: -x[1])

    async def _hits(self, ranked: list[tuple[str, float]], embedding: list[float]) -> list[dict]:
        fragments = await asyncio.gather(*(self._fragments(i, embedding) for i, _ in ranked))
        hits = []
        for (innovation_id, score), innovation_fragments in zip(ranked, fragments):
            meta = self._profile_meta[innovation_id]
            category_slug, slug = innovation_id.split("/", 1)
            hits.append({
                "id": innovation_id,
                "category_slug": category_slug,
                "slug": slug,
                "title": meta["tytul"],
                "category": meta["kategoria"],
                "url": meta["url"],
                "score": score,
                "fragments": innovation_fragments,
            })
        return hits

    async def _fragments(self, innovation_id: str, embedding: list[float], limit: int = MAX_FRAGMENTS) -> list[dict]:
        """Najlepiej pasujące fragmenty danej innowacji — cytaty do wyświetlenia / kontekst dla LLM."""
        result = await asyncio.to_thread(
            self._chunks.query, query_embeddings=[embedding], n_results=limit,
            where={"innowacja_id": innovation_id}, include=["documents", "metadatas", "distances"],
        )
        return [
            {
                "text": doc.split("\n\n", 1)[-1],  # bez nagłówka "Innowacja: ..." dodanego przy embeddingu
                "source": meta["zrodlo"],
                "file": meta["plik_nazwa"],
                "page": meta["strona"] or None,
                "score": round(1 - dist, 4),
            }
            for doc, meta, dist in zip(result["documents"][0], result["metadatas"][0], result["distances"][0])
        ]


def _normalize(text: str) -> str:
    return re.sub(r"[^\w]+", " ", text.lower()).strip()
