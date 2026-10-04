// Podobne pomysły mieszkańców do opisu problemu – MVP liczone we froncie po słowach kluczowych.
// Docelowo backend: GET /api/ideas?q=... (FULLTEXT na title, problem, summary, novelty).
// Gotowe rozwiązania ROPS przychodzą z osobnej wyszukiwarki (data/wyszukiwarka.js).

import { opublikowane } from './DaneContext.jsx'

const rdzen = (s) => s.slice(0, 5)
// Słowa bez znaczenia dla dopasowania (żeby „mają” albo „osoby” nie robiły z pomysłów „podobnych”)
const NIEISTOTNE = new Set(['mają', 'osoby', 'osób', 'nasze', 'naszej', 'naszym', 'nasza', 'gminie', 'gmina', 'gminy', 'które', 'który', 'która', 'tylko', 'bardzo', 'jest', 'są', 'gdzie', 'kiedy', 'mamy', 'może', 'mogą', 'nawet', 'przez', 'oraz', 'dlatego', 'jeszcze', 'potrzebują', 'problem', 'ludzie', 'mieszkańcy'])
const slowaZ = (tekst) => (tekst || '').toLowerCase().split(/[^a-ząćęłńóśźż-]+/).filter((s) => s.length > 3 && !NIEISTOTNE.has(s))

// Słowa fiszki liczone z jej pól (w bazie: FULLTEXT na title, problem, summary, novelty)
const zeSlowami = (f) => ({ ...f, slowa: slowaZ([f.tytul, f.problem, f.opis, f.istota, f.grupaInna, ...(f.grupy || [])].join(' ')) })

// Wynik dopasowania jednego elementu: wspólne słowa
function ocen(element, rdzenieZapytania) {
  const wspolne = [...new Set((element.slowa || []).filter((s) => rdzenieZapytania.includes(rdzen(s))))]
  return { punkty: wspolne.length, powody: wspolne.length ? [`wspólne tematy: ${wspolne.slice(0, 4).join(', ')}`] : [] }
}

// Etykieta słowna zamiast procentów – łatwiej zrozumieć mieszkańcom i jury
const etykieta = (p) => (p >= 5 ? 'bardzo' : p >= 3 ? 'podobne' : 'czesciowo')
export const NAZWA_PODOBIENSTWA = { bardzo: 'Bardzo podobne', podobne: 'Podobne', czesciowo: 'Częściowo podobne' }

function dopasujListe(lista, rdzenie, limit) {
  return lista
    .map((el) => ({ el, ...ocen(el, rdzenie) }))
    .filter((x) => x.punkty >= 2)
    .sort((a, b) => b.punkty - a.punkty)
    .slice(0, limit)
    .map((x) => ({ ...x.el, podobienstwo: etykieta(x.punkty), powody: x.powody }))
}

export function szukaj(opis, { fiszki }) {
  const rdzenie = slowaZ(opis).map(rdzen)
  return { przypadki: dopasujListe(opublikowane(fiszki).map(zeSlowami), rdzenie, 4) }
}
