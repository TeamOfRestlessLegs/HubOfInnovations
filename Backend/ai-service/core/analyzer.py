import asyncio
import hashlib
import json
import re
from datetime import datetime, timezone

from openai import AsyncOpenAI

from core.analysis_cache import AnalysisCache
from core.vector_store import VectorStore
from model.analysis import ComparisonLLM, InnovationAnalysisLLM

PROMPT_VERSION = "1"  # podbij po zmianie promptów — unieważnia cache analiz
FRAGMENTS_PER_ASPECT = 5
MAX_CONCURRENT_LLM_CALLS = 4

# Zapytania wyszukujące fragmenty o danym aspekcie wewnątrz jednej innowacji
ASPECT_QUERIES = [
    "diagnoza problemu, geneza pomysłu, dlaczego powstała innowacja, autorzy, innowator, grantobiorca",
    "budżet, koszty realizacji, kosztorys, kwoty w złotych, wydatki, finansowanie",
    "zasoby potrzebne do realizacji: kadra, zespół, sprzęt, materiały, pomieszczenia",
    "partnerzy, współpraca z instytucjami, organizacje, ośrodek pomocy społecznej",
    "testowanie: miejsce realizacji, miejscowość, gmina, liczba uczestników, czas trwania, harmonogram",
    "rezultaty testowania, efekty, rekomendacje, ryzyka, warunki wdrożenia i powielenia",
]

ANALYSIS_PROMPT = """Jesteś analitykiem innowacji społecznych. Na podstawie fragmentów dokumentacji innowacji
opisz, JAK POWSTAŁA, JAKIE ŚRODKI WYKORZYSTAŁA i GDZIE BYŁA REALIZOWANA/TESTOWANA.

Zasady (bezwzględne):
- Korzystaj WYŁĄCZNIE z podanych fragmentów. Nie uzupełniaj wiedzą ogólną.
- Brak informacji = null albo pusta lista. Lepiej pominąć niż zgadywać.
- Kwoty podawaj tylko, jeśli dosłownie występują w tekście (w złotych, bez przeliczeń i sumowania).
- Każdy fakt opatrz `source_ids` — numerami fragmentów [S…], z których pochodzi.
- Miejsce to faktyczna lokalizacja realizacji lub testowania. Pola formularzy (np. „Gmina: ……”) i ogólne
  wzmianki o regionach NIE są miejscem realizacji.
- `setting`: miasto / wies / mieszane — tylko gdy wynika z tekstu, inaczej "nieokreslone".
- Pisz po polsku, zwięźle, konkretnie.

Innowacja: {title} ({category})

FRAGMENTY:
{fragments}
"""

COMPARISON_PROMPT = """Jesteś doradcą ds. wdrażania innowacji społecznych. Poniżej są analizy kilku podobnych,
przetestowanych innowacji. Zrób syntezę: co je łączy, jakie zasoby i partnerzy się powtarzają, co zadziałało,
jakie były ryzyka.

Zasady:
- Opieraj się WYŁĄCZNIE na podanych analizach. Gdy czegoś brakuje — nie zgaduj.
- Przy wnioskach wskazuj tytuły innowacji, z których wynikają (w nawiasie).
- `recommendations`: 3–6 konkretnych wskazówek {recommendation_target}.
- Pisz po polsku, zwięźle.
{user_part}
ANALIZY:
{analyses}
"""


