"""CLI: python -m splot_dane <polecenie>. Cienka nakładka na funkcje z pakietu."""

from __future__ import annotations

import argparse
import logging
import sys

from splot_dane.magazyn import Magazyn


def _postep(i: int, n: int, opis) -> None:
    print(f"\r  [{i}/{n}] {opis}".ljust(70), end="", file=sys.stderr, flush=True)
    if i == n:
        print(file=sys.stderr)


def polecenie_katalog(args) -> int:
    from splot_dane.obserwator.katalog import pobierz_katalog
    from splot_dane.obserwator.klient import KlientObserwatora

    klient = KlientObserwatora(odswiez=args.odswiez)
    with Magazyn() as m:
        katalog = pobierz_katalog(klient, m, postep=lambda i, n, p: _postep(i, n, p["nazwa"][:50]))
    gminne = sum(1 for w in katalog if "gminy" in w["poziomy"])
    print(f"Katalog: {len(katalog)} wskaźników, w tym {gminne} z danymi gminnymi.")
    print(f"Zapisano: data/katalog_wskaznikow.csv i data/obserwator.sqlite ({klient.liczba_zapytan} zapytań do serwisu).")
    return 0


def polecenie_scrape(args) -> int:
    from splot_dane.obserwator.katalog import wczytaj_konfiguracje, wczytaj_lata_wstecz
    from splot_dane.obserwator.klient import KlientObserwatora
    from splot_dane.obserwator.pobieranie import pobierz_wartosci

    klient = KlientObserwatora(odswiez=args.odswiez)
    konfiguracja = wczytaj_konfiguracje()
    with Magazyn() as m:
        dodatkowe = []
        if args.gminne:
            # wszystkie wskaźniki z danymi gminnymi wg katalogu – potrzebne do wyszukiwania wektorowego
            dodatkowe = [r[0] for r in m.db.execute(
                "SELECT id_w_obserwatorze FROM wskazniki WHERE poziomy LIKE '%gminy%' ORDER BY id")]
            if not dodatkowe:
                print("Katalog jest pusty – uruchom najpierw: python -m splot_dane katalog", file=sys.stderr)
                return 1
        raport = pobierz_wartosci(klient, m, konfiguracja, wszystko=args.wszystko, lata_wstecz=wczytaj_lata_wstecz(),
                                  postep=lambda i, n, id_: _postep(i, n, f"wskaźnik {id_}"), dodatkowe=dodatkowe)
        for id_obs, wyniki in raport.wskazniki.items():
            w = m.wskaznik(id_w_obserwatorze=id_obs)
            lata = ", ".join(f"{r.rok} ({r.gminy_z_wartoscia} gmin)" for r in wyniki)
            print(f"  {w['kod'] or id_obs:<28} {lata}")
        print(f"Wiersze w bazie: gminy={m.liczba_wierszy('gminy')}, wartosci={m.liczba_wierszy('wartosci')}, "
              f"wartosci_powiatow={m.liczba_wierszy('wartosci_powiatow')}")
    for b in raport.bledy:
        print(f"  UWAGA: {b}")
    print(f"Zapisano data/wartosci.csv. Zapytań do serwisu: {klient.liczba_zapytan} (reszta z data/raw/).")
    if not args.odswiez:
        print("Dane z data/raw/ nie wygasają same – aby pobrać aktualne wartości z serwisu: "
              "python -m splot_dane scrape --odswiez")
    return 0


def polecenie_indeks(args) -> int:
    from splot_dane.wektory import zbuduj_indeks

    with Magazyn() as m:
        info = zbuduj_indeks(m, wymus=args.wymus)
    stan = "zbudowano" if info["zmieniono"] else "bez zmian (teksty i model te same)"
    print(f"Indeks wektorowy: {stan} – {info['wskazniki']} wskaźników, {info['obszary']} obszarów, model {info['model']}.")
    return 0


