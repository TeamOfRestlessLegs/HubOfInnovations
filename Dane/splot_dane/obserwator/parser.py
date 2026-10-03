"""Zamiana surowych odpowiedzi Obserwatora (HTML, CSV) na proste rekordy."""

from __future__ import annotations

import csv
import html
import io
import re
from dataclasses import dataclass, field

TYP_MIEJSKA = "miejska"
TYP_WIEJSKA = "wiejska"
TYP_MNPP = "miasto na prawach powiatu"


def _tekst(fragment: str) -> str:
    bez_tagow = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(bez_tagow)).strip()


# --- menu: kategorie i wskaźniki ------------------------------------------

def parsuj_menu(tresc: str) -> list[dict]:
    """Strona główna -> [{id, nazwa, kategoria}] w kolejności z menu."""
    wynik = []
    bloki = re.findall(
        r'data-target="#submenu_\d+"[^>]*>(.*?)</button>(.*?)</ul>', tresc, re.S
    )
    for kategoria, cialo in bloki:
        kat = _tekst(kategoria)
        for id_, nazwa in re.findall(r'href="/differenceanalysis/(\d+)"[^>]*>(.*?)</a>', cialo, re.S):
            wynik.append({"id": int(id_), "nazwa": _tekst(nazwa), "kategoria": kat})
    return wynik


# --- strona wskaźnika ------------------------------------------------------

@dataclass
class StronaWskaznika:
    dostepna: bool                       # False = przekierowanie do analizy trendów
    nazwa: str = ""
    opis: str = ""
    zrodlo: str = ""
    domyslny_rok: int | None = None
    lata: list[int] = field(default_factory=list)
    jednostka: str = ""
    ma_uklad_gminny: bool = False
    gminy_z_wartoscia: int = 0           # w roku domyślnym

    @property
    def poziomy(self) -> list[str]:
        if not self.dostepna:
            return ["województwo (tylko analiza trendów)"]
        poziomy = ["województwo", "powiaty"]
        if self.ma_uklad_gminny and self.gminy_z_wartoscia > 0:
            poziomy.append("gminy")
        return poziomy


def _sekcja_opisu(tresc: str, naglowek: str) -> str:
    m = re.search(rf'<h3 class="h3">{naglowek}</h3>\s*(.*?)(?=<h[23]|</div>)', tresc, re.S)
    return _tekst(m.group(1)) if m else ""


def parsuj_strone_wskaznika(tresc: str) -> StronaWskaznika:
    if "differenceanalysisForm" not in tresc:
        return StronaWskaznika(dostepna=False)
    s = StronaWskaznika(dostepna=True)
    m = re.search(r"<h1>(.*?)</h1>", tresc, re.S)
    s.nazwa = _tekst(m.group(1)) if m else ""
    s.opis = _sekcja_opisu(tresc, "Opis")
    s.zrodlo = _sekcja_opisu(tresc, "Źródło")
    select = re.search(r'<select name="differenceanalysis\[year\]".*?</select>', tresc, re.S)
    if select:
        s.lata = [int(r) for r in re.findall(r'<option value="(\d{4})"', select.group(0))]
        dom = re.search(r'<option value="(\d{4})" selected', select.group(0))
        s.domyslny_rok = int(dom.group(1)) if dom else (max(s.lata) if s.lata else None)
    czesci = tresc.split('id="analysisTable2"', 1)
    glowna = czesci[0]
    wartosci_glowne = re.findall(r'<td class="text-right">\s*([^<]*?)\s*</td>', glowna)
    s.jednostka = jednostka_z_wartosci(next((w for w in wartosci_glowne if w), ""))
    if len(czesci) == 2:
        s.ma_uklad_gminny = True
        gminne = re.findall(r'<td class="text-right">\s*([^<]*?)\s*</td>', czesci[1])
        s.gminy_z_wartoscia = sum(1 for w in gminne if w.strip())
    return s


# --- lista gmin z podziałem na powiaty -------------------------------------

def rozbierz_nazwe_gminy(nazwa_zrodlowa: str) -> tuple[str, str | None]:
    """'Tarnów (wieś)' -> ('Tarnów', 'wiejska'); 'Brzesko' -> ('Brzesko', None)."""
    m = re.match(r"^(.*?)\s*\((miasto|wieś)\)\s*$", nazwa_zrodlowa)
    if not m:
        return nazwa_zrodlowa.strip(), None
    return m.group(1), TYP_MIEJSKA if m.group(2) == "miasto" else TYP_WIEJSKA


