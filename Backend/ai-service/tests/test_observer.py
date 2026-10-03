"""Endpointy /observer na prawdziwej bazie Dane/data/obserwator.sqlite (tylko odczyt).

Aplikacja testowa ma sam router Obserwatora – bez OpenAI i ChromaDB. Testy wyszukiwania wektorowego
pomijają się, gdy brak sqlite-vec / sentence-transformers (pip install -r requirements.txt).

  python -m pytest tests/test_observer.py      # z katalogu ai-service (inna baza: OBSERVER_DB_PATH=…)
"""

import importlib.util
import os
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

SERVICE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_DIR))

from core.observer_store import ObserverStore  # noqa: E402
from routes.observer import observerRoute  # noqa: E402

DANE = SERVICE_DIR.parents[1] / "Dane"
TARNOW_WIEJSKA = 153
WEKTORY = all(importlib.util.find_spec(p) for p in ("sqlite_vec", "sentence_transformers"))
wektory = pytest.mark.skipif(not WEKTORY, reason="brak sqlite-vec / sentence-transformers")


@pytest.fixture(scope="module")
def c():
    app = FastAPI()
    app.include_router(observerRoute)
    baza = os.environ.get("OBSERVER_DB_PATH")
    app.state.observer = ObserverStore(DANE, Path(baza) if baza else None)
    with TestClient(app) as klient:
        yield klient


def test_status(c):
    s = c.get("/observer/status").json()
    assert s["communes"] > 100 and s["indicators"] > 0 and s["vector_index"] is True


def test_obszary(c):
    obszary = {a["key"]: a for a in c.get("/observer/areas").json()}
    assert "starzenie_sie" in obszary and obszary["starzenie_sie"]["indicators_with_data"] > 0


def test_gminy_filtry(c):
    tarnow = c.get("/observer/communes", params={"search": "Tarnow"}).json()   # bez polskich znaków też działa
    assert {g["type"] for g in tarnow} >= {"wiejska", "miasto na prawach powiatu"}
    powiat = c.get("/observer/communes", params={"county": "tarnowski"}).json()
    assert powiat and all(g["county"] == "tarnowski" for g in powiat)
    assert c.get("/observer/communes", params={"county": "Kraków"}).json()[0]["county"] == "m. Kraków"


def test_gmina_ze_wskaznikami(c):
    g = c.get(f"/observer/communes/{TARNOW_WIEJSKA}").json()
    assert g["name"] == "Tarnów" and g["type"] == "wiejska"
    z_wartoscia = [w for w in g["indicators"] if w["value"] is not None]
    assert z_wartoscia and all(w["year"] and w["source"] for w in z_wartoscia)


def test_skala_problemu(c):
    s = c.get(f"/observer/communes/{TARNOW_WIEJSKA}/scale", params={"area": "starzenie_sie"}).json()
    assert s["no_data"] is False and s["indicators"]
    brak = c.get(f"/observer/communes/{TARNOW_WIEJSKA}/scale", params={"area": "samotnosc"}).json()
    assert brak["no_data"] is True and "Brak danych" in brak["message"]


def test_podobne_gminy(c):
    podobne = c.get(f"/observer/communes/{TARNOW_WIEJSKA}/similar", params={"limit": 2}).json()
    assert len(podobne) == 2 and all(g["id"] != TARNOW_WIEJSKA for g in podobne)


def test_nieznana_gmina_404(c):
    assert c.get("/observer/communes/99999").status_code == 404
    assert c.get("/observer/communes/99999/scale", params={"area": "starzenie_sie"}).status_code == 404


def test_walidacja(c):
    assert c.get(f"/observer/communes/{TARNOW_WIEJSKA}/scale", params={"area": "Zły obszar!"}).status_code == 422
    assert c.post("/observer/indicators/search", json={"query": "ab"}).status_code == 422


@wektory
def test_szukaj_wskaznikow(c):
    r = c.post("/observer/indicators/search", json={"query": "seniorzy, starzenie się mieszkańców", "limit": 5}).json()
    assert len(r["results"]) == 5 and r["results"][0]["score"] > 0.7


@wektory
def test_szukaj_wskaznikow_dla_gminy(c):
    r = c.post("/observer/indicators/search",
               json={"query": "ludzie starsi samotni", "commune_id": TARNOW_WIEJSKA, "limit": 3}).json()
    assert r["results"] and all(h["value"]["value"] is not None for h in r["results"])


@wektory
def test_propozycja_obszaru(c):
    r = c.post("/observer/areas/suggest", json={"query": "młodzi wyjeżdżają, wieś się wyludnia"}).json()
    assert r["results"][0]["key"] == "depopulacja"


def test_bez_bazy_503():
    app = FastAPI()
    app.include_router(observerRoute)
    app.state.observer, app.state.observer_error = None, "Brak bazy Obserwatora"
    with TestClient(app) as klient:
        r = klient.get("/observer/status")
    assert r.status_code == 503 and "Brak bazy" in r.json()["detail"]
