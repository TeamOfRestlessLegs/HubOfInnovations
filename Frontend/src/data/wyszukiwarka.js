// Wyszukiwarka rozwiązań – serwis wyszukiwania po Bibliotece Innowacji Społecznych ROPS.
//
//   POST {VITE_SEARCH_URL}   { query, limit }      (np. VITE_SEARCH_URL=http://localhost:8080/api/search)
//   → { results: [ {id, category_slug, slug, title, category, url, score,
//                   fragments: [{text, source: 'opis'|'pdf_materialy', file, page, score}],
//                   short_description, description_md,
//                   links: {source, video, materials, learn_more[]}, documents_count } ],
//       details_available }
//
// Bez VITE_SEARCH_URL (tryb demo) zwracamy przykładową odpowiedź serwisu (data/przykladWyszukiwania.json),
// żeby dało się klikać interfejs bez backendu.

import przyklad from './przykladWyszukiwania.json'

// Osobna zmienna niż VITE_API_URL (logowanie) – wyszukiwarkę podłączamy niezależnie
const SEARCH_URL = import.meta.env.VITE_SEARCH_URL
export const TRYB_DEMO = !SEARCH_URL

export async function szukajRozwiazan(zapytanie, { limit = 5, signal } = {}) {
  if (TRYB_DEMO) {
    await new Promise((r) => setTimeout(r, 400))
    return przyklad.results.map(zMapuj)
  }
  const odp = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: zapytanie, limit }),
    signal,
  })
  if (!odp.ok) throw new Error('Wyszukiwarka nie odpowiada (' + odp.status + ')')
  const json = await odp.json()
  return (json.results || []).map(zMapuj)
}

// Odpowiedź serwisu → kształt używany przez widok
function zMapuj(r) {
  return {
    id: r.id,
    tytul: r.title,
    kategoria: r.category,
    trafnosc: r.score ?? 0,
    krotko: r.short_description,
    opisMd: r.description_md,
    url: r.links?.source || r.url,
    wideo: r.links?.video || null,
    materialy: r.links?.materials || null,
    wiecej: r.links?.learn_more || [],
    dokumenty: r.documents_count || 0,
    fragmenty: (r.fragments || [])
      .map((f) => ({ tekst: oczyscFragment(f.text, [r.title, r.short_description]), zrodlo: f.source, plik: f.file, strona: f.page, trafnosc: f.score ?? 0 }))
      .filter((f) => f.tekst.length > 60)
      // przy podobnej trafności opis innowacji czyta się lepiej niż wycinek z PDF
      .sort((a, b) => b.trafnosc + (b.zrodlo === 'opis' ? 0.03 : 0) - (a.trafnosc + (a.zrodlo === 'opis' ? 0.03 : 0))),
  }
}

// Fragmenty to kawałki markdownu/PDF – usuwamy nagłówki, znaczniki i to, co już widać na karcie
// (tytuł, krótki opis). Fragment zaczynający się w pół zdania (zakładka między kawałkami) dostaje „…”.
function oczyscFragment(t = '', powtorzenia = []) {
  const znane = powtorzenia.filter(Boolean).map((x) => x.trim())
  let linie = t
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^#{1,6}\s/.test(l))
    .map((l) => l.replace(/^>\s?/, '').replace(/^[*-]\s+/, '• '))
    .filter((l) => !znane.includes(l))
  const wPolZdania = linie.length > 0 && /^[a-ząćęłńóśźż]/.test(linie[0])
  if (wPolZdania && linie.length > 1) linie = linie.slice(1)
  const tekst = linie.join('\n').trim()
  return wPolZdania && linie.length === 1 ? '…' + tekst : tekst
}

// Skąd pochodzi fragment
export const opisZrodla = (f) =>
  f.zrodlo === 'pdf_materialy'
    ? ['materiały do wdrożenia', f.plik, f.strona && `s. ${f.strona}`].filter(Boolean).join(', ')
    : 'opis innowacji'
