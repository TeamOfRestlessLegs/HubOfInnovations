from pathlib import Path

import pytest

from splot_dane.magazyn import Magazyn
from splot_dane.obserwator.parser import parsuj_csv, parsuj_liste_gmin
from splot_dane.obserwator.pobieranie import wczytaj_tabele

FIX = Path(__file__).parent / "fixtures"


@pytest.fixture
def magazyn_testowy() -> Magazyn:
    """Baza w pamięci z prawdziwą próbką Obserwatora: wskaźnik 257 (Ludność 60+), rok 2024."""
    m = Magazyn(":memory:")
    for g in parsuj_liste_gmin((FIX / "obserwator_portraitcommune.html").read_text(encoding="utf-8")):
        m.zapisz_gmine(g)
    wid = m.zapisz_wskaznik({
        "id_w_obserwatorze": 257, "nazwa": "Ludność w wieku 60+", "kod": "ludnosc_60_plus", "jednostka": "%",
        "obszar_wyzwania": "starzenie_sie", "wyzej_znaczy_gorzej": 1, "zrodlo": "GUS BDL (próbka testowa)",
    })
    wczytaj_tabele(m, wid, 2024, parsuj_csv((FIX / "obserwator_257_2024_gminy.csv").read_bytes()),
                   parsuj_csv((FIX / "obserwator_257_2024_powiaty.csv").read_bytes()))
    return m
