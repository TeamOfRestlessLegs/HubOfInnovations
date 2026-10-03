"""Proste statystyki porównawcze dla wskaźnika i roku.

Konwencje:
* średnia wojewódzka = zwykła (nieważona) średnia wartości wszystkich gmin z danymi
  (dla danych powiatowych – wszystkich powiatów),
* miejsce w rankingu: 1 = NAJWIĘKSZA skala problemu (uwzględnia wyzej_znaczy_gorzej);
  remisy dostają to samo miejsce (1, 2, 2, 4 …),
* „zbliżone do średniej”: odległość od średniej mniejsza niż 1/4 odchylenia
  standardowego między jednostkami (miara niezależna od jednostki wskaźnika).
"""

from __future__ import annotations

import sqlite3
import statistics
from dataclasses import dataclass

PROG_ZBLIZONE_SD = 0.25

POWYZEJ = "powyżej średniej"
ZBLIZONE = "zbliżone do średniej"
PONIZEJ = "poniżej średniej"


# --- czyste funkcje (bez bazy) ----------------------------------------------

def srednia(wartosci: list[float | None]) -> float | None:
    dane = [w for w in wartosci if w is not None]
    return statistics.fmean(dane) if dane else None


def ranking(wartosci: dict[int, float | None], wyzej_znaczy_gorzej: bool) -> dict[int, int]:
    """{id_jednostki: wartość} -> {id_jednostki: miejsce}; 1 = największy problem. Braki pomijane."""
    dane = {k: v for k, v in wartosci.items() if v is not None}
    posortowane = sorted(dane.values(), reverse=wyzej_znaczy_gorzej)
    pierwsze_miejsce = {}
    for i, v in enumerate(posortowane, 1):
        pierwsze_miejsce.setdefault(v, i)
    return {k: pierwsze_miejsce[v] for k, v in dane.items()}


def opis_porownania(wartosc: float | None, sr: float | None, odchylenie: float | None) -> str | None:
    if wartosc is None or sr is None:
        return None
    prog = PROG_ZBLIZONE_SD * (odchylenie or 0.0)
    if abs(wartosc - sr) <= prog:
        return ZBLIZONE
    return POWYZEJ if wartosc > sr else PONIZEJ


@dataclass
class Porownanie:
    wartosc: float | None
    srednia: float | None
    odchylenie: float | None
    miejsce: int | None
    liczba_jednostek: int
    opis: str | None


def porownaj(wartosci: dict[int, float | None], id_jednostki: int, wyzej_znaczy_gorzej: bool) -> Porownanie:
    dane = [v for v in wartosci.values() if v is not None]
    sr = srednia(dane)
    sd = statistics.pstdev(dane) if len(dane) > 1 else None
    w = wartosci.get(id_jednostki)
    miejsca = ranking(wartosci, wyzej_znaczy_gorzej)
    return Porownanie(w, sr, sd, miejsca.get(id_jednostki), len(dane), opis_porownania(w, sr, sd))


# --- odczyt z bazy -----------------------------------------------------------

def wartosci_gmin(db: sqlite3.Connection, wskaznik_id: int, rok: int) -> dict[int, float | None]:
    return {r[0]: r[1] for r in db.execute(
        "SELECT gmina_id, wartosc FROM wartosci WHERE wskaznik_id = ? AND rok = ?", (wskaznik_id, rok))}


def wartosci_powiatow(db: sqlite3.Connection, wskaznik_id: int, rok: int) -> dict[str, float | None]:
    return {r[0]: r[1] for r in db.execute(
        "SELECT powiat, wartosc FROM wartosci_powiatow WHERE wskaznik_id = ? AND rok = ?", (wskaznik_id, rok))}


def statystyka_gminy(db: sqlite3.Connection, wskaznik_id: int, rok: int, gmina_id: int, wyzej_znaczy_gorzej: bool) -> Porownanie:
    """Średnia wojewódzka po gminach, miejsce gminy, liczba gmin z danymi."""
    return porownaj(wartosci_gmin(db, wskaznik_id, rok), gmina_id, wyzej_znaczy_gorzej)


def statystyka_powiatu(db: sqlite3.Connection, wskaznik_id: int, rok: int, powiat: str, wyzej_znaczy_gorzej: bool) -> Porownanie:
    wart = wartosci_powiatow(db, wskaznik_id, rok)
    klucze = {p: i for i, p in enumerate(sorted(wart))}
    return porownaj({klucze[p]: v for p, v in wart.items()}, klucze.get(powiat, -1), wyzej_znaczy_gorzej)


def zmiana(db: sqlite3.Connection, wskaznik_id: int, rok: int, *, gmina_id: int | None = None, powiat: str | None = None
           ) -> tuple[int | None, float | None]:
    """(rok_porownania, różnica) względem najbliższego wcześniejszego roku z wartością."""
    if gmina_id is not None:
        sql, klucz = "SELECT rok, wartosc FROM wartosci WHERE wskaznik_id=? AND gmina_id=? AND rok<? AND wartosc IS NOT NULL ORDER BY rok DESC", gmina_id
        sql_teraz = "SELECT wartosc FROM wartosci WHERE wskaznik_id=? AND gmina_id=? AND rok=?"
    else:
        sql, klucz = "SELECT rok, wartosc FROM wartosci_powiatow WHERE wskaznik_id=? AND powiat=? AND rok<? AND wartosc IS NOT NULL ORDER BY rok DESC", powiat
        sql_teraz = "SELECT wartosc FROM wartosci_powiatow WHERE wskaznik_id=? AND powiat=? AND rok=?"
    teraz = db.execute(sql_teraz, (wskaznik_id, klucz, rok)).fetchone()
    wczesniej = db.execute(sql, (wskaznik_id, klucz, rok)).fetchone()
    if not teraz or teraz[0] is None or not wczesniej:
        return None, None
    return wczesniej[0], round(teraz[0] - wczesniej[1], 4)
