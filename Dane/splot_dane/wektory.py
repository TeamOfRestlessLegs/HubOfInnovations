"""Indeks wektorowy danych z Obserwatora: opis problemu -> pasujące wskaźniki i obszar wyzwania.

* embeddingi: lokalny model wielojęzyczny (domyślnie intfloat/multilingual-e5-small, 384 wymiary,
  zmiana przez zmienną SPLOT_MODEL_WEKTOROWY) – bez klucza API, po pierwszym pobraniu bez sieci,
* magazyn: rozszerzenie sqlite-vec w tej samej bazie data/obserwator.sqlite (tabele vec0),
* indeksowane teksty: nazwa, kategoria (+ słowa kluczowe z config/kategorie_wskaznikow.yaml) i opis
  każdego wskaźnika z katalogu oraz obszary wyzwań z config/obszary_wyzwan.yaml.

    pip install .[wektory]
    python -m splot_dane indeks
    python -m splot_dane szukaj "młodzi wyjeżdżają z gminy"
"""

from __future__ import annotations

import hashlib
import json
import os
import struct
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml

from splot_dane import KATALOG_KONFIGURACJI
from splot_dane.magazyn import Magazyn
from splot_dane.obserwator.katalog import wczytaj_obszary

MODEL_DOMYSLNY = "intfloat/multilingual-e5-small"


class BrakIndeksu(RuntimeError):
    pass


# --- model i połączenie ---------------------------------------------------------------------

def nazwa_modelu() -> str:
    return os.environ.get("SPLOT_MODEL_WEKTOROWY") or MODEL_DOMYSLNY


@lru_cache(maxsize=2)
def _model(nazwa: str):
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as e:   # pragma: no cover - zależy od środowiska
        raise RuntimeError("Brak pakietu sentence-transformers. Zainstaluj: pip install .[wektory]") from e
    return SentenceTransformer(nazwa)


def _prefiksy(nazwa: str) -> tuple[str, str]:
    # modele E5 wymagają prefiksów „query:” / „passage:”
    return ("query: ", "passage: ") if "e5" in nazwa.lower() else ("", "")


def zakoduj(teksty: list[str], zapytanie: bool, nazwa: str | None = None) -> list[list[float]]:
    nazwa = nazwa or nazwa_modelu()
    prefiks = _prefiksy(nazwa)[0 if zapytanie else 1]
    wektory = _model(nazwa).encode([prefiks + t for t in teksty], normalize_embeddings=True, batch_size=32)
    return [list(map(float, w)) for w in wektory]


def _bajty(wektor: list[float]) -> bytes:
    return struct.pack(f"{len(wektor)}f", *wektor)


def polacz(magazyn: Magazyn) -> Magazyn:
    """Ładuje rozszerzenie sqlite-vec do połączenia magazynu (raz na połączenie)."""
    if getattr(magazyn, "_vec", False):
        return magazyn
    try:
        import sqlite_vec
    except ImportError as e:   # pragma: no cover - zależy od środowiska
        raise RuntimeError("Brak pakietu sqlite-vec. Zainstaluj: pip install .[wektory]") from e
    magazyn.db.enable_load_extension(True)
    sqlite_vec.load(magazyn.db)
    magazyn.db.enable_load_extension(False)
    magazyn._vec = True
    return magazyn


# --- teksty do indeksu ----------------------------------------------------------------------

def _kategorie() -> dict[str, str]:
    sciezka = KATALOG_KONFIGURACJI / "kategorie_wskaznikow.yaml"
    if not sciezka.exists():
        return {}
    return (yaml.safe_load(sciezka.read_text(encoding="utf-8")) or {}).get("kategorie", {})


def tekst_wskaznika(w, kategorie: dict[str, str]) -> str:
    slowa = kategorie.get(w["kategoria"] or "", "")
    kategoria = f"{w['kategoria']} ({slowa})" if slowa else (w["kategoria"] or "")
    return f"{w['nazwa']}. Kategoria: {kategoria}. {w['opis'] or ''}".strip()


