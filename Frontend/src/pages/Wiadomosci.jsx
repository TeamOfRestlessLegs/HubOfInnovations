import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth, ROLE } from '../auth/AuthContext.jsx'
import { useDane, mojeWatki, nieprzeczytany } from '../data/DaneContext.jsx'
import { kiedy } from '../data/czas.js'

const TYP_WATKU = {
  fiszka: { nazwa: 'Pomysł', klasa: 'bg-teal-light text-teal-dark' },
  pytanie: { nazwa: 'Pytanie', klasa: 'bg-[#E6EAF0] text-ink' },
  wdrozenie: { nazwa: 'Wdrożenie', klasa: 'bg-clay-light text-clay-dark' },
  test: { nazwa: 'Test', klasa: 'bg-[#EDE7FB] text-[#4B2A9B]' },
}

const ADRESACI = [
  { id: 'rops', nazwa: 'ROPS Kraków', opis: 'Pytania o nabory, procedury, zgłoszone pomysły', uczestnicy: ['rola:rops_admin'] },
  { id: 'ekspert', nazwa: 'Ekspert / mentor', opis: 'Merytoryczna pomoc przy pomyśle – ROPS też widzi rozmowę', uczestnicy: ['rola:rops_admin', 'rola:ekspert'] },
]

// Platforma komunikacji: rozmowy z ROPS i ekspertami. Każda rozmowa ma uczestników (osoby albo całe role).
export default function Wiadomosci() {
  const { uzytkownik: ja } = useAuth()
  const { watki } = useDane()
  const [params, setParams] = useSearchParams()
  const lista = mojeWatki(watki, ja).sort((a, b) => b.zmieniono.localeCompare(a.zmieniono))
  const wybrany = params.get('w')
  const nowy = params.has('nowy')
  const watek = lista.find((w) => w.id === wybrany)

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1">Wiadomości</h1>
          <p className="text-muted text-lg">Rozmowy z ROPS i ekspertami. Odpowiedź dostaniesz tu i w powiadomieniach.</p>
        </div>
        {ja.rola !== 'rops_admin' && ja.rola !== 'ekspert' && (
          <button type="button" onClick={() => setParams({ nowy: '' })} className="min-h-12 px-5 rounded-xl bg-clay text-white font-bold">
            + Zadaj pytanie
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <nav aria-label="Rozmowy" className={'flex-[1_1_300px] min-w-0 max-w-md bg-white border border-line rounded-2xl overflow-hidden ' + (wybrany || nowy ? 'hidden md:block' : '')}>
          {lista.length === 0 && <p className="p-5 text-muted">Nie masz jeszcze żadnych rozmów.</p>}
          <ul>
            {lista.map((w) => {
              const nowa = nieprzeczytany(w, ja)
              const ost = w.wiadomosci.at(-1)
              return (
                <li key={w.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => setParams({ w: w.id })}
                    aria-current={w.id === wybrany ? 'true' : undefined}
                    className={'w-full text-left px-4 py-3.5 flex flex-col gap-1 ' + (w.id === wybrany ? 'bg-ground' : 'hover:bg-ground')}
                  >
                    <span className="flex items-center gap-2">
                      <span className={'px-2 py-0.5 rounded-full text-xs font-bold ' + (TYP_WATKU[w.typ] || TYP_WATKU.pytanie).klasa}>{(TYP_WATKU[w.typ] || TYP_WATKU.pytanie).nazwa}</span>
                      {nowa && <span className="text-xs font-bold text-clay-dark">● nowa</span>}
                      <span className="ml-auto text-xs text-muted">{kiedy(w.zmieniono)}</span>
                    </span>
                    <span className={'leading-snug ' + (nowa ? 'font-bold' : 'font-semibold')}>{w.temat}</span>
                    <span className="text-sm text-muted line-clamp-1">{ost.autor}: {ost.tresc}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <section className="flex-[999_1_480px] min-w-0">
          {nowy ? (
            <NowePytanie onWyslano={(id) => setParams({ w: id })} />
          ) : watek ? (
            <Rozmowa key={watek.id} watek={watek} />
          ) : (
            <div className="bg-white border border-line rounded-2xl p-8 text-muted">Wybierz rozmowę z listy{ja.rola === 'resident' || ja.rola === 'jst' ? ' albo zadaj nowe pytanie' : ''}.</div>
          )}
        </section>
      </div>
    </main>
  )
}

// Jedna rozmowa: wiadomości + odpowiedź
export function Rozmowa({ watek }) {
  const { uzytkownik: ja } = useAuth()
  const { wyslijWiadomosc, oznaczWatek } = useDane()
  const [tresc, setTresc] = useState('')
  const nowa = nieprzeczytany(watek, ja)

  useEffect(() => {
    if (nowa) oznaczWatek(watek.id)
  }, [nowa, watek.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const wyslij = (e) => {
    e.preventDefault()
    if (!tresc.trim()) return
    wyslijWiadomosc({ watekId: watek.id, tresc: tresc.trim() })
    setTresc('')
  }

  const kto = watek.uczestnicy.map((a) => (a === 'rola:rops_admin' ? 'ROPS' : a === 'rola:ekspert' ? 'eksperci' : null)).filter(Boolean)

  return (
    <div className="bg-white border border-line rounded-2xl flex flex-col">
      <header className="px-5 py-4 border-b border-line">
        <h2 className="font-display font-bold text-2xl">{watek.temat}</h2>
        <p className="text-sm text-muted">W rozmowie: autor{kto.length ? ', ' + kto.join(', ') : ''}</p>
        {watek.link && <Link to={watek.link} className="text-sm font-bold">Przejdź do sprawy →</Link>}
      </header>

      <ol className="flex flex-col gap-4 p-5" aria-label="Wiadomości w rozmowie">
        {watek.wiadomosci.map((m) => {
          const moja = m.autorId === ja.id
          return (
            <li key={m.id} className={'max-w-[85%] flex flex-col gap-1 ' + (moja ? 'self-end items-end' : 'self-start')}>
              <p className="text-xs text-muted">
                <strong className="text-ink">{moja ? 'Ty' : m.autor}</strong>
                {!moja && m.rola !== 'resident' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-ink text-white font-bold">{ROLE[m.rola]?.replace(' (administrator)', '')}</span>}
                {' · '}{kiedy(m.data)}
              </p>
              <p className={'px-4 py-3 rounded-2xl whitespace-pre-line ' + (moja ? 'bg-teal text-white rounded-br-sm' : 'bg-ground rounded-bl-sm')}>{m.tresc}</p>
            </li>
          )
        })}
      </ol>

      <form onSubmit={wyslij} className="border-t border-line p-4 flex flex-col gap-2">
        <label htmlFor="odpowiedz" className="font-bold">Twoja odpowiedź</label>
        <textarea id="odpowiedz" rows={3} value={tresc} onChange={(e) => setTresc(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0] resize-y" />
        <button type="submit" disabled={!tresc.trim()} className="self-end min-h-11 px-5 rounded-xl bg-ink text-white font-bold disabled:opacity-50">Wyślij</button>
      </form>
    </div>
  )
}

// Nowe pytanie do ROPS albo eksperta
function NowePytanie({ onWyslano }) {
  const { wyslijWiadomosc } = useDane()
  const [adresat, setAdresat] = useState('rops')
  const [temat, setTemat] = useState('')
  const [tresc, setTresc] = useState('')

  const wyslij = (e) => {
    e.preventDefault()
    const id = 'pytanie-' + Date.now()
    wyslijWiadomosc({ watekId: id, typ: 'pytanie', temat: temat.trim(), uczestnicy: ADRESACI.find((a) => a.id === adresat).uczestnicy, tresc: tresc.trim() })
    onWyslano(id)
  }

  return (
    <form onSubmit={wyslij} className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="font-display font-bold text-2xl">Nowe pytanie</h2>
      <fieldset>
        <legend className="font-bold mb-2">Do kogo?</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
          {ADRESACI.map((a) => (
            <label key={a.id} className={'p-3.5 rounded-xl cursor-pointer ' + (adresat === a.id ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line')}>
              <input type="radio" name="adresat" value={a.id} checked={adresat === a.id} onChange={() => setAdresat(a.id)} className="sr-only" />
              <strong className="block">{a.nazwa}</strong>
              <span className="text-[15px] text-muted">{a.opis}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 font-bold">
        Temat
        <input value={temat} onChange={(e) => setTemat(e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal" />
      </label>
      <label className="flex flex-col gap-1 font-bold">
        Twoje pytanie
        <textarea rows={5} value={tresc} onChange={(e) => setTresc(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0] font-normal resize-y" />
      </label>
      <button type="submit" disabled={!temat.trim() || !tresc.trim()} className="self-start min-h-12 px-6 rounded-xl bg-clay text-white font-bold disabled:opacity-50">Wyślij pytanie</button>
    </form>
  )
}
