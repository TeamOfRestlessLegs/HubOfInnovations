import { useState } from 'react'
import { Link } from 'react-router-dom'
import { innowacje } from '../data/innowacje.js'
import { powiaty, materialy } from '../data/zasobnik.js'
import PasekEtapu from '../components/PasekEtapu.jsx'

const ZAKLADKI = [
  { id: 'biblioteka', nazwa: 'Biblioteka Innowacji' },
  { id: 'wyzwania', nazwa: 'Wyzwania Małopolski' },
  { id: 'materialy', nazwa: 'Materiały edukacyjne' },
]

// Kolory mapy wg liczby wyzwań (poziom 1–3)
const KOLOR_POZIOMU = { 1: 'bg-teal-light', 2: 'bg-[#B9DFD2]', 3: 'bg-[#5CC8A8]' }
// Tła kafli w bibliotece, żeby się różniły
const TLA = ['bg-[#1E3A5F]', 'bg-teal', 'bg-clay-dark', 'bg-[#3B4E6E]', 'bg-teal-dark', 'bg-clay']

export default function Zasobnik() {
  const [zakladka, setZakladka] = useState('biblioteka')

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display font-extrabold text-5xl tracking-tight mb-2">Zasobnik wiedzy</h1>
      <p className="text-lg text-muted mb-7 max-w-2xl">
        Wyzwania Małopolski, sprawdzone innowacje i materiały, które pomogą je wdrożyć.
      </p>

      <div role="tablist" aria-label="Działy zasobnika" className="flex flex-wrap gap-2 border-b-2 border-line mb-8">
        {ZAKLADKI.map((z) => (
          <button
            key={z.id}
            role="tab"
            aria-selected={zakladka === z.id}
            onClick={() => setZakladka(z.id)}
            className={
              'min-h-13 px-5 -mb-0.5 font-bold text-lg border-b-4 ' +
              (zakladka === z.id ? 'border-teal text-ink' : 'border-transparent text-muted hover:text-ink')
            }
          >
            {z.nazwa}
          </button>
        ))}
      </div>

      {zakladka === 'biblioteka' && <Biblioteka />}
      {zakladka === 'wyzwania' && <Wyzwania />}
      {zakladka === 'materialy' && <Materialy />}
    </main>
  )
}

function Biblioteka() {
  const [tylkoGotowe, setTylkoGotowe] = useState(false)
  const lista = tylkoGotowe ? innowacje.filter((i) => i.etap >= 4) : innowacje

  return (
    <>
      <label className="inline-flex items-center gap-2.5 mb-6 min-h-11 font-bold">
        <input type="checkbox" checked={tylkoGotowe} onChange={(e) => setTylkoGotowe(e.target.checked)} className="w-5 h-5 accent-teal" />
        Tylko gotowe do wdrożenia
      </label>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5">
        {lista.map((i, idx) => (
          <article key={i.id} className="bg-white border border-line rounded-xl overflow-hidden flex flex-col">
            <div className={'aspect-video relative flex items-center justify-center ' + TLA[idx % TLA.length]}>
              <span className="absolute left-3 top-3 px-2.5 py-1 rounded-md bg-white text-sm font-bold">Film · [mm:ss]</span>
              <button aria-label={'Odtwórz film: ' + i.tytul} className="w-15 h-15 rounded-full bg-white flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="#14213D" /></svg>
              </button>
            </div>
            <div className="p-4.5 flex flex-col gap-2 flex-1">
              <p className="text-sm font-bold text-teal">{i.tagi.join(' · ')}</p>
              <h3 className="font-display text-xl font-bold">{i.tytul}</h3>
              <p className="text-muted text-base">{i.opis}</p>
              <div className="mt-auto pt-3 border-t border-[#E6EAF0]"><PasekEtapu etap={i.etap} /></div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function Wyzwania() {
  const [wybrany, setWybrany] = useState('myślenicki')
  const powiat = powiaty.find((p) => p.nazwa === wybrany)

  return (
    <section className="flex flex-wrap gap-8">
      <div className="flex-[999_1_520px] min-w-0">
        <h2 className="font-display font-extrabold text-2xl mb-1">Mapa Wyzwań Społecznych</h2>
        <p className="text-muted mb-4">Wybierz powiat, żeby zobaczyć jego najważniejsze wyzwania.</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
          {powiaty.map((p) => (
            <button
              key={p.nazwa}
              aria-pressed={wybrany === p.nazwa}
              onClick={() => setWybrany(p.nazwa)}
              className={
                'min-h-18 rounded-xl text-sm font-bold ' +
                (wybrany === p.nazwa ? 'bg-teal text-white outline-3 outline-ink' : KOLOR_POZIOMU[p.poziom] + ' text-ink')
              }
            >
              {p.nazwa}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-muted">
          Mniej
          {[1, 2, 3].map((n) => <span key={n} className={'w-6 h-3.5 rounded ' + KOLOR_POZIOMU[n]} />)}
          więcej wyzwań
        </div>
      </div>

      <aside className="flex-[1_1_320px] min-w-0 bg-white border border-line rounded-2xl p-6 self-start">
        <p className="text-sm font-bold text-clay uppercase tracking-wider mb-1">Powiat</p>
        <h3 className="font-display font-extrabold text-3xl mb-4">{powiat.nazwa}</h3>
        <ul className="flex flex-col gap-2 mb-5">
          {powiat.wyzwania.map((w) => (
            <li key={w} className="px-3.5 py-2.5 rounded-lg bg-ground font-bold">{w}</li>
          ))}
        </ul>
        <Link to={'/szukaj?q=' + encodeURIComponent(powiat.wyzwania.join(' '))} className="font-bold">
          Znajdź innowacje na te wyzwania →
        </Link>
      </aside>
    </section>
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
          <a href="#" className="mt-auto font-bold min-h-11 inline-flex items-center">Otwórz →</a>
        </li>
      ))}
    </ul>
  )
}
