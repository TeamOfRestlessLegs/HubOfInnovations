"""Katalog wskaźników Obserwatora i konfiguracja wybranych wskaźników."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import yaml

from splot_dane import KATALOG_KONFIGURACJI
from splot_dane.magazyn import Magazyn
from splot_dane.obserwator.klient import KlientObserwatora
from splot_dane.obserwator.parser import parsuj_liste_gmin, parsuj_menu, parsuj_strone_wskaznika

log = logging.getLogger(__name__)


@dataclass
class WskaznikKonfiguracji:
    kod: str
    id_w_obserwatorze: int
    obszar_wyzwania: str
    wyzej_znaczy_gorzej: bool
    uzasadnienie: str = ""


def wczytaj_konfiguracje(sciezka: Path | None = None) -> list[WskaznikKonfiguracji]:
    sciezka = sciezka or KATALOG_KONFIGURACJI / "wskazniki.yaml"
    dane = yaml.safe_load(Path(sciezka).read_text(encoding="utf-8")) or {}
    return [WskaznikKonfiguracji(**w) for w in dane.get("wskazniki", [])]


def wczytaj_lata_wstecz(sciezka: Path | None = None, domyslnie: int = 5) -> int:
    sciezka = sciezka or KATALOG_KONFIGURACJI / "wskazniki.yaml"
    dane = yaml.safe_load(Path(sciezka).read_text(encoding="utf-8")) or {}
    return int((dane.get("lata") or {}).get("wstecz", domyslnie))


def wczytaj_obszary(sciezka: Path | None = None) -> dict[str, dict]:
    sciezka = sciezka or KATALOG_KONFIGURACJI / "obszary_wyzwan.yaml"
    dane = yaml.safe_load(Path(sciezka).read_text(encoding="utf-8")) or {}
    return dane.get("obszary", {})


def zapisz_konfiguracje_w_bazie(magazyn: Magazyn, konfiguracja: list[WskaznikKonfiguracji]) -> None:
    for w in konfiguracja:
        poprzedni = magazyn.wskaznik(kod=w.kod)
        if poprzedni and poprzedni["id_w_obserwatorze"] != w.id_w_obserwatorze:
            # kod przeniesiony na inny wskaźnik – zwolnij go
            magazyn.db.execute("UPDATE wskazniki SET kod = NULL WHERE id = ?", (poprzedni["id"],))
        magazyn.zapisz_wskaznik({
            "id_w_obserwatorze": w.id_w_obserwatorze,
            "kod": w.kod,
            "obszar_wyzwania": w.obszar_wyzwania,
            "wyzej_znaczy_gorzej": int(w.wyzej_znaczy_gorzej),
        })
    magazyn.zatwierdz()


def zapisz_gminy(klient: KlientObserwatora, magazyn: Magazyn) -> int:
    gminy = parsuj_liste_gmin(klient.lista_gmin())
    for g in gminy:
        magazyn.zapisz_gmine(g)
    magazyn.zatwierdz()
    return len(gminy)


def zapisz_wskaznik_ze_strony(klient: KlientObserwatora, magazyn: Magazyn, pozycja: dict) -> dict:
    strona = parsuj_strone_wskaznika(klient.strona_wskaznika(pozycja["id"]))
    rekord = {
        "id_w_obserwatorze": pozycja["id"],
        "nazwa": pozycja["nazwa"],
        "kategoria": pozycja["kategoria"].capitalize(),
        "jednostka": strona.jednostka,
        "opis": strona.opis,
        "zrodlo": strona.zrodlo,
        "poziomy": ";".join(strona.poziomy),
        "domyslny_rok": strona.domyslny_rok,
    }
    magazyn.zapisz_wskaznik(rekord)
    return rekord


def pobierz_katalog(klient: KlientObserwatora, magazyn: Magazyn, postep=None) -> list[dict]:
    """Pełna lista wskaźników: menu + strona każdego wskaźnika (opis, źródło, poziomy)."""
    menu = parsuj_menu(klient.strona_glowna())
    zapisz_gminy(klient, magazyn)
    wynik = []
    for i, pozycja in enumerate(menu, 1):
        wynik.append(zapisz_wskaznik_ze_strony(klient, magazyn, pozycja))
        magazyn.zatwierdz()   # co wskaźnik: przerwane pobieranie zostawia spójną bazę
        if postep:
            postep(i, len(menu), pozycja)
    magazyn.eksportuj_katalog_csv()
    return wynik
