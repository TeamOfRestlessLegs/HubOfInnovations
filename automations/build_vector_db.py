"""
Budowa bazy wektorowej (Chroma) z danych zebranych przez scraper.py.

Wejście:  Baza_Innowacji/  (innowacje.csv, pliki.csv, <kategoria>/<innowacja>/opis.md, PDF-y)
Wyjście:  ../ai-service/vector_db/  — kolekcja "innowacje", z której korzysta ai-service

Co trafia do bazy:
  - opis.md każdej innowacji (pełna treść podstrony)
  - czytelne PDF-y: "dowiedz się więcej" i PDF-y z materiałów (ZIP)
  Teksty są dzielone na chunki (~1200 znaków z zakładką), każdy chunk ma metadane
  (kategoria, innowacja, tytuł, url, źródło, plik, strona) do filtrowania i cytowania źródeł.

Embeddingi: OpenAI text-embedding-3-small.

Embeddingi są cache'owane (.cache/embeddings.sqlite) po hashu treści 
Użycie:
  python build_vector_db.py --szacuj     # tylko policz tokeny i koszt, bez wywołań API
  python build_vector_db.py              # zbuduj bazę
"""

import argparse
import csv
import hashlib
import json
import logging
import multiprocessing
import os
import re
import shutil
import sqlite3
import sys
from pathlib import Path

import chromadb
import tiktoken
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from openai import OpenAI
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "Baza_Innowacji"
DB_DIR = HERE.parent / "ai-service" / "vector_db"
CACHE_PATH = HERE / ".cache" / "embeddings.sqlite"
ENV_PATH = HERE / ".env"

COLLECTION = "innowacje"
EMBEDDING_MODEL = "text-embedding-3-small"
API_KEY_ENV = "OPENAI_KEY"
PRICE_PER_1M_TOKENS = 0.02  # USD, text-embedding-3-small

CHUNK_CHARS = 1200
CHUNK_OVERLAP = 200
MAX_CHUNK_TOKENS = 8000  # limit modelu to 8191
BATCH_TOKENS = 250_000   # limit API to 300k tokenów na zapytanie
BATCH_SIZE = 1000

PDF_KINDS = {"dowiedz_sie_wiecej", "z_zip"}  # pdf_do_odczytu to kopie z_zip — pomijamy duplikaty

ENCODER = tiktoken.get_encoding("cl100k_base")
logging.getLogger("pypdf").setLevel(logging.ERROR)


# ---------------------------------------------------------------- konfiguracja

def load_env():
    """Wczytuje .env (KLUCZ=wartość) do os.environ, jeśli zmienna nie jest już ustawiona."""
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


# ---------------------------------------------------------------- tekst i chunki

def clean_text(text):
    text = text.replace("\xa0", " ").replace("­", "")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)          # dzielenie wyrazów na końcu linii
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def split_paragraphs(text):
    """Dzieli tekst na akapity; zbyt długie akapity tnie po zdaniach / twardo."""
    for paragraph in re.split(r"\n\s*\n", text):
        paragraph = paragraph.strip()
        while len(paragraph) > CHUNK_CHARS:
            cut = paragraph.rfind(". ", 0, CHUNK_CHARS)
            cut = cut + 1 if cut > CHUNK_CHARS // 2 else CHUNK_CHARS
            yield paragraph[:cut].strip()
            paragraph = paragraph[cut:].strip()
        if paragraph:
            yield paragraph


def make_chunks(pages):
    """pages: lista (numer_strony albo None, tekst). Zwraca listę (strona_startowa, tekst_chunka)."""
    chunks, current, current_page = [], "", None
    for page_no, text in pages:
        for paragraph in split_paragraphs(clean_text(text)):
            if current and len(current) + len(paragraph) + 2 > CHUNK_CHARS:
                chunks.append((current_page, current))
                tail = current[-CHUNK_OVERLAP:]
                tail = tail[tail.find(" ") + 1:] if " " in tail else tail
                current, current_page = tail, page_no
            if not current:
                current_page = page_no
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current.strip():
        chunks.append((current_page, current))
    return [(p, c) for p, c in chunks if len(c.strip()) >= 40]


def read_description(innovation_dir):
    path = innovation_dir / "opis.md"
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8")
    return text.split("\n## Linki", 1)[0]  # sekcja z linkami to szum dla wyszukiwania


def read_pdf_pages(path):
    try:
        reader = PdfReader(str(path))
        if reader.is_encrypted:
            reader.decrypt("")
        return [(i + 1, page.extract_text() or "") for i, page in enumerate(reader.pages)]
    except Exception as e:
        print(f"  [PDF pominięty] {path.name}: {e}")
        return []