def tekst_obszaru(klucz: str, o: dict) -> str:
    slowa = f" Np.: {o['slowa_kluczowe']}." if o.get("slowa_kluczowe") else ""
    return f"{o.get('nazwa', klucz)}. {o.get('opis', '')}{slowa}".strip()


# --- budowa indeksu --------------------------------------------------------------------------

def _meta(db, klucz: str) -> str | None:
    r = db.execute("SELECT wartosc FROM indeks_meta WHERE klucz = ?", (klucz,)).fetchone()
    return r[0] if r else None


def zbuduj_indeks(magazyn: Magazyn | None = None, wymus: bool = False) -> dict:
    """(Prze)buduje indeks wskaźników i obszarów. Nic nie robi, gdy teksty i model się nie zmieniły."""
    m = polacz(magazyn or Magazyn())
    db = m.db
    db.execute("CREATE TABLE IF NOT EXISTS indeks_meta (klucz TEXT PRIMARY KEY, wartosc TEXT)")
    kategorie = _kategorie()
    wskazniki = db.execute("SELECT * FROM wskazniki ORDER BY id").fetchall()
    if not wskazniki:
        raise BrakIndeksu("Katalog wskaźników jest pusty – uruchom najpierw: python -m splot_dane katalog")
    obszary = wczytaj_obszary()
    teksty_w = [tekst_wskaznika(w, kategorie) for w in wskazniki]
    teksty_o = [tekst_obszaru(k, o) for k, o in obszary.items()]
    model = nazwa_modelu()
    skrot = hashlib.sha256(json.dumps([model, teksty_w, teksty_o], ensure_ascii=False).encode()).hexdigest()
    if not wymus and _meta(db, "skrot") == skrot:
        return {"zmieniono": False, "wskazniki": len(teksty_w), "obszary": len(teksty_o), "model": model}

    wektory_w = zakoduj(teksty_w, zapytanie=False, nazwa=model)
    wektory_o = zakoduj(teksty_o, zapytanie=False, nazwa=model) if teksty_o else []
    wymiar = len(wektory_w[0])
    for tabela in ("wektory_wskaznikow", "wektory_obszarow"):
        db.execute(f"DROP TABLE IF EXISTS {tabela}")
    db.execute("DROP TABLE IF EXISTS obszary_indeksu")
    db.execute(f"CREATE VIRTUAL TABLE wektory_wskaznikow USING vec0("
               f"wskaznik_id INTEGER PRIMARY KEY, embedding float[{wymiar}] distance_metric=cosine)")
    db.execute(f"CREATE VIRTUAL TABLE wektory_obszarow USING vec0("
               f"obszar_nr INTEGER PRIMARY KEY, embedding float[{wymiar}] distance_metric=cosine)")
    db.execute("CREATE TABLE obszary_indeksu (obszar_nr INTEGER PRIMARY KEY, klucz TEXT NOT NULL)")
    db.executemany("INSERT INTO wektory_wskaznikow (wskaznik_id, embedding) VALUES (?, ?)",
                   [(w["id"], _bajty(v)) for w, v in zip(wskazniki, wektory_w)])
    for nr, (klucz, v) in enumerate(zip(obszary, wektory_o), 1):
        db.execute("INSERT INTO obszary_indeksu VALUES (?, ?)", (nr, klucz))
        db.execute("INSERT INTO wektory_obszarow (obszar_nr, embedding) VALUES (?, ?)", (nr, _bajty(v)))
    for klucz, wartosc in (("skrot", skrot), ("model", model), ("wymiar", str(wymiar))):
        db.execute("INSERT INTO indeks_meta VALUES (?, ?) ON CONFLICT(klucz) DO UPDATE SET wartosc = excluded.wartosc",
                   (klucz, wartosc))
    db.commit()
    return {"zmieniono": True, "wskazniki": len(teksty_w), "obszary": len(teksty_o), "model": model, "wymiar": wymiar}


