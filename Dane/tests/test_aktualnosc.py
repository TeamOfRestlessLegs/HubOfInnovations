"""Data pobrania danych i informacja o metodzie średniej (bez sieci)."""

import os
from datetime import date, datetime

from splot_dane import api
from splot_dane.obserwator.klient import KlientObserwatora


def _wartosc(pobrano):
    # DANE TESTOWE – fikcyjna wartość wskaźnika
    return api.WartoscWskaznika(kod="t", nazwa="Test", obszar_wyzwania=None, wartosc=1.0, jednostka="", rok=2024,
                                srednia_wojewodztwa=1.0, miejsce_w_rankingu=1, liczba_gmin=10, zmiana=None,
                                rok_porownania=None, opis_porownania=None, zrodlo="test", pobrano=pobrano)


def test_ostrzezenie_o_starych_danych():
    dzis = date(2026, 10, 3)
    swieze = api.ostrzezenie_o_aktualnosci([_wartosc("2026-09-30")], dzis=dzis)
    assert "2026-09-30" in swieze and "UWAGA" not in swieze
    stare = api.ostrzezenie_o_aktualnosci([_wartosc("2026-01-10"), _wartosc("2026-09-30")], dzis=dzis)
    assert "2026-01-10 – 2026-09-30" in stare and "UWAGA" in stare and "--odswiez" in stare
    assert "nieznana" in api.ostrzezenie_o_aktualnosci([_wartosc(None)], dzis=dzis)


def test_data_pobrania_z_pliku_w_raw(tmp_path):
    klient = KlientObserwatora(katalog_raw=tmp_path)
    assert klient.data_pobrania(257, 2024) is None
    plik = tmp_path / klient.nazwy_plikow_csv(257, 2024)[1]
    plik.parent.mkdir(parents=True)
    plik.write_bytes(b"")
    znacznik = datetime(2026, 1, 10, 12, 0).timestamp()
    os.utime(plik, (znacznik, znacznik))
    assert klient.data_pobrania(257, 2024) == "2026-01-10"


def test_wartosc_ma_date_pobrania_i_metode_sredniej(magazyn_testowy):
    m = magazyn_testowy
    wid = m.wskaznik(id_w_obserwatorze=257)["id"]
    m.zapisz_pobranie(wid, 2024, "2026-01-10")
    m.zapisz_pobranie(wid, 2024, "2026-02-01")              # ponowne pobranie nadpisuje datę, bez duplikatu
    assert m.liczba_wierszy("pobrania") == 1
    tarnow = api.znajdz_gmine("Tarnów", "wiejska", m)
    w = next(x for x in api.wskazniki_gminy(tarnow.id, m) if x.nazwa == "Ludność w wieku 60+")
    assert w.pobrano == "2026-02-01"
    assert "nieważona" in w.metoda_sredniej
