// Social Innovation Canvas (arkusze #01–#03) zapisana jako dane.
// Strona Canva.jsx sama rysuje z tego formularz – żeby zmienić pytanie,
// edytujecie tylko ten plik.
//
// Typy pytań:
//   'wybor' – jedna odpowiedź (kafelki)
//   'lista' – wiele odpowiedzi (checkboxy), `max` = limit zaznaczeń
//   'tekst' – pole tekstowe

import { ETAPY } from './etapy.js'

const POZIOMY_WPLYWU = [
  { id: 'maly', nazwa: 'Mały wpływ', opis: 'Zmiana niewielka lub jeszcze niejasna.' },
  { id: 'mozliwy', nazwa: 'Możliwy wpływ', opis: 'Widzimy potencjał, nie mamy potwierdzenia.' },
  { id: 'wyrazny', nazwa: 'Wyraźny wpływ', opis: 'Konkretna, zauważalna zmiana.' },
  { id: 'silny', nazwa: 'Silny wpływ', opis: 'Duża zmiana potwierdzona przez użytkowników lub dane.' },
]

export const CANVA = [
  {
    arkusz: '#01 Problem i rozwiązanie',
    sekcje: [
      {
        id: 'problem', nazwa: 'Problem',
        pytania: [
          { id: 'intensywnosc', typ: 'wybor', tytul: 'Intensywność', opis: 'Jak bardzo źle jest bez Waszego rozwiązania?', opcje: [
            { id: 'bardzo', nazwa: 'Bardzo poważny problem', opis: 'Powoduje stres, wyklucza albo realnie krzywdzi.' },
            { id: 'mocno', nazwa: 'Mocno przeszkadza', opis: 'Regularnie blokuje ważne działania.' },
            { id: 'utrudnia', nazwa: 'Utrudnia działanie', opis: 'Trzeba szukać alternatyw, traci się czas.' },
            { id: 'lekko', nazwa: 'Lekko przeszkadza', opis: 'Da się żyć, problem raczej irytuje.' },
          ] },
          { id: 'czestotliwosc', typ: 'wybor', tytul: 'Częstotliwość', opis: 'Jak często występuje problem?', opcje: [
            { id: 'bardzo-czesto', nazwa: 'Bardzo często', opis: 'Codziennie albo prawie codziennie.' },
            { id: 'czesto', nazwa: 'Często', opis: 'Co tydzień lub regularnie.' },
            { id: 'czasami', nazwa: 'Czasami', opis: 'Kilka razy w roku lub miesiącu.' },
            { id: 'rzadko', nazwa: 'Rzadko', opis: 'Raz na jakiś czas.' },
          ] },
          { id: 'skala', typ: 'wybor', tytul: 'Skala problemu', opis: 'Ilu ludzi dotyka problem?', opcje: [
            { id: 'pojedyncze', nazwa: 'Pojedyncze osoby', opis: 'Kilka osób lub mała grupa.' },
            { id: 'waska', nazwa: 'Wąska grupa', opis: 'Np. uczniowie jednej szkoły, jedna okolica.' },
            { id: 'duza', nazwa: 'Duża grupa', opis: 'Wiele osób w mieście, regionie, branży.' },
            { id: 'szeroka', nazwa: 'Bardzo szeroka grupa', opis: 'Duża część społeczeństwa, wiele miejsc.' },
          ] },
        ],
      },
      {
        id: 'aktorzy', nazwa: 'Aktorzy zmiany',
        pytania: [
          { id: 'wspieraja', typ: 'tekst', tytul: 'Wspierają zmianę', opis: 'Kto najbardziej potrzebuje zmiany? Kto może pomóc, polecić, otworzyć drzwi?' },
          { id: 'utrudniaja', typ: 'tekst', tytul: 'Utrudniają zmianę', opis: 'Kto może się bać dodatkowej pracy, kosztów, utraty wpływu? Kto może zablokować decyzję?' },
        ],
      },
      {
        id: 'rozwiazanie', nazwa: 'Rozwiązanie',
        pytania: [
          { id: 'przystepnosc', typ: 'wybor', tytul: 'Przystępność i wartość', opis: 'Jak ma się korzyść do kosztu?', opcje: [
            { id: 'koszt-wiekszy', nazwa: 'Koszt większy niż korzyść', opis: 'Dużo pieniędzy i wysiłku, mało widoczny efekt.' },
            { id: 'podobne', nazwa: 'Korzyść i koszt podobne', opis: 'Pomaga, ale nie wiadomo, czy się opłaca.' },
            { id: 'korzysc-wieksza', nazwa: 'Korzyść większa niż koszt', opis: 'Zauważalna wartość za rozsądną cenę.' },
            { id: 'duza-wartosc', nazwa: 'Duża wartość, mały koszt', opis: 'Skutecznie pomaga, niska bariera wejścia.' },
          ] },
          // Etapy biorą się z data/etapy.js – ten sam etap widać potem w „Innowacjach w toku”
          { id: 'etap', typ: 'wybor', tytul: 'Gotowość do wdrożenia', opis: 'Na jakim etapie jest rozwiązanie?',
            opcje: ETAPY.map((e) => ({ id: e.nr, nazwa: e.nazwa, opis: e.opis })) },
          { id: 'prostota', typ: 'wybor', tytul: 'Prostota i zrozumiałość', opis: 'Czy ktoś, kto pierwszy raz je widzi, szybko zrozumie, dla kogo jest i jak działa?', opcje: [
            { id: 'niejasne', nazwa: 'Niejasne', opis: 'Trzeba długo tłumaczyć.' },
            { id: 'czesciowo', nazwa: 'Częściowo jasne', opis: 'Ogólny pomysł tak, szczegóły nie.' },
            { id: 'jasne', nazwa: 'Jasne', opis: 'Większość od razu rozumie.' },
            { id: 'wyjasniaja', nazwa: 'Ludzie wyjaśniają sami', opis: 'Odbiorcy tłumaczą to innym.' },
          ] },
        ],
      },
      {
        id: 'koszty', nazwa: 'Struktura kosztów',
        pytania: [
          { id: 'stale', typ: 'lista', tytul: 'Stałe koszty', opis: 'Płacicie je niezależnie od liczby użytkowników.', opcje: [
            'wynagrodzenie zespołu', 'czynsz / przestrzeń', 'utrzymanie aplikacji lub strony', 'abonamenty narzędzi',
            'koordynacja projektu', 'księgowość / administracja', 'promocja podstawowa', 'sprzęt potrzebny na start',
          ] },
          { id: 'zmienne', typ: 'lista', tytul: 'Zmienne koszty', opis: 'Rosną, gdy korzysta więcej osób.', opcje: [
            'materiały dla uczestników', 'czas specjalisty na osobę', 'dojazdy', 'catering', 'wydruk materiałów', 'wsparcie techniczne',
          ] },
        ],
      },
    ],
  },
  {
    arkusz: '#02 Odbiorcy i wartość',
    sekcje: [
      {
        id: 'odbiorcy', nazwa: 'Odbiorcy',
        pytania: [
          { id: 'uzytkownik', typ: 'lista', tytul: 'Główny użytkownik', opis: 'Komu to rozwiązanie ma realnie pomóc?', opcje: [
            'dzieci', 'młodzież', 'rodzice', 'seniorzy', 'osoby z niepełnosprawnościami', 'nauczyciele',
            'pracownicy instytucji', 'osoby w kryzysie', 'organizacje społeczne', 'mieszkańcy konkretnego miejsca',
          ] },
          { id: 'platnik', typ: 'lista', tytul: 'Klient / płatnik', opis: 'Kto wyciąga portfel albo uruchamia budżet?', opcje: [
            'sam użytkownik', 'rodzic / opiekun', 'szkoła', 'firma', 'urząd miasta / gmina', 'fundacja / organizacja',
            'grantodawca', 'sponsor', 'NFZ / instytucja publiczna', 'pracodawca',
          ] },
          { id: 'decydent', typ: 'lista', tytul: 'Autorytet / decydent', opis: 'Czyja zgoda lub rekomendacja jest potrzebna?', opcje: [
            'dyrektor szkoły', 'nauczyciel', 'lekarz', 'terapeuta', 'pracownik socjalny', 'urząd', 'lider lokalny',
            'organizacja społeczna', 'rodzic / opiekun', 'ekspert', 'instytucja finansująca',
          ] },
        ],
      },
      {
        id: 'dochody', nazwa: 'Źródła dochodów',
        pytania: [
          { id: 'glowny-dochod', typ: 'wybor', tytul: 'Główny dochód', opis: 'Co jest podstawowym źródłem pieniędzy?', opcje: [
            { id: 'nie-wiemy', nazwa: 'Nie wiemy jeszcze', opis: 'Nie mamy pomysłu, kto i za co miałby płacić.' },
            { id: 'pomysl', nazwa: 'Mamy pomysł', opis: 'Nie sprawdziliśmy go z potencjalnym klientem.' },
            { id: 'propozycja', nazwa: 'Mamy konkretną propozycję', opis: 'Wiemy, co oferujemy, komu i dlaczego zapłaci.' },
            { id: 'potwierdzenie', nazwa: 'Mamy potwierdzenie', opis: 'Ktoś już zapłacił lub zadeklarował wsparcie.' },
          ] },
          { id: 'skalowanie', typ: 'wybor', tytul: 'Skalowanie dochodu', opis: 'Co możecie sprzedawać lub finansować w przyszłości?', opcje: [
            { id: 'brak', nazwa: 'Brak jasnych dodatkowych źródeł', opis: 'Na razie tylko jedno źródło.' },
            { id: 'szanse', nazwa: 'Są szanse na dodatkowe pieniądze', opis: 'Kilka pomysłów, jeszcze niesprawdzonych.' },
            { id: 'sciezki', nazwa: 'Widzimy realne ścieżki rozwoju', opis: 'Wiemy, jakie usługi dodać po pierwszym sukcesie.' },
            { id: 'powielanie', nazwa: 'Model można powielać', opis: 'Wiele miejsc, wiele grup, wiele kanałów.' },
          ] },
          { id: 'dochod-opis', typ: 'tekst', tytul: 'Pomysł na źródło finansowania', opis: 'Jeśli macie propozycję, wpiszcie ją tutaj.' },
        ],
      },
      {
        id: 'wartosc', nazwa: 'Propozycja wartości',
        pytania: [
          { id: 'emocjonalna', typ: 'lista', max: 3, tytul: 'Wartość emocjonalna', opis: 'Co odbiorcy poczują dzięki rozwiązaniu? Maks. 3.', opcje: [
            'bezpieczeństwo', 'spokój', 'pewność', 'mniejsza samotność', 'większa sprawczość', 'poprawa zdrowia',
            'niezależność', 'motywacja', 'włączenie społeczne', 'poczucie bycia widzianym', 'lepszy nastrój', 'zadowolenie z życia',
          ] },
          { id: 'funkcjonalna', typ: 'lista', max: 3, tytul: 'Wartość funkcjonalna', opis: 'Co rozwiązanie konkretnie poprawi? Maks. 3.', opcje: [
            'obniża koszty', 'oszczędza czas', 'zwiększa skuteczność', 'poprawia jakość', 'upraszcza proces', 'zwiększa dostępność',
            'zwiększa zasięg pomocy', 'zmniejsza obciążenie', 'poprawia bezpieczeństwo', 'zwiększa wpływ społeczny',
            'mniej szkodzi środowisku', 'pomaga w lepszych decyzjach',
          ] },
        ],
      },
    ],
  },
  {
    arkusz: '#03 Zasięg i wpływ',
    sekcje: [
      {
        id: 'kanaly', nazwa: 'Kanały',
        pytania: [
          { id: 'bezposrednie', typ: 'lista', tytul: 'Jak ludzie trafiają do Was bezpośrednio?', opis: '', opcje: [
            'własna strona', 'formularz zgłoszeniowy', 'kontakt telefoniczny / mailowy', 'spotkania bezpośrednie',
            'własne warsztaty', 'media społecznościowe', 'własna aplikacja', 'newsletter', 'własne wydarzenia',
          ] },
          { id: 'posrednicy', typ: 'lista', tytul: 'Kto może pomóc dotrzeć do odbiorców?', opis: '', opcje: [
            'szkoła', 'urząd / gmina', 'organizacja społeczna', 'ekspert', 'lekarz / terapeuta', 'nauczyciel',
            'pracownik socjalny', 'lider lokalny', 'firma', 'ambasador',
          ] },
        ],
      },
      {
        id: 'partnerzy', nazwa: 'Konstelacja partnerów',
        pytania: [
          { id: 'taniej', typ: 'tekst', tytul: 'Jak robić to taniej?', opis: 'Jacy partnerzy mogą obniżać koszty? W jaki sposób?' },
          { id: 'dotrzec', typ: 'tekst', tytul: 'Jak dotrzeć do odbiorców?', opis: 'Jacy partnerzy wesprą komunikację i dystrybucję?' },
          { id: 'lepsza-wartosc', typ: 'tekst', tytul: 'Jak dawać lepszą wartość?', opis: 'Jacy partnerzy wzmocnią propozycję wartości?' },
        ],
      },
      {
        id: 'wplyw', nazwa: 'Wpływ',
        pytania: [
          { id: 'wplyw-osoba', typ: 'wybor', tytul: 'Osoba', opis: 'Jak zmienia życie użytkownika?', opcje: POZIOMY_WPLYWU },
          { id: 'wplyw-spolecznosc', typ: 'wybor', tytul: 'Społeczność', opis: 'Jak pomaga większej grupie?', opcje: POZIOMY_WPLYWU },
          { id: 'wplyw-srodowisko', typ: 'wybor', tytul: 'Środowisko', opis: 'Jak zmienia świat wokół?', opcje: POZIOMY_WPLYWU },
        ],
      },
    ],
  },
]

