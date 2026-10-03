"""Indeks wektorowy (sqlite-vec) – bez pobierania modelu: koder zastąpiony prostym wektorem słów."""

import math
import re

import pytest

pytest.importorskip("sqlite_vec")

from splot_dane import api, wektory  # noqa: E402
from splot_dane.wektory import BrakIndeksu  # noqa: E402

SLOWNIK = ["senior", "starsz", "60", "bezrobo", "prac", "migrac", "wyjeżdż", "ludno", "wiek"]


def koder_testowy(teksty, zapytanie, nazwa=None):
    """DANE TESTOWE: wektor obecności rdzeni słów ze SLOWNIK (znormalizowany) – deterministyczny, bez modelu."""
    wynik = []
    for t in teksty:
        t = t.lower()
        v = [1.0 if re.search(s, t) else 0.0 for s in SLOWNIK] + [0.01]
        n = math.sqrt(sum(x * x for x in v))
        wynik.append([x / n for x in v])
    return wynik


@pytest.fixture
def indeks(magazyn_testowy, monkeypatch):
    monkeypatch.setattr(wektory, "zakoduj", koder_testowy)
    monkeypatch.setattr(wektory, "nazwa_modelu", lambda: "koder-testowy")
    m = magazyn_testowy
    # dwa dodatkowe wskaźniki w katalogu (bez wartości w bazie)
    m.zapisz_wskaznik({"id_w_obserwatorze": 25, "nazwa": "Stopa bezrobocia", "kategoria": "Rynek pracy", "poziomy": "województwo;powiaty"})
    m.zapisz_wskaznik({"id_w_obserwatorze": 98, "nazwa": "Saldo migracji stałych", "kategoria": "Mobilność", "poziomy": "województwo;powiaty"})
    m.db.execute("UPDATE wskazniki SET kategoria = 'Ludność', poziomy = 'województwo;powiaty;gminy' WHERE id_w_obserwatorze = 257")
    info = wektory.zbuduj_indeks(m)
    assert info["zmieniono"] and info["wskazniki"] == 3
    return m


def test_brak_indeksu_daje_czytelny_blad(magazyn_testowy):
    with pytest.raises(BrakIndeksu):
        wektory.szukaj_wskaznikow("seniorzy", magazyn=magazyn_testowy)


def test_wyszukiwanie_wskaznikow(indeks):
    wyniki = wektory.szukaj_wskaznikow("seniorzy w wieku 60+ są samotni", k=3, magazyn=indeks)
    assert wyniki[0].id_w_obserwatorze == 257 and wyniki[0].ma_wartosci and wyniki[0].gminny
    wyniki = wektory.szukaj_wskaznikow("młodzi wyjeżdżają, migracja", k=1, magazyn=indeks)
    assert wyniki[0].id_w_obserwatorze == 98 and not wyniki[0].ma_wartosci
    assert all(t.gminny for t in wektory.szukaj_wskaznikow("praca", k=3, tylko_gminne=True, magazyn=indeks))


def test_indeks_nie_jest_przebudowywany_bez_zmian(indeks):
    assert wektory.zbuduj_indeks(indeks)["zmieniono"] is False


def test_propozycja_obszaru(indeks):
    obszary = wektory.zaproponuj_obszar("osoby starsze, seniorzy", k=3, magazyn=indeks)
    assert obszary and obszary[0].klucz == "starzenie_sie"


def test_wskazniki_dla_problemu_tylko_z_danymi(indeks):
    tarnow = api.znajdz_gmine("Tarnów", "wiejska", indeks)
    wyniki = api.wskazniki_dla_problemu("seniorzy 60+ i migracja", tarnow.id, k=3, magazyn=indeks)
    assert [w.wartosc.nazwa for w in wyniki] == ["Ludność w wieku 60+"]     # saldo migracji nie ma danych w bazie
    assert wyniki[0].wartosc.wartosc == 23.97 and wyniki[0].wartosc.rok == 2024
