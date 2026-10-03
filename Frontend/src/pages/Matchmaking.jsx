import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import { szukaj, NAZWA_PODOBIENSTWA } from '../data/api.js'
import PasekEtapu from '../components/PasekEtapu.jsx'
import KartaBiblioteki from '../components/KartaBiblioteki.jsx'

// Wyszukiwarka (matching): opis problemu → gotowe rozwiązania, podobne przypadki, wiedza o kwestii
export default function Matchmaking() {
  // Opis siedzi w adresie (?q=...), więc wyniki da się odświeżyć i udostępnić linkiem
  const [params, setParams] = useSearchParams()
  const zapytanie = params.get('q') || ''
  const [opis, setOpis] = useState(zapytanie)
  const dane = useDane()

  const wynik = zapytanie ? szukaj(zapytanie, dane) : null

  // Każde zapytanie zapisujemy jako sygnał potrzeby (backend zrobi to sam przy POST /api/search).
  // useRef pilnuje, żeby to samo zapytanie nie zapisało się dwa razy.
  const zapisane = useRef('')
  useEffect(() => {
    if (!wynik || zapisane.current === zapytanie) return
    zapisane.current = zapytanie
    dane.dodajZgloszenie({ tekst: zapytanie, obszary: wynik.rozpoznane.obszary.map((o) => o.id), powiat: null })
  }, [zapytanie]) // eslint-disable-line react-hooks/exhaustive-deps

  const nicNiePasuje = wynik && !wynik.rozwiazania.length && !wynik.przypadki.length

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
            placeholder="Np. Seniorzy z naszej wsi nie mają jak dojechać do przychodni…"
            className="flex-[999_1_480px] min-w-0 p-3.5 rounded-xl border border-[#B8C2D0] text-lg resize-y"
          />
          <button type="submit" disabled={!opis.trim()} className="flex-[1_1_180px] min-h-14 rounded-xl bg-teal text-white font-bold text-lg disabled:opacity-50">
            Szukaj
          </button>
        </form>

        {wynik && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="font-bold text-[15px]">Zrozumieliśmy:</span>
            {wynik.rozpoznane.obszary.map((o) => (
              <Link key={o.id} to={'/zasobnik/' + o.id} className="px-3 py-1 rounded-full bg-teal-light text-teal-dark font-bold text-[15px] no-underline">
                {o.nazwa}
              </Link>
            ))}
            {wynik.rozpoznane.grupy.map((g) => (
              <span key={g} className="px-3 py-1 rounded-full bg-[#E6EAF0] font-bold text-[15px]">{g}</span>
            ))}
            {!wynik.rozpoznane.obszary.length && <span className="text-muted text-[15px]">nie rozpoznaliśmy obszaru – spróbuj opisać więcej szczegółów</span>}
          </div>
        )}
        {wynik?.podobneZgloszenia > 1 && (
          <p className="mt-3 text-[15px] text-muted">
            Nie tylko Ty – w tych obszarach mieszkańcy zgłosili już <strong className="text-ink">{wynik.podobneZgloszenia}</strong> podobnych problemów. ROPS widzi te sygnały.
          </p>
        )}
      </section>

      {!wynik && <p className="text-lg text-muted">Wpisz opis problemu – pokażemy sprawdzone rozwiązania ROPS, podobne inicjatywy mieszkańców i wiedzę o temacie.</p>}

      {wynik && (
        <div className="flex flex-wrap gap-8 items-start">
          <div className="flex-[999_1_640px] min-w-0 flex flex-col gap-10">
            <section aria-labelledby="h-rozw">
              <h2 id="h-rozw" className="font-display font-extrabold text-2xl mb-1">Gotowe rozwiązania</h2>
              <p className="text-muted mb-4">Innowacje sprawdzone przez ROPS – z materiałami do wdrożenia.</p>
              {wynik.rozwiazania.length === 0 && <p className="text-muted">Brak sprawdzonych innowacji dla tego problemu.</p>}
              <div className="flex flex-col gap-4">
                {wynik.rozwiazania.map((r) => (
                  <KartaBiblioteki key={r.id} innowacja={r} podobienstwo={NAZWA_PODOBIENSTWA[r.podobienstwo]} powody={r.powody} />
                ))}
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
                      {f.szuka && <span className="px-2.5 py-0.5 rounded-full bg-clay-light text-clay-dark font-bold text-sm">Szuka: {f.szuka}</span>}
                    </div>
                    <h3 className="font-display text-xl font-bold">{f.tytul}</h3>
                    <p className="text-muted"><strong className="text-ink">Problem:</strong> {f.problem}</p>
                    <p className="text-sm text-muted">pow. {f.powiat} · {f.powody.join(' · ')}</p>
                    <PasekEtapu etap={f.etap} />
                    <Link to="/innowacje" className="font-bold min-h-11 inline-flex items-center">Zobacz i poprzyj →</Link>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside aria-labelledby="h-wiedza" className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
            <h2 id="h-wiedza" className="font-display font-extrabold text-2xl">Wiedza o tej kwestii</h2>
            {wynik.wiedza.length === 0 && <p className="text-muted">Przeglądaj obszary w <Link to="/zasobnik">Zasobniku wiedzy</Link>.</p>}
            {wynik.wiedza.map((w) => (
              <section key={w.obszar.id} className="bg-white border border-line rounded-2xl p-5">
                <p className="text-xs font-bold text-clay uppercase tracking-wider mb-1">Mapa Wyzwań Społecznych</p>
                <h3 className="font-display text-xl font-bold mb-1">{w.obszar.nazwa}</h3>
                <p className="text-muted text-[15px] mb-3">{w.obszar.krotko}</p>
                <p className="font-bold text-[15px] mb-1">Kluczowe wyzwania</p>
                <ul className="list-disc pl-5 text-[15px] flex flex-col gap-1 mb-3">
                  {w.wyzwania.map((x) => <li key={x}>{x}</li>)}
                </ul>
                {w.raporty.length > 0 && (
                  <>
                    <p className="font-bold text-[15px] mb-1">Raporty</p>
                    <ul className="text-[15px] text-muted flex flex-col gap-1 mb-3">
                      {w.raporty.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </>
                )}
                <Link to={'/zasobnik/' + w.obszar.id} className="font-bold min-h-11 inline-flex items-center">Cały obszar w Zasobniku →</Link>
              </section>
            ))}

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