// Płaska lista wszystkich sekcji – przydaje się do nawigacji "dalej / wstecz"
export const SEKCJE = CANVA.flatMap((a) => a.sekcje.map((s) => ({ ...s, arkusz: a.arkusz })))

// ── Pomocniki ──────────────────────────────────────────────

// Czy na pytanie jest już jakaś odpowiedź
export const odpowiedziano = (pytanie, wartosc) => {
  if (pytanie.typ === 'lista') return (wartosc || []).length > 0
  if (pytanie.typ === 'tekst') return (wartosc || '').trim().length > 0
  return wartosc !== undefined && wartosc !== null && wartosc !== ''
}

export const sekcjaGotowa = (sekcja, odpowiedzi) => sekcja.pytania.every((p) => odpowiedziano(p, odpowiedzi[p.id]))
export const brakujaceSekcje = (odpowiedzi) => SEKCJE.filter((s) => !sekcjaGotowa(s, odpowiedzi))

// Canva na start wypełniona tym, co już wiemy z fiszki – użytkownik nie odpowiada drugi raz na te same pytania
export function canvaZFiszki(f) {
  const CZESTOTLIWOSC_Z_FISZKI = { codziennie: 'bardzo-czesto', czesto: 'czesto', czasami: 'czasami', rzadko: 'rzadko' }
  const GRUPA_Z_FISZKI = {
    'mieszkańcy wsi': 'mieszkańcy konkretnego miejsca',
    'cała społeczność lokalna': 'mieszkańcy konkretnego miejsca',
  }
  const opcjeUzytkownika = SEKCJE.find((s) => s.id === 'odbiorcy').pytania.find((p) => p.id === 'uzytkownik').opcje
  const uzytkownik = [...new Set((f.grupy || []).map((g) => GRUPA_Z_FISZKI[g] || g).filter((g) => opcjeUzytkownika.includes(g)))]

  return {
    intensywnosc: f.intensywnosc,
    czestotliwosc: CZESTOTLIWOSC_Z_FISZKI[f.czestotliwosc],
    skala: f.skala,
    etap: f.etap,
    ...(uzytkownik.length ? { uzytkownik } : {}),
  }
}