class InnovationAnalyzer:
    """Analizy innowacji (jak powstała, środki, miejsce) i synteza podobnych projektów — LLM + cache."""

    def __init__(self, store: VectorStore, openai: AsyncOpenAI, cache: AnalysisCache, model: str):
        self._store, self._openai, self._cache, self._model = store, openai, cache, model
        self._aspect_embeddings: list[list[float]] | None = None
        self._llm_slots = asyncio.Semaphore(MAX_CONCURRENT_LLM_CALLS)
        self._locks: dict[str, asyncio.Lock] = {}  # jedna analiza danej innowacji naraz

    @property
    def model(self) -> str:
        return self._model

    # ------------------------------------------------------------------ analiza jednej innowacji

    async def build_context(self, innovation_id: str) -> tuple[dict, list[dict], str]:
        """(profil, ponumerowane fragmenty, hash kontekstu). Rzuca InnovationNotFound."""
        if self._aspect_embeddings is None:
            self._aspect_embeddings = await self._store.embed_many(ASPECT_QUERIES)
        profile = await self._store.profile(innovation_id)
        fragments = await self._store.context(innovation_id, self._aspect_embeddings, FRAGMENTS_PER_ASPECT)
        sources = [{"kind": "profil", "file": None, "page": None, "text": profile["text"]}] + fragments
        for number, source in enumerate(sources, start=1):
            source["id"] = number
        context_hash = _hash(PROMPT_VERSION, self._model, [s["text"] for s in sources])
        return profile, sources, context_hash

    async def analyze(self, innovation_id: str, force: bool = False) -> dict:
        profile, sources, context_hash = await self.build_context(innovation_id)
        async with self._locks.setdefault(innovation_id, asyncio.Lock()):
            if not force and (cached := await self._cache.get_analysis(innovation_id, context_hash)):
                return cached
            prompt = ANALYSIS_PROMPT.format(
                title=profile["title"], category=profile["category"], fragments=_format_sources(sources))
            llm = await self._parse(prompt, InnovationAnalysisLLM)
            analysis = _finalize_analysis(llm.model_dump(), profile, sources, self._model)
            await self._cache.put_analysis(innovation_id, context_hash, analysis)
            return analysis

    # ------------------------------------------------------------------ synteza podobnych projektów

    async def compare(self, ranked: list[tuple[str, float]], base_id: str | None = None,
                      user_description: str | None = None) -> dict:
        """ranked: [(id innowacji, podobieństwo)]. Z opisem użytkownika = benchmark jego pomysłu."""
        analyses = await asyncio.gather(*(self.analyze(innovation_id) for innovation_id, _ in ranked))
        key = _hash(PROMPT_VERSION, self._model, base_id, user_description, analyses)
        if cached := await self._cache.get_comparison(key):
            return cached

        if user_description:
            user_part = f"\nPOMYSŁ UŻYTKOWNIKA (odnieś rekomendacje do niego):\n{user_description}\n"
            target = "dla autora pomysłu — co przejąć z podobnych projektów, czego się wystrzegać"
        else:
            user_part = ""
            target = "dla osoby, która chce wdrożyć podobną innowację u siebie"
        prompt = COMPARISON_PROMPT.format(
            user_part=user_part, recommendation_target=target,
            analyses="\n\n".join(json.dumps(_compact(a), ensure_ascii=False) for a in analyses))
        llm = await self._parse(prompt, ComparisonLLM)

        rows = [_comparison_row(a, similarity) for a, (_, similarity) in zip(analyses, ranked)]
        comparison = {
            **llm.model_dump(),
            "base_id": base_id,
            "compared": rows,
            "typical_budget": _typical_budget(rows),
            "model": self._model,
            "generated_at": _now(),
        }
        await self._cache.put_comparison(key, comparison)
        return comparison

    async def _parse(self, prompt: str, schema):
        async with self._llm_slots:
            response = await self._openai.chat.completions.parse(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                response_format=schema,
                temperature=0,
            )
        message = response.choices[0].message
        if message.parsed is None:
            raise RuntimeError(f"Model nie zwrócił analizy: {message.refusal or 'brak odpowiedzi'}")
        return message.parsed


# ---------------------------------------------------------------------- pomocnicze

def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _hash(*parts) -> str:
    return hashlib.sha256(json.dumps(parts, ensure_ascii=False, sort_keys=True, default=str).encode()).hexdigest()


def _format_sources(sources: list[dict]) -> str:
    blocks = []
    for s in sources:
        where = "opis innowacji" if s["kind"] in ("profil", "opis") else f"{s['file']}, str. {s['page'] or '?'}"
        blocks.append(f"[S{s['id']}] ({where})\n{s['text']}")
    return "\n\n".join(blocks)


def _normalize_numbers(text: str) -> str:
    """'98 000,00 zł' / '98.000 zł' -> '98000,00 zł' — do sprawdzania, czy kwota występuje w tekście."""
    return re.sub(r"(?<=\d)[\s. ](?=\d{3}\b)", "", text)


