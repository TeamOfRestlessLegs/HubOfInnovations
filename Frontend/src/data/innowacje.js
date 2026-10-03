// Przykładowe dane, dopóki backend nie wystawi API.
// Później zamienicie to na fetch('/api/innowacje').
// `slowa` – słowa kluczowe dla prostego matchmakingu (data/dopasuj.js),
// docelowo zastąpi je serwis AI (wektory).
export const innowacje = [
  { id: 1, tytul: 'Kawiarenka cyfrowa w remizie', tagi: ['Cyfryzacja', 'Seniorzy'], powiat: 'myślenicki', etap: 1, poparcia: 12, szuka: 'partnera (OSP / szkoła)',
    opis: 'Licealiści raz w tygodniu uczą seniorów obsługi telefonu: wideorozmowy, e-recepta, bankowość.',
    slowa: ['seniorzy', 'telefon', 'internet', 'komputer', 'wykluczenie cyfrowe', 'młodzież', 'e-recepta'] },
  { id: 2, tytul: 'Sąsiedzkie podwórko', tagi: ['Integracja', 'Młodzież'], powiat: 'wielicki', etap: 1, poparcia: 5,
    opis: 'Wspólne odnawianie podwórka przez mieszkańców bloku, z miejscem do spotkań dla młodzieży.',
    slowa: ['młodzież', 'sąsiedzi', 'integracja', 'osiedle', 'samotność', 'spotkania'] },
  { id: 3, tytul: 'Bus na telefon dla gminy', tagi: ['Transport', 'Seniorzy'], powiat: 'limanowski', etap: 2, poparcia: 31, szuka: 'testerów',
    opis: 'Mieszkańcy zamawiają kurs dzień wcześniej, gmina łączy przejazdy w jedną trasę.',
    slowa: ['transport', 'dojazd', 'autobus', 'seniorzy', 'wieś', 'przychodnia', 'lekarz', 'dojechać'] },
  { id: 4, tytul: 'Opieka wytchnieniowa na zmianę', tagi: ['Opieka', 'Rodziny'], powiat: 'tarnowski', etap: 2, poparcia: 18, szuka: 'wolontariuszy',
    opis: 'Sąsiedzi na kilka godzin zastępują opiekunów osób zależnych, żeby mogli odpocząć.',
    slowa: ['opieka', 'opiekun', 'niepełnosprawność', 'rodzina', 'zmęczenie', 'wolontariat'] },
  { id: 5, tytul: 'Teleporady w świetlicy', tagi: ['Zdrowie', 'Seniorzy'], powiat: 'nowosądecki', etap: 3, poparcia: 44,
    opis: 'W świetlicy wiejskiej stoi stanowisko do teleporady z lekarzem, pomaga asystent.',
    slowa: ['zdrowie', 'lekarz', 'przychodnia', 'seniorzy', 'wieś', 'teleporada', 'dojazd'] },
  { id: 6, tytul: 'Mobilny Sąsiad', tagi: ['Transport', 'Seniorzy'], powiat: 'myślenicki', etap: 4, poparcia: 87,
    opis: 'Wolontariusze z gminy dowożą seniorów do lekarza, urzędu i na zakupy. Koordynuje GOPS.',
    slowa: ['transport', 'dojazd', 'seniorzy', 'lekarz', 'przychodnia', 'wieś', 'wolontariat', 'dojechać', 'urząd'] },
]
