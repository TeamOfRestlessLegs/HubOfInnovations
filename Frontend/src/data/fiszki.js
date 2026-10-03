// Przykładowe fiszki mieszkańców (już zatwierdzone przez ROPS) – do czasu API.
// Pola fiszki i ich opcje: data/fiszka.js. `obszar` – id z data/obszary.js.
export const fiszkiStartowe = [
  { id: 1, tytul: 'Kawiarenka cyfrowa w remizie', obszar: 'seniorzy', tagi: ['Seniorzy'], powiat: 'myślenicki', etap: 1, poparcia: 12, szuka: 'partnera (OSP / szkoła)',
    problem: 'Starsi mieszkańcy wsi nie umieją korzystać z telefonu – nie zrobią wideorozmowy z rodziną ani nie odbiorą e-recepty, a najbliższa pomoc jest w mieście.',
    intensywnosc: 'mocno', czestotliwosc: 'czesto', grupy: ['seniorzy', 'mieszkańcy wsi'], skala: 'duza',
    opis: 'Licealiści raz w tygodniu uczą seniorów obsługi telefonu w remizie OSP: wideorozmowy, e-recepta, bankowość.',
    slowa: ['seniorzy', 'telefon', 'internet', 'komputer', 'cyfrowe', 'młodzież', 'e-recepta'] },
  { id: 2, tytul: 'Sąsiedzkie podwórko', obszar: 'psychika', tagi: ['Młodzież'], powiat: 'wielicki', etap: 1, poparcia: 5,
    problem: 'Młodzież z osiedla nie ma gdzie się spotykać po szkole, siedzi w telefonach, a sąsiedzi się nie znają.',
    intensywnosc: 'utrudnia', czestotliwosc: 'codziennie', grupy: ['młodzież', 'cała społeczność lokalna'], skala: 'waska',
    opis: 'Wspólne odnawianie podwórka przez mieszkańców bloku, z miejscem do spotkań dla młodzieży.',
    slowa: ['młodzież', 'sąsiedzi', 'integracja', 'osiedle', 'samotność', 'spotkania'] },
  { id: 3, tytul: 'Bus na telefon dla gminy', obszar: 'seniorzy', tagi: ['Seniorzy'], powiat: 'limanowski', etap: 2, poparcia: 31, szuka: 'testerów',
    problem: 'Autobus do przychodni jeździ dwa razy dziennie, seniorzy bez samochodu nie dojadą do lekarza.',
    intensywnosc: 'bardzo', czestotliwosc: 'czesto', grupy: ['seniorzy', 'mieszkańcy wsi'], skala: 'duza',
    opis: 'Mieszkańcy zamawiają kurs dzień wcześniej, gmina łączy przejazdy w jedną trasę.',
    slowa: ['transport', 'dojazd', 'autobus', 'seniorzy', 'wieś', 'przychodnia', 'lekarz', 'dojechać'] },
  { id: 4, tytul: 'Opieka wytchnieniowa na zmianę', obszar: 'zdrowie', tagi: ['Opiekunowie'], powiat: 'tarnowski', etap: 2, poparcia: 18, szuka: 'wolontariuszy',
    problem: 'Opiekunowie osób zależnych nie mają ani jednego wolnego dnia i są wyczerpani.',
    intensywnosc: 'bardzo', czestotliwosc: 'codziennie', grupy: ['opiekunowie osób zależnych', 'osoby z niepełnosprawnościami'], skala: 'waska',
    opis: 'Sąsiedzi na kilka godzin zastępują opiekunów osób zależnych, żeby mogli odpocząć.',
    slowa: ['opieka', 'opiekun', 'niepełnosprawność', 'rodzina', 'zmęczenie', 'wolontariat'] },
]
