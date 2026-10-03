"""Funkcje do użycia w innych modułach (właściwa aplikacja Splot).

Wszystkie funkcje zwracają dataclassy; `jako_slownik(obiekt)` daje słownik gotowy do JSON.
Parametr `magazyn` jest opcjonalny – domyślnie otwierana jest baza data/obserwator.sqlite.

    from splot_dane import api
    tarnow = api.znajdz_gmine("Tarnów", typ="wiejska")
    skala = api.skala_problemu(tarnow.id, "starzenie_sie")
"""

from __future__ import annotations

import json
import math
import statistics
import unicodedata
from dataclasses import asdict, dataclass, field, is_dataclass

from splot_dane import ZRODLO_SERWISU
from splot_dane.magazyn import Magazyn
from splot_dane.obserwator.katalog import wczytaj_obszary
from splot_dane.obserwator.parser import TYP_MIEJSKA, TYP_MNPP, TYP_WIEJSKA
from splot_dane.statystyki import statystyka_gminy, statystyka_powiatu, zmiana

ADRES_WSKAZNIKA = "https://obserwator.rops.krakow.pl/differenceanalysis/{id}"

POZIOM_GMINA = "gmina"
POZIOM_POWIAT = "powiat"
MIN_GMIN_DO_POROWNANIA = 10


# --- typy wyników ------------------------------------------------------------

@dataclass
class Gmina:
    id: int
    nazwa: str
    typ: str | None
    powiat: str
    kod_teryt: str | None = None

    @property
    def opis(self) -> str:
        typ = f"gmina {self.typ}" if self.typ in (TYP_MIEJSKA, TYP_WIEJSKA) else (self.typ or "gmina")
        powiat = f"powiat {self.powiat}" if not self.powiat.startswith("m.") else f"powiat grodzki {self.powiat}"
        return f"{self.nazwa} ({typ}, {powiat})"


@dataclass
class WartoscWskaznika:
    kod: str
    nazwa: str
    obszar_wyzwania: str | None
    wartosc: float | None
    jednostka: str
    rok: int | None
    srednia_wojewodztwa: float | None
    miejsce_w_rankingu: int | None       # 1 = największa skala problemu (bez znanego kierunku: 1 = najwyższa wartość)
    liczba_gmin: int                     # liczba jednostek z danymi (gmin; przy poziom="powiat" – powiatów)
    zmiana: float | None                 # różnica względem rok_porownania (w jednostkach wskaźnika, dla % – w p.p.)
    rok_porownania: int | None
    opis_porownania: str | None          # „powyżej średniej” / „zbliżone do średniej” / „poniżej średniej”
    zrodlo: str
    poziom: str = POZIOM_GMINA           # „gmina” albo „powiat” (zapas, gdy brak danych gminnych)
    jednostka_terytorialna: str = ""     # nazwa gminy albo powiatu, którego dotyczą liczby
    wyzej_znaczy_gorzej: bool | None = None
    opis_wskaznika: str = ""
    adres: str = ""
    szczegoly: dict = field(default_factory=dict)   # licznik/mianownik z Obserwatora, np. {"ludność 60+": 6351}
    metoda_sredniej: str = ""            # jak liczono średnią (nieważona – każda jednostka liczy się tak samo)
    pobrano: str | None = None           # kiedy dane pobrano z Obserwatora (ISO); None = nieznane (przed `scrape`)


SREDNIA_GMIN = "nieważona średnia gmin województwa (każda gmina liczy się tak samo, bez ważenia liczbą mieszkańców)"
SREDNIA_POWIATOW = "nieważona średnia powiatów województwa (każdy powiat liczy się tak samo)"
DNI_AKTUALNOSCI = 90


def ostrzezenie_o_aktualnosci(wartosci: list["WartoscWskaznika"], dni: int = DNI_AKTUALNOSCI,
                              dzis: "date | None" = None) -> str | None:
    """Komunikat o wieku danych: najstarsza data pobrania i ostrzeżenie, gdy ma ponad `dni` dni."""
    from datetime import date

    daty = sorted(w.pobrano for w in wartosci if w.pobrano)
    if not daty:
        return "Data pobrania danych nieznana – uruchom: python -m splot_dane scrape"
    najstarsza = date.fromisoformat(daty[0])
    wiek = ((dzis or date.today()) - najstarsza).days
    komunikat = f"Dane pobrane z Obserwatora: {daty[0]}" + (f" – {daty[-1]}" if daty[-1] != daty[0] else "")
    if wiek > dni:
        komunikat += (f". UWAGA: najstarsze dane mają {wiek} dni – serwis mógł je zaktualizować; "
                      "odśwież: python -m splot_dane scrape --odswiez")
    return komunikat


