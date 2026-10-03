// Powiaty Małopolski – do wyboru miejsca problemu w Kreatorze i filtrów.
export const powiaty = [
  'bocheński', 'brzeski', 'chrzanowski', 'dąbrowski', 'gorlicki', 'krakowski', 'limanowski', 'miechowski',
  'myślenicki', 'nowosądecki', 'nowotarski', 'olkuski', 'oświęcimski', 'proszowicki', 'suski', 'tarnowski',
  'tatrzański', 'wadowicki', 'wielicki', 'Kraków', 'Nowy Sącz', 'Tarnów',
].map((nazwa) => ({ nazwa }))

// Materiały edukacyjne – ogólne (raporty per obszar są w data/obszary.js).
// Docelowo ROPS dodaje je w panelu (GET /api/materialy).
export const materialy = [
  { id: 'm1', typ: 'Narzędzie', tytul: 'Social Innovation Canvas', opis: 'Trzy arkusze do prototypowania pomysłu. W Splocie wypełnisz je online jako pierwszy krok wniosku – gdy ROPS ogłosi nabór.', url: '/kreator', wewnetrzny: true },
  { id: 'm2', typ: 'Raport', tytul: 'Mapa Wyzwań Społecznych', opis: 'Osiem obszarów: definicje, dane, kluczowe wyzwania i persony. ROPS Kraków, Dział Innowacji Społecznych.', url: '#' },
  { id: 'm3', typ: 'Poradnik', tytul: '[Jak zacząć innowację społeczną]', opis: '[Materiał ROPS – do uzupełnienia przez administratora]', url: '#' },
  { id: 'm4', typ: 'Film', tytul: '[Webinar ROPS o testowaniu w mikroskali]', opis: '[Materiał ROPS – do uzupełnienia przez administratora]', url: '#' },
]
