// Biblioteka Innowacji Społecznych – innowacje już podjęte przez ROPS.
// Kształt odpowiada temu, co zwróci backend: tytuł, krótki opis, załączniki, link „czytaj więcej”.
// PRZYKŁADOWE wpisy do czasu podpięcia prawdziwych danych ROPS (GET /api/biblioteka).
//
//   obszary     – id z data/obszary.js
//   zalaczniki  – [{ nazwa, url }]  (pliki z MinIO / S3)
//   url         – link „czytaj więcej” (pełny opis na stronie ROPS)
//   wideo       – opcjonalny link do filmu
//   slowa       – słowa kluczowe dla prostego matchingu (docelowo wektory z serwisu AI)
export const bibliotekaStartowa = [
  {
    id: 'b1', tytul: 'Mobilny Sąsiad', obszary: ['seniorzy', 'zdrowie'],
    opis: 'Wolontariusze z gminy dowożą seniorów do lekarza, urzędu i na zakupy. Kursy koordynuje GOPS.',
    zalaczniki: [{ nazwa: 'Opis modelu (PDF)', url: '#' }, { nazwa: 'Wzór regulaminu wolontariatu', url: '#' }],
    url: '#', wideo: '#', miejsce: '[gmina wdrożenia]',
    slowa: ['transport', 'dojazd', 'dojechać', 'seniorzy', 'lekarz', 'przychodnia', 'wieś', 'wolontariat', 'urząd', 'samotność'],
  },
  {
    id: 'b2', tytul: 'Teleporady w świetlicy wiejskiej', obszary: ['zdrowie', 'seniorzy'],
    opis: 'W świetlicy stoi stanowisko do teleporady z lekarzem; asystent pomaga połączyć się i przygotować do wizyty.',
    zalaczniki: [{ nazwa: 'Raport z pilotażu (PDF)', url: '#' }],
    url: '#', miejsce: '[gmina wdrożenia]',
    slowa: ['zdrowie', 'lekarz', 'przychodnia', 'teleporada', 'wieś', 'seniorzy', 'dojazd', 'internet'],
  },
  {
    id: 'b3', tytul: 'Rodzinny dom dla rodzeństw', obszary: ['rodzina'],
    opis: 'Program wsparcia rodzin zastępczych przyjmujących rodzeństwa – szkolenia, asystent i dodatkowe godziny opieki wytchnieniowej.',
    zalaczniki: [{ nazwa: 'Ścieżka rekrutacji kandydatów', url: '#' }],
    url: '#', miejsce: '[powiat wdrożenia]',
    slowa: ['rodzina', 'zastępcza', 'piecza', 'rodzeństwo', 'dzieci', 'adopcja', 'opieka'],
  },
  {
    id: 'b4', tytul: 'Mieszkanie treningowe „Start”', obszary: ['bezdomnosc', 'rodzina'],
    opis: 'Mieszkanie z opiekunem dla usamodzielniających się wychowanków placówek – pierwsza praca, budżet domowy, wsparcie psychologa.',
    zalaczniki: [{ nazwa: 'Opis usługi (PDF)', url: '#' }],
    url: '#', miejsce: '[miasto wdrożenia]',
    slowa: ['mieszkanie', 'bezdom', 'wychowanek', 'placówka', 'młodzież', 'usamodzielnienie', 'nocleg'],
  },
  {
    id: 'b5', tytul: 'Asystent wyjścia z domu', obszary: ['niepelnosprawnosc'],
    opis: 'Przeszkoleni asystenci towarzyszą osobom z niepełnosprawnością w wyjściach – do urzędu, na zakupy, do kina.',
    zalaczniki: [{ nazwa: 'Standard usługi asystenckiej', url: '#' }],
    url: '#', wideo: '#', miejsce: '[gmina wdrożenia]',
    slowa: ['niepełnosprawność', 'asystent', 'wózek', 'samotność', 'wyjście', 'transport', 'dostępność'],
  },
  {
    id: 'b6', tytul: 'Sąsiedzka spiżarnia', obszary: ['ubostwo'],
    opis: 'Lodówka i półki społeczne przy parafii i sklepie – mieszkańcy dzielą się żywnością, a GOPS dowozi paczki osobom, które nie wychodzą z domu.',
    zalaczniki: [{ nazwa: 'Instrukcja uruchomienia', url: '#' }],
    url: '#', miejsce: '[gmina wdrożenia]',
    slowa: ['ubóstwo', 'bieda', 'jedzenie', 'głód', 'żywność', 'paczki', 'seniorzy'],
  },
  {
    id: 'b7', tytul: 'Klub językowy dla rodzin migranckich', obszary: ['cudzoziemcy'],
    opis: 'Wolontariusze prowadzą spotkania językowe dla dzieci i rodziców z Ukrainy w szkolnej świetlicy, z pomocą w sprawach urzędowych.',
    zalaczniki: [{ nazwa: 'Scenariusze zajęć', url: '#' }],
    url: '#', miejsce: '[miasto wdrożenia]',
    slowa: ['cudzoziemcy', 'migranci', 'ukraina', 'język', 'szkoła', 'dzieci', 'integracja'],
  },
  {
    id: 'b8', tytul: 'Punkt „Pogadaj” dla młodzieży', obszary: ['psychika'],
    opis: 'Dyżury psychologa i przeszkolonych rówieśników w szkole i online – pierwsza pomoc w kryzysie emocjonalnym bez skierowania.',
    zalaczniki: [{ nazwa: 'Model dyżurów (PDF)', url: '#' }],
    url: '#', wideo: '#', miejsce: '[powiat wdrożenia]',
    slowa: ['młodzież', 'psychika', 'depresja', 'samotność', 'kryzys', 'emocje', 'szkoła', 'stres'],
  },
]
