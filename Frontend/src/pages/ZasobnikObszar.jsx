import { Link, useParams } from 'react-router-dom'
import { obszarPoId, ZRODLO_MAPY } from '../data/obszary.js'
import { useDane, opublikowane } from '../data/DaneContext.jsx'
import KartaBiblioteki from '../components/KartaBiblioteki.jsx'
import PasekEtapu from '../components/PasekEtapu.jsx'

// Strona jednego obszaru z Mapy Wyzwań: wszystko o danej kwestii na jednym ekranie
export default function ZasobnikObszar() {
  const { id } = useParams()
  const o = obszarPoId(id)
  const { biblioteka, fiszki } = useDane()

  if (!o) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-extrabold text-3xl mb-3">Nie ma takiego obszaru</h1>
        <Link to="/zasobnik">← Wróć do Zasobnika</Link>
      </main>
    )
  }

  const innowacje = biblioteka.filter((b) => (b.obszary || []).includes(o.id))
  const pomysly = opublikowane(fiszki).filter((f) => f.obszar === o.id)

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <nav aria-label="Ścieżka" className="text-[15px] mb-4">
        <Link to="/zasobnik">Zasobnik wiedzy</Link> <span className="text-muted">› Wyzwania Małopolski › {o.nazwa}</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <h1 className="font-display font-extrabold text-5xl tracking-tight mb-3">{o.nazwa}</h1>
        <p className="text-xl leading-relaxed">{o.definicja}</p>
        <p className="text-sm text-muted mt-3">Źródło: {ZRODLO_MAPY}.</p>
      </header>

      <div className="flex flex-wrap gap-6 items-start mb-12">
        {o.dane.length > 0 && (
          <section aria-labelledby="h-dane" className="flex-[1_1_420px] min-w-0 bg-white border border-line rounded-2xl p-6">
            <h2 id="h-dane" className="font-display font-bold text-2xl mb-4">Co mówią dane</h2>
            <ul className="flex flex-col gap-3">
              {o.dane.map((d) => (
                <li key={d} className="pl-4 border-l-4 border-teal">{d}</li>
              ))}
            </ul>
            {o.zrodla.length > 0 && (
              <p className="text-sm text-muted mt-5"><strong>Źródła:</strong> {o.zrodla.join('; ')}.</p>
            )}
          </section>
        )}
        <section aria-labelledby="h-wyz" className="flex-[1_1_420px] min-w-0 bg-ink text-white rounded-2xl p-6">
          <h2 id="h-wyz" className="font-display font-bold text-2xl mb-4">Kluczowe wyzwania</h2>
          <ol className="flex flex-col gap-3">
            {o.wyzwania.map((w, i) => (
              <li key={w} className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-[#5CC8A8] text-[#0B2E26] font-bold text-sm flex items-center justify-center">{i + 1}</span>
                <span>{w}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Persona persona={o.persona} />

      <section aria-labelledby="h-inn" className="mb-12">
        <h2 id="h-inn" className="font-display font-extrabold text-3xl mb-1">Innowacje, które już działają</h2>
        <p className="text-muted mb-5">Sprawdzone przez ROPS – z materiałami, które pomogą wdrożyć je u siebie.</p>
        {innowacje.length === 0 && <p className="text-muted">W tym obszarze nie ma jeszcze innowacji w Bibliotece.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
          {innowacje.map((b) => <KartaBiblioteki key={b.id} innowacja={b} />)}
        </div>
      </section>

      <section aria-labelledby="h-pom" className="mb-12">
        <h2 id="h-pom" className="font-display font-extrabold text-3xl mb-1">Pomysły mieszkańców</h2>
        <p className="text-muted mb-5">Inicjatywy w toku, zatwierdzone przez ROPS.</p>
        {pomysly.length === 0 && <p className="text-muted">Nikt jeszcze nie zgłosił pomysłu w tym obszarze. Możesz być pierwszy.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {pomysly.map((f) => (
            <article key={f.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-2">
              <h3 className="font-display text-xl font-bold">{f.tytul}</h3>
              <p className="text-muted text-[15px]">{f.problem}</p>
              <p className="text-sm text-muted">pow. {f.powiat} · {f.poparcia} poparć</p>
              <PasekEtapu etap={f.etap} />
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-6 items-start">
        {o.raporty.length > 0 && (
          <section aria-labelledby="h-rap" className="flex-[1_1_420px] min-w-0 bg-white border border-line rounded-2xl p-6">
            <h2 id="h-rap" className="font-display font-bold text-2xl mb-1">Dowiedz się więcej</h2>
            <p className="text-muted text-[15px] mb-4">Raporty polecane w Mapie Wyzwań Społecznych.</p>
            <ul className="flex flex-col gap-2">
              {o.raporty.map((r) => (
                <li key={r} className="flex gap-3 items-start">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 mt-0.5 text-teal"><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></svg>
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="flex-[1_1_320px] min-w-0 bg-clay-light rounded-2xl p-6">
          <h2 className="font-display font-bold text-2xl mb-2">Masz pomysł na to wyzwanie?</h2>
          <p className="mb-4">Zgłoś go w Kreatorze – obszar „{o.nazwa}” będzie już wybrany.</p>
          <div className="flex flex-wrap gap-2">
            <Link to={'/kreator?obszar=' + o.id} className="min-h-12 px-5 inline-flex items-center rounded-xl bg-clay text-white font-bold no-underline">Zgłoś pomysł</Link>
            <Link to="/szukaj" className="min-h-12 px-5 inline-flex items-center rounded-xl border-2 border-clay-dark text-clay-dark font-bold no-underline">Opisz problem</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

// Persona z Mapy Wyzwań: konkretna osoba zamiast statystyki – „ciekawa forma prezentacji”
function Persona({ persona: p }) {
  if (!p) return null
  const kolumny = [
    { tytul: 'Cele i potrzeby', lista: p.cele },
    { tytul: 'Wyzwania', lista: p.wyzwania },
    { tytul: 'Motywacje', lista: p.motywacje },
  ]
  return (
    <section aria-labelledby="h-persona" className="mb-12 bg-white border-2 border-ink rounded-2xl p-6 flex flex-wrap gap-8">
      <div className="flex-[1_1_260px] min-w-0">
        <p className="text-sm font-bold text-clay uppercase tracking-wider mb-1">Persona</p>
        <h2 id="h-persona" className="font-display font-extrabold text-4xl mb-4">Poznaj: {p.imie}</h2>
        <ul className="flex flex-col gap-1.5 text-[15px]">
          {p.cechy.map((c) => <li key={c} className="text-muted">• {c}</li>)}
        </ul>
      </div>
      <div className="flex-[2_1_480px] min-w-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {kolumny.map((k) => (
          <div key={k.tytul} className="rounded-xl bg-ground p-4">
            <h3 className="font-bold mb-2">{k.tytul}</h3>
            <ul className="flex flex-col gap-1.5 text-[15px]">
              {k.lista.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
