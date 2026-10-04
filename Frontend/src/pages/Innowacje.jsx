import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { liczbaPoparc } from '../data/watekFiszki.js'
import PasekEtapu from '../components/PasekEtapu.jsx'
import KartaInnowacji from '../components/KartaInnowacji.jsx'
import { useDane, opublikowane } from '../data/DaneContext.jsx'
import { ETAPY } from '../data/etapy.js'

// Pomysły mieszkańców (innowacje w toku) – tylko fiszki zatwierdzone przez ROPS.
// Filtr po powiecie pozwala np. urzędnikowi zobaczyć, czego potrzebują mieszkańcy jego terenu.
export default function Innowacje() {
  const [szukaj, setSzukaj] = useState('')
  const [params, setParams] = useSearchParams()
  const widok = params.get('widok') === 'etapy' ? 'etapy' : 'ranking'
  const fiszki = opublikowane(useDane().fiszki)

  // Filtrowanie to zwykły JS – przy każdej zmianie widok przelicza się sam
  const tekst = szukaj.toLowerCase()
  const widoczne = fiszki.filter((f) =>
    !tekst || (f.tytul + ' ' + (f.problem || '')).toLowerCase().includes(tekst),
  )

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-display font-extrabold text-5xl tracking-tight mb-2">Pomysły i potrzeby regionu</h1>
      <p className="text-lg text-muted mb-6 max-w-2xl">
        Innowacje w toku – problemy, które mieszkańcy Małopolski chcą rozwiązać, i ich pomysły. Każdy wpis sprawdził ROPS.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <label className="sr-only" htmlFor="szukaj">Szukaj</label>
        <input id="szukaj" type="search" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} placeholder="Szukaj w pomysłach i problemach…"
          className="flex-[999_1_280px] min-w-0 min-h-12 px-4 rounded-lg border border-line bg-white" />
      </div>

      <div role="tablist" aria-label="Widok" className="inline-flex gap-1 p-1 rounded-xl bg-[#E6EAF0] mb-6">
        {[['ranking', 'Ranking poparć'], ['etapy', 'Według etapów']].map(([id, nazwa]) => (
          <button key={id} role="tab" aria-selected={widok === id} onClick={() => setParams({ widok: id }, { replace: true })}
            className={'min-h-11 px-4 rounded-lg font-bold ' + (widok === id ? 'bg-white text-ink shadow-sm' : 'text-muted')}>{nazwa}</button>
        ))}
      </div>

      {widok === 'ranking' && <Ranking lista={widoczne} />}

      {/* Etapy jako poziome pasy: nagłówek etapu po lewej, karty pomysłów po prawej */}
      {widok === 'etapy' && <div className="flex flex-col gap-5">
        {ETAPY.map((etap) => <Etap key={etap.nr} etap={etap} lista={widoczne.filter((f) => f.etap === etap.nr)} />)}
      </div>}
    </main>
  )
}

// Ile kart pokazujemy w etapie, zanim pojawi się „Pokaż więcej”
const NA_START = 3

// Jeden etap: najpierw najbardziej popierane, reszta po kliknięciu „Pokaż więcej”
function Etap({ etap, lista }) {
  const [ile, setIle] = useState(NA_START)
  const posortowane = [...lista].sort((a, b) => liczbaPoparc(b) - liczbaPoparc(a))
  const reszta = posortowane.length - ile
  return (
    <section aria-labelledby={'etap-' + etap.nr} className="bg-[#EDF0F4] rounded-3xl p-4 sm:p-5 grid gap-4 lg:grid-cols-[230px_1fr] items-start">
      <div className="flex lg:flex-col gap-3 lg:gap-2 items-start">
        <span className="shrink-0 w-12 h-12 rounded-full bg-ink text-white font-display font-extrabold text-xl flex items-center justify-center">{etap.nr}</span>
        <div>
          <h2 id={'etap-' + etap.nr} className="font-display text-2xl font-bold">{etap.nazwa}</h2>
          {etap.opis && <p className="text-[15px] text-muted">{etap.opis}</p>}
          <p className="mt-1 text-sm font-bold">{lista.length} {lista.length === 1 ? 'pomysł' : lista.length > 1 && lista.length < 5 ? 'pomysły' : 'pomysłów'}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 min-w-0">
        {lista.length === 0 && <p className="rounded-2xl border-2 border-dashed border-[#C9D1DC] px-5 py-4 text-muted">Na tym etapie nie ma jeszcze pomysłów.</p>}
        {posortowane.slice(0, ile).map((f) => <KartaInnowacji key={f.id} innowacja={f} />)}
        {(reszta > 0 || ile > NA_START) && (
          <div className="flex flex-wrap gap-2">
            {reszta > 0 && (
              <button type="button" onClick={() => setIle(ile + 5)} className="min-h-11 px-5 rounded-xl border-2 border-ink bg-white font-bold">
                Pokaż więcej · jeszcze {reszta}
              </button>
            )}
            {ile > NA_START && (
              <button type="button" onClick={() => setIle(NA_START)} className="min-h-11 px-5 rounded-xl font-bold text-muted hover:text-ink">Zwiń</button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// Ranking najbardziej palących potrzeb – kolejność według poparć mieszkańców (weryfikacja społeczna)
function Ranking({ lista }) {
  const posortowane = [...lista].sort((a, b) => liczbaPoparc(b) - liczbaPoparc(a))
  const max = Math.max(1, ...posortowane.map(liczbaPoparc))
  return (
    <ol className="flex flex-col gap-3 max-w-4xl">
      {posortowane.map((f, i) => (
        <li key={f.id}>
          <Link to={'/pomysl/' + f.id} className="flex gap-4 items-center bg-white border border-line rounded-2xl p-4 no-underline text-ink hover:border-ink">
            <span className={'shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-display font-extrabold text-lg ' + (i < 3 ? 'bg-clay text-white' : 'bg-ground')}>{i + 1}</span>
            <span className="flex-1 min-w-0 flex flex-col gap-1.5">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="font-display text-xl">{f.tytul}</strong>
                {f.odJST && <span className="px-2 py-0.5 rounded bg-ink text-white text-xs font-bold">Pomysł gminy</span>}
              </span>
              <span className="text-[15px] text-muted line-clamp-1">{f.problem}</span>
              <span className="h-2 rounded-full bg-[#E6EAF0] overflow-hidden" aria-hidden="true"><span className="block h-2 bg-clay rounded-full" style={{ width: `${(liczbaPoparc(f) / max) * 100}%` }} /></span>
              <span className="max-w-xs"><PasekEtapu etap={f.etap} /></span>
            </span>
            <span className="shrink-0 text-right"><strong className="font-display text-2xl block">{liczbaPoparc(f)}</strong><span className="text-sm text-muted">poparć</span></span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
