// Wyszukiwarka – MVP liczona we froncie, ale zwraca DOKŁADNIE kształt przyszłego API:
//
//   POST /api/search  { opis }
//   → {
//       rozpoznane:   { obszary: [{id, nazwa}], grupy: [] },
//       rozwiazania:  [ innowacje z Biblioteki ROPS: {id, tytul, opis, zalaczniki, url, wideo?, miejsce, podobienstwo, powody[]} ],
//       przypadki:    [ opublikowane fiszki użytkowników: {id, tytul, problem, etap, szuka, powiat, podobienstwo, powody[]} ],
//       wiedza:       [ obszary z Mapy Wyzwań: {obszar, wyzwania[3], raporty[]} ],
//       podobneZgloszenia: liczba wcześniejszych zapytań w tych samych obszarach
//     }
//
// Backend robi to samo, tylko zamiast słów kluczowych używa wektorów (embeddingi + pgvector).
// Podmiana = zamiana ciała funkcji szukaj() na fetch – strony się nie zmieniają.

import { wykryjObszary, obszarPoId } from './obszary.js'
import { GRUPY } from './fiszka.js'
import { opublikowane } from './DaneContext.jsx'

const rdzen = (s) => s.slice(0, 5)
const slowaZ = (tekst) => (tekst || '').toLowerCase().split(/[^a-ząćęłńóśźż-]+/).filter((s) => s.length > 3)

// Wynik dopasowania jednego elementu: wspólne słowa + zgodny obszar
function ocen(element, rdzenieZapytania, obszaryZapytania) {
  const wspolne = (element.slowa || []).filter((s) => rdzenieZapytania.includes(rdzen(s)))
  const obszaryEl = element.obszary || (element.obszar ? [element.obszar] : [])
  const wspolnyObszar = obszaryEl.find((o) => obszaryZapytania.includes(o))
  const punkty = wspolne.length + (wspolnyObszar ? 2 : 0)

  const powody = []
  if (wspolnyObszar) powody.push(`ten sam obszar: ${obszarPoId(wspolnyObszar).nazwa}`)
  if (wspolne.length) powody.push(`wspólne tematy: ${[...new Set(wspolne)].slice(0, 4).join(', ')}`)

  return { punkty, powody }
}

// Etykieta słowna zamiast procentów – łatwiej zrozumieć mieszkańcom i jury
const etykieta = (p) => (p >= 5 ? 'bardzo' : p >= 3 ? 'podobne' : 'czesciowo')
export const NAZWA_PODOBIENSTWA = { bardzo: 'Bardzo podobne', podobne: 'Podobne', czesciowo: 'Częściowo podobne' }

function dopasujListe(lista, rdzenie, obszary, limit) {
  return lista
    .map((el) => ({ el, ...ocen(el, rdzenie, obszary) }))
    .filter((x) => x.punkty >= 2)
    .sort((a, b) => b.punkty - a.punkty)
    .slice(0, limit)
    .map((x) => ({ ...x.el, podobienstwo: etykieta(x.punkty), powody: x.powody }))
}

export function szukaj(opis, { biblioteka, fiszki, zgloszenia }) {
  const rdzenie = slowaZ(opis).map(rdzen)
  const obszary = wykryjObszary(opis).slice(0, 2)
  const idObszarow = obszary.map((o) => o.id)
  const grupy = GRUPY.filter((g) => rdzenie.includes(rdzen(g.split(' ')[0])))

  return {
    rozpoznane: { obszary: obszary.map((o) => ({ id: o.id, nazwa: o.nazwa })), grupy },
    rozwiazania: dopasujListe(biblioteka, rdzenie, idObszarow, 5),
    przypadki: dopasujListe(opublikowane(fiszki), rdzenie, idObszarow, 4),
    wiedza: obszary.map((o) => ({ obszar: { id: o.id, nazwa: o.nazwa, krotko: o.krotko }, wyzwania: o.wyzwania.slice(0, 3), raporty: o.raporty.slice(0, 2) })),
    podobneZgloszenia: zgloszenia.filter((z) => (z.obszary || []).some((o) => idObszarow.includes(o))).length,
  }
}