@dataclass
class SkalaProblemu:
    gmina: Gmina
    obszar: str
    nazwa_obszaru: str
    wskazniki: list[WartoscWskaznika]
    brak_danych: bool
    komunikat: str = ""


class GminaNieznaleziona(LookupError):
    pass


class GminaNiejednoznaczna(LookupError):
    def __init__(self, nazwa: str, kandydaci: list[Gmina]):
        self.kandydaci = kandydaci
        lista = "; ".join(g.opis for g in kandydaci)
        super().__init__(f"Nazwa „{nazwa}” pasuje do kilku jednostek: {lista}. Podaj typ (np. --typ wiejska).")


def jako_slownik(obj) -> dict | list:
    if isinstance(obj, list):
        return [jako_slownik(o) for o in obj]
    if is_dataclass(obj):
        return asdict(obj)
    return obj


def jako_json(obj) -> str:
    return json.dumps(jako_slownik(obj), ensure_ascii=False, indent=2)


# --- pomocnicze --------------------------------------------------------------

def _m(magazyn: Magazyn | None) -> Magazyn:
    return magazyn or Magazyn()


def _normalizuj(tekst: str) -> str:
    t = tekst.lower().replace("ł", "l")
    return "".join(c for c in unicodedata.normalize("NFKD", t) if not unicodedata.combining(c)).strip()


_ALIASY_TYPU = {
    "wiejska": {TYP_WIEJSKA}, "wies": {TYP_WIEJSKA},
    "miejska": {TYP_MIEJSKA},
    "miasto": {TYP_MIEJSKA, TYP_MNPP},
    "mnpp": {TYP_MNPP}, "miasto na prawach powiatu": {TYP_MNPP}, "grodzka": {TYP_MNPP},
}


def _gmina_z_wiersza(r) -> Gmina:
    return Gmina(id=r["id"], nazwa=r["nazwa"], typ=r["typ"], powiat=r["powiat"], kod_teryt=r["kod_teryt"])


# --- API -----------------------------------------------------------------------

def lista_gmin(szukaj: str | None = None, typ: str | None = None, magazyn: Magazyn | None = None) -> list[Gmina]:
    """Gminy, opcjonalnie filtrowane po fragmencie nazwy (bez polskich znaków też działa) i typie."""
    m = _m(magazyn)
    gminy = [_gmina_z_wiersza(r) for r in m.db.execute("SELECT * FROM gminy ORDER BY nazwa, powiat")]
    if szukaj:
        s = _normalizuj(szukaj)
        dokladne = [g for g in gminy if _normalizuj(g.nazwa) == s]
        gminy = dokladne or [g for g in gminy if s in _normalizuj(g.nazwa)]
    if typ:
        dozwolone = _ALIASY_TYPU.get(_normalizuj(typ), {typ})
        gminy = [g for g in gminy if g.typ in dozwolone]
    return gminy


def znajdz_gmine(nazwa: str, typ: str | None = None, magazyn: Magazyn | None = None) -> Gmina:
    """Jedna gmina po nazwie i (opcjonalnie) typie. Niejednoznaczność -> GminaNiejednoznaczna z kandydatami."""
    kandydaci = lista_gmin(nazwa, typ, magazyn)
    if not kandydaci:
        raise GminaNieznaleziona(f"Nie znaleziono gminy „{nazwa}”" + (f" typu „{typ}”" if typ else "") + ".")
    if len(kandydaci) > 1:
        raise GminaNiejednoznaczna(nazwa, kandydaci)
    return kandydaci[0]


def gmina(gmina_id: int, magazyn: Magazyn | None = None) -> Gmina:
    r = _m(magazyn).db.execute("SELECT * FROM gminy WHERE id = ?", (gmina_id,)).fetchone()
    if r is None:
        raise GminaNieznaleziona(f"Brak gminy o id {gmina_id}.")
    return _gmina_z_wiersza(r)


def _zrodlo(w) -> str:
    pierwotne = f" Źródło pierwotne: {w['zrodlo']}" if w["zrodlo"] else ""
    return f"{ZRODLO_SERWISU}, wskaźnik „{w['nazwa']}”.{pierwotne}"


