"""
Scraper Biblioteki Innowacji Społecznych ROPS Kraków.

Przebieg:
  1. /kategorie                       -> lista kategorii           -> kategorie.csv
  2. każda kategoria                  -> lista innowacji (kafelki)  -> innowacje.csv
  3. każda innowacja ("Więcej")       -> pełny opis, linki          -> opis.md, strona.html, info.json
  4. "dowiedz się więcej" (PDF)       -> dowiedz_sie_wiecej/
  5. "pobierz materiały" (ZIP)        -> materialy/ (zip + rozpakowane/ + pdf_do_odczytu/)
  6. każdy zapisany plik              -> pliki.csv (skąd, dokąd, czy PDF da się odczytać)

Struktura wyjścia:
  Baza_Innowacji/
    kategorie.csv, innowacje.csv, pliki.csv
    _wspolne/                       (pliki wspólne dla wszystkich innowacji, np. zasady wykorzystania)
    <kategoria>/<innowacja>/
      opis.md, strona.html, info.json
      dowiedz_sie_wiecej/*.pdf
      materialy/<plik>.zip
      materialy/rozpakowane/...
      materialy/pdf_do_odczytu/*.pdf

Ponowne uruchomienie pobiera tylko nowe pliki (aktualizacje). --odswiez wymusza pobranie wszystkiego.
"""

import argparse
import csv
import io
import json
import logging
import os
import re
import shutil
import struct
import sys
import time
import unicodedata
import zipfile
from datetime import datetime
from pathlib import Path, PurePosixPath
from urllib.parse import urljoin, urlparse, unquote

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from pypdf import PdfReader
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://rops.krakow.pl"
CATEGORIES_URL = f"{BASE_URL}/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie"
LIBRARY_PATH = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/"
DATA_DIR = Path("Baza_Innowacji")
SHARED_DIR = DATA_DIR / "_wspolne"

DOWNLOAD_EXTENSIONS = {".pdf", ".zip", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".odt", ".rar", ".7z"}
SHARED_FILE_PATTERNS = ("zasady_wykorzystania",)  # pliki identyczne na każdej podstronie
MIN_READABLE_CHARS = 100  # PDF z mniejszą ilością tekstu traktujemy jako skan / nieczytelny
MAX_ZIP_DEPTH = 3
MAX_ZIP_MB = 500  # większe ZIP-y czytamy zdalnie i wyciągamy z nich tylko PDF-y (None = zawsze całe)
REQUEST_DELAY = 0.3

KATEGORIE_COLS = ["kategoria_slug", "kategoria", "url", "opis", "liczba_innowacji", "folder"]
INNOWACJE_COLS = [
    "kategoria_slug", "kategoria", "innowacja_slug", "tytul", "url", "opis_krotki",
    "link_dowiedz_sie_wiecej", "link_materialy", "link_film", "inne_linki",
    "liczba_plikow", "liczba_pdf_czytelnych", "folder", "data_pobrania",
]
PLIKI_COLS = [
    "kategoria_slug", "innowacja_slug", "rodzaj", "zrodlo_url", "sciezka_w_zip",
    "sciezka_lokalna", "rozmiar_b", "pdf_czytelny", "pdf_stron", "pdf_znakow", "status",
]


# ---------------------------------------------------------------- HTTP

def make_session():
    session = requests.Session()
    retry = Retry(total=4, backoff_factor=1, status_forcelist=(429, 500, 502, 503, 504))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.headers["User-Agent"] = "HubOfInnovations-scraper/1.0 (+kontakt: projekt hackathonowy)"
    return session


SESSION = make_session()
logging.getLogger("pypdf").setLevel(logging.ERROR)  # ostrzeżenia o fontach zaśmiecają wyjście


def get_soup(url):
    try:
        response = SESSION.get(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"  [Błąd HTTP] {url}: {e}")
        return None, None
    time.sleep(REQUEST_DELAY)
    response.encoding = response.encoding or "utf-8"
    return BeautifulSoup(response.text, "html.parser"), response.text


