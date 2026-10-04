"""Miejsca na odpowiedzi w prawdziwych wzorach wniosków ROPS (data/wnioski) – bez modelu.

  python -m pytest tests/test_layout.py      # z katalogu ai-service
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.layout import Layout  # noqa: E402

WZORY = Path(__file__).resolve().parents[3] / "data" / "wnioski"


@pytest.fixture(scope="module")
def grant():
    return Layout((WZORY / "Wniosek o grant.pdf").read_bytes())


@pytest.fixture(scope="module")
def formularz():
    return Layout((WZORY / "Wzór formularza aplikacyjnego.pdf").read_bytes())


def test_pusta_ramka_pod_naglowkiem(grant):
    s = grant.slot("2. OPIS INNOWACYJNEJ USŁUGI SPOŁECZNEJ", "wykorzystanie wybranej innowacji społecznej?)")
    assert s["box"] and s["page"] == 2 and 360 < s["y"] < s["y_end"] < 392
    assert s["x0"] < 80 and s["x1"] > 500


def test_instrukcja_na_nastepnej_stronie(grant):
    # nagłówek „5.” jest na dole str. 3, instrukcja i ramka na str. 4
    s = grant.slot("5. DIAGNOZA PROBLEMU I OPIS ODBIORCÓW USŁUGI", "wykluczone społecznie i dlaczego?)")
    assert s["box"] and s["page"] == 3


def test_wzor_bez_ramek_wstawia_pod_instrukcja(formularz):
    s = formularz.slot("5. Diagnoza problemu, na który odpowiada", "– jeśli tak to jakim?)")
    assert not s["box"] and s["page"] == 2 and s["y"] == s["y_end"]
    nast = formularz.slot("6. Opis odbiorców innowacji", "lub zagrożone wykluczeniem?)")
    assert nast["page"] == 2 and nast["y"] > s["y"]


def test_naglowek_i_stopka_z_logotypami(formularz, grant):
    p = formularz.pages[0]
    assert 95 < p["top"] < 110 and 730 < p["bottom"] < 745      # logotypy u góry i u dołu
    assert grant.pages[0]["top"] < 60                             # tylko pasek logotypów u góry
    assert all(p["top"] <= c <= p["bottom"] for c in p["cuts"])
    assert p["top"] < p["last"] <= p["bottom"]
    assert grant.pages[7]["last"] < grant.pages[7]["bottom"] - 100     # str. 8 kończy się wcześnie (podział strony)


def test_koniec_w_srodku_listy_idzie_za_cala_liste(grant):
    # model podał koniec pierwszego wiersza punktu a) – odpowiedź ma trafić za całą listę a)–e), nie w jej środek
    srodek = grant.slots([("4. GRUPA DOCELOWA, DO KTÓREJ KIEROWANA", "z dziećmi i ich otoczenie, w tym rodziny"),
                          ("5. DIAGNOZA PROBLEMU I OPIS ODBIORCÓW USŁUGI", "wykluczone społecznie i dlaczego?)")])[0]
    calosc = grant.slots([("4. GRUPA DOCELOWA, DO KTÓREJ KIEROWANA", "terenie województwa małopolskiego."),
                          ("5. DIAGNOZA PROBLEMU I OPIS ODBIORCÓW USŁUGI", "wykluczone społecznie i dlaczego?)")])[0]
    assert srodek["page"] == calosc["page"] == 2 and srodek["y"] == calosc["y"] > 700


def test_lista_nie_przechodzi_przez_naglowek(grant):
    # po „e. Głuchy czytelnik…” jest „II. DANE WNIOSKODAWCY” – tam lista się kończy
    s = grant.slots([("I. NAZWA WYBRANEJ DO WDROŻENIA INNOWACJI", "e. Głuchy czytelnik w bibliotece"),
                     ("II. DOŚWIADCZENIE WNIOSKODAWCY", "")])[0]
    assert s["page"] == 0 and not s["box"]


def test_brak_naglowka(grant):
    assert grant.slot("Rozdział, którego nie ma w tym wzorze", "") is None
