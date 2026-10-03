"""Klient HTTP Obserwatora: limit zapytań, ponawianie, pamięć podręczna w data/raw/.

Serwis jest stanowy (wskaźnik i rok są trzymane w sesji), dlatego zapytania
dotyczące jednego wskaźnika i roku idą zawsze jako jedna, nieprzerwana seria.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path

import requests

from splot_dane import KATALOG_DANYCH

log = logging.getLogger(__name__)

ADRES_BAZOWY = "https://obserwator.rops.krakow.pl"
USER_AGENT = "splot-hackyeah/0.1 (+prototyp HackYeah dla ROPS Krakow)"
MIN_ODSTEP_S = 1.0
MAKS_PROB = 3
KODY_ODMOWY = {401, 403, 429}


class SerwisOdrzucaZapytania(RuntimeError):
    """Serwis odmówił obsługi (403/429 itp.). Nie obchodzimy tego – przerywamy."""


class BladPobierania(RuntimeError):
    """Nie udało się pobrać danych mimo ponowień albo odpowiedź ma zły format."""


class KlientObserwatora:
    def __init__(
        self,
        katalog_raw: Path | None = None,
        odswiez: bool = False,
        min_odstep_s: float = MIN_ODSTEP_S,
        sesja: requests.Session | None = None,
    ):
        self.katalog_raw = Path(katalog_raw or KATALOG_DANYCH / "raw")
        self.katalog_raw.mkdir(parents=True, exist_ok=True)
        self.odswiez = odswiez
        self.min_odstep_s = min_odstep_s
        self.sesja = sesja or requests.Session()
        self.sesja.headers["User-Agent"] = USER_AGENT
        self._ostatnie_zapytanie = 0.0
        self.liczba_zapytan = 0

    # --- niskopoziomowe ---------------------------------------------------

    def _czekaj(self) -> None:
        odstep = time.monotonic() - self._ostatnie_zapytanie
        if odstep < self.min_odstep_s:
            time.sleep(self.min_odstep_s - odstep)

    def _zapytanie(self, metoda: str, sciezka: str, dane: dict | None = None) -> requests.Response:
        url = ADRES_BAZOWY + sciezka
        for proba in range(1, MAKS_PROB + 1):
            self._czekaj()
            self._ostatnie_zapytanie = time.monotonic()
            self.liczba_zapytan += 1
            try:
                odp = self.sesja.request(metoda, url, data=dane, timeout=30)
            except requests.RequestException as e:
                blad: Exception = e
            else:
                if odp.status_code in KODY_ODMOWY:
                    raise SerwisOdrzucaZapytania(
                        f"{metoda} {url} -> HTTP {odp.status_code}. Przerywam pobieranie."
                    )
                if odp.status_code < 500:
                    odp.raise_for_status()
                    return odp
                blad = BladPobierania(f"HTTP {odp.status_code}")
            if proba < MAKS_PROB:
                pauza = 2 ** proba
                log.warning("%s %s: %s – ponawiam za %ss (próba %s/%s)", metoda, url, blad, pauza, proba, MAKS_PROB)
                time.sleep(pauza)
        raise BladPobierania(f"{metoda} {url}: {blad} (po {MAKS_PROB} próbach)")

    def _zapisz(self, sciezka: Path, tresc: bytes) -> None:
        # zapis przez plik tymczasowy: przerwane pobieranie nie zostawia uszkodzonego pliku
        sciezka.parent.mkdir(parents=True, exist_ok=True)
        tmp = sciezka.with_suffix(sciezka.suffix + ".tmp")
        tmp.write_bytes(tresc)
        tmp.replace(sciezka)

    def _z_pamieci(self, nazwa: str) -> bytes | None:
        p = self.katalog_raw / nazwa
        if p.exists() and not self.odswiez:
            return p.read_bytes()
        return None

    def _pobierz_strone(self, nazwa: str, sciezka: str) -> bytes:
        tresc = self._z_pamieci(nazwa)
        if tresc is None:
            tresc = self._zapytanie("GET", sciezka).content
            self._zapisz(self.katalog_raw / nazwa, tresc)
        return tresc

    # --- strony -----------------------------------------------------------

    def strona_glowna(self) -> str:
        """Strona główna – menu z kategoriami i wskaźnikami."""
        return self._pobierz_strone("strona_glowna.html", "/").decode("utf-8")

    def lista_gmin(self) -> str:
        """Portret gminy – lista gmin pogrupowana według powiatów."""
        return self._pobierz_strone("portraitcommune.html", "/portraitcommune").decode("utf-8")

    def strona_wskaznika(self, id_wskaznika: int) -> str:
        """Strona analizy zróżnicowania wskaźnika (opis, źródło, lata, tabele)."""
        nazwa = f"wskazniki/{id_wskaznika}.html"
        return self._pobierz_strone(nazwa, f"/differenceanalysis/{id_wskaznika}").decode("utf-8")

    # --- eksport CSV ------------------------------------------------------

    @staticmethod
    def nazwy_plikow_csv(id_wskaznika: int, rok: int) -> tuple[str, str]:
        return (f"wartosci/{id_wskaznika}_{rok}_gminy.csv", f"wartosci/{id_wskaznika}_{rok}_powiaty.csv")

    def jest_w_pamieci(self, id_wskaznika: int, rok: int) -> bool:
        return not self.odswiez and all(
            (self.katalog_raw / n).exists() for n in self.nazwy_plikow_csv(id_wskaznika, rok)
        )

    def eksport_csv(self, id_wskaznika: int, rok: int) -> tuple[bytes, bytes]:
        """Zwraca (csv_gminy, csv_powiaty) w surowej postaci (Windows-1250)."""
        n_gminy, n_powiaty = self.nazwy_plikow_csv(id_wskaznika, rok)
        if self.jest_w_pamieci(id_wskaznika, rok):
            return (self.katalog_raw / n_gminy).read_bytes(), (self.katalog_raw / n_powiaty).read_bytes()

        # seria stanowa: wybór wskaźnika -> wybór roku -> eksporty
        odp = self._zapytanie("GET", f"/differenceanalysis/{id_wskaznika}")
        self._zapisz(self.katalog_raw / f"wskazniki/{id_wskaznika}.html", odp.content)
        if "differenceanalysisForm" not in odp.text:
            raise BladPobierania(f"Wskaźnik {id_wskaznika} nie ma analizy zróżnicowania (przekierowanie).")
        odp_roku = self._zapytanie(
            "POST",
            "/differenceanalysis",
            {"differenceanalysis[year]": str(rok), "differenceanalysis[regions]": "-1"},
        )
        ma_gminy = 'id="analysisTable2"' in odp_roku.text
        wyniki = []
        for sciezka, potrzebny in (("/differenceanalysis/sourcedataAll", ma_gminy), ("/differenceanalysis/sourcedata", True)):
            if not potrzebny:
                # w tym roku strona nie ma układu gminnego – eksport zwróciłby stronę HTML
                wyniki.append(b"")
                continue
            odp = self._zapytanie("POST", sciezka, {"export[separator]": "0"})
            if "attachment" in odp.headers.get("Content-disposition", "").lower():
                wyniki.append(odp.content)
            else:
                # serwis nie ma danych dla tego roku – zapisujemy pusty plik jako „brak danych”
                log.info("%s: brak eksportu dla wskaźnika %s w roku %s", sciezka, id_wskaznika, rok)
                wyniki.append(b"")
        # zapis dopiero po komplecie – połowiczny wynik nie trafia do pamięci
        self._zapisz(self.katalog_raw / n_gminy, wyniki[0])
        self._zapisz(self.katalog_raw / n_powiaty, wyniki[1])
        return wyniki[0], wyniki[1]
