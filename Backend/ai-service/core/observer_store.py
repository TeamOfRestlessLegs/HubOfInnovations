import asyncio
import logging
import sys
from datetime import date
from pathlib import Path

log = logging.getLogger(__name__)


class CommuneNotFound(Exception):
    pass


class SearchUnavailable(Exception):
    """Wyszukiwanie wektorowe nie działa: brak indeksu albo pakietów sqlite-vec / sentence-transformers."""


COVERAGE = "województwo małopolskie"   # Obserwator ROPS Kraków obejmuje tylko gminy i powiaty Małopolski


class ObserverStore:
    """Dane z Internetowego Obserwatora Statystyk Społecznych ROPS — nakładka na pakiet Dane/splot_dane.

    Baza SQLite (Dane/data/obserwator.sqlite) ma gminy, wskaźniki z wartościami i indeks wektorowy (sqlite-vec,
    lokalny model multilingual-e5-small) — budują je `python -m splot_dane scrape` i `python -m splot_dane indeks`.
    Połączenia SQLite nie są współdzielone między wątkami, więc każde zapytanie otwiera własne (w wątku roboczym).
    """

    def __init__(self, splot_dane_dir: Path, db_path: Path | None = None):
        if not (splot_dane_dir / "splot_dane").exists():
            raise RuntimeError(f"Brak pakietu splot_dane w {splot_dane_dir} — ustaw SPLOT_DANE_DIR")
        if str(splot_dane_dir) not in sys.path:
            sys.path.insert(0, str(splot_dane_dir))
        from splot_dane import SCIEZKA_BAZY, api, wektory
        from splot_dane.magazyn import Magazyn
        from splot_dane.obserwator.katalog import wczytaj_obszary

        self._api, self._wektory, self._Magazyn, self._obszary = api, wektory, Magazyn, wczytaj_obszary
        self._db_path = Path(db_path or SCIEZKA_BAZY)
        if not self._db_path.exists():
            raise RuntimeError(f"Brak bazy Obserwatora w {self._db_path} — uruchom: python -m splot_dane scrape")

    # ------------------------------------------------------------------ publiczne (async)

    async def status(self) -> dict:
        return await asyncio.to_thread(self._status)

    async def areas(self) -> list[dict]:
        return await asyncio.to_thread(self._areas)

    async def communes(self, search: str | None = None, county: str | None = None, type_: str | None = None) -> list[dict]:
        return await asyncio.to_thread(self._communes, search, county, type_)

    async def commune(self, commune_id: int) -> dict:
        return await asyncio.to_thread(self._commune, commune_id)

    async def problem_scale(self, commune_id: int, area: str) -> dict:
        return await asyncio.to_thread(self._problem_scale, commune_id, area)

    async def similar_communes(self, commune_id: int, limit: int) -> list[dict]:
        return await asyncio.to_thread(self._similar_communes, commune_id, limit)

    async def search_indicators(self, query: str, limit: int, commune_id: int | None, local_data_only: bool) -> list[dict]:
        return await asyncio.to_thread(self._search_indicators, query, limit, commune_id, local_data_only)

    async def suggest_areas(self, query: str, limit: int) -> list[dict]:
        return await asyncio.to_thread(self._suggest_areas, query, limit)

    def warm_up(self) -> None:
        """Ładuje model embeddingów (pierwsze wyszukiwanie nie czeka kilku sekund). Brak pakietów — tylko log."""
        try:
            self._wektory.zakoduj(["rozgrzewka"], zapytanie=True)
        except Exception as e:
            log.warning("Wyszukiwanie wektorowe Obserwatora niedostępne: %s", e)

    # ------------------------------------------------------------------ wewnętrzne

    def _magazyn(self):
        return self._Magazyn(self._db_path)

    def _gmina(self, m, commune_id: int):
        try:
            return self._api.gmina(commune_id, m)
        except self._api.GminaNieznaleziona:
            raise CommuneNotFound(commune_id)

    @staticmethod
    def _commune_dict(g) -> dict:
        return {"id": g.id, "name": g.nazwa, "type": g.typ, "county": g.powiat, "teryt": g.kod_teryt, "label": g.opis}

    @staticmethod
    def _indicator_dict(w) -> dict:
        return {
            "code": w.kod, "name": w.nazwa, "area": w.obszar_wyzwania, "value": w.wartosc, "unit": w.jednostka,
            "year": w.rok, "voivodeship_average": w.srednia_wojewodztwa, "rank": w.miejsce_w_rankingu,
            "units_compared": w.liczba_gmin, "change": w.zmiana, "comparison_year": w.rok_porownania,
            "comparison": w.opis_porownania, "level": w.poziom, "territorial_unit": w.jednostka_terytorialna,
            "higher_is_worse": w.wyzej_znaczy_gorzej, "description": w.opis_wskaznika, "url": w.adres,
            "details": w.szczegoly, "average_method": w.metoda_sredniej, "downloaded_at": w.pobrano, "source": w.zrodlo,
        }

    def _status(self) -> dict:
        with self._magazyn() as m:
            db = m.db
            index = db.execute("SELECT 1 FROM sqlite_master WHERE name = 'wektory_wskaznikow'").fetchone() is not None
            return {
                "communes": db.execute("SELECT COUNT(*) FROM gminy").fetchone()[0],
                "indicators": db.execute("SELECT COUNT(*) FROM wskazniki").fetchone()[0],
                "values": db.execute("SELECT COUNT(*) FROM wartosci").fetchone()[0],
                "vector_index": index,
                "embedding_model": self._wektory.nazwa_modelu(),
                "coverage": COVERAGE,
            }

    def _areas(self) -> list[dict]:
        with self._magazyn() as m:
            wynik = []
            for k, o in self._obszary().items():
                n = self._wektory.liczba_wskaznikow_obszaru(k, m)
                wynik.append({"key": k, "name": o.get("nazwa", k), "description": o.get("opis", ""),
                              "indicators_with_data": n, "has_data": n > 0,
                              "note": "" if n else self._wektory.UWAGA_BRAK_DANYCH})
            return wynik

    def _freshness(self, wartosci) -> dict:
        """Wiek danych z Obserwatora (daty pobrania wartości) i ostrzeżenie, gdy najstarsze mają > 90 dni."""
        daty = sorted(w.pobrano for w in wartosci if w.pobrano and w.wartosc is not None)
        wiek = (date.today() - date.fromisoformat(daty[0])).days if daty else None
        return {
            "downloaded_from": daty[0] if daty else None, "downloaded_to": daty[-1] if daty else None,
            "max_age_days": self._api.DNI_AKTUALNOSCI,
            "stale": wiek is None or wiek > self._api.DNI_AKTUALNOSCI,
            "message": self._api.ostrzezenie_o_aktualnosci([w for w in wartosci if w.wartosc is not None]),
        }

    def _communes(self, search, county, type_) -> list[dict]:
        with self._magazyn() as m:
            gminy = self._api.lista_gmin(search or None, type_ or None, m)
        if county:
            # miasta na prawach powiatu są w bazie jako powiat „m. Kraków” – przyjmujemy też samo „Kraków”
            nazwy = {county, f"m. {county}"}
            gminy = [g for g in gminy if g.powiat in nazwy]
        return [self._commune_dict(g) for g in gminy]

    def _commune(self, commune_id: int) -> dict:
        with self._magazyn() as m:
            g = self._gmina(m, commune_id)
            wskazniki = self._api.wskazniki_gminy(commune_id, m)
        return {**self._commune_dict(g), "indicators": [self._indicator_dict(w) for w in wskazniki],
                "data_freshness": self._freshness(wskazniki)}

    def _problem_scale(self, commune_id: int, area: str) -> dict:
        with self._magazyn() as m:
            self._gmina(m, commune_id)
            s = self._api.skala_problemu(commune_id, area, m)
        return {
            "commune": self._commune_dict(s.gmina), "area": s.obszar, "area_name": s.nazwa_obszaru,
            "no_data": s.brak_danych, "message": s.komunikat, "indicators": [self._indicator_dict(w) for w in s.wskazniki],
            "data_freshness": self._freshness(s.wskazniki),
        }

    def _similar_communes(self, commune_id: int, limit: int) -> list[dict]:
        with self._magazyn() as m:
            self._gmina(m, commune_id)
            return [self._commune_dict(g) for g in self._api.podobne_gminy(commune_id, limit, m)]

    def _vector(self, fn):
        try:
            return fn()
        except self._wektory.BrakIndeksu as e:
            raise SearchUnavailable(str(e)) from e
        except RuntimeError as e:   # brak sqlite-vec / sentence-transformers
            raise SearchUnavailable(str(e)) from e

    def _search_indicators(self, query: str, limit: int, commune_id: int | None, local_data_only: bool) -> list[dict]:
        with self._magazyn() as m:
            if commune_id is None:
                trafienia = self._vector(lambda: self._wektory.szukaj_wskaznikow(
                    query, k=limit, tylko_z_danymi_lokalnymi=local_data_only, magazyn=m))
                return [{"indicator_id": t.id_w_obserwatorze, "code": t.kod, "name": t.nazwa, "category": t.kategoria,
                         "levels": t.poziomy, "has_values": t.ma_wartosci, "score": t.podobienstwo, "value": None}
                        for t in trafienia]
            self._gmina(m, commune_id)
            trafienia = self._vector(lambda: self._api.wskazniki_dla_problemu(query, commune_id, k=limit, magazyn=m))
            return [{"indicator_id": t.id_w_obserwatorze, "code": t.wartosc.kod, "name": t.wartosc.nazwa,
                     "category": "", "levels": t.wartosc.poziom, "has_values": True, "score": t.podobienstwo,
                     "value": self._indicator_dict(t.wartosc)}
                    for t in trafienia]

    def _suggest_areas(self, query: str, limit: int) -> list[dict]:
        with self._magazyn() as m:
            trafienia = self._vector(lambda: self._wektory.zaproponuj_obszar(query, k=limit, magazyn=m))
        return [{"key": t.klucz, "name": t.nazwa, "score": t.podobienstwo, "indicators_with_data": t.liczba_wskaznikow,
                 "has_data": t.ma_dane, "note": t.uwaga} for t in trafienia]
