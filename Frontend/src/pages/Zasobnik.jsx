import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDane, opublikowane } from '../data/DaneContext.jsx'
import { OBSZARY, ZRODLO_MAPY } from '../data/obszary.js'
import { materialy } from '../data/zasobnik.js'
import KartaBiblioteki from '../components/KartaBiblioteki.jsx'

const ZAKLADKI = [
  { id: 'wyzwania', nazwa: 'Wyzwania Małopolski' },
  { id: 'biblioteka', nazwa: 'Biblioteka Innowacji' },
  { id: 'materialy', nazwa: 'Materiały edukacyjne' },
]

// Zasobnik wiedzy: przeglądanie wiedzy ROPS po obszarach (bez wpisywania czegokolwiek).
// Różnica z wyszukiwarką: tu użytkownik PRZEGLĄDA katalog, tam OPISUJE problem i dostaje dopasowane wyniki.
export default function Zasobnik() {
  const [zakladka, setZakladka] = useState('wyzwania')

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
      {zakladka === 'biblioteka' && <Biblioteka />}
      {zakladka === 'materialy' && <Materialy />}
    </main>
  )
}

function Wyzwania() {
  const { biblioteka, fiszki } = useDane()
  const pub = opublikowane(fiszki)

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
          const pomyslow = pub.filter((f) => f.obszar === o.id).length
          return (
            <li key={o.id}>
              <Link to={'/zasobnik/' + o.id} className="h-full flex flex-col gap-2 p-5 rounded-2xl bg-white border border-line no-underline text-ink hover:border-ink">
                <span className="font-display font-extrabold text-3xl text-[#B8C2D0]">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display font-bold text-xl">{o.nazwa}</span>
                <span className="text-muted text-[15px]">{o.krotko}</span>
                <span className="mt-auto pt-3 border-t border-[#E6EAF0] text-sm text-muted">
                  {o.wyzwania.length} kluczowych wyzwań · {innowacji} innowacji · {pomyslow} pomysłów mieszkańców
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Biblioteka() {
  const { biblioteka } = useDane()
  const [obszar, setObszar] = useState('')
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