def polecenie_szukaj(args) -> int:
    from splot_dane import api
    from splot_dane.formatowanie import z_jednostka
    from splot_dane.wektory import szukaj_wskaznikow, zaproponuj_obszar

    with Magazyn() as m:
        print("Obszar wyzwania (propozycja):")
        for o in zaproponuj_obszar(args.opis, 3, m):
            dane = f"{o.liczba_wskaznikow} wskaźn. z danymi" if o.ma_dane else "BRAK DANYCH w Obserwatorze"
            print(f"  {o.podobienstwo:.2f}  {o.nazwa} [{o.klucz}] – {dane}")
            if o.uwaga:
                print(f"        {o.uwaga}")
        print()
        g = _wybierz_gmine(args.gmina, args.typ, m) if args.gmina else None
        if args.gmina and g is None:
            return 1
        pokazane = []
        for t in szukaj_wskaznikow(args.opis, k=args.k, tylko_gminne=args.gminne, magazyn=m):
            poziom = "gminy" if t.gminny else ("powiaty" if "powiaty" in t.poziomy else "tylko województwo")
            dane = "dane w bazie" if t.ma_wartosci else "brak danych w bazie"
            print(f"  {t.podobienstwo:.2f}  {t.nazwa[:60]:<60} [{t.id_w_obserwatorze}] {poziom}, {dane}")
            if g is not None and t.ma_wartosci:
                w = m.db.execute("SELECT * FROM wskazniki WHERE id = ?", (t.wskaznik_id,)).fetchone()
                wart = api._wartosc_dla(m, w, g)
                if wart.wartosc is not None:
                    pokazane.append(wart)
                    print(f"        {wart.jednostka_terytorialna}: {z_jednostka(wart.wartosc, wart.jednostka)} ({wart.rok}), "
                          f"średnia {z_jednostka(wart.srednia_wojewodztwa, wart.jednostka)}")
        if pokazane:
            print(f"\nŚrednia: {pokazane[0].metoda_sredniej}.")
            print(api.ostrzezenie_o_aktualnosci(pokazane))
    return 0


def _wybierz_gmine(nazwa: str, typ: str | None, magazyn):
    """Zwraca gminę albo None (po wypisaniu kandydatów / komunikatu)."""
    from splot_dane import api

    try:
        return api.znajdz_gmine(nazwa, typ, magazyn)
    except api.GminaNiejednoznaczna as e:
        print(f"Nazwa „{nazwa}” jest niejednoznaczna. Pasujące jednostki:", file=sys.stderr)
        for g in e.kandydaci:
            print(f"  - {g.opis}", file=sys.stderr)
        print("Doprecyzuj typ, np. --typ wiejska albo --typ miasto.", file=sys.stderr)
    except api.GminaNieznaleziona as e:
        print(str(e), file=sys.stderr)
    return None


def polecenie_gmina(args) -> int:
    from splot_dane import api
    from splot_dane.formatowanie import liczba_pl, z_jednostka, zmiana_pl

    with Magazyn() as m:
        g = _wybierz_gmine(args.nazwa, args.typ, m)
        if g is None:
            return 1
        wskazniki = api.wskazniki_gminy(g.id, m)
        if args.json:
            print(api.jako_json({"gmina": api.jako_slownik(g), "wskazniki": api.jako_slownik(wskazniki)}))
            return 0
        print(f"\n{g.opis}\n")
        naglowek = f"{'obszar':<18} {'wskaźnik':<46} {'rok':>4} {'wartość':>10} {'śr. woj.':>10} {'miejsce':>9} {'zmiana':>14}  porównanie"
        print(naglowek)
        print("-" * len(naglowek))
        for w in wskazniki:
            miejsce = f"{w.miejsce_w_rankingu}/{w.liczba_gmin}" if w.miejsce_w_rankingu else "–"
            zm = f"{zmiana_pl(w.zmiana, w.jednostka)} od {w.rok_porownania}" if w.zmiana is not None else "–"
            dopisek = f" [dane: {w.jednostka_terytorialna}]" if w.poziom == api.POZIOM_POWIAT else ""
            print(f"{(w.obszar_wyzwania or ''):<18} {w.nazwa[:46]:<46} {w.rok or '–':>4} "
                  f"{z_jednostka(w.wartosc, w.jednostka):>10} {z_jednostka(w.srednia_wojewodztwa, w.jednostka):>10} "
                  f"{miejsce:>9} {zm:>14}  {w.opis_porownania or 'brak danych'}{dopisek}")
        print("\nMiejsce: 1 = największa skala problemu. Średnia: nieważona średnia gmin (przy danych powiatu – powiatów),"
              " każda jednostka liczy się tak samo, bez ważenia liczbą mieszkańców.")
        print(api.ostrzezenie_o_aktualnosci([w for w in wskazniki if w.wartosc is not None]))
        podobne = api.podobne_gminy(g.id, 3, m)
        if podobne:
            print("Podobne gminy: " + "; ".join(p.opis for p in podobne))
        print(f"Źródło: Internetowy Obserwator Statystyk Społecznych ROPS Kraków (obserwator.rops.krakow.pl).")
    return 0