def download(url, path, force=False):
    """Pobiera plik. Zwraca 'pobrano', 'istnieje' albo 'błąd: ...'."""
    if path.exists() and path.stat().st_size > 0 and not force:
        return "istnieje"
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".part")
    try:
        with SESSION.get(url, timeout=120, stream=True) as response:
            response.raise_for_status()
            with open(tmp, "wb") as f:
                for chunk in response.iter_content(1 << 16):
                    f.write(chunk)
        tmp.replace(path)
        time.sleep(REQUEST_DELAY)
        return "pobrano"
    except (requests.RequestException, OSError) as e:
        tmp.unlink(missing_ok=True)
        print(f"  [Błąd pobierania] {url}: {e}")
        return f"błąd: {e}"


# ---------------------------------------------------------------- pomocnicze

def normalize_url(href):
    """Ujednolica URL (część linków na stronie ma http:// zamiast https://)."""
    url = urljoin(BASE_URL, href.strip())
    parsed = urlparse(url)
    if parsed.netloc.endswith("rops.krakow.pl"):
        url = parsed._replace(scheme="https", netloc="rops.krakow.pl").geturl()
    return url


def clean_text(text):
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def safe_name(name, max_len=100):
    """Nazwa pliku/folderu bezpieczna dla Windows (zachowuje polskie znaki)."""
    name = unicodedata.normalize("NFC", name)
    name = re.sub(r'[\\/*?:"<>|\x00-\x1f]', "_", name).strip(" .")
    if len(name) > max_len:
        stem, ext = os.path.splitext(name)
        name = stem[: max_len - len(ext)].rstrip(" .") + ext
    return name or "_"


def filename_from_url(url):
    return safe_name(unquote(PurePosixPath(urlparse(url).path).name))


def rel(path):
    return Path(path).relative_to(DATA_DIR).as_posix()


def file_extension(url):
    return PurePosixPath(urlparse(url).path).suffix.lower()


# ---------------------------------------------------------------- PDF / ZIP

class HttpRangeFile(io.RawIOBase):
    """Plik zdalny czytany przez HTTP Range — zipfile może dzięki temu wylistować ZIP
    i wyciągnąć pojedyncze pliki bez pobierania całego (wielogigabajtowego) archiwum."""

    def __init__(self, url, size):
        self.url, self.size, self.pos = url, size, 0

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, offset, whence=io.SEEK_SET):
        base = {io.SEEK_SET: 0, io.SEEK_CUR: self.pos, io.SEEK_END: self.size}[whence]
        self.pos = max(0, base + offset)
        return self.pos

    def readinto(self, buffer):
        if self.pos >= self.size or len(buffer) == 0:
            return 0
        end = min(self.pos + len(buffer), self.size) - 1
        response = SESSION.get(self.url, headers={"Range": f"bytes={self.pos}-{end}"}, timeout=120)
        if response.status_code != 206:
            raise OSError(f"serwer nie obsłużył Range (HTTP {response.status_code})")
        data = response.content
        buffer[: len(data)] = data
        self.pos += len(data)
        return len(data)


class SubFile(io.RawIOBase):
    """Okno [start, start+size) w innym pliku — pozwala otworzyć ZIP zapisany bez kompresji
    wewnątrz innego ZIP-a, bez rozpakowywania go na dysk."""

    def __init__(self, fp, start, size):
        self.fp, self.start, self.size, self.pos = fp, start, size, 0

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, offset, whence=io.SEEK_SET):
        base = {io.SEEK_SET: 0, io.SEEK_CUR: self.pos, io.SEEK_END: self.size}[whence]
        self.pos = max(0, base + offset)
        return self.pos

    def readinto(self, buffer):
        n = min(len(buffer), self.size - self.pos)
        if n <= 0:
            return 0
        self.fp.seek(self.start + self.pos)
        data = self.fp.read(n)
        buffer[: len(data)] = data
        self.pos += len(data)
        return len(data)


