"""Asystent wniosku – na atrapie OpenAI (bez klucza).

  python -m pytest tests/test_assistant.py      # z katalogu ai-service
"""

import sys
from pathlib import Path

from types import SimpleNamespace

import openai
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.assistant import _trim  # noqa: E402
from routes.assistant import assistantRoute  # noqa: E402
from tests.test_middleman import AtrapaOpenAI  # noqa: E402

KONTEKST = {
    "call": {"name": "Aktywni seniorzy", "criteria": "Jasna grupa docelowa; test w 6 miesięcy."},
    "idea": {"title": "Herbatka u sąsiada", "problem": "Seniorzy są samotni.", "description": "Spotkania w świetlicy.",
             "groups": ["seniorzy"]},
    "canvas": {"Problem – Intensywność": "Mocno przeszkadza"},
}
POLA = [
    {"id": "problem", "label": "Opis problemu", "limit": 200, "current": "Seniorzy są samotni."},
    {"id": "odbiorcy", "label": "Grupa docelowa", "limit": 100, "current": ""},
]


def propozycja(field_id, text="Seniorzy w naszej wsi często są sami. Chcemy to zmienić.", **inne):
    return {"field_id": field_id, "text": text, "why": "Rozwinąłem opis.", **inne}


def klient(atrapa):
    app = FastAPI()
    app.include_router(assistantRoute)
    app.state.openai = atrapa
    return TestClient(app)


def test_wniosek_propozycje_dla_pol_w_kolejnosci():
    atrapa = AtrapaOpenAI({"suggestions": [propozycja("odbiorcy", "Seniorzy."), propozycja("problem"),
                                           propozycja("nieznane")], "tips": ["Dopisz liczbę osób."]})
    odp = klient(atrapa).post("/asystent/wniosek", json={"context": KONTEKST, "fields": POLA})
    assert odp.status_code == 200
    d = odp.json()
    assert [s["field_id"] for s in d["suggestions"]] == ["problem", "odbiorcy"]
    assert d["tips"] == ["Dopisz liczbę osób."] and d["checks"] == []
    tresc = atrapa.wywolania[0]["messages"][1]["content"]
    assert "<dane_uzytkownika>" in tresc and "Herbatka u sąsiada" in tresc


def test_za_dlugi_tekst_poprawka_a_potem_przyciecie():
    dlugi = "To jest zdanie. " * 20   # 320 znaków > limit 200
    atrapa = AtrapaOpenAI({"suggestions": [propozycja("problem", dlugi), propozycja("odbiorcy")]},
                          {"suggestions": [propozycja("problem", dlugi), propozycja("odbiorcy", "Seniorzy.")]})
    d = klient(atrapa).post("/asystent/wniosek", json={"context": KONTEKST, "fields": POLA}).json()
    assert len(atrapa.wywolania) == 2
    assert "limit to 200" in atrapa.wywolania[1]["messages"][-1]["content"]
    problem = d["suggestions"][0]["text"]
    assert len(problem) <= 200 and problem.endswith(".")
    assert any("przycięto" in c for c in d["checks"])


def test_brak_pola_prosi_o_uzupelnienie():
    atrapa = AtrapaOpenAI({"suggestions": [propozycja("problem")]},
                          {"suggestions": [propozycja("problem"), propozycja("odbiorcy", "Seniorzy.")]})
    d = klient(atrapa).post("/asystent/wniosek", json={"context": KONTEKST, "fields": POLA}).json()
    assert "Grupa docelowa" in atrapa.wywolania[1]["messages"][-1]["content"]
    assert len(d["suggestions"]) == 2


def test_zly_json_dwa_razy_503():
    odp = klient(AtrapaOpenAI("nie json", "dalej nie")).post("/asystent/wniosek", json={"context": KONTEKST, "fields": POLA})
    assert odp.status_code == 503


def test_blad_openai_503():
    atrapa = AtrapaOpenAI(blad=openai.APIConnectionError(request=None))
    odp = klient(atrapa).post("/asystent/pole", json={"context": KONTEKST, "field": POLA[0]})
    assert odp.status_code == 503 and "Asystent niedostępny" in odp.json()["detail"]


def test_pole_z_poleceniem():
    atrapa = AtrapaOpenAI(propozycja("cokolwiek"))
    odp = klient(atrapa).post("/asystent/pole", json={
        "context": KONTEKST, "field": POLA[0], "kind": "canva", "previous": "Stara wersja.", "instruction": "krócej"})
    d = odp.json()
    assert d["field_id"] == "problem" and "questions" not in d
    wiadomosci = atrapa.wywolania[0]["messages"]
    assert wiadomosci[2] == {"role": "assistant", "content": '{"field_id": "problem", "text": "Stara wersja."}'}
    assert "<polecenie>krócej</polecenie>" in wiadomosci[3]["content"]
    assert "pole Canvy" in wiadomosci[1]["content"]


def test_trim_bez_konca_zdania():
    assert _trim("słowo " * 50, 40).endswith("…") and len(_trim("słowo " * 50, 40)) <= 40


# ---------------------------------------------------------------- wizualizacja pomysłu

class AtrapaObrazow(AtrapaOpenAI):
    def __init__(self, *odpowiedzi, b64="aGVsbG8=", blad_obrazu=None):
        super().__init__(*odpowiedzi)
        self.obrazy, self.b64, self.blad_obrazu = [], b64, blad_obrazu
        self.images = SimpleNamespace(generate=self._generate)

    async def _generate(self, **kwargs):
        self.obrazy.append(kwargs)
        if self.blad_obrazu:
            raise self.blad_obrazu
        return SimpleNamespace(data=[SimpleNamespace(b64_json=self.b64)])


SCENA = {"prompt": "A wooden bench with a QR code plaque in a village square.", "caption": "Wizualizacja poglądowa: ławka z kodem QR."}
FISZKA = {"idea": KONTEKST["idea"]}


def test_wizualizacja_zwraca_obraz_i_podpis():
    atrapa = AtrapaObrazow(SCENA)
    odp = klient(atrapa).post("/asystent/wizualizacja", json={**FISZKA, "style": "szkic"})
    assert odp.status_code == 200
    d = odp.json()
    assert d["image"] == "data:image/png;base64,aGVsbG8=" and d["caption"].startswith("Wizualizacja poglądowa")
    assert atrapa.obrazy[0]["prompt"].startswith("A wooden bench") and "sketch" in atrapa.obrazy[0]["prompt"]
    assert "<dane_uzytkownika>" in atrapa.wywolania[0]["messages"][1]["content"]


def test_wizualizacja_z_poleceniem():
    atrapa = AtrapaObrazow(SCENA)
    klient(atrapa).post("/asystent/wizualizacja", json={**FISZKA, "instruction": "dodaj stół"})
    assert "<polecenie>dodaj stół</polecenie>" in atrapa.wywolania[0]["messages"][1]["content"]


def test_wizualizacja_blad_obrazu_503():
    atrapa = AtrapaObrazow(SCENA, blad_obrazu=openai.APIConnectionError(request=None))
    odp = klient(atrapa).post("/asystent/wizualizacja", json=FISZKA)
    assert odp.status_code == 503 and "Asystent niedostępny" in odp.json()["detail"]


def test_wizualizacja_pusta_odpowiedz_503():
    odp = klient(AtrapaObrazow(SCENA, b64=None)).post("/asystent/wizualizacja", json=FISZKA)
    assert odp.status_code == 503