def _podsumuj(wniosek, pliki) -> None:
    from collections import Counter

    licz = Counter(p.status for p in wniosek.pola)
    pytania = sum(len(p.pytania) for p in wniosek.pola)
    print(f"{wniosek.szablon_nazwa}")
    print(f"  jednostka: {wniosek.gmina['opis']} | obszar: {wniosek.sprawa.obszar} | "
          f"innowacja: {wniosek.sprawa.innowacja.get('nazwa', '–')} | model: {wniosek.model}")
    print("  statusy pól: " + ", ".join(f"{s}: {n}" for s, n in sorted(licz.items())) + f" | pytań do wnioskodawcy: {pytania}")
    for plik in pliki:
        print(f"  zapisano: {plik}")


def _llm(args):
    from splot_dane.wniosek.llm import utworz_llm

    return utworz_llm(prawdziwy=getattr(args, "llm", False))


def polecenie_wniosek_wypelnij(args) -> int:
    from splot_dane.wniosek.sprawa import wczytaj_sprawe
    from splot_dane.wniosek.szablon import wczytaj_szablon
    from splot_dane.wniosek.wypelnianie import wypelnij_wniosek, zapisz_wyniki

    llm = _llm(args)
    with Magazyn() as m:
        sprawa = wczytaj_sprawe(args.sprawa, m)
        if args.gmina:
            g = _wybierz_gmine(args.gmina, args.typ, m)
            if g is None:
                return 1
            sprawa.gmina_id = g.id
        wniosek = wypelnij_wniosek(wczytaj_szablon(args.szablon), sprawa, llm, m)
        _podsumuj(wniosek, zapisz_wyniki(wniosek, args.wyjscie))
    return 0


def _wczytaj_wniosek(sciezka):
    from splot_dane.wniosek.sprawa import WypelnionyWniosek

    return WypelnionyWniosek.wczytaj_json(sciezka)


def _zapisz_obok(wniosek, sciezka) -> list:
    from pathlib import Path

    from splot_dane.wniosek.wypelnianie import zapisz_wyniki

    sciezka = Path(sciezka)
    return zapisz_wyniki(wniosek, sciezka.parent, sciezka.stem)


def polecenie_wniosek_uzupelnij(args) -> int:
    import json
    from pathlib import Path

    from splot_dane.wniosek.wypelnianie import uzupelnij

    stary = _wczytaj_wniosek(args.wniosek)
    odpowiedzi = json.loads(Path(args.odpowiedzi).read_text(encoding="utf-8"))
    with Magazyn() as m:
        nowy = uzupelnij(stary, odpowiedzi, _llm(args), m)
    ponowione = [s.id for s in stary.pola if not s.edytowane_recznie and (s.pytania or s.id in odpowiedzi)]
    zmienione = [n.id for s, n in zip(stary.pola, nowy.pola) if s != n]
    print(f"Wygenerowano ponownie pól: {len(ponowione)} (z pytaniami lub z nową odpowiedzią); "
          f"zmieniło się: {len(zmienione)} – {', '.join(zmienione) or 'żadne'}")
    _podsumuj(nowy, _zapisz_obok(nowy, args.wniosek))
    return 0