def member_data_offset(z, info):
    """Pozycja danych pliku w archiwum (za nagłówkiem lokalnym)."""
    z.fp.seek(info.header_offset)
    header = z.fp.read(30)
    name_len, extra_len = struct.unpack("<HH", header[26:30])
    return info.header_offset + 30 + name_len + extra_len


def remote_size(url):
    """Rozmiar pliku zdalnego i czy serwer obsługuje Range."""
    try:
        response = SESSION.head(url, timeout=30, allow_redirects=True)
        response.raise_for_status()
        size = int(response.headers.get("Content-Length", 0))
        return size, response.headers.get("Accept-Ranges", "").lower() == "bytes"
    except (requests.RequestException, ValueError):
        return 0, False


def pdf_info(path):
    """Zwraca (czytelny, liczba_stron, liczba_znaków) — czytelny = ma warstwę tekstową."""
    try:
        reader = PdfReader(str(path))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                return False, "", 0
        pages = len(reader.pages)
        chars = 0
        for page in reader.pages:
            chars += len((page.extract_text() or "").strip())
            if chars >= 5000:  # wystarczy żeby uznać za czytelny, nie mielimy całych książek
                break
        return chars >= MIN_READABLE_CHARS, pages, chars
    except Exception as e:
        print(f"    [PDF nieczytelny] {path.name}: {e}")
        return False, "", 0


