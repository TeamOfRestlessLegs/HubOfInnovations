import { Fragment } from 'react'

// Prosty, bezpieczny renderer Markdown dla opisów innowacji z Biblioteki ROPS (bez dangerouslySetInnerHTML).
// Obsługuje: nagłówki, listy (punktowane i numerowane), cytaty, **pogrubienie**, *kursywę* i [linki](https://…).
// Nagłówek 1. poziomu (powtórzony tytuł) i cytat powtarzający pierwszy akapit są pomijane.

const norm = (t) => t.replace(/[*_`>#]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

function Inline({ tekst }) {
  // linki | **pogrubienie** | *kursywa*
  const czesci = tekst.split(/(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
  return czesci.map((c, i) => {
    let m
    if ((m = c.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/))) {
      return /^https?:\/\//.test(m[2])
        ? <a key={i} href={m[2]} target="_blank" rel="noreferrer">{m[1]}<span className="sr-only"> (nowa karta)</span></a>
        : <Fragment key={i}>{m[1]}</Fragment>
    }
    if ((m = c.match(/^\*\*([^*]+)\*\*$/))) return <strong key={i}>{m[1]}</strong>
    if ((m = c.match(/^\*([^*]+)\*$/))) return <em key={i}>{m[1]}</em>
    return <Fragment key={i}>{c}</Fragment>
  })
}

function bloki(tekst) {
  const wynik = []
  let akapit = []
  let lista = null
  const zamknij = () => {
    if (akapit.length) wynik.push({ typ: 'p', tekst: akapit.join(' ') })
    if (lista) wynik.push(lista)
    akapit = []; lista = null
  }
  for (const surowa of tekst.split('\n')) {
    const linia = surowa.trim()
    let m
    if (!linia) { zamknij(); continue }
    if ((m = linia.match(/^(#{1,6})\s+(.*)$/))) { zamknij(); wynik.push({ typ: 'h', poziom: m[1].length, tekst: m[2] }); continue }
    if ((m = linia.match(/^>\s?(.*)$/))) { zamknij(); if (m[1]) wynik.push({ typ: 'q', tekst: m[1] }); continue }
    if ((m = linia.match(/^([-*+]|\d+[.)])\s+(.*)$/))) {
      const numerowana = /\d/.test(m[1])
      if (!lista || lista.numerowana !== numerowana) { zamknij(); lista = { typ: 'l', numerowana, pozycje: [] } }
      lista.pozycje.push(m[2]); continue
    }
    if (lista) zamknij()
    akapit.push(linia)
  }
  zamknij()
  const pierwszy = wynik.find((b) => b.typ === 'p')
  return wynik.filter((b) => !(b.typ === 'h' && b.poziom === 1) && !(b.typ === 'q' && pierwszy && norm(b.tekst) === norm(pierwszy.tekst)))
}

// duzy = pełna strona innowacji (większy tekst, nagłówki h2/h3); domyślnie zwarty podgląd w karcie (np. KartaRozwiazania).
export default function Markdown({ tekst, duzy = false }) {
  return (
    <div className={'flex flex-col leading-relaxed ' + (duzy ? 'gap-3 text-lg' : 'gap-2 text-[15px]')}>
      {bloki(tekst || '').map((b, i) => {
        if (b.typ === 'h') {
          if (!duzy) return <h4 key={i} className="font-display font-bold text-lg mt-2"><Inline tekst={b.tekst.replace(/^\d+\.\s*/, '')} /></h4>
          return b.poziom === 2
            ? <h2 key={i} className="font-display font-bold text-2xl mt-3"><Inline tekst={b.tekst} /></h2>
            : <h3 key={i} className="font-display font-bold text-xl mt-2"><Inline tekst={b.tekst} /></h3>
        }
        if (b.typ === 'q') return <blockquote key={i} className="border-l-4 border-teal pl-4 text-muted"><Inline tekst={b.tekst} /></blockquote>
        if (b.typ === 'l') {
          const Tag = b.numerowana ? 'ol' : 'ul'
          return <Tag key={i} className={(b.numerowana ? 'list-decimal' : 'list-disc') + ' pl-6 flex flex-col gap-1'}>{b.pozycje.map((p, j) => <li key={j}><Inline tekst={p} /></li>)}</Tag>
        }
        return <p key={i}><Inline tekst={b.tekst} /></p>
      })}
    </div>
  )
}

// Skrót jako zwykły tekst (do podglądów): pierwsze zdania opisu bez znaczników
export function skrot(tekst, ile = 280) {
  const b = bloki(tekst || '').find((x) => x.typ === 'p')
  const t = (b ? b.tekst : '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '')
  return t.length > ile ? t.slice(0, ile).trimEnd() + '…' : t
}