def truncate_tokens(text):
    tokens = ENCODER.encode(text)
    return text if len(tokens) <= MAX_CHUNK_TOKENS else ENCODER.decode(tokens[:MAX_CHUNK_TOKENS])


# ---------------------------------------------------------------- zbieranie dokumentów

def collect_chunks():
    """Zwraca listę rekordów: id, text (do embeddingu i zapisu), metadata."""
    innovations = {(r["kategoria_slug"], r["innowacja_slug"]): r for r in read_csv(DATA_DIR / "innowacje.csv")}
    files_by_innovation = {}
    for row in read_csv(DATA_DIR / "pliki.csv"):
        if row["rodzaj"] in PDF_KINDS and row["pdf_czytelny"] == "tak" and row["sciezka_lokalna"]:
            files_by_innovation.setdefault((row["kategoria_slug"], row["innowacja_slug"]), []).append(row)

    records = []
    for key, inn in innovations.items():
        innovation_id = f"{inn['kategoria_slug']}/{inn['innowacja_slug']}"
        base_meta = {
            "innowacja_id": innovation_id,
            "kategoria_slug": inn["kategoria_slug"],
            "kategoria": inn["kategoria"],
            "tytul": inn["tytul"],
            "url": inn["url"],
        }
        header = f"Innowacja: {inn['tytul']} ({inn['kategoria']})"
        sources = []

        description = read_description(DATA_DIR / inn["folder"])
        if description:
            sources.append(("opis", f"{inn['folder']}/opis.md", [(None, description)]))

        seen_hashes = set()
        for row in files_by_innovation.get(key, []):
            path = DATA_DIR / row["sciezka_lokalna"]
            if not path.exists():
                continue
            file_hash = hashlib.sha256(path.read_bytes()).hexdigest()
            if file_hash in seen_hashes:  # ten sam PDF w kilku miejscach materiałów
                continue
            seen_hashes.add(file_hash)
            kind = "pdf_dowiedz_sie_wiecej" if row["rodzaj"] == "dowiedz_sie_wiecej" else "pdf_materialy"
            sources.append((kind, row["sciezka_lokalna"], read_pdf_pages(path)))

        for kind, rel_path, pages in sources:
            for i, (page_no, chunk) in enumerate(make_chunks(pages)):
                text = truncate_tokens(f"{header}\n\n{chunk}")
                source_key = hashlib.sha1(rel_path.encode("utf-8")).hexdigest()[:10]
                records.append({
                    "id": f"{innovation_id}#{kind}:{source_key}:{i}",
                    "text": text,
                    "hash": hashlib.sha256(f"{EMBEDDING_MODEL}\n{text}".encode("utf-8")).hexdigest(),
                    "metadata": {
                        **base_meta,
                        "zrodlo": kind,
                        "plik": rel_path,
                        "plik_nazwa": Path(rel_path).name,
                        "strona": page_no or 0,
                        "chunk": i,
                    },
                })
        print(f"  {innovation_id}: {len(sources)} źródeł")
    return records


# ---------------------------------------------------------------- embeddingi (z cache)

