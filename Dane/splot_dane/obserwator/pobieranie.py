"""Pobieranie wartości wskaźników (gminy + powiaty) i zapis do magazynu."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from splot_dane.magazyn import Magazyn
from splot_dane.obserwator.katalog import (
    WskaznikKonfiguracji,
    zapisz_gminy,
    zapisz_konfiguracje_w_bazie,
    zapisz_wskaznik_ze_strony,
)
from splot_dane.obserwator.klient import BladPobierania, KlientObserwatora
from splot_dane.obserwator.parser import (
    TabelaCsv,
    gmina_z_powiatu_grodzkiego,
    parsuj_csv,
    parsuj_menu,
    parsuj_strone_wskaznika,
    rozbierz_nazwe_gminy,
)

log = logging.getLogger(__name__)

LATA_WSTECZ = 5
MAKS_COFNIEC_NAJNOWSZEGO = 3   # ile lat cofać się, gdy rok domyślny nie ma danych gminnych
NAJSTARSZY_ROK = 2007


@dataclass
class WynikWczytania:
    rok: int
    gminy_z_wartoscia: int
    powiaty_z_wartoscia: int


@dataclass
class RaportPobierania:
    wskazniki: dict[int, list[WynikWczytania]] = field(default_factory=dict)
    bledy: list[str] = field(default_factory=list)


def przypisz_gminy(magazyn: Magazyn, nazwy: list[str]) -> list[int | None | bool]:
    """Wiersze CSV -> id gmin.

    Nazwy w CSV nie są unikalne (np. dwie gminy Bolesław i dwie Spytkowice w różnych
    powiatach), ale kolejność wierszy jest taka sama jak na liście /portraitcommune.
    Gdy kolejność się zgadza – przypisujemy pozycyjnie. W przeciwnym razie po nazwie;
    nazwy niejednoznaczne dostają False (pomijane), nieznane – None.
    """
    lista = magazyn.db.execute(
        "SELECT id, nazwa_zrodlowa FROM gminy WHERE id_w_obserwatorze IS NOT NULL ORDER BY id_w_obserwatorze"
    ).fetchall()
    if [r["nazwa_zrodlowa"] for r in lista] == nazwy:
        return [r["id"] for r in lista]
    log.warning("Kolejność gmin w CSV różni się od listy z /portraitcommune – dopasowanie po nazwie")
    po_nazwie: dict[str, list[int]] = {}
    for r in magazyn.db.execute("SELECT id, nazwa_zrodlowa FROM gminy"):
        po_nazwie.setdefault(r["nazwa_zrodlowa"], []).append(r["id"])
    wynik: list[int | None | bool] = []
    for n in nazwy:
        ids = po_nazwie.get(n, [])
        wynik.append(ids[0] if len(ids) == 1 else (False if ids else None))
    return wynik


def wczytaj_tabele(magazyn: Magazyn, wskaznik_id: int, rok: int, gminy: TabelaCsv, powiaty: TabelaCsv) -> WynikWczytania:
    """Zapisuje jedną parę eksportów (gminy, powiaty) do bazy. Idempotentne."""
    mapa = magazyn.mapa_nazw_zrodlowych()
    przypisanie = przypisz_gminy(magazyn, [w["obszar"] for w in gminy.wiersze])
    n_gmin = n_powiatow = 0
    for i, w in enumerate(gminy.wiersze):
        gmina_id = przypisanie[i]
        if gmina_id is False:
            continue   # nazwa niejednoznaczna i kolejność niezgodna – nie zgadujemy
        if gmina_id is None:
            # gmina spoza listy z /portraitcommune – zapisz bez powiatu, żeby nie zgubić wartości
            nazwa, typ = rozbierz_nazwe_gminy(w["obszar"])
            log.warning("Gmina '%s' nie ma przypisanego powiatu", w["obszar"])
            gmina_id = magazyn.zapisz_gmine({"nazwa": nazwa, "typ": typ, "powiat": "?", "nazwa_zrodlowa": w["obszar"]})
            mapa[w["obszar"]] = gmina_id
        magazyn.zapisz_wartosc(wskaznik_id, gmina_id, rok, w["wartosc"], w["szczegoly"])
        n_gmin += w["wartosc"] is not None
    for w in powiaty.wiersze:
        powiat = w["obszar"].removeprefix("powiat ").strip()
        magazyn.zapisz_wartosc_powiatu(wskaznik_id, powiat, rok, w["wartosc"], w["szczegoly"])
        n_powiatow += w["wartosc"] is not None
        # miasta na prawach powiatu są w Obserwatorze tylko jako powiaty – to ta sama jednostka
        miasto = gmina_z_powiatu_grodzkiego(w["obszar"])
        if miasto:
            gmina_id = mapa.get(miasto["nazwa_zrodlowa"]) or magazyn.zapisz_gmine(miasto)
            mapa[miasto["nazwa_zrodlowa"]] = gmina_id
            magazyn.zapisz_wartosc(wskaznik_id, gmina_id, rok, w["wartosc"], w["szczegoly"])
            n_gmin += w["wartosc"] is not None
    if gminy.jednostka or powiaty.jednostka:
        magazyn.db.execute(
            "UPDATE wskazniki SET jednostka = ? WHERE id = ? AND IFNULL(jednostka, '') = ''",
            (gminy.jednostka or powiaty.jednostka, wskaznik_id),
        )
    magazyn.zatwierdz()
    return WynikWczytania(rok, n_gmin, n_powiatow)


def _pobierz_rok(klient, magazyn, wskaznik_id, id_obs, rok) -> WynikWczytania:
    surowe_gminy, surowe_powiaty = klient.eksport_csv(id_obs, rok)
    return wczytaj_tabele(magazyn, wskaznik_id, rok, parsuj_csv(surowe_gminy), parsuj_csv(surowe_powiaty))


def _ma_gminy(w: WynikWczytania) -> bool:
    return w.gminy_z_wartoscia > 3   # więcej niż same 3 miasta na prawach powiatu


def pobierz_wskaznik(klient, magazyn, id_obs: int, wszystkie_lata: bool = False, lata_wstecz: int = LATA_WSTECZ) -> list[WynikWczytania]:
    """Domyślnie: najnowszy rok z danymi gminnymi i rok o 5 lat wcześniejszy (albo najbliższy dostępny)."""
    wiersz = magazyn.wskaznik(id_w_obserwatorze=id_obs)
    strona = parsuj_strone_wskaznika(klient.strona_wskaznika(id_obs))
    if not strona.dostepna:
        raise BladPobierania(f"Wskaźnik {id_obs} nie ma analizy zróżnicowania (tylko trendy) – brak danych gminnych.")
    if wiersz is None or not wiersz["opis"]:
        menu = {p["id"]: p for p in parsuj_menu(klient.strona_glowna())}
        zapisz_wskaznik_ze_strony(klient, magazyn, menu.get(id_obs, {"id": id_obs, "nazwa": strona.nazwa, "kategoria": ""}))
        wiersz = magazyn.wskaznik(id_w_obserwatorze=id_obs)
    wskaznik_id = wiersz["id"]
    najnowszy = strona.domyslny_rok or max(strona.lata)

    if wszystkie_lata:
        return [_pobierz_rok(klient, magazyn, wskaznik_id, id_obs, r) for r in range(najnowszy, NAJSTARSZY_ROK - 1, -1)]

    wyniki = []
    # 1) najnowszy rok z danymi gminnymi
    najnowszy_gminny = None
    for rok in range(najnowszy, max(najnowszy - MAKS_COFNIEC_NAJNOWSZEGO, NAJSTARSZY_ROK - 1), -1):
        w = _pobierz_rok(klient, magazyn, wskaznik_id, id_obs, rok)
        wyniki.append(w)
        if _ma_gminy(w):
            najnowszy_gminny = rok
            break
    if najnowszy_gminny is not None:
        warunek, najnowszy = _ma_gminy, najnowszy_gminny
    else:
        # wskaźnik tylko powiatowy: bierzemy najnowszy rok z danymi powiatów
        z_powiatami = [w for w in wyniki if w.powiaty_z_wartoscia > 0]
        if not z_powiatami:
            log.warning("Wskaźnik %s: brak danych w latach %s–%s", id_obs, rok, najnowszy)
            return wyniki
        log.warning("Wskaźnik %s: brak danych gminnych – tylko powiaty", id_obs)
        warunek, najnowszy = (lambda w: w.powiaty_z_wartoscia > 0), z_powiatami[0].rok
    # 2) rok o lata_wstecz wcześniejszy albo najbliższy dostępny (5, 4, 6, 3, 7 …)
    cel = najnowszy - lata_wstecz
    kandydaci = [cel]
    for d in range(1, lata_wstecz):
        kandydaci += [cel + d, cel - d]
    sprawdzone = {w.rok for w in wyniki}
    for rok in kandydaci:
        if rok >= najnowszy or rok < NAJSTARSZY_ROK or rok in sprawdzone:
            continue
        w = _pobierz_rok(klient, magazyn, wskaznik_id, id_obs, rok)
        wyniki.append(w)
        if warunek(w):
            break
    return wyniki


def pobierz_wartosci(
    klient: KlientObserwatora,
    magazyn: Magazyn,
    konfiguracja: list[WskaznikKonfiguracji],
    wszystko: bool = False,
    postep=None,
    lata_wstecz: int = LATA_WSTECZ,
    dodatkowe: list[int] | None = None,
) -> RaportPobierania:
    """Pobiera wartości wskaźników z konfiguracji (albo wszystkich z katalogu przy wszystko=True).

    `dodatkowe` – id wskaźników pobieranych obok konfiguracji (np. wszystkie gminne dla wyszukiwania wektorowego);
    dla nich, jak dla konfiguracji, pobierany jest rok najnowszy i o `lata_wstecz` wcześniejszy."""
    zapisz_gminy(klient, magazyn)
    if wszystko:
        id_wskaznikow = [p["id"] for p in parsuj_menu(klient.strona_glowna())]
    else:
        id_wskaznikow = [w.id_w_obserwatorze for w in konfiguracja]
        id_wskaznikow += [i for i in (dodatkowe or []) if i not in id_wskaznikow]
    raport = RaportPobierania()
    for i, id_obs in enumerate(id_wskaznikow, 1):
        try:
            raport.wskazniki[id_obs] = pobierz_wskaznik(klient, magazyn, id_obs, wszystkie_lata=wszystko, lata_wstecz=lata_wstecz)
        except BladPobierania as e:
            raport.bledy.append(str(e))
            log.warning("%s", e)
        if postep:
            postep(i, len(id_wskaznikow), id_obs)
    zapisz_konfiguracje_w_bazie(magazyn, konfiguracja)
    magazyn.eksportuj_wartosci_csv()
    return raport
