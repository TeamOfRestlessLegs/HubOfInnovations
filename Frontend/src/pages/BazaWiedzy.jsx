import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import { obszarPoId } from '../data/obszary.js'
import AkcjeWdrozenia from '../components/AkcjeWdrozenia.jsx'
import { aiDostepne, BRAK_AI, zapytaj } from '../data/ai.js'

const NA_STRONE = 24

// Baza wiedzy: wszystkie innowacje ROPS, każda jako osobna karta z własną stroną (/baza-wiedzy/…).
// Z serwisem AI – cała Biblioteka (GET /innovations); bez niego – przykładowe wpisy z Biblioteki demo.
export default function BazaWiedzy() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display font-extrabold text-5xl tracking-tight mb-2">Baza wiedzy</h1>
      <p className="text-lg text-muted mb-8 max-w-2xl">
        Wszystkie innowacje społeczne ROPS Kraków w jednym miejscu. Wybierz innowację, żeby zobaczyć jej pełny opis i materiały.
      </p>
      {aiDostepne ? <ZSerwisu /> : <Demo />}
    </main>
  )
}

function ZSerwisu() {
  const [kategorie, setKategorie] = useState([])
  const [kategoria, setKategoria] = useState('')
  const [szukaj, setSzukaj] = useState('')
  const [zapytanie, setZapytanie] = useState('')
  const [wynik, setWynik] = useState({ total: 0, results: [] })
  const [stan, setStan] = useState('laduje')   // laduje | gotowe | blad
  const [blad, setBlad] = useState('')

  const adres = (offset) => {
    const p = new URLSearchParams({ limit: NA_STRONE, offset })
    if (kategoria) p.set('category', kategoria)
    if (zapytanie.length >= 2) p.set('q', zapytanie)
    return '/innovations?' + p
  }

  useEffect(() => { zapytaj('GET', '/innovations/categories').then(setKategorie, () => {}) }, [])

  useEffect(() => {
    setStan('laduje')
    zapytaj('GET', adres(0)).then(
      (w) => { setWynik(w); setStan('gotowe') },
      (e) => { setBlad(e.message); setStan('blad') },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategoria, zapytanie])

  const wiecej = () => zapytaj('GET', adres(wynik.results.length)).then(
    (w) => setWynik((s) => ({ ...w, results: [...s.results, ...w.results] })),
    (e) => setBlad(e.message),
  )

  return (
    <section>
      <form onSubmit={(e) => { e.preventDefault(); setZapytanie(szukaj.trim()) }} role="search" className="flex flex-wrap gap-2 mb-4 max-w-3xl">
        <label htmlFor="szukaj-baza" className="sr-only">Szukaj w Bazie wiedzy</label>
        <input id="szukaj-baza" type="search" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} placeholder="Np. seniorzy, transport, opieka wytchnieniowa"
          className="flex-[1_1_280px] min-h-12 px-4 rounded-xl border-2 border-line bg-white" />
        <button type="submit" className="min-h-12 px-5 rounded-xl bg-ink text-white font-bold">Szukaj</button>
        {zapytanie && <button type="button" onClick={() => { setSzukaj(''); setZapytanie('') }} className="min-h-12 px-4 rounded-xl border-2 border-line font-bold">Wyczyść</button>}
      </form>

      {kategorie.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtruj po kategorii">
          <Filtr aktywny={!kategoria} onClick={() => setKategoria('')}>Wszystkie</Filtr>
          {kategorie.map((k) => (
            <Filtr key={k.slug} aktywny={kategoria === k.slug} onClick={() => setKategoria(k.slug)}>{k.name} ({k.count})</Filtr>
          ))}
        </div>
      )}

      <div aria-live="polite">
        {stan === 'laduje' && <p className="text-muted">Wczytywanie bazy wiedzy…</p>}
        {stan === 'blad' && <p role="alert" className="font-bold text-[#9B1C1C]">{blad}</p>}
        {stan === 'gotowe' && <p className="text-muted mb-4">{wynik.total ? `Innowacji: ${wynik.total}` : 'Nic nie znaleziono – spróbuj innych słów.'}</p>}
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
        {wynik.results.map((i) => (
          <li key={i.id}>
            <Karta id={i.id} link={'/baza-wiedzy/' + i.id} kategoria={i.category} tytul={i.title} opis={i.summary} />
          </li>
        ))}
      </ul>

      {stan === 'gotowe' && wynik.results.length < wynik.total && (
        <button type="button" onClick={wiecej} className="mt-6 min-h-12 px-6 rounded-xl border-2 border-ink font-bold">
          Pokaż więcej ({wynik.total - wynik.results.length})
        </button>
      )}
    </section>
  )
}

function Demo() {
  const { biblioteka } = useDane()
  const [szukaj, setSzukaj] = useState('')
  const tekst = szukaj.toLowerCase()
  const lista = biblioteka.filter((b) => !tekst || (b.tytul + ' ' + b.opis).toLowerCase().includes(tekst))
  return (
    <section>
      <p role="status" className="mb-6 px-4 py-3 rounded-xl bg-clay-light text-clay-dark font-bold max-w-3xl">
        Pełna baza wiedzy jest dostępna po podłączeniu serwisu AI. {BRAK_AI} Poniżej – przykładowe wpisy demonstracyjne.
      </p>
      <label htmlFor="szukaj-baza" className="sr-only">Szukaj w Bazie wiedzy</label>
      <input id="szukaj-baza" type="search" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} placeholder="Szukaj innowacji…"
        className="w-full max-w-3xl min-h-12 px-4 mb-6 rounded-xl border-2 border-line bg-white" />
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
        {lista.map((b) => (
          <li key={b.id}>
            <Karta id={b.id} link={'/baza-wiedzy/' + b.id} kategoria={(b.obszary || []).map((id) => obszarPoId(id)?.nazwa).filter(Boolean).join(' · ')} tytul={b.tytul} opis={b.opis} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Karta({ id, link, kategoria, tytul, opis }) {
  return (
    <article className="h-full bg-white border border-line rounded-2xl p-5 flex flex-col gap-2 hover:border-ink transition-colors">
      {kategoria && <p className="self-start px-2.5 py-0.5 rounded-full bg-teal-light text-teal-dark font-bold text-sm">{kategoria}</p>}
      <h2 className="font-display text-xl font-bold leading-snug">{tytul}</h2>
      <p className="text-[15px] text-muted line-clamp-4">{opis}</p>
      <Link to={link} className="mt-auto pt-2 min-h-11 inline-flex items-center font-bold">
        Zobacz innowację<span className="sr-only">: {tytul}</span> →
      </Link>
      {/* Tylko dla kont gminy (JST): zapis i Middleman */}
      <AkcjeWdrozenia zasob={{ typ: 'biblioteka', id, tytul }} kompaktowo />
    </article>
  )
}

function Filtr({ aktywny, onClick, children }) {
  return (
    <button aria-pressed={aktywny} onClick={onClick}
      className={'min-h-11 px-4 rounded-full font-bold text-[15px] border-2 ' + (aktywny ? 'bg-ink border-ink text-white' : 'bg-white border-line text-ink')}>
      {children}
    </button>
  )
}
