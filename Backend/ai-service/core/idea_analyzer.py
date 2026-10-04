import asyncio
import logging

from openai import AsyncOpenAI

from core.ideas_search import DOCUMENT_MIN_SIMILARITY, IdeasSearch, IdeasUnavailable, idea_text
from core.innovations_client import InnovationsClient
from core.vector_store import VectorStore
from model.ideas import IdeaAnalysisLLM

logger = logging.getLogger(__name__)

MAX_CATEGORIES = 2
CATEGORY_BOOST = 0.1  # innowacje z kategorii pomysłu lekko w górę — kategorie się nakładają, więc nie filtrujemy

PROMPT = """Jesteś doradcą w inkubatorze innowacji społecznych. Oceń szkic pomysłu zgłoszonego przez mieszkańca.

1. `categories`: 1–2 kategorie grup docelowych z listy (pole `slug` dokładnie jak na liście), najlepiej pasująca
   pierwsza, z krótkim uzasadnieniem. Drugą podaj tylko, jeśli pomysł wyraźnie dotyczy też innej grupy.
2. `profile`: grupa docelowa (konkretnie, z opisu), typ rozwiązania, środowisko (miasto/wieś — tylko gdy wynika
   z opisu, inaczej "nieokreslone"), 3–6 słów kluczowych.
3. `feedback`: czego brakuje, żeby pomysł dało się ocenić i wdrożyć (np. kto ma go realizować, skala, koszty,
   partnerzy), oraz 2–4 konkretne sugestie poprawy opisu. Bez ogólników i bez pochwał.

Opieraj się wyłącznie na opisie. Pisz po polsku, zwięźle.

KATEGORIE:
{categories}

POMYSŁ:
{idea}
"""


class IdeaAnalyzer:
    """Analiza szkicu pomysłu: kategorie, profil i wskazówki (LLM) + podobne innowacje i pomysły (wyszukiwanie)."""

    def __init__(self, store: VectorStore, ideas: IdeasSearch, client: InnovationsClient,
                 openai: AsyncOpenAI, model: str):
        self._store, self._ideas, self._client = store, ideas, client
        self._openai, self._model = openai, model

    @property
    def model(self) -> str:
        return self._model

    async def analyze(self, draft: dict, limit: int) -> dict:
        text = idea_text({
            "title": draft["title"], "problem": draft.get("problem"), "customGroup": draft.get("custom_group"),
            "summary": draft["summary"], "novelty": draft.get("novelty"),
        })
        embedding = await self._store.embed(text)  # jedno zapytanie do embeddingów dla obu wyszukiwań
        llm, innovations, ideas = await asyncio.gather(
            self._llm(text),
            self._store.search(text, limit * 2),
            self._similar_ideas(text, limit, embedding),
        )
        categories = self._categories(llm)
        innovations = _boost(innovations, {c["slug"] for c in categories})[:limit]
        details_available = await self._client.enrich(innovations)
        similar_ideas, ideas_available = ideas
        return {
            "categories": categories,
            "profile": llm.profile.model_dump(),
            "feedback": llm.feedback.model_dump(),
            "related_innovations": innovations,
            "similar_ideas": similar_ideas,
            "ideas_available": ideas_available,
            "details_available": details_available,
            "model": self._model,
        }

    async def _llm(self, text: str) -> IdeaAnalysisLLM:
        listing = "\n".join(f"- {slug}: {name}" for slug, name in sorted(self._store.categories().items()))
        response = await self._openai.chat.completions.parse(
            model=self._model,
            messages=[{"role": "user", "content": PROMPT.format(categories=listing, idea=text)}],
            response_format=IdeaAnalysisLLM,
            temperature=0,
        )
        message = response.choices[0].message
        if message.parsed is None:
            raise RuntimeError(f"Model nie zwrócił analizy: {message.refusal or 'brak odpowiedzi'}")
        return message.parsed

    def _categories(self, llm: IdeaAnalysisLLM) -> list[dict]:
        names = self._store.categories()
        picked, seen = [], set()
        for pick in llm.categories:  # model mógł podać slug spoza listy — takie pomijamy
            if pick.slug in names and pick.slug not in seen:
                seen.add(pick.slug)
                picked.append({"slug": pick.slug, "name": names[pick.slug], "reason": pick.reason})
        return picked[:MAX_CATEGORIES]

    async def _similar_ideas(self, text: str, limit: int, embedding: list[float]) -> tuple[list[dict], bool]:
        try:
            return await self._ideas.search(text, limit, embedding=embedding,
                                            min_similarity=DOCUMENT_MIN_SIMILARITY), True
        except IdeasUnavailable as e:
            logger.warning("Pomysły niedostępne: %s", e)
            return [], False


def _boost(hits: list[dict], categories: set[str]) -> list[dict]:
    return sorted(hits, key=lambda h: -(h["score"] + (CATEGORY_BOOST if h["category_slug"] in categories else 0)))
