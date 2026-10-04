"""Analiza wzoru wniosku (PDF) – na atrapie OpenAI.

  python -m pytest tests/test_template.py      # z katalogu ai-service
"""

import base64
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from routes.assistant import assistantRoute  # noqa: E402
from tests.test_middleman import AtrapaOpenAI  # noqa: E402


def pdf(*linie: str) -> bytes:
    """Najprostszy PDF z tekstem (Helvetica, ASCII) – bez zewnętrznych bibliotek."""
    tresc = "BT /F1 11 Tf 50 780 Td 14 TL " + " ".join(f"({x}) '" for x in linie) + " ET"
    obiekty = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(tresc)} >>\nstream\n{tresc}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    wynik, pozycje = "%PDF-1.4\n", []
    for i, o in enumerate(obiekty, 1):
        pozycje.append(len(wynik))
        wynik += f"{i} 0 obj\n{o}\nendobj\n"
    xref = len(wynik)
    wynik += f"xref\n0 {len(obiekty) + 1}\n0000000000 65535 f \n" + "".join(f"{p:010d} 00000 n \n" for p in pozycje)
    wynik += f"trailer\n<< /Size {len(obiekty) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"
    return wynik.encode("latin-1")


WZOR = "data:application/pdf;base64," + base64.b64encode(pdf(
    "WNIOSEK O DOFINANSOWANIE - Inkubator innowacji",
    "1. Imie i nazwisko wnioskodawcy",
    "2. Opis problemu spolecznego (max 1500 znakow)",
    "3. Budzet projektu z podzialem na kategorie",
    "4. Harmonogram dzialan",
)).decode()

KATALOG = [{"id": "intensywnosc", "title": "Intensywność", "section": "Problem"},
           {"id": "stale", "title": "Stałe koszty", "section": "Struktura kosztów"}]


def klient(atrapa):
    app = FastAPI()
    app.include_router(assistantRoute)
    app.state.openai = atrapa
    return TestClient(app)


def test_wzor_pola_powiazania_i_dopytania():
    budzet = {"text": "Ile pieniędzy potrzebujecie i na co?", "hint": "Np. 12 000 zł"}
    atrapa = AtrapaOpenAI({
        "fields": [
            {"id": "problem", "label": "Opis problemu społecznego", "anchor": "2. Opis problemu spolecznego",
             "after": "(max 1500 znakow)", "instruction": "Opisz problem.", "limit": 1500,
             "canvas": ["intensywnosc", "nieistniejace"], "idea": ["problem", "zle"], "questions": []},
            {"id": "budżet", "label": "Budżet projektu", "anchor": "3. Budzet projektu", "instruction": None,
             "limit": "max. 2 000 znaków",
             "canvas": ["stale"], "idea": None, "questions": [budzet]},
            {"id": "problem", "label": "Harmonogram działań", "anchor": "4. Harmonogram dzialan", "limit": 50000,
             "questions": [{"text": "Co i kiedy zrobicie?"}, {"text": "Ile pieniędzy potrzebujecie, i na co"}]},
        ],
    })
    odp = klient(atrapa).post("/asystent/wzor", json={"pdf": WZOR, "call": {"name": "Inkubator"}, "canvas_questions": KATALOG})
    assert odp.status_code == 200, odp.text
    d = odp.json()
    assert d["pages"] == 1 and d["form_fields"] == 0
    assert [f["id"] for f in d["fields"]] == ["problem", "budzet", "problem_2"]
    problem, budzet_pole, harmonogram = d["fields"]
    assert problem["canvas"] == ["intensywnosc"] and problem["idea"] == ["problem"]
    assert budzet_pole["limit"] == 2000 and budzet_pole["instruction"] == "" and budzet_pole["idea"] == []
    # to samo pytanie w dwóch polach → jedno dopytanie, podpięte pod oba
    assert [q["text"] for q in d["questions"]] == ["Ile pieniędzy potrzebujecie i na co?", "Co i kiedy zrobicie?"]
    assert budzet_pole["questions"] == [d["questions"][0]["id"]]
    assert harmonogram["limit"] == 10_000 and harmonogram["questions"] == [d["questions"][1]["id"], d["questions"][0]["id"]]
    assert any("nieistniejace" in c for c in d["checks"])
    # miejsce na odpowiedź: pod linią pola, kolejne pola coraz niżej; układ strony do składania PDF
    assert [f["slot"]["page"] for f in d["fields"]] == [0, 0, 0] and not problem["slot"]["box"]
    assert problem["slot"]["y"] < budzet_pole["slot"]["y"] < harmonogram["slot"]["y"]
    assert d["layout"][0]["width"] == 595 and d["layout"][0]["cuts"]
    # tekst wzoru trafia do modelu jako dane
    tresc = atrapa.wywolania[0]["messages"][1]["content"]
    assert "Harmonogram dzialan" in tresc and "<wzor>" in tresc and "intensywnosc: Problem" in tresc


def test_pole_bez_zrodla_wymusza_dopytanie():
    bez = {"fields": [{"id": "harmonogram", "label": "Harmonogram", "anchor": "4. Harmonogram dzialan", "limit": 1000}]}
    z = {"fields": [{"id": "harmonogram", "label": "Harmonogram", "anchor": "4. Harmonogram dzialan", "limit": 1000,
                     "questions": [{"text": "Co i kiedy zrobicie?", "hint": None}]}]}
    atrapa = AtrapaOpenAI(bez, z)
    d = klient(atrapa).post("/asystent/wzor", json={"pdf": WZOR}).json()
    assert "nie mają żadnego źródła" in atrapa.wywolania[1]["messages"][-1]["content"]
    assert d["fields"][0]["questions"] == [d["questions"][0]["id"]] and d["questions"][0]["hint"] == ""


def test_pdf_bez_tekstu_422():
    pusty = "data:application/pdf;base64," + base64.b64encode(pdf()).decode()
    odp = klient(AtrapaOpenAI()).post("/asystent/wzor", json={"pdf": pusty})
    assert odp.status_code == 422 and "skan" in odp.json()["detail"]


def test_to_nie_pdf_422():
    odp = klient(AtrapaOpenAI()).post("/asystent/wzor", json={"pdf": base64.b64encode(b"to nie jest pdf, tylko tekst").decode()})
    assert odp.status_code == 422


def test_nieznaleziony_naglowek_poprawka_a_potem_strona_dodatkowa():
    zly = {"fields": [{"id": "x", "label": "Opis", "anchor": "Rozdział, którego nie ma", "idea": ["problem"]}]}
    atrapa = AtrapaOpenAI(zly, zly)
    d = klient(atrapa).post("/asystent/wzor", json={"pdf": WZOR}).json()
    assert "DOSŁOWNIE" in atrapa.wywolania[1]["messages"][-1]["content"]
    assert d["fields"][0]["slot"] is None and any("stronę dodatkową" in c for c in d["checks"])


def test_model_bez_pol_422():
    odp = klient(AtrapaOpenAI({"fields": []}, {"fields": []})).post("/asystent/wzor", json={"pdf": WZOR})
    assert odp.status_code == 422 and "pól wniosku" in odp.json()["detail"]