def _wartosc_dla(m: Magazyn, w, g: Gmina) -> WartoscWskaznika:
    db = m.db
    # Kierunek jest znany tylko dla wskaźników z config/wskazniki.yaml. Dla pozostałych ranking liczymy
    # malejąco (1 = najwyższa wartość) i nie oceniamy, czy to „lepiej”, czy „gorzej” (wyzej_znaczy_gorzej=None).
    kierunek = None if w["wyzej_znaczy_gorzej"] is None else bool(w["wyzej_znaczy_gorzej"])
    gorzej = True if kierunek is None else kierunek
    wspolne = dict(
        kod=w["kod"] or str(w["id_w_obserwatorze"]), nazwa=w["nazwa"], obszar_wyzwania=w["obszar_wyzwania"],
        jednostka=w["jednostka"] or "", zrodlo=_zrodlo(w), wyzej_znaczy_gorzej=kierunek,
        opis_wskaznika=w["opis"] or "", adres=ADRES_WSKAZNIKA.format(id=w["id_w_obserwatorze"]),
    )
    r = db.execute(
        "SELECT rok, wartosc, szczegoly FROM wartosci WHERE wskaznik_id=? AND gmina_id=? AND wartosc IS NOT NULL ORDER BY rok DESC",
        (w["id"], g.id)).fetchone()
    st = statystyka_gminy(db, w["id"], r["rok"], g.id, gorzej) if r else None
    # Same 3 miasta na prawach powiatu (dane z układu powiatowego) to za mało na porównanie gmin.
    if st and st.liczba_jednostek >= MIN_GMIN_DO_POROWNANIA:
        rok_p, zm = zmiana(db, w["id"], r["rok"], gmina_id=g.id)
        return WartoscWskaznika(
            **wspolne, wartosc=r["wartosc"], rok=r["rok"], srednia_wojewodztwa=st.srednia,
            miejsce_w_rankingu=st.miejsce, liczba_gmin=st.liczba_jednostek, zmiana=zm, rok_porownania=rok_p,
            opis_porownania=st.opis, poziom=POZIOM_GMINA, jednostka_terytorialna=g.nazwa,
            metoda_sredniej=SREDNIA_GMIN, pobrano=m.data_pobrania(w["id"], r["rok"]),
            szczegoly=json.loads(r["szczegoly"] or "{}"))
    # zapas: dane powiatu, do którego należy gmina
    r = db.execute(
        "SELECT rok, wartosc, szczegoly FROM wartosci_powiatow WHERE wskaznik_id=? AND powiat=? AND wartosc IS NOT NULL ORDER BY rok DESC",
        (w["id"], g.powiat)).fetchone()
    if r:
        st = statystyka_powiatu(db, w["id"], r["rok"], g.powiat, gorzej)
        rok_p, zm = zmiana(db, w["id"], r["rok"], powiat=g.powiat)
        return WartoscWskaznika(
            **wspolne, wartosc=r["wartosc"], rok=r["rok"], srednia_wojewodztwa=st.srednia,
            miejsce_w_rankingu=st.miejsce, liczba_gmin=st.liczba_jednostek, zmiana=zm, rok_porownania=rok_p,
            opis_porownania=st.opis, poziom=POZIOM_POWIAT, jednostka_terytorialna=f"powiat {g.powiat}",
            metoda_sredniej=SREDNIA_POWIATOW, pobrano=m.data_pobrania(w["id"], r["rok"]),
            szczegoly=json.loads(r["szczegoly"] or "{}"))
    return WartoscWskaznika(
        **wspolne, wartosc=None, rok=None, srednia_wojewodztwa=None, miejsce_w_rankingu=None, liczba_gmin=0,
        zmiana=None, rok_porownania=None, opis_porownania=None, poziom=POZIOM_GMINA, jednostka_terytorialna=g.nazwa)


@dataclass
class WskaznikProblemu:
    """Wskaźnik dobrany do opisu problemu wyszukiwaniem wektorowym, z wartością dla gminy (jeśli jest w bazie)."""
    podobienstwo: float
    wartosc: WartoscWskaznika
    w_konfiguracji: bool       # czy wskaźnik jest w config/wskazniki.yaml (wtedy znany jest kierunek oceny)
    id_w_obserwatorze: int | None = None


def wskazniki_dla_problemu(opis: str, gmina_id: int, k: int = 5, min_podobienstwo: float = 0.0,
                           magazyn: Magazyn | None = None) -> list[WskaznikProblemu]:
    """Wskaźniki z całego katalogu najbardziej pasujące do opisu problemu, z wartościami dla gminy.

    Wymaga indeksu (python -m splot_dane indeks). Zwraca tylko wskaźniki, które mają w bazie dane
    gminne albo powiatowe (pełny zestaw: python -m splot_dane scrape --gminne)."""
    from splot_dane.wektory import szukaj_wskaznikow

    m = _m(magazyn)
    g = gmina(gmina_id, m)
    wynik = []
    for t in szukaj_wskaznikow(opis, k=k, tylko_z_danymi_lokalnymi=True, magazyn=m):
        if t.podobienstwo < min_podobienstwo:
            continue
        w = m.db.execute("SELECT * FROM wskazniki WHERE id = ?", (t.wskaznik_id,)).fetchone()
        wartosc = _wartosc_dla(m, w, g)
        if wartosc.wartosc is not None:
            wynik.append(WskaznikProblemu(t.podobienstwo, wartosc, w["kod"] is not None, t.id_w_obserwatorze))
    return wynik


