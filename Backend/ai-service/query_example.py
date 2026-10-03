"""
Przykład odpytania bazy wektorowej zbudowanej przez automations/build_vector_db.py.

Kolekcja ma zapisaną konfigurację embeddingów (OpenAI text-embedding-3-small),
więc wystarczy get_collection + query_texts. Wymaga zmiennej OPENAI_KEY.

  python query_example.py "jak pomóc seniorom w zakupach przez internet"
  python query_example.py "aktywizacja zawodowa" --kategoria dla-rynku-pracy
"""

import argparse
import os
from pathlib import Path

import chromadb

DB_DIR = Path(__file__).resolve().parent / "vector_db"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pytanie")
    parser.add_argument("--kategoria", help="slug kategorii, np. dla-seniorow")
    parser.add_argument("-n", type=int, default=5)
    args = parser.parse_args()

    if not os.environ.get("OPENAI_KEY"):
        raise SystemExit("Ustaw zmienną OPENAI_KEY.")

    collection = chromadb.PersistentClient(path=str(DB_DIR)).get_collection("innowacje")
    result = collection.query(
        query_texts=[args.pytanie],
        n_results=args.n,
        where={"kategoria_slug": args.kategoria} if args.kategoria else None,
    )
    for doc, meta, dist in zip(result["documents"][0], result["metadatas"][0], result["distances"][0]):
        page = f", str. {meta['strona']}" if meta["strona"] else ""
        print(f"\n[{1 - dist:.2f}] {meta['tytul']} — {meta['kategoria']}")
        print(f"      {meta['zrodlo']}: {meta['plik_nazwa']}{page}")
        print(f"      {meta['url']}")
        print("      " + doc.split("\n\n", 1)[-1][:300].replace("\n", " ") + "…")


if __name__ == "__main__":
    main()