def _amount_in_text(amount: float, text: str) -> bool:
    integer = str(int(round(amount)))
    return re.search(rf"(?<![\d]){integer}(?![\d])", text) is not None


def _finalize_analysis(data: dict, profile: dict, sources: list[dict], model: str) -> dict:
    """Weryfikacja odpowiedzi LLM: niepoprawne source_ids usuwane, kwoty spoza dokumentów odrzucane."""
    valid_ids = {s["id"] for s in sources}
    used_ids: set[int] = set()

    def clean_ids(node):
        if isinstance(node, dict):
            if "source_ids" in node:
                node["source_ids"] = sorted({i for i in node["source_ids"] if i in valid_ids})
                used_ids.update(node["source_ids"])
            for value in node.values():
                clean_ids(value)
        elif isinstance(node, list):
            for value in node:
                clean_ids(value)

    clean_ids(data)

    warnings = []
    all_text = _normalize_numbers(" ".join(s["text"] for s in sources))
    budget = data["resources"]["budget"]
    if budget:
        if budget["total_pln"] is not None and not _amount_in_text(budget["total_pln"], all_text):
            warnings.append(f"Odrzucono kwotę całkowitą {budget['total_pln']:.0f} zł — nie występuje w dokumentach.")
            budget["total_pln"] = None
        for item in budget["items"]:
            if item["amount_pln"] is not None and not _amount_in_text(item["amount_pln"], all_text):
                warnings.append(f"Odrzucono kwotę {item['amount_pln']:.0f} zł ({item['name']}) — brak w dokumentach.")
                item["amount_pln"] = None

    has_budget = bool(budget and (budget["total_pln"] is not None
                                  or any(i["amount_pln"] is not None for i in budget["items"])))
    testing = data["testing"]
    return {
        **data,
        "id": profile["id"],
        "title": profile["title"],
        "category": profile["category"],
        "url": profile["url"],
        "data_coverage": {
            "budget": has_budget,
            "location": bool(data["location"]["places"]),
            "testing": testing["participants"] is not None or testing["results"] is not None,
            "partners": bool(data["resources"]["partners"]),
            "innovator": data["origin"]["innovator"] is not None,
        },
        "sources": [
            {"id": s["id"], "kind": s["kind"], "file": s["file"], "page": s["page"],
             "excerpt": s["text"][:400]}
            for s in sources if s["id"] in used_ids
        ],
        "warnings": warnings,
        "model": model,
        "generated_at": _now(),
    }


def _compact(analysis: dict) -> dict:
    """Analiza bez źródeł i metadanych — krótki wsad do syntezy porównawczej."""
    def strip(node):
        if isinstance(node, dict):
            return {k: strip(v) for k, v in node.items() if k != "source_ids"}
        if isinstance(node, list):
            return [strip(v) for v in node]
        return node

    keep = ("title", "summary", "origin", "resources", "location", "testing", "replication")
    return strip({k: analysis[k] for k in keep})


def _comparison_row(analysis: dict, similarity: float) -> dict:
    budget = analysis["resources"]["budget"]
    return {
        "id": analysis["id"],
        "title": analysis["title"],
        "similarity": similarity,
        "budget_pln": budget["total_pln"] if budget else None,
        "participants": analysis["testing"]["participants"],
        "setting": analysis["location"]["setting"],
        "places": [p["name"] for p in analysis["location"]["places"]],
        "duration": analysis["testing"]["duration"],
        "partners": [p["name"] for p in analysis["resources"]["partners"]],
        "summary": analysis["summary"],
    }


def _typical_budget(rows: list[dict]) -> str:
    budgets = sorted(r["budget_pln"] for r in rows if r["budget_pln"] is not None)
    if not budgets:
        return f"Brak danych o budżecie w dokumentacji porównywanych projektów (0 z {len(rows)})."
    fmt = lambda v: f"{v:,.0f}".replace(",", " ")
    span = fmt(budgets[0]) if len(budgets) == 1 else f"{fmt(budgets[0])}–{fmt(budgets[-1])}"
    return f"{span} zł (dane z {len(budgets)} z {len(rows)} projektów)"