def wskazniki_gminy(gmina_id: int, magazyn: Magazyn | None = None) -> list[WartoscWskaznika]:
    """Wskaźniki z config/wskazniki.yaml dla gminy: najnowszy rok z danymi, porównanie z województwem."""
    m = _m(magazyn)
    g = gmina(gmina_id, m)
    wskazniki = m.db.execute("SELECT * FROM wskazniki WHERE kod IS NOT NULL ORDER BY obszar_wyzwania, id").fetchall()
    return [_wartosc_dla(m, w, g) for w in wskazniki]


def skala_problemu(gmina_id: int, obszar: str, magazyn: Magazyn | None = None) -> SkalaProblemu:
    """Wskaźniki obszaru wyzwania dla gminy. Bez danych -> brak_danych=True i jasny komunikat."""
    m = _m(magazyn)
    g = gmina(gmina_id, m)
    obszary = wczytaj_obszary()
    nazwa_obszaru = (obszary.get(obszar) or {}).get("nazwa", obszar)
    wartosci = [w for w in wskazniki_gminy(gmina_id, m) if w.obszar_wyzwania == obszar and w.wartosc is not None]
    if not wartosci:
        return SkalaProblemu(
            gmina=g, obszar=obszar, nazwa_obszaru=nazwa_obszaru, wskazniki=[], brak_danych=True,
            komunikat=(f"Brak danych: Internetowy Obserwator Statystyk Społecznych nie zawiera wskaźników "
                       f"dla obszaru „{nazwa_obszaru}” na poziomie gminy {g.nazwa} ani powiatu {g.powiat}."))
    komunikat = ""
    if any(w.poziom == POZIOM_POWIAT for w in wartosci):
        komunikat = f"Część wskaźników nie ma danych dla gminy – podano dane dla: powiat {g.powiat}."
    return SkalaProblemu(gmina=g, obszar=obszar, nazwa_obszaru=nazwa_obszaru, wskazniki=wartosci,
                         brak_danych=False, komunikat=komunikat)


def podobne_gminy(gmina_id: int, n: int = 3, magazyn: Magazyn | None = None) -> list[Gmina]:
    """Gminy najbardziej podobne pod względem wskaźników z konfiguracji (odległość na wartościach standaryzowanych).

    Bierze najnowszy wspólny rok każdego wskaźnika; pomija wskaźniki bez danych dla danej gminy.
    """
    m = _m(magazyn)
    db = m.db
    profile: dict[int, list[float | None]] = {}
    wskazniki = db.execute("SELECT id FROM wskazniki WHERE kod IS NOT NULL ORDER BY id").fetchall()
    uzyte = 0
    for w in wskazniki:
        rok = db.execute("SELECT MAX(rok) FROM wartosci WHERE wskaznik_id=? AND gmina_id=? AND wartosc IS NOT NULL",
                         (w["id"], gmina_id)).fetchone()[0]
        if rok is None:
            continue
        wart = {r[0]: r[1] for r in db.execute(
            "SELECT gmina_id, wartosc FROM wartosci WHERE wskaznik_id=? AND rok=? AND wartosc IS NOT NULL", (w["id"], rok))}
        if len(wart) < 3:
            continue
        sr, sd = statistics.fmean(wart.values()), statistics.pstdev(wart.values()) or 1.0
        for gid in {r[0] for r in db.execute("SELECT id FROM gminy")}:
            profile.setdefault(gid, [None] * uzyte).append((wart[gid] - sr) / sd if gid in wart else None)
        uzyte += 1
    wzorzec = profile.get(gmina_id)
    if not wzorzec:
        return []
    odleglosci = []
    for gid, prof in profile.items():
        if gid == gmina_id:
            continue
        pary = [(a, b) for a, b in zip(wzorzec, prof) if a is not None and b is not None]
        if len(pary) < max(1, uzyte // 2):
            continue
        odleglosci.append((math.sqrt(sum((a - b) ** 2 for a, b in pary) / len(pary)), gid))
    return [gmina(gid, m) for _, gid in sorted(odleglosci)[:n]]
