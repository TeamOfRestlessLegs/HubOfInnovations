// Asystent wniosku (Backend/ai-service, /asystent/*): propozycje treści pól wniosku i Canvy
// oraz odczyt wzoru wniosku naboru (PDF) – pola, ich powiązania z Canvą / fiszką i pytania do dopytania.
// Autor każdą propozycję wstawia albo odrzuca sam – nic nie zmienia się bez jego kliknięcia.

import { SEKCJE, odpowiedziano } from './canva.js'
import { ETAPY } from './etapy.js'
import { zapytaj } from './ai.js'

export const LIMIT_CANVY = 600

const PYTANIA_CANVY = SEKCJE.flatMap((s) => s.pytania.map((p) => ({ ...p, sekcja: s.nazwa })))
export const pytanieCanvy = (id) => PYTANIA_CANVY.find((p) => p.id === id)

// Odpowiedź na pytanie Canvy jako tekst ('' – brak odpowiedzi)
export function odpowiedzCanvy(id, canva) {
  const p = pytanieCanvy(id)
  const v = canva?.[id]
  if (!p || !odpowiedziano(p, v)) return ''
  if (p.typ === 'wybor') return p.opcje.find((o) => String(o.id) === String(v))?.nazwa || String(v)
  return p.typ === 'lista' ? v.join(', ') : v.trim()
}

// Canva jako czytelny tekst dla modelu: {"Problem – Intensywność": "Mocno przeszkadza", …}
export const canvaJakoTekst = (canva) =>
  Object.fromEntries(PYTANIA_CANVY.filter((p) => odpowiedzCanvy(p.id, canva)).map((p) => [`${p.sekcja} – ${p.tytul}`, odpowiedzCanvy(p.id, canva)]))

// Dane z fiszki, które wzór wniosku może wskazać jako źródło pola
export const DANE_FISZKI = {
  problem: { nazwa: 'Problem', z: (f) => f.problem },
  opis: { nazwa: 'Opis pomysłu', z: (f) => f.opis },
  istota: { nazwa: 'Co nowego', z: (f) => f.istota },
  grupy: { nazwa: 'Grupy odbiorców', z: (f) => [...(f.grupy || []), f.grupaInna].filter(Boolean).join(', ') },
  szuka: { nazwa: 'Czego szukamy', z: (f) => f.szuka },
  powiat: { nazwa: 'Powiat', z: (f) => f.powiat },
  etap: { nazwa: 'Etap', z: (f) => ETAPY.find((e) => e.nr === f.etap)?.nazwa },
}

// Odpowiedzi na pytania naboru po treści pytania: {"Ile pieniędzy potrzebujecie?": "12 000 zł", …}
const odpowiedziJakoTekst = (nabor, odpowiedzi) =>
  Object.fromEntries((nabor?.pytania || []).filter((q) => (odpowiedzi?.[q.id] || '').trim()).map((q) => [q.tresc, odpowiedzi[q.id].trim()]))

// Kontekst wspólny dla wszystkich zapytań: nabór, fiszka, Canva, odpowiedzi na pytania naboru
export function kontekstAI(fiszka, nabor, canva, odpowiedzi = {}) {
  return {
    call: { name: nabor?.nazwa || '', criteria: nabor?.kryteria || '' },
    idea: {
      title: fiszka.tytul,
      problem: fiszka.problem || '',
      description: fiszka.opis || '',
      novelty: fiszka.istota || '',
      groups: [...(fiszka.grupy || []), fiszka.grupaInna].filter(Boolean),
      needs: fiszka.szuka || '',
      county: fiszka.powiat || '',
      stage: DANE_FISZKI.etap.z(fiszka) || '',
    },
    canvas: canvaJakoTekst(canva),
    answers: odpowiedziJakoTekst(nabor, odpowiedzi),
  }
}

