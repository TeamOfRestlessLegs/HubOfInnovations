"""
Przykładowe pomysły (fiszki) do lokalnej bazy — żeby było na czym testować /ideas/search i /ideas/analyze.

Pomysł jest tworzony przez POST /api/ideas i od razu zatwierdzany (POST /api/ideas/{id}/endorse -> PUBLISHED),
bo ai-service widzi tylko opublikowane pomysły. Tytuły mają prefiks [DEMO] — tylko do środowiska deweloperskiego.

  python fill_ideas.py                                   # dodaj (pomija już opublikowane o tym samym tytule)
  python fill_ideas.py --api http://127.0.0.1:8081 --user-id 1
  python fill_ideas.py --archive                         # zarchiwizuj wszystkie pomysły [DEMO]
"""

import argparse
import sys

import requests

PREFIX = "[DEMO] "

# Dobrane celowo: pary podobnych pomysłów (wykrywanie duplikatów), pomysły zbliżone do innowacji
# z biblioteki ROPS oraz pomysły z zupełnie innych dziedzin (czy wyszukiwanie ich nie miesza).
IDEAS = [
    {
        "title": "Sąsiedzki transport dla seniorów do lekarza",
        "problem": "Starsze osoby z małych wsi nie mają jak dojechać do przychodni i apteki — autobus kursuje dwa razy dziennie, a taksówka jest za droga.",
        "customGroup": "samotni seniorzy na terenach wiejskich",
        "summary": "Wolontariusze z własnym samochodem zapisują się do grafiku w gminie, a seniorzy zamawiają przejazd telefonicznie przez sołtysa lub OPS. Gmina pokrywa koszt paliwa i ubezpieczenia.",
        "novelty": "Wykorzystanie istniejących sąsiedzkich relacji i sołtysa jako koordynatora zamiast kosztownego transportu specjalistycznego.",
    },
    {
        "title": "Wiejska taksówka społeczna dla osób starszych",
        "problem": "Seniorzy na wsi rezygnują z wizyt u lekarza i zakupów, bo brakuje komunikacji publicznej.",
        "customGroup": "osoby starsze bez samochodu",
        "summary": "Gminny bus jeżdżący na telefon w ustalone dni tygodnia: do ośrodka zdrowia, apteki, urzędu i sklepu. Kierowcą jest osoba zatrudniona w ramach prac społecznie użytecznych.",
        "novelty": "Połączenie transportu z aktywizacją zawodową osoby bezrobotnej.",
    },
    {
        "title": "Kawiarenka cyfrowa w bibliotece dla seniorów",
        "problem": "Osoby starsze nie potrafią korzystać z bankowości internetowej, e-recepty i profilu zaufanego, przez co są wykluczone i narażone na oszustwa.",
        "customGroup": "seniorzy 65+",
        "summary": "Raz w tygodniu w bibliotece gminnej licealiści-wolontariusze uczą seniorów obsługi smartfona, e-usług i rozpoznawania oszustw internetowych przy kawie.",
        "novelty": "Nauka międzypokoleniowa w swobodnej atmosferze, z naciskiem na bezpieczeństwo w sieci.",
    },
    {
        "title": "Mobilny prysznic dla osób w kryzysie bezdomności",
        "problem": "Osoby bezdomne w mieście nie mają gdzie się umyć, co pogarsza zdrowie i utrudnia szukanie pracy.",
        "customGroup": "osoby w kryzysie bezdomności",
        "summary": "Przerobiony busik z prysznicem i pralką objeżdża miejsca, w których przebywają osoby bezdomne. Na pokładzie streetworker, który pomaga załatwić sprawy w MOPS.",
        "novelty": "Higiena jako pierwszy krok do kontaktu z pracownikiem socjalnym.",
    },
    {
        "title": "Ciepła noc — punkt ogrzewania w gminie wiejskiej",
        "problem": "Zimą osoby bezdomne i skrajnie ubogie na wsi nie mają dostępu do noclegowni, najbliższa jest 40 km dalej.",
        "customGroup": "osoby bezdomne i zagrożone bezdomnością na wsi",
        "summary": "Przy remizie OSP w okresie mrozów działa punkt z ciepłym posiłkiem i miejscem do przenocowania, obsługiwany przez strażaków-ochotników i parafię.",
        "novelty": "Wykorzystanie istniejącej infrastruktury OSP zamiast budowy noclegowni.",
    },
    {
        "title": "Aplikacja z tłumaczem migowym na wideo w urzędzie",
        "problem": "Osoby głuche nie mogą samodzielnie załatwić sprawy w urzędzie, bo urzędnicy nie znają polskiego języka migowego.",
        "customGroup": "osoby głuche posługujące się PJM",
        "summary": "Tablet przy okienku łączy się z tłumaczem PJM przez wideo. Urząd płaci abonament za minuty, a osoba głucha nie musi umawiać tłumacza z wyprzedzeniem.",
        "novelty": "Tłumacz dostępny od ręki, bez wcześniejszej rezerwacji.",
    },
    {
        "title": "Nawigacja dźwiękowa po dworcu dla niewidomych",
        "problem": "Osoby niewidome gubią się na dużych dworcach i nie mogą samodzielnie znaleźć peronu.",
        "customGroup": "osoby niewidome i słabowidzące",
        "summary": "Nadajniki rozmieszczone na dworcu współpracują z aplikacją, która głosem prowadzi do peronu, kasy i wyjścia.",
        "novelty": "Działa bez zasięgu GPS wewnątrz budynku.",
    },
    {
        "title": "Kurs polskiego przy wspólnym gotowaniu dla uchodźców",
        "problem": "Uchodźczynie z dziećmi nie chodzą na kursy językowe, bo nie mają z kim zostawić dzieci i krępują się formalnych zajęć.",
        "customGroup": "kobiety z doświadczeniem uchodźstwa",
        "summary": "Cotygodniowe spotkania w świetlicy, na których Polki i uchodźczynie gotują razem potrawy z obu kuchni, ucząc się słownictwa. Dzieci mają w tym czasie zajęcia obok.",
        "novelty": "Nauka języka przez wspólne działanie i integrację, z opieką nad dziećmi na miejscu.",
    },
    {
        "title": "Spółdzielnia socjalna szyjąca torby z banerów",
        "problem": "Osoby z niepełnosprawnością intelektualną po zakończeniu szkoły nie mają szans na zatrudnienie.",
        "customGroup": "dorośli z niepełnosprawnością intelektualną",
        "summary": "Spółdzielnia socjalna przerabia zużyte banery reklamowe na torby i saszetki, zatrudniając osoby z niepełnosprawnością intelektualną z trenerem pracy.",
        "novelty": "Połączenie zatrudnienia wspomaganego z upcyklingiem i sprzedażą lokalnym firmom.",
    },
    {
        "title": "Trening pracy w kawiarni dla młodzieży z autyzmem",
        "problem": "Młodzi ludzie w spektrum autyzmu nie mają gdzie zdobyć pierwszego doświadczenia zawodowego.",
        "customGroup": "młodzież w spektrum autyzmu 16–25 lat",
        "summary": "Kawiarnia przy fundacji, w której młodzież w spektrum przechodzi płatne staże z asystentem: obsługa klienta, przygotowanie kawy, praca na kasie.",
        "novelty": "Bezpieczne, przewidywalne środowisko pracy z jasnymi instrukcjami obrazkowymi.",
    },
    {
        "title": "Wypożyczalnia sprzętu rehabilitacyjnego w gminie",
        "problem": "Rodziny osób po udarze nie stać na zakup wózka, balkonika czy łóżka rehabilitacyjnego, a NFZ refunduje sprzęt z dużym opóźnieniem.",
        "customGroup": "osoby z ograniczoną mobilnością i ich rodziny",
        "summary": "Gmina prowadzi bezpłatną wypożyczalnię sprzętu rehabilitacyjnego, zasilaną darowiznami i sprzętem odzyskanym po zmarłych użytkownikach.",
        "novelty": "Obieg sprzętu w społeczności zamiast jednorazowych zakupów.",
    },
    {
        "title": "Grupa wsparcia dla rodzeństwa dzieci z niepełnosprawnością",
        "problem": "Zdrowe rodzeństwo dzieci z niepełnosprawnością czuje się pomijane, bo cała uwaga rodziców skupia się na chorym dziecku.",
        "customGroup": "rodzeństwo dzieci z niepełnosprawnością, 7–15 lat",
        "summary": "Comiesięczne warsztaty z psychologiem i wyjazdy integracyjne tylko dla rodzeństwa, plus krótkie materiały dla rodziców.",
        "novelty": "Wsparcie skierowane do dzieci, które zwykle są pomijane w systemie.",
    },
    {
        "title": "Ogród społeczny na osiedlu z wielkiej płyty",
        "problem": "Mieszkańcy dużego osiedla nie znają się nawzajem, a zaniedbane podwórka nie sprzyjają spotkaniom.",
        "customGroup": "mieszkańcy osiedla w każdym wieku",
        "summary": "Wspólne grządki i kompostownik na nieużywanym trawniku, prowadzone przez mieszkańców z pomocą spółdzielni. Raz w miesiącu wspólne sadzenie i piknik.",
        "novelty": "Ogród jako pretekst do budowania więzi sąsiedzkich.",
    },
    {
        "title": "Rowerowe warsztaty naprawcze dla młodzieży z placówek",
        "problem": "Wychowankowie placówek opiekuńczo-wychowawczych nie mają praktycznych umiejętności i zajęć po szkole.",
        "customGroup": "młodzież z placówek opiekuńczo-wychowawczych",
        "summary": "Warsztat, w którym młodzież pod okiem mechanika naprawia oddane rowery, a odnowione przekazuje dzieciom z ubogich rodzin.",
        "novelty": "Nauka zawodu połączona z pomaganiem innym.",
    },
]


