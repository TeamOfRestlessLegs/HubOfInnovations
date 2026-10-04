import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import { OBSZARY, ZRODLO_MAPY } from '../data/obszary.js'
import { materialy } from '../data/zasobnik.js'
import KartaBiblioteki from '../components/KartaBiblioteki.jsx'
import { aiDostepne, BRAK_AI, zapytaj, zBibliotekiROPS } from '../data/ai.js'

const ZAKLADKI = [
  { id: 'wyzwania', nazwa: 'Wyzwania Małopolski' },
  { id: 'biblioteka', nazwa: 'Biblioteka Innowacji' },
  { id: 'materialy', nazwa: 'Materiały edukacyjne' },
]

// Zasobnik wiedzy: przeglądanie wiedzy ROPS po obszarach (bez wpisywania czegokolwiek).
// Różnica z wyszukiwarką: tu użytkownik PRZEGLĄDA katalog, tam OPISUJE problem i dostaje dopasowane wyniki.
export default function Zasobnik() {
  const [params] = useSearchParams()
  const [zakladka, setZakladka] = useState(ZAKLADKI.some((z) => z.id === params.get('dzial')) ? params.get('dzial') : 'wyzwania')

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display font-extrabold text-5xl tracking-tight mb-2">Zasobnik wiedzy</h1>
      <p className="text-lg text-muted mb-7 max-w-2xl">
        Najważniejsze wyzwania społeczne, sprawdzone innowacje i materiały ROPS Kraków – w jednym miejscu.
      </p>

      <div role="tablist" aria-label="Działy zasobnika" className="flex flex-wrap gap-2 border-b-2 border-line mb-8">
        {ZAKLADKI.map((z) => (
          <button
            key={z.id}
            role="tab"
            aria-selected={zakladka === z.id}
            onClick={() => setZakladka(z.id)}
            className={'min-h-13 px-5 -mb-0.5 font-bold text-lg border-b-4 ' + (zakladka === z.id ? 'border-teal text-ink' : 'border-transparent text-muted hover:text-ink')}
          >
            {z.nazwa}
          </button>
        ))}
      </div>

      {zakladka === 'wyzwania' && <Wyzwania />}
      {zakladka === 'biblioteka' && <BibliotekaROPS />}
      {zakladka === 'materialy' && <Materialy />}
    </main>
  )
}

