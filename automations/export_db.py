"""
Eksport danych ze scrapera do importu w serwisie innovations (Java): POST /api/admin/import.

Format JSON = rekord ImportCommand z Javy (camelCase):
  {
    "categories":  [UpsertCategoryCommand...],
    "innovations": [{"innovation": UpsertInnovationCommand, "files": [FileCommand...]}]
  }

Użycie:
  python export_db.py                                             # zapis do Baza_Innowacji/innovations.json
  python export_db.py --post http://localhost:8081/api/admin/import   # zapis + wysłanie do serwisu

contentHash liczony jest z treści innowacji i jej plików (bez daty pobrania), więc import
w Javie pomija innowacje bez zmian, a aktualizuje te, w których zmienił się opis, linki albo pliki.
"""

import argparse
import csv
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path, PurePosixPath

import requests

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "Baza_Innowacji"
DEFAULT_OUT = DATA_DIR / "innovations.json"

# Z ZIP-ów eksportujemy tylko dokumenty — zdjęcia i filmy (~75 tys. plików) nie są potrzebne w bazie
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".odt", ".rtf", ".ppt", ".pptx", ".odp", ".xls", ".xlsx", ".ods"}
FILE_KINDS = {"dowiedz_sie_wiecej", "materialy", "z_zip"}  # pdf_do_odczytu = kopie, zasady_wykorzystania = wspólny plik

MIIS_BOILERPLATE = re.compile(
    r'\s*INNOWACJA WYBRANA DO UPOWSZECHNIANIA W RAMACH PROJEKTU\s*"?MAŁOPOLSKI INKUBATOR INNOWACJI SPOŁECZNYCH"?',
    re.IGNORECASE,
)


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def none_if_empty(value):
    value = (value or "").strip()
    return value or None


def first_link(value):
    """Kolumny z linkami w innowacje.csv mogą mieć kilka wartości rozdzielonych ' | '."""
    return none_if_empty((value or "").split(" | ")[0])


def to_offset_datetime(value):
    """'2026-10-03T13:44:22' -> '2026-10-03T13:44:22+02:00' (Java OffsetDateTime wymaga strefy)."""
    if not value:
        return None
    return datetime.fromisoformat(value).astimezone().isoformat()


def description_md(folder):
    """Treść sekcji '## Opis' z opis.md — bez nagłówka scrapera i bez sekcji z linkami."""
    path = DATA_DIR / folder / "opis.md"
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8")
    text = text.split("\n## Opis\n", 1)[-1].split("\n## Linki", 1)[0]
    return none_if_empty(text)


def file_command(row):
    path_in_zip = none_if_empty(row["sciezka_w_zip"])
    name_source = path_in_zip or row["sciezka_lokalna"] or row["zrodlo_url"]
    readable = {"tak": True, "nie": False}.get(row["pdf_czytelny"])
    return {
        "kind": row["rodzaj"],
        "fileName": PurePosixPath(name_source.replace("\\", "/")).name,
        "sourceUrl": none_if_empty(row["zrodlo_url"]),
        "pathInZip": path_in_zip,
        "storagePath": none_if_empty(row["sciezka_lokalna"]),
        "sizeBytes": int(row["rozmiar_b"]) if row["rozmiar_b"] else None,
        "pdfReadable": readable,
        "pdfPages": int(row["pdf_stron"]) if row["pdf_stron"] else None,
    }


def is_exported_file(row):
    if row["rodzaj"] not in FILE_KINDS:
        return False
    if row["rodzaj"] == "z_zip":
        return PurePosixPath(row["sciezka_w_zip"].replace("\\", "/")).suffix.lower() in DOCUMENT_EXTENSIONS
    return True


def content_hash(innovation, files):
    payload = {k: v for k, v in innovation.items() if k not in ("scrapedAt", "contentHash")}
    payload["files"] = files
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def build_export():
    categories = [
        {"slug": r["kategoria_slug"], "name": r["kategoria"], "sourceUrl": r["url"]}
        for r in read_csv(DATA_DIR / "kategorie.csv")
    ]

    files_by_innovation = {}
    for row in read_csv(DATA_DIR / "pliki.csv"):
        if is_exported_file(row):
            key = (row["kategoria_slug"], row["innowacja_slug"])
            files_by_innovation.setdefault(key, []).append(file_command(row))

    innovations = []
    for r in read_csv(DATA_DIR / "innowacje.csv"):
        files = files_by_innovation.get((r["kategoria_slug"], r["innowacja_slug"]), [])
        files.sort(key=lambda f: (f["kind"], f["pathInZip"] or "", f["fileName"]))  # stabilny hash
        innovation = {
            "categorySlug": r["kategoria_slug"],
            "slug": r["innowacja_slug"],
            "title": r["tytul"],
            "shortDescription": none_if_empty(MIIS_BOILERPLATE.sub("", r["opis_krotki"])),
            "descriptionMd": description_md(r["folder"]),
            "sourceUrl": r["url"],
            "materialsUrl": first_link(r["link_materialy"]),
            "videoUrl": first_link(r["link_film"]),
            "scrapedAt": to_offset_datetime(r["data_pobrania"]),
            "contentHash": None,
        }
        innovation["contentHash"] = content_hash(innovation, files)
        innovations.append({"innovation": innovation, "files": files})

    return {"categories": categories, "innovations": innovations}


def main():
    parser = argparse.ArgumentParser(description="Eksport Baza_Innowacji do JSON dla POST /api/admin/import")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help=f"plik wyjściowy (domyślnie {DEFAULT_OUT})")
    parser.add_argument("--post", metavar="URL", help="wyślij od razu, np. http://localhost:8081/api/admin/import")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    export = build_export()
    args.out.write_text(json.dumps(export, ensure_ascii=False, indent=2), encoding="utf-8")
    n_files = sum(len(i["files"]) for i in export["innovations"])
    print(f"Zapisano {args.out}: {len(export['categories'])} kategorii, "
          f"{len(export['innovations'])} innowacji, {n_files} plików "
          f"({args.out.stat().st_size / 1024 / 1024:.1f} MB)")

    if args.post:
        response = requests.post(args.post, json=export, timeout=300)
        print(f"POST {args.post} -> HTTP {response.status_code}")
        print(response.text[:2000])
        if not response.ok:
            sys.exit(1)


if __name__ == "__main__":
    main()