// Na czym opiera się pole wniosku – do pokazania autorowi i podpowiedzi dla modelu
export function zrodlaPola(p, nabor) {
  return [
    ...(p.fiszka || []).map((k) => DANE_FISZKI[k]?.nazwa && `Fiszka: ${DANE_FISZKI[k].nazwa}`),
    ...(p.canva || []).map((id) => pytanieCanvy(id) && `Canva: ${pytanieCanvy(id).tytul}`),
    ...(p.pytania || []).map((id) => nabor?.pytania?.find((q) => q.id === id)?.tresc),
  ].filter(Boolean)
}

export const poleWniosku = (p, tekst, nabor) => ({
  id: p.id, label: p.etykieta, limit: p.limit, current: tekst || '',
  hint: [p.opis, zrodlaPola(p, nabor).length && 'Oprzyj się zwłaszcza na: ' + zrodlaPola(p, nabor).join('; ')].filter(Boolean).join(' ').slice(0, 1500),
})
export const poleCanvy = (p, tekst) => ({ id: p.id, label: p.tytul, hint: p.opis || '', limit: LIMIT_CANVY, current: tekst || '' })

// Propozycje dla wszystkich pól wniosku → { suggestions, tips, checks }
export const propozycjeWniosku = (kontekst, pola) => zapytaj('POST', '/asystent/wniosek', { context: kontekst, fields: pola })

// Jedno pole; z `previous` + `instruction` – poprawka na prośbę autora („krócej”)
export const propozycjaPola = (kontekst, pole, { rodzaj = 'wniosek', poprzednia, polecenie } = {}) =>
  zapytaj('POST', '/asystent/pole', {
    context: kontekst, field: pole, kind: rodzaj,
    ...(poprzednia ? { previous: poprzednia } : {}),
    ...(polecenie ? { instruction: polecenie } : {}),
  })

// PDF jako data URL (wzór wgrany przez ROPS już nim jest; przykładowy leży pod adresem /wzory/…)
async function jakoDataUrl(url) {
  if (url.startsWith('data:')) return url
  const blob = await (await fetch(url)).blob()
  return new Promise((ok, blad) => {
    const r = new FileReader()
    r.onload = () => ok(r.result)
    r.onerror = () => blad(new Error('Nie udało się wczytać wzoru wniosku.'))
    r.readAsDataURL(blob)
  })
}

// Wzór wniosku (PDF z naboru) → { pola, pytania, uklad, uwagi } w kształcie naboru:
//   pola:    [{ id, etykieta, opis, limit, canva: [id pytania Canvy], fiszka: [klucz DANE_FISZKI], pytania: [id],
//               kotwica, po – nagłówek i koniec instrukcji ze wzoru (z nich backend liczy `miejsce`),
//               miejsce: { page, y, y_end, x0, x1, box } | null – gdzie w oryginalnym PDF wpisać odpowiedź }]
//   pytania: [{ id, tresc, podpowiedz }] – o co trzeba dopytać, bo Canva i fiszka tego nie mówią
//   uklad:   [{ szer, wys, gora, dol, ostatni, ciecia }] – strony wzoru (data/wypelnijWzor.js)
export async function odczytajWzor(wzor, nabor) {
  const a = await zapytaj('POST', '/asystent/wzor', {
    pdf: await jakoDataUrl(wzor.url),
    call: { name: nabor.nazwa || '', criteria: nabor.kryteria || '' },
    canvas_questions: PYTANIA_CANVY.map((p) => ({ id: p.id, title: p.tytul, section: p.sekcja })),
  })
  return {
    pola: a.fields.map((f) => ({ id: f.id, etykieta: f.label, opis: f.instruction, limit: f.limit, canva: f.canvas, fiszka: f.idea, pytania: f.questions, kotwica: f.anchor, po: f.after, miejsce: f.slot })),
    pytania: a.questions.map((q) => ({ id: q.id, tresc: q.text, podpowiedz: q.hint })),
    uklad: a.layout.map((p) => ({ szer: p.width, wys: p.height, gora: p.top, dol: p.bottom, ostatni: p.last, ciecia: p.cuts })),
    uwagi: a.checks,
  }
}