# --- wyszukiwanie ------------------------------------------------------------------------------

@dataclass
class TrafienieWskaznika:
    wskaznik_id: int
    id_w_obserwatorze: int
    nazwa: str
    kategoria: str
    poziomy: str
    kod: str | None              # ustawiony, gdy wskaźnik jest w config/wskazniki.yaml
    podobienstwo: float          # 0–1 (cosinus)
    ma_wartosci: bool            # czy w bazie są już wartości gminne/powiatowe

    @property
    def gminny(self) -> bool:
        return "gminy" in (self.poziomy or "")


@dataclass
class TrafienieObszaru:
    klucz: str
    nazwa: str
    podobienstwo: float


def _sprawdz_indeks(m: Magazyn) -> None:
    db = m.db
    istnieje = db.execute("SELECT 1 FROM sqlite_master WHERE name = 'wektory_wskaznikow'").fetchone()
    if not istnieje:
        raise BrakIndeksu("Brak indeksu wektorowego – uruchom: python -m splot_dane indeks")
    model = _meta(db, "model")
    if model and model != nazwa_modelu():
        raise BrakIndeksu(f"Indeks zbudowano modelem {model}, a ustawiony jest {nazwa_modelu()} – "
                          "przebuduj: python -m splot_dane indeks")


def szukaj_wskaznikow(opis: str, k: int = 8, tylko_z_danymi_lokalnymi: bool = False,
                      tylko_gminne: bool = False, magazyn: Magazyn | None = None) -> list[TrafienieWskaznika]:
    """Wskaźniki najbardziej pasujące do opisu problemu (malejąco po podobieństwie)."""
    m = polacz(magazyn or Magazyn())
    _sprawdz_indeks(m)
    zapytanie = _bajty(zakoduj([opis], zapytanie=True, nazwa=_meta(m.db, "model"))[0])
    wiersze = m.db.execute(
        """SELECT v.wskaznik_id, v.distance, w.id_w_obserwatorze, w.nazwa, w.kategoria, w.poziomy, w.kod,
                  EXISTS(SELECT 1 FROM wartosci x WHERE x.wskaznik_id = w.id AND x.wartosc IS NOT NULL)
                  OR EXISTS(SELECT 1 FROM wartosci_powiatow x WHERE x.wskaznik_id = w.id AND x.wartosc IS NOT NULL)
           FROM wektory_wskaznikow v JOIN wskazniki w ON w.id = v.wskaznik_id
           WHERE v.embedding MATCH ? AND k = ? ORDER BY v.distance""",
        (zapytanie, max(k * 6, 30))).fetchall()
    wynik = []
    for r in wiersze:
        t = TrafienieWskaznika(r[0], r[2], r[3], r[4] or "", r[5] or "", r[6], round(1 - r[1], 4), bool(r[7]))
        if tylko_gminne and not t.gminny:
            continue
        if tylko_z_danymi_lokalnymi and not t.ma_wartosci:
            continue
        wynik.append(t)
        if len(wynik) == k:
            break
    return wynik


def zaproponuj_obszar(opis: str, k: int = 3, magazyn: Magazyn | None = None) -> list[TrafienieObszaru]:
    """Obszary wyzwań (config/obszary_wyzwan.yaml) najbliższe opisowi problemu."""
    m = polacz(magazyn or Magazyn())
    _sprawdz_indeks(m)
    obszary = wczytaj_obszary()
    zapytanie = _bajty(zakoduj([opis], zapytanie=True, nazwa=_meta(m.db, "model"))[0])
    wiersze = m.db.execute(
        """SELECT o.klucz, v.distance FROM wektory_obszarow v JOIN obszary_indeksu o ON o.obszar_nr = v.obszar_nr
           WHERE v.embedding MATCH ? AND k = ? ORDER BY v.distance""", (zapytanie, k)).fetchall()
    return [TrafienieObszaru(kl, (obszary.get(kl) or {}).get("nazwa", kl), round(1 - d, 4)) for kl, d in wiersze]