def parsuj_liste_gmin(tresc: str) -> list[dict]:
    """Strona /portraitcommune -> [{id_w_obserwatorze, nazwa_zrodlowa, nazwa, typ, powiat}]."""
    wynik = []
    for powiat, cialo in re.findall(r'<optgroup label="([^"]+)">(.*?)</optgroup>', tresc, re.S):
        nazwa_powiatu = re.sub(r"^powiat\s+", "", html.unescape(powiat).strip())
        for id_, nazwa in re.findall(r'<option value="(\d+)">([^<]+)</option>', cialo):
            zrodlowa = html.unescape(nazwa).strip()
            baza, typ = rozbierz_nazwe_gminy(zrodlowa)
            wynik.append({
                "id_w_obserwatorze": int(id_),
                "nazwa_zrodlowa": zrodlowa,
                "nazwa": baza,
                "typ": typ,
                "powiat": nazwa_powiatu,
            })
    return wynik


def gmina_z_powiatu_grodzkiego(nazwa_powiatu: str) -> dict | None:
    """'powiat m. Tarnów' -> rekord gminy 'Tarnów' (miasto na prawach powiatu)."""
    m = re.match(r"^(?:powiat\s+)?m\.\s*(.+)$", nazwa_powiatu.strip())
    if not m:
        return None
    return {
        "id_w_obserwatorze": None,
        "nazwa_zrodlowa": nazwa_powiatu.strip(),
        "nazwa": m.group(1).strip(),
        "typ": TYP_MNPP,
        "powiat": f"m. {m.group(1).strip()}",
    }


# --- eksport CSV -------------------------------------------------------------

def jednostka_z_wartosci(tekst: str) -> str:
    return "%" if tekst.strip().endswith("%") else ""


def liczba(tekst: str) -> float | None:
    """'27,32%' -> 27.32, '7742,0000' -> 7742.0, '' -> None."""
    t = tekst.strip().replace("%", "").replace("\xa0", "").replace(" ", "").replace(",", ".")
    if t in ("", "-", "–", "x", "brak"):
        return None
    try:
        return float(t)
    except ValueError:
        return None


@dataclass
class TabelaCsv:
    tytul: str
    rok: int | None
    naglowki: list[str]
    jednostka: str
    wiersze: list[dict]   # {obszar, wartosc, szczegoly: {nazwa_kolumny: liczba}}


def dekoduj(surowe: bytes) -> str:
    # Serwis deklaruje UTF-8, ale faktycznie wysyła Windows-1250.
    try:
        return surowe.decode("utf-8")
    except UnicodeDecodeError:
        return surowe.decode("cp1250")


def parsuj_csv(surowe: bytes | str) -> TabelaCsv:
    tekst = dekoduj(surowe) if isinstance(surowe, bytes) else surowe
    linie = [l for l in tekst.splitlines() if l.strip()]
    if not linie:
        # pusty plik = serwis nie ma danych dla tego roku (zob. KlientObserwatora.eksport_csv)
        return TabelaCsv(tytul="", rok=None, naglowki=[], jednostka="", wiersze=[])
    if len(linie) < 2 or "Obszar" not in linie[1]:
        raise ValueError("Nieoczekiwany format CSV Obserwatora (brak nagłówka 'Obszar').")
    separator = ";" if linie[1].count(";") >= linie[1].count(",") else ","
    tytul = linie[0].split(separator)[0].strip()
    lata = re.findall(r"\b((?:19|20)\d{2})\b", tytul)   # rok jest ostatnią liczbą 4-cyfrową w tytule
    rok = int(lata[-1]) if lata else None
    wiersze_csv = list(csv.reader(io.StringIO("\n".join(linie[1:])), delimiter=separator))
    naglowki = [h.strip() for h in wiersze_csv[0]]
    jednostka = ""
    wiersze = []
    for w in wiersze_csv[1:]:
        if not w or not w[0].strip():
            continue
        w = w + [""] * (len(naglowki) - len(w))
        surowa_wartosc = w[1] if len(w) > 1 else ""
        jednostka = jednostka or jednostka_z_wartosci(surowa_wartosc)
        szczegoly = {
            naglowki[i]: liczba(w[i])
            for i in range(2, len(naglowki))
            if naglowki[i] and liczba(w[i]) is not None
        }
        if szczegoly.get("Mianownik") == 1.0:   # techniczna kolumna przy wskaźnikach bez ułamka
            del szczegoly["Mianownik"]
        wiersze.append({"obszar": w[0].strip(), "wartosc": liczba(surowa_wartosc), "szczegoly": szczegoly})
    return TabelaCsv(tytul=tytul, rok=rok, naglowki=naglowki, jednostka=jednostka, wiersze=wiersze)
