// Pola fiszki i ich opcje – jedno źródło dla Kreatora i wszystkich paneli.
// Pytania i skale pochodzą z Social Innovation Canvas (arkusz #01 i #02).

export const INTENSYWNOSC = [
  { id: 'bardzo', nazwa: 'Bardzo poważny problem', krotko: 'Bardzo poważny', opis: 'Powoduje stres, wyklucza albo realnie krzywdzi.', waga: 4, klasa: 'bg-[#FDE2E1] text-[#9B1C1C]' },
  { id: 'mocno', nazwa: 'Mocno przeszkadza', krotko: 'Mocno przeszkadza', opis: 'Regularnie blokuje ważne sprawy.', waga: 3, klasa: 'bg-clay-light text-clay-dark' },
  { id: 'utrudnia', nazwa: 'Utrudnia życie', krotko: 'Utrudnia życie', opis: 'Trzeba szukać obejść, traci się czas.', waga: 2, klasa: 'bg-[#E6EAF0] text-ink' },
  { id: 'lekko', nazwa: 'Lekko przeszkadza', krotko: 'Lekko przeszkadza', opis: 'Da się żyć, ale irytuje.', waga: 1, klasa: 'bg-[#E6EAF0] text-muted' },
]

export const CZESTOTLIWOSC = [
  { id: 'codziennie', nazwa: 'Codziennie', opis: 'Codziennie albo prawie codziennie.' },
  { id: 'czesto', nazwa: 'Często', opis: 'Co tydzień lub regularnie.' },
  { id: 'czasami', nazwa: 'Czasami', opis: 'Kilka razy w roku lub miesiącu.' },
  { id: 'rzadko', nazwa: 'Rzadko', opis: 'Raz na jakiś czas.' },
]

export const SKALA = [
  { id: 'pojedyncze', nazwa: 'Kilka osób', opis: 'Pojedyncze osoby lub mała grupa.' },
  { id: 'waska', nazwa: 'Wąska grupa', opis: 'Np. jedna szkoła, jedno osiedle.' },
  { id: 'duza', nazwa: 'Duża grupa', opis: 'Wiele osób w gminie lub powiecie.' },
  { id: 'szeroka', nazwa: 'Bardzo szeroka', opis: 'Wiele grup w różnych miejscach.' },
]

export const GRUPY = [
  'seniorzy', 'dzieci', 'młodzież', 'rodzice', 'osoby z niepełnosprawnościami',
  'opiekunowie osób zależnych', 'osoby w kryzysie', 'mieszkańcy wsi', 'cała społeczność lokalna',
]

// Znajduje opcję po id: znajdz(SKALA, 'duza') → { id:'duza', nazwa:'Duża grupa', … }
export const znajdz = (lista, id) => lista.find((o) => o.id === id)