def headers(user_id):
    return {"X-User-Id": str(user_id)}


def published_titles(api):
    """{tytuł: id} opublikowanych pomysłów (GET /api/ideas zwraca tylko PUBLISHED)."""
    titles, page = {}, 0
    while True:
        r = requests.get(f"{api}/api/ideas", params={"page": page, "size": 100}, timeout=30)
        r.raise_for_status()
        data = r.json()
        titles.update({i["title"]: i["id"] for i in data.get("content", [])})
        total = data.get("totalPages", data.get("page", {}).get("totalPages", 1))
        page += 1
        if page >= total or not data.get("content"):
            return titles


def main():
    parser = argparse.ArgumentParser(description="Przykładowe pomysły [DEMO] do lokalnej bazy")
    parser.add_argument("--api", default="http://127.0.0.1:8081", help="adres serwisu innovations")
    parser.add_argument("--user-id", type=int, default=1, help="autor pomysłów (nagłówek X-User-Id)")
    parser.add_argument("--expert-id", type=int, default=1, help="kto zatwierdza (endorse)")
    parser.add_argument("--archive", action="store_true", help="zarchiwizuj wszystkie pomysły [DEMO]")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    existing = published_titles(args.api)

    if args.archive:
        demo = {t: i for t, i in existing.items() if t.startswith(PREFIX)}
        for title, idea_id in demo.items():
            requests.post(f"{args.api}/api/ideas/{idea_id}/archive", headers=headers(args.expert_id),
                          timeout=30).raise_for_status()
            print(f"zarchiwizowano #{idea_id} {title}")
        print(f"Zarchiwizowano {len(demo)} pomysłów [DEMO].")
        return

    created = skipped = 0
    for idea in IDEAS:
        title = PREFIX + idea["title"]
        if title in existing:
            skipped += 1
            continue
        body = {**idea, "title": title, "byMunicipality": False}
        r = requests.post(f"{args.api}/api/ideas", json=body, headers=headers(args.user_id), timeout=30)
        r.raise_for_status()
        idea_id = r.json()["id"]
        requests.post(f"{args.api}/api/ideas/{idea_id}/endorse", headers=headers(args.expert_id),
                      timeout=30).raise_for_status()
        created += 1
        print(f"#{idea_id} {title}")
    print(f"\nDodano i opublikowano {created} pomysłów, pominięto {skipped} (już istniały).")


if __name__ == "__main__":
    main()
