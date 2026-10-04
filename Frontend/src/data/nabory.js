// Nabory grantowe i szablon wniosku.
// ROPS tworzy nabór w panelu; użytkownik generuje z fiszki wniosek dopasowany do naboru.

import { ETAPY } from './etapy.js'
import { obszarPoId } from './obszary.js'
import { DANE_FISZKI, odpowiedzCanvy, pytanieCanvy } from './asystent.js'
import wzorInkubator from './wzory/inkubator.json'
import wzorUsluga from './wzory/usluga.json'

// Domyślny szablon pól wniosku. `zrodlo` mówi, z czego wypełnić pole na start.
// Gdy ROPS wgra wzór wniosku (PDF), pola i pytania naboru odczytuje z niego asystent (data/asystent.js → odczytajWzor).
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

// Pole na start: szablon domyślny ma `zrodlo`, pola odczytane ze wzoru – powiązania z fiszką, Canvą
// i odpowiedziami na pytania naboru. Skleja to, co już wiemy; asystent AI może potem przeredagować.
export function wypelnijPole(p, f, canva = {}, nabor, odpowiedzi = {}) {
  if (p.zrodlo) return wypelnijZFiszki(p.zrodlo, f, canva)
  const zdanie = (t) => (/[.!?]$/.test(t) ? t : t + '.')
  return [
    // krótkie dane (grupy, powiat, etap) z etykietą, dłuższe opisy fiszki – wprost
    ...(p.fiszka || []).filter((k) => DANE_FISZKI[k]?.z(f)).map((k) => zdanie(['problem', 'opis', 'istota', 'szuka'].includes(k)
      ? String(DANE_FISZKI[k].z(f)).trim() : `${DANE_FISZKI[k].nazwa}: ${DANE_FISZKI[k].z(f)}`)),
    ...(p.canva || []).map((id) => odpowiedzCanvy(id, canva) && `${pytanieCanvy(id).tytul}: ${odpowiedzCanvy(id, canva)}`).filter(Boolean).map(zdanie),
    ...(p.pytania || []).map((id) => (odpowiedzi[id] || '').trim()).filter(Boolean).map(zdanie),
  ].join(' ')
}

// Pytania naboru, na które autor jeszcze nie odpowiedział
export const bezOdpowiedzi = (nabor, odpowiedzi = {}) => (nabor?.pytania || []).filter((q) => !(odpowiedzi[q.id] || '').trim())

// Czy nabór jest teraz otwarty
export const naborOtwarty = (n) => n.status === 'otwarty' && new Date(n.termin) >= new Date(new Date().toDateString())

const NAZWY_WPLYWU = { maly: 'mały', mozliwy: 'możliwy', wyrazny: 'wyraźny', silny: 'silny' }

const zaDni = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

// Przykładowe nabory z prawdziwymi wzorami wniosków ROPS (Frontend/public/wzory, źródło: data/wnioski).
// Pola, pytania i układ stron odczytał asystent (POST /asystent/wzor) i sprawdził człowiek – tak jak robi to ROPS
// przy ogłaszaniu naboru. `wersja` – po zmianie przykładu zapisane w przeglądarce kopie się odświeżą.
export const naboryStartowe = [
  {
    id: 'n1',
    wersja: 3,
    nazwa: '[Przykład] Inkubator Włączenia Społecznego 2.0 – pomysły na innowacje społeczne',
    opis: 'Granty na przygotowanie i przetestowanie pomysłów przeciwdziałających wykluczeniu społecznemu (do 3 miesięcy przygotowania i 9 miesięcy testu).',
    kryteria: 'Innowacja odpowiada na problem wykluczenia społecznego; jest nowa (nie powiela istniejących rozwiązań); ma realny plan przygotowania i testu z kosztami.',
    obszary: ['seniorzy', 'psychika', 'niepelnosprawnosc', 'rodzina'],
    termin: zaDni(21),
    status: 'otwarty',
    wzor: { nazwa: 'Formularz aplikacyjny – Inkubator Włączenia Społecznego 2.0.pdf', url: '/wzory/inkubator-formularz-aplikacyjny.pdf' },
    ...wzorInkubator,
  },
  {
    id: 'n2',
    wersja: 2,
    nazwa: '[Przykład] Usługa Wrażliwa – pilotażowe wdrożenie usług społecznych',
    opis: 'Granty dla gmin i organizacji na wdrożenie w społeczności lokalnej usługi opartej na jednej z innowacji ROPS (do 18 miesięcy).',
    kryteria: 'Usługa wdraża wybraną innowację ROPS; jasna grupa docelowa i diagnoza; plan działań i kosztów; trwałość efektów; zgodność z zasadą deinstytucjonalizacji.',
    obszary: ['seniorzy', 'zdrowie', 'niepelnosprawnosc', 'rodzina'],
    termin: zaDni(35),
    status: 'otwarty',
    wzor: { nazwa: 'Wniosek o grant – Usługa Wrażliwa.pdf', url: '/wzory/usluga-wrazliwa-wniosek-o-grant.pdf' },
    ...wzorUsluga,
  },
]
