// Nabory grantowe i szablon wniosku.
// ROPS tworzy nabór w panelu; użytkownik generuje z fiszki wniosek dopasowany do naboru.

import { ETAPY } from './etapy.js'

// Domyślny szablon pól wniosku. `zrodlo` mówi, z czego wypełnić pole na start.
// Docelowo ROPS może zmienić pola i limity dla każdego naboru.
export const DOMYSLNE_POLA = [
  { id: 'problem', etykieta: 'Opis problemu społecznego', limit: 1500, zrodlo: 'problem' },
  { id: 'odbiorcy', etykieta: 'Grupa docelowa i skala problemu', limit: 800, zrodlo: 'odbiorcy' },
  { id: 'rozwiazanie', etykieta: 'Opis innowacji – na czym polega rozwiązanie', limit: 2000, zrodlo: 'rozwiazanie' },
  { id: 'etap', etykieta: 'Etap realizacji i dotychczasowe działania', limit: 800, zrodlo: 'etap' },
  { id: 'zasoby', etykieta: 'Potrzebne zasoby i partnerzy', limit: 800, zrodlo: 'zasoby' },
  { id: 'rezultaty', etykieta: 'Zakładane rezultaty i sposób ich sprawdzenia', limit: 1000, zrodlo: 'rezultaty' },
]

// Wypełnia pole wniosku danymi z fiszki i Canvy (bez AI – AI może potem przeredagować)
export function wypelnijZFiszki(zrodlo, f, canva = {}) {
  const lista = (x) => (x || []).join(', ')
  switch (zrodlo) {
    case 'problem':
      return [
        /[.!?]$/.test(f.problem.trim()) ? f.problem.trim() : f.problem.trim() + '.',
      ].filter(Boolean).join(' ')
    case 'odbiorcy': {
      const grupy = [...(f.grupy || []), f.grupaInna].filter(Boolean).join(', ')
      return `Odbiorcy: ${grupy}.`
    }
    case 'rozwiazanie':
      return [`${f.tytul}. ${f.opis}`, f.istota && `Nowość: ${f.istota}`].filter(Boolean).join(' ')
    case 'etap':
      return `Obecny etap: ${ETAPY.find((e) => e.nr === f.etap)?.nazwa || '—'}. Pomysł ma ${(f.poparcia || 0) + (f.poparli?.length || 0)} poparć mieszkańców na platformie Małopolski Splot.`
    case 'zasoby':
      return [
        canva.stale?.length && `Koszty stałe: ${lista(canva.stale)}.`,
        canva.zmienne?.length && `Koszty zmienne: ${lista(canva.zmienne)}.`,
        canva.taniej && `Partnerzy obniżający koszty: ${canva.taniej}`,
        canva.dotrzec && `Partnerzy w dotarciu do odbiorców: ${canva.dotrzec}`,
        canva['lepsza-wartosc'] && `Partnerzy wzmacniający wartość: ${canva['lepsza-wartosc']}`,
      ].filter(Boolean).join(' ')
    case 'rezultaty':
      return [
        canva.emocjonalna?.length && `Dla odbiorców: ${lista(canva.emocjonalna)}.`,
        canva.funkcjonalna?.length && `Konkretne efekty: ${lista(canva.funkcjonalna)}.`,
        canva['wplyw-osoba'] && `Wpływ na osobę: ${NAZWY_WPLYWU[canva['wplyw-osoba']]}.`,
        canva['wplyw-spolecznosc'] && `Wpływ na społeczność: ${NAZWY_WPLYWU[canva['wplyw-spolecznosc']]}.`,
        canva['wplyw-srodowisko'] && `Wpływ na środowisko: ${NAZWY_WPLYWU[canva['wplyw-srodowisko']]}.`,
      ].filter(Boolean).join(' ')
    default:
      return ''
  }
}

// Czy nabór jest teraz otwarty
export const naborOtwarty = (n) => n.status === 'otwarty' && new Date(n.termin) >= new Date(new Date().toDateString())

const NAZWY_WPLYWU = { maly: 'mały', mozliwy: 'możliwy', wyrazny: 'wyraźny', silny: 'silny' }

const zaDni = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

export const naboryStartowe = [
  {
    id: 'n1',
    nazwa: '[Przykład] Inkubator innowacji – aktywni seniorzy',
    opis: 'Granty na przetestowanie w mikroskali rozwiązań przeciwdziałających samotności i wykluczeniu seniorów.',
    kryteria: 'Rozwiązanie odpowiada na wyzwanie z Mapy Wyzwań; ma jasno opisaną grupę docelową; da się je przetestować w ciągu 6 miesięcy.',
    termin: zaDni(21),
    status: 'otwarty',
    pola: DOMYSLNE_POLA,
  },
]