function Wyzwania() {
  const { biblioteka } = useDane()

  return (
    <section>
      <p className="text-muted mb-6 max-w-3xl">
        Osiem obszarów z Mapy Wyzwań Społecznych. W każdym: czym jest problem, co mówią dane, kluczowe wyzwania,
        historia konkretnej osoby i innowacje, które już działają.
        <span className="block text-sm mt-1">Źródło: {ZRODLO_MAPY}.</span>
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {OBSZARY.map((o, i) => {
          const innowacji = biblioteka.filter((b) => (b.obszary || []).includes(o.id)).length
          return (
            <li key={o.id}>
              <Link to={'/zasobnik/' + o.id} className="h-full flex flex-col gap-2 p-5 rounded-2xl bg-white border border-line no-underline text-ink hover:border-ink">
                <span className="font-display font-extrabold text-3xl text-[#B8C2D0]">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display font-bold text-xl">{o.nazwa}</span>
                <span className="text-muted text-[15px]">{o.krotko}</span>
                {o.liczby?.[0] && (
                  <span className="mt-1 rounded-xl bg-ground px-3 py-2.5 flex flex-col">
                    <span className="font-display font-extrabold text-2xl leading-tight">{o.liczby[0].wartosc}</span>
                    <span className="text-sm text-muted leading-snug">{o.liczby[0].opis}</span>
                  </span>
                )}
                <span className="mt-auto pt-3 border-t border-[#E6EAF0] grid grid-cols-2 gap-2 text-center">
                  {[
                    [o.wyzwania.length, 'wyzwań'],
                    [innowacji, 'innowacji'],
                  ].map(([n, etykieta]) => (
                    <span key={etykieta} className="flex flex-col">
                      <strong className="text-lg leading-tight">{n}</strong>
                      <span className="text-xs text-muted">{etykieta}</span>
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const NA_STRONE = 24

// Biblioteka Innowacji ROPS z serwisu AI (GET /innovations): ~200 innowacji z opisami i materiałami.
// Bez serwisu – komunikat i przykładowe wpisy demonstracyjne.
function BibliotekaROPS() {
  const [kategorie, setKategorie] = useState([])
  const [kategoria, setKategoria] = useState('')
  const [szukaj, setSzukaj] = useState('')
  const [zapytanie, setZapytanie] = useState('')
  const [wynik, setWynik] = useState({ total: 0, results: [] })
  const [stan, setStan] = useState('laduje')   // laduje | gotowe | blad
  const [blad, setBlad] = useState('')

  useEffect(() => {
    if (aiDostepne) zapytaj('GET', '/innovations/categories').then(setKategorie, () => {})
  }, [])

  // Nowe wyszukiwanie / kategoria = lista od początku
  useEffect(() => {
    if (!aiDostepne) return
    const params = new URLSearchParams({ limit: NA_STRONE, offset: 0 })
    if (kategoria) params.set('category', kategoria)
    if (zapytanie.length >= 2) params.set('q', zapytanie)
    setStan('laduje')
    zapytaj('GET', '/innovations?' + params).then(
      (w) => { setWynik(w); setStan('gotowe') },
      (e) => { setBlad(e.message); setStan('blad') },
    )
  }, [kategoria, zapytanie])

  const wiecej = () => {
    const params = new URLSearchParams({ limit: NA_STRONE, offset: wynik.results.length })
    if (kategoria) params.set('category', kategoria)
    if (zapytanie.length >= 2) params.set('q', zapytanie)
    zapytaj('GET', '/innovations?' + params).then((w) => setWynik((s) => ({ ...w, results: [...s.results, ...w.results] })), (e) => setBlad(e.message))
  }

  if (!aiDostepne) {
    return (
      <>
        <p role="status" className="mb-6 px-4 py-3 rounded-xl bg-clay-light text-clay-dark font-bold max-w-3xl">
          Pełna Biblioteka Innowacji ROPS jest dostępna po podłączeniu serwisu AI. {BRAK_AI} Poniżej – przykładowe wpisy demonstracyjne.
        </p>
        <Biblioteka />
      </>
    )
  }

  return (
    <section>
      <form onSubmit={(e) => { e.preventDefault(); setZapytanie(szukaj.trim()) }} role="search" className="flex flex-wrap gap-2 mb-4 max-w-3xl">
        <label htmlFor="szukaj-bib" className="sr-only">Szukaj w Bibliotece</label>
        <input id="szukaj-bib" type="search" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} placeholder="Np. seniorzy, transport, opieka wytchnieniowa"
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
        {stan === 'laduje' && <p className="text-muted">Wczytywanie Biblioteki…</p>}
        {stan === 'blad' && <p role="alert" className="font-bold text-[#9B1C1C]">{blad}</p>}
        {stan === 'gotowe' && <p className="text-muted mb-4">{wynik.total ? `Innowacji: ${wynik.total}` : 'Nic nie znaleziono – spróbuj innych słów.'}</p>}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
        {wynik.results.map((i) => <KartaBiblioteki key={i.id} innowacja={zBibliotekiROPS(i)} />)}
      </div>
      {stan === 'gotowe' && wynik.results.length < wynik.total && (
        <button type="button" onClick={wiecej} className="mt-6 min-h-12 px-6 rounded-xl border-2 border-ink font-bold">
          Pokaż więcej ({wynik.total - wynik.results.length})
        </button>
      )}
    </section>
  )
}

function Biblioteka({ start = '' }) {
  const { biblioteka } = useDane()
  const [obszar, setObszar] = useState(start)
  const lista = obszar ? biblioteka.filter((b) => (b.obszary || []).includes(obszar)) : biblioteka

  return (
    <section>
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtruj po obszarze">
        <Filtr aktywny={!obszar} onClick={() => setObszar('')}>Wszystkie ({biblioteka.length})</Filtr>
        {OBSZARY.map((o) => (
          <Filtr key={o.id} aktywny={obszar === o.id} onClick={() => setObszar(o.id)}>{o.nazwa}</Filtr>
        ))}
      </div>
      {lista.length === 0 && <p className="text-muted">Brak innowacji w tym obszarze – ROPS może je dodać w panelu administratora.</p>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
        {lista.map((b) => <KartaBiblioteki key={b.id} innowacja={b} />)}
      </div>
    </section>
  )
}

function Filtr({ aktywny, onClick, children }) {
  return (
    <button
      aria-pressed={aktywny}
      onClick={onClick}
      className={'min-h-11 px-4 rounded-full font-bold text-[15px] border-2 ' + (aktywny ? 'bg-ink border-ink text-white' : 'bg-white border-line text-ink')}
    >
      {children}
    </button>
  )
}

function Materialy() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      {materialy.map((m) => (
        <li key={m.id} className="bg-white border border-line rounded-xl p-5 flex flex-col gap-2">
          <span className="self-start px-2.5 py-0.5 rounded-md bg-teal-light text-teal-dark text-sm font-bold">{m.typ}</span>
          <h3 className="font-display text-xl font-bold">{m.tytul}</h3>
          <p className="text-muted">{m.opis}</p>
          {m.wewnetrzny ? (
            <Link to={m.url} className="mt-auto font-bold min-h-11 inline-flex items-center">Otwórz →</Link>
          ) : (
            <a href={m.url} className="mt-auto font-bold min-h-11 inline-flex items-center">Otwórz →</a>
          )}
        </li>
      ))}
    </ul>
  )
}