def zip_member_name(info):
    """Poprawia polskie nazwy plików w ZIP-ach z Windows (cp852 zamiast UTF-8)."""
    if info.flag_bits & 0x800:
        return info.filename
    raw = info.filename.encode("cp437", errors="replace")
    for encoding in ("utf-8", "cp852", "cp1250"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return info.filename


def extract_zip(source, target_dir, only_pdf=False, depth=0):
    """Rozpakowuje ZIP (także zagnieżdżone). `source` to ścieżka albo plik zdalny (HttpRangeFile).

    only_pdf=True — wyciąga tylko PDF-y (i zagnieżdżone ZIP-y), resztę tylko odnotowuje.
    Zwraca listę (ścieżka_w_zip, ścieżka_lokalna albo None, rozmiar).
    """
    extracted = []
    try:
        with zipfile.ZipFile(source) as z:
            for info in z.infolist():
                if info.is_dir():
                    continue
                member = zip_member_name(info)
                parts = [safe_name(p) for p in PurePosixPath(member.replace("\\", "/")).parts
                         if p not in ("", ".", "..")]
                if not parts or "__MACOSX" in parts:
                    continue
                out_path = target_dir.joinpath(*parts)
                suffix = out_path.suffix.lower()
                big_nested_zip = (suffix == ".zip" and MAX_ZIP_MB is not None
                                  and info.file_size > MAX_ZIP_MB * 1024 * 1024)
                if big_nested_zip:
                    # duży ZIP w ZIP-ie: bez rozpakowywania, tylko PDF-y (możliwe gdy zapisany bez kompresji)
                    if depth < MAX_ZIP_DEPTH and info.compress_type == zipfile.ZIP_STORED and not info.flag_bits & 1:
                        window = io.BufferedReader(
                            SubFile(z.fp, member_data_offset(z, info), info.file_size), buffer_size=1 << 20)
                        nested_dir = out_path.with_name(out_path.stem)
                        for nested_member, nested_path, size in extract_zip(window, nested_dir, True, depth + 1):
                            extracted.append((f"{member}/{nested_member}", nested_path, size))
                    else:
                        extracted.append((member, None, info.file_size))
                    continue
                if only_pdf and suffix not in (".pdf", ".zip"):
                    extracted.append((member, None, info.file_size))
                    continue
                if not (out_path.exists() and out_path.stat().st_size == info.file_size):
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(info) as src, open(out_path, "wb") as dst:
                        shutil.copyfileobj(src, dst, 1 << 20)
                extracted.append((member, out_path, info.file_size))
                if suffix == ".zip" and depth < MAX_ZIP_DEPTH:
                    nested_dir = out_path.with_name(out_path.stem)
                    for nested_member, nested_path, size in extract_zip(out_path, nested_dir, only_pdf, depth + 1):
                        extracted.append((f"{member}/{nested_member}", nested_path, size))
    except (zipfile.BadZipFile, OSError, RuntimeError) as e:
        print(f"    [Błąd ZIP] {getattr(source, 'name', None) or getattr(source, 'url', source)}: {e}")
    return extracted


# ---------------------------------------------------------------- parsowanie stron

def parse_categories(soup):
    categories = {}
    content = soup.select_one("div.text-content") or soup
    for a in content.find_all("a", href=True):
        url = normalize_url(a["href"])
        path = urlparse(url).path
        name = clean_text(a.get_text(" "))
        if not path.startswith(LIBRARY_PATH) or "," in path or not name:
            continue
        slug = path[len(LIBRARY_PATH):].strip("/")
        if slug and slug != "kategorie":
            categories[slug] = {"kategoria_slug": slug, "kategoria": name, "url": url}
    return list(categories.values())


def parse_category_page(soup, category_slug):
    intro = soup.select_one("div.content__main > div.text-content")
    description = clean_text(intro.get_text(" ")) if intro else ""

    innovations = {}
    prefix = f"{LIBRARY_PATH}{category_slug},"
    for item in soup.select("div.news-list__item"):
        title_a = item.select_one("a.news-list__title") or item.select_one("a.btn-read-more")
        if not title_a or not title_a.get("href"):
            continue
        url = normalize_url(title_a["href"])
        path = urlparse(url).path
        if not path.startswith(prefix):
            continue
        desc_el = item.select_one(".news-list__desc")
        short_desc = ""
        if desc_el:
            desc_el = BeautifulSoup(str(desc_el), "html.parser")
            for table in desc_el.find_all("table"):
                table.decompose()
            short_desc = clean_text(desc_el.get_text(" "))
        innovations[url] = {
            "innowacja_slug": path[len(prefix):].strip("/"),
            "tytul": clean_text(title_a.get_text(" ")),
            "url": url,
            "opis_krotki": short_desc,
        }
    return description, list(innovations.values())


def classify_link(label, url):
    label = label.lower()
    ext = file_extension(url)
    lowered_url = url.lower()
    if any(p in lowered_url for p in SHARED_FILE_PATTERNS) or "zasad" in label:
        return "zasady_wykorzystania"
    if "dowiedz" in label:
        return "dowiedz_sie_wiecej"
    if "materia" in label or "pobierz" in label:
        return "materialy"
    if "film" in label or "youtu" in lowered_url:
        return "film"
    if "telefon" in label:
        return "telefon"
    if ext == ".zip":
        return "materialy"
    if ext in DOWNLOAD_EXTENSIONS:
        return "dowiedz_sie_wiecej"
    return "link"


def icon_table_labels(content):
    """Mapuje href -> podpis pod ikoną (np. 'dowiedz się więcej', 'pobierz materiały').

    Na stronie ikony są w jednym wierszu tabeli, a podpisy w wierszu pod nim.
    Komórki z rowspan>1 w pierwszym wierszu nie mają odpowiednika w drugim.
    """
    labels = {}
    for table in content.find_all("table"):
        rows = table.find_all("tr")
        for top, bottom in zip(rows, rows[1:]):
            top_cells = [td for td in top.find_all(["td", "th"], recursive=False)
                         if int(td.get("rowspan", 1) or 1) == 1]
            bottom_cells = bottom.find_all(["td", "th"], recursive=False)
            for cell, label_cell in zip(top_cells, bottom_cells):
                label = clean_text(label_cell.get_text(" "))
                for a in cell.find_all("a", href=True):
                    labels.setdefault(normalize_url(a["href"]), label)
    return labels


def parse_innovation_page(soup):
    main = soup.select_one("div.content__main") or soup
    title_el = main.select_one(".page-title")
    content = main.select_one("div.text-content")
    if content is None:
        return None

    labels = icon_table_labels(content)
    links = []
    seen = set()
    for a in content.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith(("#", "mailto:", "javascript:")):
            continue
        url = normalize_url(href)
        if url in seen:
            continue
        seen.add(url)
        label = labels.get(url) or clean_text(a.get_text(" "))
        links.append({"url": url, "podpis": label, "rodzaj": classify_link(label, url)})

    # Opis bez tabeli z ikonami (linki są osobno w info.json / CSV)
    text_soup = BeautifulSoup(str(content), "html.parser")
    for table in text_soup.find_all("table"):
        if table.find("img") and labels:
            table.decompose()
    description_md = md(str(text_soup), heading_style="ATX").strip()
    description_md = re.sub(r"\n{3,}", "\n\n", description_md)

    return {
        "tytul": clean_text(title_el.get_text(" ")) if title_el else "",
        "opis_md": description_md,
        "linki": links,
    }


# ---------------------------------------------------------------- przetwarzanie innowacji

def file_row(category_slug, innovation_slug, kind, source_url, local_path, status, path_in_zip="", size=""):
    exists = bool(local_path) and Path(local_path).exists()
    row = {
        "kategoria_slug": category_slug, "innowacja_slug": innovation_slug, "rodzaj": kind,
        "zrodlo_url": source_url, "sciezka_w_zip": path_in_zip,
        "sciezka_lokalna": rel(local_path) if exists else "",
        "rozmiar_b": Path(local_path).stat().st_size if exists else size,
        "pdf_czytelny": "", "pdf_stron": "", "pdf_znakow": "", "status": status,
    }
    if exists and Path(local_path).suffix.lower() == ".pdf":
        readable, pages, chars = pdf_info(Path(local_path))
        row.update(pdf_czytelny="tak" if readable else "nie", pdf_stron=pages, pdf_znakow=chars)
    return row


def process_materials_zip(url, materials_dir, category_slug, innovation_slug, force):
    """Pobiera i rozpakowuje ZIP z materiałami.

    ZIP większy niż MAX_ZIP_MB (zwykle przez filmy) nie jest pobierany w całości —
    czytamy go zdalnie (HTTP Range) i wyciągamy z niego tylko PDF-y.
    """
    rows = []
    zip_path = materials_dir / filename_from_url(url)
    unpack_dir = materials_dir / "rozpakowane" / safe_name(zip_path.stem)
    readable_dir = materials_dir / "pdf_do_odczytu"

    size, supports_range = remote_size(url)
    remote = (MAX_ZIP_MB is not None and size > MAX_ZIP_MB * 1024 * 1024
              and supports_range and not zip_path.exists())
    if remote:
        print(f"    duży ZIP ({size / 1024**3:.1f} GB) — wyciągam z niego tylko PDF-y")
        rows.append(file_row(category_slug, innovation_slug, "materialy", url, None,
                             "duży ZIP — nie pobrano w całości, wyciągnięto tylko PDF", size=size))
        source = io.BufferedReader(HttpRangeFile(url, size), buffer_size=1 << 20)
    else:
        status = download(url, zip_path, force)
        rows.append(file_row(category_slug, innovation_slug, "materialy", url, zip_path, status))
        if not zip_path.exists():
            return rows
        source = zip_path

    if force and unpack_dir.exists():
        shutil.rmtree(unpack_dir)
    extracted = extract_zip(source, unpack_dir, only_pdf=remote)

    for member, path, member_size in extracted:
        if path is None:
            rows.append(file_row(category_slug, innovation_slug, "z_zip", url, None,
                                 "pominięto — duży ZIP, pobrano z niego tylko PDF-y", member, member_size))
            continue
        row = file_row(category_slug, innovation_slug, "z_zip", url, path, "rozpakowano", member)
        rows.append(row)
        if row["pdf_czytelny"] == "tak":
            readable_dir.mkdir(parents=True, exist_ok=True)
            flat_name = safe_name("__".join(Path(member).parts)) if len(Path(member).parts) > 1 else path.name
            target = readable_dir / flat_name
            if not target.exists():
                shutil.copy2(path, target)
            rows.append(file_row(category_slug, innovation_slug, "pdf_do_odczytu", url, target,
                                 "skopiowano", member))
    return rows


def process_innovation(category, listing, force):
    cat_slug = category["kategoria_slug"]
    inn_slug = listing["innowacja_slug"]
    print(f"  • {listing['tytul']}")

    soup, raw_html = get_soup(listing["url"])
    folder = DATA_DIR / safe_name(cat_slug) / safe_name(inn_slug)
    folder.mkdir(parents=True, exist_ok=True)
    now = datetime.now().isoformat(timespec="seconds")

    innovation_row = {
        **{k: "" for k in INNOWACJE_COLS},
        "kategoria_slug": cat_slug, "kategoria": category["kategoria"], "innowacja_slug": inn_slug,
        "tytul": listing["tytul"], "url": listing["url"], "opis_krotki": listing["opis_krotki"],
        "folder": rel(folder), "data_pobrania": now,
    }
    if soup is None:
        innovation_row["liczba_plikow"] = 0
        return innovation_row, []

    page = parse_innovation_page(soup)
    if page is None:
        print("    [Brak treści na stronie]")
        return innovation_row, []
    title = page["tytul"] or listing["tytul"]
    innovation_row["tytul"] = title

    (folder / "strona.html").write_text(raw_html, encoding="utf-8")
    links_by_kind = {}
    for link in page["linki"]:
        links_by_kind.setdefault(link["rodzaj"], []).append(link["url"])

    md_links = "\n".join(f"- **{l['rodzaj']}** ({l['podpis'] or '-'}): {l['url']}" for l in page["linki"])
    (folder / "opis.md").write_text(
        f"# {title}\n\n"
        f"- Kategoria: {category['kategoria']}\n"
        f"- Źródło: {listing['url']}\n"
        f"- Pobrano: {now}\n\n"
        f"> {listing['opis_krotki']}\n\n"
        f"## Opis\n\n{page['opis_md']}\n\n"
        f"## Linki\n\n{md_links}\n",
        encoding="utf-8",
    )

    file_rows = []
    for link in page["linki"]:
        url, kind = link["url"], link["rodzaj"]
        if file_extension(url) not in DOWNLOAD_EXTENSIONS:
            continue
        name = filename_from_url(url)

        if kind == "zasady_wykorzystania":
            path = SHARED_DIR / name
            status = download(url, path, force=False)
            file_rows.append(file_row(cat_slug, inn_slug, kind, url, path, status))
            continue

        subdir = "materialy" if kind == "materialy" else "dowiedz_sie_wiecej"
        if file_extension(url) == ".zip":
            file_rows += process_materials_zip(url, folder / subdir, cat_slug, inn_slug, force)
            continue
        path = folder / subdir / name
        status = download(url, path, force)
        file_rows.append(file_row(cat_slug, inn_slug, kind, url, path, status))

    innovation_row.update(
        link_dowiedz_sie_wiecej=" | ".join(links_by_kind.get("dowiedz_sie_wiecej", [])),
        link_materialy=" | ".join(links_by_kind.get("materialy", [])),
        link_film=" | ".join(links_by_kind.get("film", [])),
        inne_linki=" | ".join(u for k, us in links_by_kind.items()
                              if k not in ("dowiedz_sie_wiecej", "materialy", "film") for u in us),
        liczba_plikow=sum(1 for r in file_rows if r["sciezka_lokalna"] and r["rodzaj"] != "pdf_do_odczytu"),
        liczba_pdf_czytelnych=sum(1 for r in file_rows if r["rodzaj"] == "pdf_do_odczytu")
        + sum(1 for r in file_rows if r["rodzaj"] == "dowiedz_sie_wiecej" and r["pdf_czytelny"] == "tak"),
    )
    (folder / "info.json").write_text(
        json.dumps({**innovation_row, "linki": page["linki"], "pliki": file_rows}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return innovation_row, file_rows


# ---------------------------------------------------------------- main

def write_csv(path, columns, rows):
    # utf-8-sig, żeby Excel poprawnie pokazał polskie znaki
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main():
    global DATA_DIR, SHARED_DIR, MAX_ZIP_MB
    parser = argparse.ArgumentParser(description="Scraper Biblioteki Innowacji Społecznych ROPS Kraków")
    parser.add_argument("--kategorie", nargs="*", help="tylko wybrane kategorie (slugi, np. dla-seniorow)")
    parser.add_argument("--limit", type=int, help="maks. liczba innowacji na kategorię (do testów)")
    parser.add_argument("--odswiez", action="store_true", help="pobierz ponownie wszystkie pliki")
    parser.add_argument("--max-zip-mb", type=int, default=MAX_ZIP_MB,
                        help=f"ZIP-y większe niż tyle MB: tylko PDF-y, bez pobierania całości "
                             f"(domyślnie {MAX_ZIP_MB}, 0 = pobieraj wszystko w całości)")
    parser.add_argument("--wyjscie", default=str(DATA_DIR), help=f"katalog wyjściowy (domyślnie {DATA_DIR})")
    args = parser.parse_args()
    sys.stdout.reconfigure(line_buffering=True)  # postęp widoczny na bieżąco także w pliku logu

    DATA_DIR = Path(args.wyjscie)
    SHARED_DIR = DATA_DIR / "_wspolne"
    MAX_ZIP_MB = args.max_zip_mb or None

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SHARED_DIR.mkdir(exist_ok=True)

    soup, _ = get_soup(CATEGORIES_URL)
    if soup is None:
        raise SystemExit("Nie udało się pobrać strony kategorii.")
    categories = parse_categories(soup)
    if args.kategorie:
        categories = [c for c in categories if c["kategoria_slug"] in args.kategorie]
    print(f"Znaleziono kategorii: {len(categories)}")

    category_rows, innovation_rows, all_file_rows = [], [], []
    for category in categories:
        print(f"\n--- {category['kategoria']} ---")
        cat_soup, _ = get_soup(category["url"])
        if cat_soup is None:
            continue
        description, innovations = parse_category_page(cat_soup, category["kategoria_slug"])
        if args.limit:
            innovations = innovations[: args.limit]
        cat_folder = DATA_DIR / safe_name(category["kategoria_slug"])
        cat_folder.mkdir(exist_ok=True)
        category_rows.append({**category, "opis": description, "liczba_innowacji": len(innovations),
                              "folder": rel(cat_folder)})

        for listing in innovations:
            try:
                innovation_row, file_rows = process_innovation(category, listing, args.odswiez)
            except Exception as e:  # jedna zepsuta podstrona nie zatrzymuje całości
                print(f"    [Błąd] {listing['url']}: {e}")
                continue
            innovation_rows.append(innovation_row)
            all_file_rows += file_rows
            # zapis po każdej innowacji, żeby przerwanie nie gubiło wyników
            write_csv(DATA_DIR / "kategorie.csv", KATEGORIE_COLS, category_rows)
            write_csv(DATA_DIR / "innowacje.csv", INNOWACJE_COLS, innovation_rows)
            write_csv(DATA_DIR / "pliki.csv", PLIKI_COLS, all_file_rows)

    readable = sum(1 for r in all_file_rows if r["pdf_czytelny"] == "tak" and r["rodzaj"] != "pdf_do_odczytu")
    errors = sum(1 for r in all_file_rows if r["status"].startswith("błąd"))
    print(f"\nGotowe: {len(category_rows)} kategorii, {len(innovation_rows)} innowacji, "
          f"{len(all_file_rows)} wpisów plików, {readable} czytelnych PDF, {errors} błędów pobierania.")
    print(f"Wyniki: {DATA_DIR.resolve()}")


if __name__ == "__main__":
    main()
