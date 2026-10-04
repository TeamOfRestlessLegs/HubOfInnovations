// Przykładowe fiszki (już poparte i opublikowane) – do czasu API.
// Tylko pola z formularza fiszki (tabela ideas): problem, grupy (+ grupaInna), tytul, opis, etap, istota.
// `poparcia` = startowa liczba poparć (w bazie: wiersze w tabeli supports).
export const fiszkiStartowe = [
  { id: 1, tytul: 'Kawiarenka cyfrowa w remizie', etap: 1, poparcia: 12,
    problem: 'Starsi mieszkańcy wsi nie umieją korzystać z telefonu – nie zrobią wideorozmowy z rodziną ani nie odbiorą e-recepty, a najbliższa pomoc jest w mieście.',
    grupy: ['seniorzy', 'mieszkańcy wsi'], grupaInna: '',
    opis: 'Licealiści raz w tygodniu uczą seniorów obsługi telefonu w remizie OSP: wideorozmowy, e-recepta, bankowość.',
    istota: 'Uczą młodzi z tej samej wsi, w miejscu, które seniorzy znają – bez dojazdu do miasta.' },
  { id: 2, tytul: 'Sąsiedzkie podwórko', etap: 1, poparcia: 5,
    problem: 'Młodzież z osiedla nie ma gdzie się spotykać po szkole, siedzi w telefonach, a sąsiedzi się nie znają.',
    grupy: ['młodzież', 'cała społeczność lokalna'], grupaInna: '',
    opis: 'Wspólne odnawianie podwórka przez mieszkańców bloku, z miejscem do spotkań dla młodzieży.',
    istota: 'Młodzież sama projektuje i buduje miejsce razem z dorosłymi sąsiadami.' },
  { id: 3, tytul: 'Bus na telefon dla gminy', etap: 2, poparcia: 31,
    problem: 'Autobus do przychodni jeździ dwa razy dziennie, seniorzy bez samochodu nie dojadą do lekarza.',
    grupy: ['seniorzy', 'mieszkańcy wsi'], grupaInna: '',
    opis: 'Mieszkańcy zamawiają kurs dzień wcześniej, gmina łączy przejazdy w jedną trasę.',
    istota: 'Trasa układa się z zamówień, a nie ze stałego rozkładu.' },
  { id: 4, tytul: 'Opieka wytchnieniowa na zmianę', etap: 2, poparcia: 18,
    problem: 'Opiekunowie osób zależnych nie mają ani jednego wolnego dnia i są wyczerpani.',
    grupy: ['opiekunowie osób zależnych', 'osoby z niepełnosprawnościami'], grupaInna: '',
    opis: 'Sąsiedzi na kilka godzin zastępują opiekunów osób zależnych, żeby mogli odpocząć.',
    istota: 'Grafik zastępstw między sąsiadami zamiast drogiej opieki instytucjonalnej.' },
]