def polecenie_wniosek_popraw(args) -> int:
    from splot_dane.wniosek.wypelnianie import popraw_pole

    with Magazyn() as m:
        nowy = popraw_pole(_wczytaj_wniosek(args.wniosek), args.pole, args.polecenie, _llm(args), m)
    p = nowy.pole(args.pole)
    print(f"Pole {p.id}: {p.status}")
    print(p.wartosc)
    _zapisz_obok(nowy, args.wniosek)
    return 0


def polecenie_wniosek_edytuj(args) -> int:
    from splot_dane.wniosek.wypelnianie import edytuj_recznie

    nowy = edytuj_recznie(_wczytaj_wniosek(args.wniosek), args.pole, args.wartosc)
    print(f"Pole {args.pole} zapisane jako edytowane ręcznie (nie będzie nadpisywane przy uzupełnianiu).")
    _zapisz_obok(nowy, args.wniosek)
    return 0


def polecenie_wniosek_zaproponuj(args) -> int:
    from splot_dane.wniosek.propozycja import KATALOG_PROPOZYCJI, zaproponuj_szablon

    tresc = zaproponuj_szablon(args.plik, _llm(args))
    print(tresc)
    print(f"\n# Zapisano w {KATALOG_PROPOZYCJI} – przejrzyj pola „NIEPEWNE” i przenieś plik do config/wnioski/.",
          file=sys.stderr)
    return 0


def polecenie_wniosek_sprawdz(args) -> int:
    from pathlib import Path

    from splot_dane.wniosek.sprawdzanie import sprawdz_wniosek, zapisz_uwagi

    wniosek = _wczytaj_wniosek(args.wniosek)
    uwagi = sprawdz_wniosek(wniosek, llm=_llm(args))
    sciezka = Path(args.wniosek).with_name(Path(args.wniosek).stem + "_uwagi.md")
    zapisz_uwagi(wniosek, uwagi, sciezka)
    print(f"Uwag: {len(uwagi)} (w {len({u.pole_id for u in uwagi})} polach). Zapisano: {sciezka}")
    for u in uwagi[:15]:
        print(f"  - {u.pole_id} [{u.kryterium}]: {u.tresc}")
    if len(uwagi) > 15:
        print(f"  … i {len(uwagi) - 15} kolejnych w pliku")
    return 0


def polecenie_wniosek_pdf(args) -> int:
    from pathlib import Path

    wniosek = _wczytaj_wniosek(args.wniosek)
    if args.raport:
        from splot_dane.wniosek.eksport_pdf import eksportuj_pdf

        sciezka = Path(args.wyjscie) if args.wyjscie else Path(args.wniosek).with_name(Path(args.wniosek).stem + "_raport.pdf")
        eksportuj_pdf(wniosek, sciezka, adnotacje=True)
        print(f"Zapisano raport (statusy, źródła, pytania): {sciezka}")
        return 0
    from splot_dane.wniosek.wzor_pdf import wypelnij_wzor_pdf

    sciezka = Path(args.wyjscie) if args.wyjscie else Path(args.wniosek).with_suffix(".pdf")
    sciezka, nieodnalezione = wypelnij_wzor_pdf(wniosek, sciezka, args.wzor)
    puste = [p.id for p in wniosek.pola if p.wartosc in (None, "", []) and p.typ != "oswiadczenie"]
    print(f"Zapisano wypełniony wzór: {sciezka}")
    print(f"  pól pustych (do uzupełnienia przez wnioskodawcę): {len(puste)}")
    for e in nieodnalezione:
        print(f"  UWAGA – nie znaleziono miejsca we wzorze: {e} (dodaj w szablonie pdf: {{kotwica: \"…\"}})")
    return 0


