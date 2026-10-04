"""
Liczenie analiz innowacji z góry (batch) — potem GET /innovations/{category}/{slug}/analysis odpowiada z cache.

  python -m scripts.build_analyses --szacuj          # koszt, bez wywołań LLM
  python -m scripts.build_analyses                   # wszystkie brakujące / nieaktualne
  python -m scripts.build_analyses --only dla-seniorow/merkury --force

Analiza w cache jest nieaktualna, gdy zmienił się kontekst (przebudowa bazy wektorowej), model albo wersja promptu.
"""

import argparse
import asyncio
import sys
import time

from openai import AsyncOpenAI

from core.analysis_cache import AnalysisCache
from core.analyzer import ANALYSIS_PROMPT, InnovationAnalyzer
from core.config import get_settings
from core.vector_store import VectorStore

CHARS_PER_TOKEN = 3.2      # przybliżenie dla polskiego tekstu
OUTPUT_TOKENS = 1800       # typowa długość analizy
# Orientacyjne ceny USD za 1M tokenów (wejście, wyjście) — sprawdź aktualny cennik OpenAI
PRICES = {"gpt-4.1-mini": (0.40, 1.60), "gpt-4.1": (2.00, 8.00), "gpt-4o-mini": (0.15, 0.60)}


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--szacuj", action="store_true", help="tylko policz koszt")
    parser.add_argument("--only", nargs="*", help="tylko wybrane innowacje (id)")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--force", action="store_true", help="licz od nowa także aktualne")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

    settings = get_settings()
    openai = AsyncOpenAI(api_key=settings.openai_key)
    store = VectorStore(settings.vector_db_path, settings.collection, settings.profiles_collection, openai)
    cache = AnalysisCache(settings.analysis_db_path)
    analyzer = InnovationAnalyzer(store, openai, cache, settings.analysis_model)

    ids = args.only or store.innovation_ids()
    ids = ids[: args.limit] if args.limit else ids

    todo, input_chars = [], 0
    for innovation_id in ids:
        profile, sources, context_hash = await analyzer.build_context(innovation_id)
        if args.force or not await cache.get_analysis(innovation_id, context_hash):
            todo.append(innovation_id)
            input_chars += len(ANALYSIS_PROMPT) + sum(len(s["text"]) + 40 for s in sources)
    input_tokens = int(input_chars / CHARS_PER_TOKEN)
    output_tokens = OUTPUT_TOKENS * len(todo)
    price_in, price_out = PRICES.get(settings.analysis_model, (None, None))
    cost = f"≈ ${input_tokens / 1e6 * price_in + output_tokens / 1e6 * price_out:.2f}" if price_in else "(brak ceny w PRICES)"
    print(f"Model: {settings.analysis_model} | do policzenia: {len(todo)} z {len(ids)} "
          f"| ~{input_tokens:,} tokenów wejścia + ~{output_tokens:,} wyjścia {cost}")
    if args.szacuj or not todo:
        return await _close(openai, cache)

    done, failed, started = 0, [], time.time()

    async def run(innovation_id):
        nonlocal done
        try:
            analysis = await analyzer.analyze(innovation_id, force=args.force)
            done += 1
            cov = analysis["data_coverage"]
            flags = " ".join(k for k, v in cov.items() if v)
            print(f"[{done}/{len(todo)}] {innovation_id}  ({flags}){'  ⚠ ' + str(len(analysis['warnings'])) if analysis['warnings'] else ''}")
        except Exception as e:  # jedna nieudana analiza nie zatrzymuje reszty
            failed.append(innovation_id)
            print(f"[BŁĄD] {innovation_id}: {e}")

    await asyncio.gather(*(run(i) for i in todo))
    print(f"\nGotowe: {done} analiz w {time.time() - started:.0f}s, błędów: {len(failed)} {failed or ''}")
    await _close(openai, cache)


async def _close(openai, cache):
    cache.close()
    await openai.close()


if __name__ == "__main__":
    asyncio.run(main())
