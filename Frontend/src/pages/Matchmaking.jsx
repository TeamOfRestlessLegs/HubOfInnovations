import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { innowacje } from '../data/innowacje.js'
import { ETAPY } from '../data/etapy.js'
import { dopasuj, stopienPodobienstwa, rozpoznaneTematy } from '../data/dopasuj.js'
import PasekEtapu from '../components/PasekEtapu.jsx'

export default function Matchmaking() {
  // Opis siedzi w adresie (?q=...), więc wyniki da się odświeżyć i udostępnić linkiem
  const [params, setParams] = useSearchParams()
  const zapytanie = params.get('q') || ''
  const [opis, setOpis] = useState(zapytanie)

  // Filtr etapów: lista numerów etapów, które pokazujemy
  const [etapy, setEtapy] = useState(ETAPY.map((e) => e.nr))
  const przelaczEtap = (nr) =>
    setEtapy(etapy.includes(nr) ? etapy.filter((x) => x !== nr) : [...etapy, nr])

  const wszystkieWyniki = zapytanie ? dopasuj(zapytanie, innowacje) : []
  const wyniki = wszystkieWyniki.filter((w) => etapy.includes(w.etap))
  const tematy = rozpoznaneTematy(wszystkieWyniki)

  return (
    <main className="max-w-7xl mx-auto px-6 py-9">
      <section className="bg-white border-2 border-ink rounded-2xl p-5 mb-5">
        <h1 className="font-display font-extrabold text-3xl mb-3">Opisz problem, znajdź rozwiązanie</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); setParams({ q: opis }) }}
          className="flex flex-wrap gap-3"
        >
          <label htmlFor="q" className="sr-only">Opis problemu</label>
          <textarea
            id="q"
            rows={2}
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            placeholder="Np. Seniorzy z naszej wsi nie mają jak dojechać do przychodni…"
            className="flex-[999_1_480px] min-w-0 p-3.5 rounded-xl border border-[#B8C2D0] text-lg resize-y"
          />
          <button type="submit" className="flex-[1_1_180px] min-h-14 rounded-xl bg-teal text-white font-bold text-lg">
            Szukaj
          </button>
        </form>

        {tematy.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            <span className="font-bold text-[15px]">Zrozumieliśmy:</span>
            {tematy.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full bg-teal-light text-teal-dark font-bold text-[15px]">{t}</span>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-7 items-start">
        <aside aria-label="Filtry" className="flex-[1_1_240px] min-w-0 bg-white border border-line rounded-2xl p-5">
          <fieldset>
            <legend className="font-bold mb-2">Etap gotowości</legend>
            {ETAPY.map((e) => (
              <label key={e.nr} className="flex items-center gap-2.5 min-h-10">
                <input
                  type="checkbox"
                  checked={etapy.includes(e.nr)}
                  onChange={() => przelaczEtap(e.nr)}
                  className="w-5 h-5 accent-teal"
                />
                {e.nazwa}
                <span className="ml-auto text-sm text-muted">
                  {wszystkieWyniki.filter((w) => w.etap === e.nr).length}
                </span>
              </label>
            ))}
          </fieldset>
        </aside>

        <div className="flex-[999_1_640px] min-w-0 flex flex-col gap-4">
          {!zapytanie && (
            <p className="text-lg text-muted">Wpisz opis problemu, a pokażemy podobne innowacje z Małopolski.</p>
          )}

          {zapytanie && (
            <h2 className="font-display font-extrabold text-2xl">
              {wyniki.length > 0 ? `${wyniki.length} dopasowań` : 'Nie znaleźliśmy podobnych innowacji'}
            </h2>
          )}

          {wyniki.map((w, i) => (
            <Wynik key={w.id} wynik={w} wyrozniony={i === 0} />
          ))}

          {zapytanie && (
            <section className="flex flex-wrap gap-4 items-center bg-clay-light rounded-2xl p-5">
              <div className="flex-[999_1_360px] min-w-0">
                <h2 className="font-display text-xl font-bold mb-1">Żadne nie pasuje? Masz własny pomysł?</h2>
                <p>Zgłoś go w Kreatorze — Twój opis trafi też do ROPS jako sygnał o potrzebie w regionie.</p>
              </div>
              <Link to="/kreator" className="min-h-12 px-5 inline-flex items-center rounded-xl bg-clay text-white font-bold no-underline">
                Zgłoś pomysł
              </Link>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function Wynik({ wynik, wyrozniony }) {
  const gotowe = wynik.etap >= 4

  // Pierwszy wynik pokazujemy większy i na ciemnym tle
  if (wyrozniony) {
    return (
      <article className="bg-ink text-white rounded-2xl p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-[#5CC8A8] text-[#0B2E26] font-bold text-sm">
            {stopienPodobienstwa(wynik.wspolne.length)}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#22345A] font-bold text-sm">
            {gotowe ? 'Sprawdzona innowacja' : 'Innowacja w toku'}
          </span>
        </div>
        <h3 className="font-display font-extrabold text-3xl mb-2">{wynik.tytul}</h3>
        <p className="text-white/85 text-lg mb-4 max-w-2xl">{wynik.opis}</p>
        <div className="mb-4"><PasekEtapu etap={wynik.etap} jasny /></div>
        <div className="bg-[#1C2E52] rounded-xl p-4 mb-5">
          <p className="font-bold mb-1">Dlaczego pasuje</p>
          <p className="text-white/85">Wspólne tematy: {wynik.wspolne.join(', ')} · pow. {wynik.powiat}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="min-h-12 px-5 rounded-xl bg-[#F29A5C] text-ink font-bold">
            {gotowe ? 'Wdróż u siebie' : 'Dołącz do projektu'}
          </button>
          <Link to="/innowacje" className="min-h-12 px-5 inline-flex items-center rounded-xl border-2 border-white text-white font-bold no-underline">
            Szczegóły
          </Link>
        </div>
      </article>
    )
  }

  return (
    <article className="bg-white border border-line rounded-2xl p-5 flex flex-wrap gap-4 items-center">
      <div className="flex-[999_1_380px] min-w-0">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal-dark font-bold text-sm">
            {stopienPodobienstwa(wynik.wspolne.length)}
          </span>
          {wynik.szuka && (
            <span className="px-2.5 py-0.5 rounded-full bg-clay-light text-clay-dark font-bold text-sm">
              Szuka: {wynik.szuka}
            </span>
          )}
        </div>
        <h3 className="font-display text-2xl font-bold mb-1">{wynik.tytul}</h3>
        <p className="text-muted mb-3">{wynik.opis}</p>
        <PasekEtapu etap={wynik.etap} />
      </div>
      <Link to="/innowacje" className="font-bold min-h-11 inline-flex items-center">Szczegóły →</Link>
    </article>
  )
}