def polecenie_wnioski_demo(args) -> int:
    import yaml

    from splot_dane import KATALOG_GLOWNY, KATALOG_KONFIGURACJI
    from splot_dane.wniosek.sprawa import wczytaj_sprawe
    from splot_dane.wniosek.szablon import wczytaj_szablon
    from splot_dane.wniosek.wypelnianie import wypelnij_wniosek, zapisz_wyniki

    demo = yaml.safe_load((KATALOG_KONFIGURACJI / "wnioski_demo.yaml").read_text(encoding="utf-8"))
    llm = _llm(args)
    with Magazyn() as m:
        g = _wybierz_gmine(args.gmina, args.typ, m) if args.gmina else None
        if args.gmina and g is None:
            return 1
        for w in demo["wnioski"]:
            sprawa = wczytaj_sprawe(KATALOG_GLOWNY / w["sprawa"], m)
            if g is not None:
                sprawa.gmina_id = g.id
            wniosek = wypelnij_wniosek(wczytaj_szablon(KATALOG_GLOWNY / w["szablon"]), sprawa, llm, m)
            _podsumuj(wniosek, zapisz_wyniki(wniosek, args.out))
            print()
    return 0


def zbuduj_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="python -m splot_dane", description="Dane z Obserwatora ROPS i wypełnianie wniosków.")
    p.add_argument("-v", "--verbose", action="store_true", help="więcej komunikatów")
    sub = p.add_subparsers(dest="polecenie", required=True)

    k = sub.add_parser("katalog", help="pobierz pełną listę wskaźników")
    k.add_argument("--odswiez", action="store_true", help="pobierz ponownie zamiast z data/raw/")
    k.set_defaults(func=polecenie_katalog)

    s = sub.add_parser("scrape", help="pobierz wartości gminne wskaźników z config/wskazniki.yaml")
    s.add_argument("--wszystko", action="store_true", help="wszystkie wskaźniki i wszystkie lata (długo!)")
    s.add_argument("--odswiez", action="store_true", help="pobierz ponownie zamiast z data/raw/")
    s.add_argument("--gminne", action="store_true",
                   help="dodatkowo wszystkie wskaźniki gminne z katalogu (2 lata; potrzebne do wyszukiwania wektorowego)")
    s.set_defaults(func=polecenie_scrape)

    ix = sub.add_parser("indeks", help="zbuduj indeks wektorowy wskaźników i obszarów (sqlite-vec)")
    ix.add_argument("--wymus", action="store_true", help="przebuduj, nawet gdy nic się nie zmieniło")
    ix.set_defaults(func=polecenie_indeks)

    sz = sub.add_parser("szukaj", help="wskaźniki i obszar wyzwania pasujące do opisu problemu")
    sz.add_argument("opis", help='np. "młodzi wyjeżdżają z gminy"')
    sz.add_argument("--k", type=int, default=8, help="liczba wskaźników (domyślnie 8)")
    sz.add_argument("--gminne", action="store_true", help="tylko wskaźniki z danymi gminnymi")
    sz.add_argument("--gmina", help="pokaż też wartości dla tej gminy")
    sz.add_argument("--typ", help="typ gminy: wiejska / miejska / miasto")
    sz.set_defaults(func=polecenie_szukaj)

    g = sub.add_parser("gmina", help="tabela wskaźników gminy z porównaniem do średniej")
    g.add_argument("nazwa", help='nazwa gminy, np. "Tarnów"')
    g.add_argument("--typ", help="wiejska / miejska / miasto (miasto na prawach powiatu)")
    g.add_argument("--json", action="store_true", help="wynik jako JSON")
    g.set_defaults(func=polecenie_gmina)

    w = sub.add_parser("wniosek", help="wypełnianie wniosku pole po polu")
    wsub = w.add_subparsers(dest="podpolecenie", required=True)

    ww = wsub.add_parser("wypelnij", help="wypełnij szablon dla sprawy")
    ww.add_argument("--szablon", required=True, help="config/wnioski/<nazwa>.yaml")
    ww.add_argument("--sprawa", required=True, help="przyklady/sprawa_tarnow.json")
    ww.add_argument("--gmina", help="nadpisuje gminę ze sprawy")
    ww.add_argument("--typ", help="wiejska / miejska / miasto")
    ww.add_argument("--llm", action="store_true", help="prawdziwy model (ANTHROPIC_API_KEY, SPLOT_LLM_MODEL)")
    ww.add_argument("--wyjscie", default="out", help="katalog wyników (domyślnie out/)")
    ww.set_defaults(func=polecenie_wniosek_wypelnij)

    wu = wsub.add_parser("uzupelnij", help="dopisz odpowiedzi i wygeneruj ponownie tylko brakujące pola")
    wu.add_argument("--wniosek", required=True, help="out/<plik>.json")
    wu.add_argument("--odpowiedzi", required=True, help='JSON {"<id pola>": "odpowiedź", "*": "informacja ogólna"}')
    wu.add_argument("--llm", action="store_true")
    wu.set_defaults(func=polecenie_wniosek_uzupelnij)

    wp = wsub.add_parser("popraw", help="zmień jedno pole według polecenia")
    wp.add_argument("--wniosek", required=True)
    wp.add_argument("--pole", required=True)
    wp.add_argument("--polecenie", required=True, help='np. "skróć", "napisz prościej"')
    wp.add_argument("--llm", action="store_true")
    wp.set_defaults(func=polecenie_wniosek_popraw)

    we = wsub.add_parser("edytuj", help="wpisz wartość pola ręcznie (chronione przed nadpisaniem)")
    we.add_argument("--wniosek", required=True)
    we.add_argument("--pole", required=True)
    we.add_argument("--wartosc", required=True)
    we.set_defaults(func=polecenie_wniosek_edytuj)

    wz = wsub.add_parser("zaproponuj-szablon", help="szkic szablonu YAML dla nowego wzoru (PDF/DOCX)")
    wz.add_argument("plik", help="../data/wnioski/<plik>.pdf lub .docx")
    wz.add_argument("--llm", action="store_true")
    wz.set_defaults(func=polecenie_wniosek_zaproponuj)

    wc = wsub.add_parser("sprawdz", help="uwagi do pól przed wysłaniem (bez punktacji)")
    wc.add_argument("--wniosek", required=True)
    wc.add_argument("--llm", action="store_true")
    wc.set_defaults(func=polecenie_wniosek_sprawdz)

    wf = wsub.add_parser("pdf", help="wpisz treść wniosku w oryginalny wzór PDF")
    wf.add_argument("--wniosek", required=True, help="out/<plik>.json")
    wf.add_argument("--wyjscie", help="ścieżka PDF (domyślnie obok pliku JSON)")
    wf.add_argument("--wzor", help="plik wzoru PDF (domyślnie z szablonu, pole 'wzor')")
    wf.add_argument("--raport", action="store_true", help="zamiast wzoru: raport roboczy ze statusami, źródłami i pytaniami")
    wf.set_defaults(func=polecenie_wniosek_pdf)

    d = sub.add_parser("wnioski-demo", help="wypełnij oba wnioski z ../data/wnioski/ dla gminy Tarnów")
    d.add_argument("--gmina", help="domyślnie z config/wnioski_demo.yaml (Tarnów)")
    d.add_argument("--typ", help="domyślnie wiejska; --typ miasto = miasto Tarnów")
    d.add_argument("--llm", action="store_true", help="prawdziwy model zamiast MockLLM")
    d.add_argument("--out", default="out")
    d.set_defaults(func=polecenie_wnioski_demo)
    return p


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    args = zbuduj_parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING, format="%(levelname)s %(message)s")
    from splot_dane.obserwator.klient import SerwisOdrzucaZapytania
    try:
        return args.func(args)
    except SerwisOdrzucaZapytania as e:
        print(f"\nBŁĄD: serwis odrzuca zapytania – przerywam. {e}", file=sys.stderr)
        return 2
    except RuntimeError as e:
        print(f"BŁĄD: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
