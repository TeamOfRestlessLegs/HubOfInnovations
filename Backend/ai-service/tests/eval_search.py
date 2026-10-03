"""
Ocena jakości wyszukiwania na zestawie tests/eval_cases.py.

  python -m tests.eval_search                 # z katalogu ai-service
  python -m tests.eval_search --db vector_db_tmp -v

Miary:
  top1 — oczekiwana innowacja na 1. miejscu
  top3 — oczekiwana innowacja w pierwszej trójce
  MRR  — średnia z 1/pozycja pierwszego trafienia (1.0 = zawsze pierwsza)
"""

import argparse
import asyncio
import sys
from pathlib import Path

from openai import AsyncOpenAI

from core.config import SERVICE_DIR, get_settings
from core.vector_store import VectorStore
from tests.eval_cases import EVAL_CASES

TOP_K = 5


async def evaluate(store: VectorStore, verbose: bool) -> dict:
    top1 = top3 = 0
    reciprocal_ranks = []
    for query, expected in EVAL_CASES:
        results = await store.search(query, TOP_K)
        ids = [r["id"] for r in results]
        rank = next((i + 1 for i, r in enumerate(ids) if r in expected), None)
        top1 += rank == 1
        top3 += rank is not None and rank <= 3
        reciprocal_ranks.append(1 / rank if rank else 0)
        if verbose or rank != 1:
            mark = "✅" if rank == 1 else ("🟡" if rank else "❌")
            print(f"{mark} [{rank or '-'}] {query:<65} -> {[i.split('/')[1][:28] for i in ids[:3]]}")
    n = len(EVAL_CASES)
    return {"top1": f"{top1}/{n}", "top3": f"{top3}/{n}", "MRR": round(sum(reciprocal_ranks) / n, 3)}


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", help="katalog bazy (domyślnie z ustawień)")
    parser.add_argument("-v", "--verbose", action="store_true", help="pokaż też trafione zapytania")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    settings = get_settings()
    db_path = SERVICE_DIR / args.db if args.db else settings.vector_db_path
    openai = AsyncOpenAI(api_key=settings.openai_key)
    store = VectorStore(db_path, settings.collection, settings.profiles_collection, openai)
    print(f"Baza: {db_path} ({store.embedding_model})\n")
    print("\nWynik:", await evaluate(store, args.verbose))
    await openai.close()


if __name__ == "__main__":
    asyncio.run(main())