class EmbeddingCache:
    def __init__(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.execute("CREATE TABLE IF NOT EXISTS emb (hash TEXT PRIMARY KEY, model TEXT, vector TEXT)")

    def get_many(self, hashes):
        found = {}
        hashes = list(hashes)
        for i in range(0, len(hashes), 900):
            part = hashes[i:i + 900]
            query = f"SELECT hash, vector FROM emb WHERE hash IN ({','.join('?' * len(part))})"
            for h, v in self.db.execute(query, part):
                found[h] = json.loads(v)
        return found

    def put_many(self, items):
        self.db.executemany("INSERT OR REPLACE INTO emb VALUES (?, ?, ?)",
                            [(h, EMBEDDING_MODEL, json.dumps(v)) for h, v in items])
        self.db.commit()


def embed_missing(records, cache):
    cached = cache.get_many({r["hash"] for r in records})
    missing = {}
    for r in records:
        if r["hash"] not in cached:
            missing.setdefault(r["hash"], r["text"])
    print(f"Embeddingi: {len(cached)} z cache, {len(missing)} do policzenia")
    if missing:
        client = OpenAI(api_key=os.environ[API_KEY_ENV])
        batch, batch_tokens, done = [], 0, 0
        items = list(missing.items())
        for idx, (h, text) in enumerate(items):
            tokens = len(ENCODER.encode(text))
            batch.append((h, text))
            batch_tokens += tokens
            last = idx == len(items) - 1
            if last or len(batch) >= BATCH_SIZE or batch_tokens + MAX_CHUNK_TOKENS > BATCH_TOKENS:
                response = client.embeddings.create(model=EMBEDDING_MODEL, input=[t for _, t in batch])
                vectors = [d.embedding for d in sorted(response.data, key=lambda d: d.index)]
                cache.put_many(zip([h for h, _ in batch], vectors))
                done += len(batch)
                print(f"  policzono {done}/{len(items)}")
                batch, batch_tokens = [], 0
        cached = cache.get_many({r["hash"] for r in records})
    return cached


# ---------------------------------------------------------------- zapis do Chroma

def write_collection(tmp_dir, records, vectors, result):
    """Uruchamiane w osobnym procesie: Chroma trzyma pliki otwarte do końca procesu,
    a na Windows nie da się przemianować katalogu z otwartymi plikami."""
    client = chromadb.PersistentClient(path=str(tmp_dir))
    collection = client.create_collection(
        COLLECTION,
        embedding_function=OpenAIEmbeddingFunction(api_key_env_var=API_KEY_ENV, model_name=EMBEDDING_MODEL),
        configuration={"hnsw": {"space": "cosine"}},
        metadata={"embedding_model": EMBEDDING_MODEL, "zrodlo_danych": "rops.krakow.pl biblioteka innowacji"},
    )
    for i in range(0, len(records), 2000):
        part = records[i:i + 2000]
        collection.add(
            ids=[r["id"] for r in part],
            embeddings=[vectors[r["hash"]] for r in part],
            documents=[r["text"] for r in part],
            metadatas=[r["metadata"] for r in part],
        )
    result.value = collection.count()


def build_chroma(records, vectors):
    tmp_dir = DB_DIR.with_name(DB_DIR.name + "_tmp")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    ctx = multiprocessing.get_context("spawn")
    result = ctx.Value("i", -1)
    vectors = {r["hash"]: vectors[r["hash"]] for r in records}
    process = ctx.Process(target=write_collection, args=(tmp_dir, records, vectors, result))
    process.start()
    process.join()
    if process.exitcode != 0 or result.value < 0:
        sys.exit(f"Zapis do Chroma nie powiódł się (kod {process.exitcode}).")
    count = result.value

    old_dir = DB_DIR.with_name(DB_DIR.name + "_old")
    if old_dir.exists():
        shutil.rmtree(old_dir)
    try:
        if DB_DIR.exists():
            DB_DIR.rename(old_dir)
        tmp_dir.rename(DB_DIR)
    except OSError as e:
        sys.exit(f"Nie udało się podmienić bazy ({e}). Czy ai-service ma ją otwartą? "
                 f"Nowa baza czeka w {tmp_dir}")
    shutil.rmtree(old_dir, ignore_errors=True)
    return count


# ---------------------------------------------------------------- main

def main():
    parser = argparse.ArgumentParser(description="Budowa bazy wektorowej Chroma z Baza_Innowacji")
    parser.add_argument("--szacuj", action="store_true", help="tylko policz tokeny i koszt (bez API)")
    args = parser.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    load_env()
    if not args.szacuj and not os.environ.get(API_KEY_ENV):
        sys.exit(f"Brak klucza {API_KEY_ENV} (w .env albo zmiennej środowiskowej).")

    print("Zbieranie i dzielenie tekstów...")
    records = collect_chunks()
    cache = EmbeddingCache(CACHE_PATH)
    cached = cache.get_many({r["hash"] for r in records})
    new_texts = {r["hash"]: r["text"] for r in records if r["hash"] not in cached}
    new_tokens = sum(len(ENCODER.encode(t)) for t in new_texts.values())
    innovations = len({r["metadata"]["innowacja_id"] for r in records})
    print(f"\nChunków: {len(records)} z {innovations} innowacji "
          f"(opisy: {sum(r['metadata']['zrodlo'] == 'opis' for r in records)}, "
          f"PDF: {sum(r['metadata']['zrodlo'] != 'opis' for r in records)})")
    print(f"Do policzenia: {len(new_texts)} chunków, {new_tokens:,} tokenów "
          f"≈ ${new_tokens / 1e6 * PRICE_PER_1M_TOKENS:.2f}")
    if args.szacuj:
        return

    vectors = embed_missing(records, cache)
    count = build_chroma(records, vectors)
    print(f"\nGotowe: kolekcja '{COLLECTION}' ({count} chunków) w {DB_DIR}")


if __name__ == "__main__":
    main()
