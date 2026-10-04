import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import { szukaj, NAZWA_PODOBIENSTWA } from '../data/api.js'
import { szukajRozwiazan } from '../data/wyszukiwarka.js'
import PasekEtapu from '../components/PasekEtapu.jsx'
import KartaRozwiazania from '../components/KartaRozwiazania.jsx'
import PrzyciskMowy from '../components/PrzyciskMowy.jsx'

// Wyszukiwarka: opis problemu → gotowe rozwiązania z Biblioteki ROPS (serwis wyszukiwania)
// + podobne pomysły mieszkańców (fiszki z naszej bazy)
export default function Matchmaking() {
  // Opis siedzi w adresie (?q=...), więc wyniki da się odświeżyć i udostępnić linkiem
  const [params, setParams] = useSearchParams()
  const zapytanie = params.get('q') || ''
  const [opis, setOpis] = useState(zapytanie)
  const dane = useDane()

  // Podobne pomysły mieszkańców i sygnały potrzeb – liczone z naszych danych
  const wynik = zapytanie ? szukaj(zapytanie, dane) : null

  // Gotowe rozwiązania – z serwisu wyszukiwania (asynchronicznie).
  // Odpowiedź pamiętamy razem z zapytaniem; stan „ładuje” wynika z tego, że odpowiedź jest do innego zapytania.
  const [odp, setOdp] = useState({ q: '', lista: [], blad: '' })
  useEffect(() => {
    if (!zapytanie) return
    const przerwij = new AbortController()
    szukajRozwiazan(zapytanie, { signal: przerwij.signal })
      .then((lista) => setOdp({ q: zapytanie, lista, blad: '' }))
      .catch((e) => { if (e.name !== 'AbortError') setOdp({ q: zapytanie, lista: [], blad: e.message }) })
    return () => przerwij.abort()
  }, [zapytanie])
  const rozw = !zapytanie ? { stan: 'puste', lista: [] }
    : odp.q !== zapytanie ? { stan: 'laduje', lista: [] }
    : odp.blad ? { stan: 'blad', lista: [], blad: odp.blad }
    : { stan: 'gotowe', lista: odp.lista }

  // Każde zapytanie zapisujemy jako sygnał potrzeby (backend zrobi to sam przy POST /api/search).
  // useRef pilnuje, żeby to samo zapytanie nie zapisało się dwa razy.
  const zapisane = useRef('')
  useEffect(() => {
    if (!wynik || zapisane.current === zapytanie) return
    zapisane.current = zapytanie
    dane.dodajZgloszenie({ tekst: zapytanie, powiat: null })
  }, [zapytanie]) // eslint-disable-line react-hooks/exhaustive-deps

  const nicNiePasuje = wynik && rozw.stan === 'gotowe' && !rozw.lista.length && !wynik.przypadki.length

  return (
    <main className="max-w-7xl mx-auto px-6 py-9">
      <section className="bg-white border-2 border-ink rounded-2xl p-5 mb-8">
        <h1 className="font-display font-extrabold text-3xl mb-3">Opisz problem, znajdź rozwiązanie</h1>
        <form onSubmit={(e) => { e.preventDefault(); setParams({ q: opis }) }} className="flex flex-wrap gap-3">
          <label htmlFor="q" className="sr-only">Opis problemu</label>
          <textarea
            id="q"
            rows={2}
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            placeholder="Np. Seniorzy z naszej wsi nie mają jak dojechać do przychodni… Możesz też kliknąć „Powiedz” i opisać problem głosem."
            className="flex-[999_1_480px] min-w-0 p-3.5 rounded-xl border border-[#B8C2D0] text-lg resize-y"
          />
          <div className="flex-[1_1_180px] flex flex-col gap-2">
            <button type="submit" disabled={!opis.trim()} className="min-h-14 rounded-xl bg-teal text-white font-bold text-lg disabled:opacity-50">
              Szukaj
            </button>
            {/* Dyktowanie: rozpoznany tekst dopisuje się do opisu */}
            <PrzyciskMowy onTekst={(t) => setOpis((o) => (o.trim() ? o.trimEnd() + ' ' : '') + t)} />
          </div>
        </form>

      </section>

      {!wynik && <p className="text-lg text-muted">Wpisz opis problemu – pokażemy sprawdzone rozwiązania z Biblioteki Innowacji Społecznych ROPS i podobne pomysły mieszkańców.</p>}

      {wynik && (
        <div className="flex flex-wrap gap-8 items-start">
          <div className="flex-[999_1_640px] min-w-0 flex flex-col gap-10">
            <section aria-labelledby="h-rozw" aria-busy={rozw.stan === 'laduje'}>
              <h2 id="h-rozw" className="font-display font-extrabold text-2xl mb-1">Gotowe rozwiązania</h2>
              
              {rozw.stan === 'laduje' && <p role="status" className="text-muted">Szukamy w Bibliotece ROPS…</p>}
              {rozw.stan === 'blad' && <p role="alert" className="rounded-xl bg-[#FDE2E1] text-[#9B1C1C] px-4 py-3 font-bold">Nie udało się pobrać rozwiązań. {rozw.blad}</p>}
              {rozw.stan === 'gotowe' && rozw.lista.length === 0 && <p className="text-muted">Brak sprawdzonych innowacji dla tego problemu.</p>}
              <div className="flex flex-col gap-4">
                {rozw.stan === 'gotowe' && rozw.lista.map((r) => <KartaRozwiazania key={r.id} r={r} />)}
              </div>
            </section>

            <section aria-labelledby="h-przyp">
              <h2 id="h-przyp" className="font-display font-extrabold text-2xl mb-1">Podobne przypadki</h2>
              <p className="text-muted mb-4">Mieszkańcy, którzy pracują nad podobnym problemem. Poprzyj albo dołącz, zamiast zaczynać od zera.</p>
              {wynik.przypadki.length === 0 && <p className="text-muted">Nikt jeszcze nie zgłosił podobnego pomysłu.</p>}
              <div className="flex flex-col gap-3">
                {wynik.przypadki.map((f) => (
                  <article key={f.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal-dark font-bold text-sm">{NAZWA_PODOBIENSTWA[f.podobienstwo]}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold">{f.tytul}</h3>
                    <p className="text-muted"><strong className="text-ink">Problem:</strong> {f.problem}</p>
                    <p className="text-sm text-muted">{f.powody.join(' · ')}</p>
                    <PasekEtapu etap={f.etap} />
                    <Link to={'/pomysl/' + f.id} className="font-bold min-h-11 inline-flex items-center">Otwórz wątek i poprzyj →</Link>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside aria-label="Zgłoś pomysł" className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
            <section className="bg-clay-light rounded-2xl p-5">
              <h3 className="font-display text-xl font-bold mb-1">{nicNiePasuje ? 'Nic nie pasuje?' : 'Masz własny pomysł?'}</h3>
              <p className="mb-4 text-[15px]">Zgłoś go w Kreatorze – Twój opis przeniesiemy, nie musisz pisać od nowa.</p>
              <Link to={'/kreator?problem=' + encodeURIComponent(zapytanie)} className="min-h-12 px-5 inline-flex items-center rounded-xl bg-clay text-white font-bold no-underline">
                Zgłoś pomysł
              </Link>
            </section>
          </aside>
        </div>
      )}
    </main>
  )
}
