import { useState } from 'react'
import { raport } from '../data/tester.js'
import { ListaSlupkow } from './Dane.jsx'

// Raport z opinii testerów – dla autora pomysłu i ROPS (docelowo GET /api/opinie/raport?zasob=…)
export function RaportOpinii({ opinie, tytul = 'Raport z testów' }) {
  const r = raport(opinie)
  if (!r) return <p className="text-muted text-[15px]">Brak opinii testerów.</p>
  return (
    <section className="rounded-xl bg-ground p-4 flex flex-col gap-4" aria-label={tytul}>
      <p className="font-bold">{tytul}</p>
      <div className="flex flex-wrap gap-8">
        <div>
          <p className="font-display font-extrabold text-4xl leading-none">{String(r.srednia).replace('.', ',')}<span className="text-xl text-muted">/5</span></p>
          <p className="text-[15px] text-muted mt-1">średnia z {r.liczba} {r.liczba === 1 ? 'opinii' : 'opinii'}</p>
          <p className="text-[15px] mt-1"><strong>{r.polecam}</strong> z {r.liczba} poleca</p>
        </div>
        <div className="flex-[1_1_220px] min-w-0"><ListaSlupkow tytul="Oceny" pozycje={r.rozklad} /></div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 text-[15px]">
        <Lista tytul="Co działa" pozycje={r.dziala} />
        <Lista tytul="Co poprawić" pozycje={r.poprawic} />
        <Lista tytul="Pomysły na usprawnienie" pozycje={r.pomysly} />
      </div>
    </section>
  )
}

function Lista({ tytul, pozycje }) {
  return (
    <div>
      <p className="font-bold mb-1">{tytul}</p>
      {pozycje.length ? <ul className="flex flex-col gap-1.5">{pozycje.map((p, i) => <li key={i} className="pl-3 border-l-4 border-teal">{p}</li>)}</ul> : <p className="text-muted">—</p>}
    </div>
  )
}

// Formularz opinii: ocena 1–5 + trzy krótkie pola. Działa dla testu i dla innowacji z Biblioteki.
export function FormularzOpinii({ onWyslij, onAnuluj }) {
  const [ocena, setOcena] = useState(0)
  const [dziala, setDziala] = useState('')
  const [poprawic, setPoprawic] = useState('')
  const [pomysl, setPomysl] = useState('')
  const [polecam, setPolecam] = useState(true)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onWyslij({ ocena, dziala: dziala.trim(), poprawic: poprawic.trim(), pomysl: pomysl.trim(), polecam }) }}
      className="flex flex-col gap-4 rounded-xl bg-ground p-4"
    >
      <fieldset>
        <legend className="font-bold mb-2">Jak oceniasz? (1 – słabo, 5 – świetnie)</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {[1, 2, 3, 4, 5].map((g) => (
            <button key={g} type="button" role="radio" aria-checked={ocena === g} aria-label={`${g} z 5`} onClick={() => setOcena(g)}
              className={'w-12 h-12 rounded-xl text-xl font-bold ' + (ocena >= g ? 'bg-clay text-white' : 'bg-white border-2 border-line text-muted')}>
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <Pole etykieta="Co działa dobrze?" wartosc={dziala} onZmiana={setDziala} />
      <Pole etykieta="Co było trudne albo trzeba poprawić?" wartosc={poprawic} onZmiana={setPoprawic} />
      <Pole etykieta="Masz pomysł na usprawnienie?" wartosc={pomysl} onZmiana={setPomysl} />
      <label className="flex items-center gap-3 font-bold min-h-11">
        <input type="checkbox" checked={polecam} onChange={(e) => setPolecam(e.target.checked)} className="w-5 h-5 accent-teal" />
        Poleciłbym to innym
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={!ocena || !(dziala.trim() || poprawic.trim())} className="min-h-12 px-6 rounded-xl bg-clay text-white font-bold disabled:opacity-50">Wyślij opinię</button>
        {onAnuluj && <button type="button" onClick={onAnuluj} className="min-h-12 px-5 rounded-xl border-2 border-line font-bold">Anuluj</button>}
      </div>
    </form>
  )
}

function Pole({ etykieta, wartosc, onZmiana }) {
  return (
    <label className="flex flex-col gap-1 font-bold">
      {etykieta}
      <textarea rows={2} value={wartosc} onChange={(e) => onZmiana(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0] font-normal bg-white resize-y" />
    </label>
  )
}
