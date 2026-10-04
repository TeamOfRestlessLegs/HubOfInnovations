import { Link, useParams } from 'react-router-dom'
import { obszarPoId } from '../data/obszary.js'
import { useDane } from '../data/DaneContext.jsx'
import KartaBiblioteki from '../components/KartaBiblioteki.jsx'
import { KafelLiczby, WykresSlupkowy } from '../components/Dane.jsx'

// Na stronie obszaru tylko kilka innowacji – pełna lista w Bibliotece, dopasowanie w wyszukiwarce
const POKAZ_INNOWACJI = 3

const SEKCJE_STRONY = [
  { id: 'h-dane', nazwa: 'Dane' },
  { id: 'h-wyz', nazwa: 'Wyzwania' },
  { id: 'h-persona', nazwa: 'Persona' },
  { id: 'h-inn', nazwa: 'Innowacje' },
  { id: 'h-rap', nazwa: 'Raporty' },
]

// Strona jednego obszaru z Mapy Wyzwań: wszystko o danej kwestii na jednym ekranie
export default function ZasobnikObszar() {
  const { id } = useParams()
  const o = obszarPoId(id)
  const { biblioteka } = useDane()

  if (!o) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-extrabold text-3xl mb-3">Nie ma takiego obszaru</h1>
        <Link to="/zasobnik">← Wróć do Zasobnika</Link>
      </main>
    )
  }

  const innowacje = biblioteka.filter((b) => (b.obszary || []).includes(o.id))
  const maDane = o.liczby?.length > 0 || o.wykres || o.dane.length > 0
  const widoczne = { 'h-dane': maDane, 'h-wyz': true, 'h-persona': !!o.persona, 'h-inn': true, 'h-rap': o.raporty.length > 0 }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <nav aria-label="Ścieżka" className="text-[15px] mb-4">
        <Link to="/zasobnik">Zasobnik wiedzy</Link> <span className="text-muted">› Wyzwania Małopolski › {o.nazwa}</span>
      </nav>

      <header className="mb-6 max-w-3xl">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight mb-3 break-words hyphens-auto" lang="pl">{o.nazwa}</h1>
        <p className="text-xl leading-relaxed">{o.definicja}</p>
      </header>

      {/* Spis treści strony */}
      <nav aria-label="Na tej stronie" className="sticky top-0 z-10 -mx-6 px-6 py-3 mb-8 bg-ground/95 backdrop-blur border-b border-line">
        <ul className="flex flex-wrap gap-2">
          {SEKCJE_STRONY.filter((x) => widoczne[x.id]).map((x) => (
            <li key={x.id}>
              <a href={'#' + x.id} className="min-h-10 px-3.5 inline-flex items-center rounded-full bg-white border border-line font-bold text-[15px] no-underline text-ink hover:border-ink">{x.nazwa}</a>
            </li>
          ))}
        </ul>
      </nav>

      {maDane && (
        <section aria-labelledby="h-dane" className="mb-12 scroll-mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
            <h2 id="h-dane" className="font-display font-extrabold text-3xl">Co mówią dane</h2>
            <span className="px-3 py-1 rounded-full bg-[#E6EAF0] text-ink text-sm font-bold">Dane ogólnopolskie · Mapa Wyzwań ROPS</span>
          </div>

          {o.liczby?.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-4">
              {o.liczby.map((l) => <KafelLiczby key={l.wartosc + l.opis} liczba={l} />)}
            </div>
          )}

          {(o.wykres || o.dane.length > 0) && (
            <div className="flex flex-wrap gap-4 items-start">
              {o.wykres && <div className="flex-[1_1_420px] min-w-0"><WykresSlupkowy wykres={o.wykres} /></div>}
              {o.dane.length > 0 && (
                <div className="flex-[1_1_420px] min-w-0 bg-white border border-line rounded-2xl p-5">
                  <p className="font-bold text-lg mb-3">Najważniejsze ustalenia</p>
                  <ul className="flex flex-col gap-3">
                    {o.dane.map((d) => <li key={d} className="pl-4 border-l-4 border-teal">{d}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {o.zrodla.length > 0 && (
            <div className="text-sm text-muted mt-4">
              <p className="font-bold mb-1">Źródła danych (za Mapą Wyzwań):</p>
              <ul className="flex flex-col gap-0.5">
                {o.zrodla.map((z) => (
                  <li key={z.tytul}>{z.url ? <a href={z.url} target="_blank" rel="noreferrer" className="text-muted underline hover:text-ink">{z.tytul} <span aria-hidden="true">↗</span><span className="sr-only"> (otwiera się w nowej karcie)</span></a> : z.tytul}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="h-wyz" className="mb-12 scroll-mt-20 bg-ink text-white rounded-2xl p-6">
        <h2 id="h-wyz" className="font-display font-bold text-2xl mb-1">Kluczowe wyzwania</h2>
        <p className="text-white/70 mb-5">Na co, według Mapy Wyzwań, potrzeba nowych rozwiązań.</p>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-8 gap-y-3">
          {o.wyzwania.map((w, i) => (
            <li key={w} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-[#5CC8A8] text-[#0B2E26] font-bold text-sm flex items-center justify-center">{i + 1}</span>
              <span>{w}</span>
            </li>
          ))}
        </ol>
      </section>

      <Persona persona={o.persona} />

      <section aria-labelledby="h-inn" className="mb-12 scroll-mt-20">
        <h2 id="h-inn" className="font-display font-extrabold text-3xl mb-1">Innowacje, które już działają</h2>
        <p className="text-muted mb-5">Sprawdzone przez ROPS – z materiałami, które pomogą wdrożyć je u siebie.</p>
        {innowacje.length === 0 && <p className="text-muted">W tym obszarze nie ma jeszcze innowacji w Bibliotece.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
          {innowacje.slice(0, POKAZ_INNOWACJI).map((b) => <KartaBiblioteki key={b.id} innowacja={b} />)}
        </div>
        {innowacje.length > POKAZ_INNOWACJI && (
          <Link to={`/zasobnik?dzial=biblioteka&obszar=${o.id}`} className="mt-4 min-h-12 px-5 inline-flex items-center rounded-xl border-2 border-ink font-bold no-underline text-ink">
            Wszystkie innowacje w tym obszarze ({innowacje.length}) →
          </Link>
        )}
      </section>


      {o.raporty.length > 0 && (
        <section aria-labelledby="h-rap" className="mb-12 scroll-mt-20">
          <h2 id="h-rap" className="font-display font-extrabold text-3xl mb-1">Dowiedz się więcej</h2>
          <p className="text-muted mb-5">Raporty polecane w Mapie Wyzwań Społecznych – kliknij okładkę, żeby otworzyć lub pobrać.</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {o.raporty.map((rap) => (
              <li key={rap.url}>
                <a href={rap.url} target="_blank" rel="noreferrer" className="group h-full flex flex-col gap-2 no-underline text-ink">
                  <span className="block aspect-[3/4] rounded-xl overflow-hidden bg-white border border-line group-hover:border-ink group-hover:shadow-md transition">
                    <img src={rap.okladka} alt="" loading="lazy" className="w-full h-full object-contain" />
                  </span>
                  <span className="font-bold leading-snug group-hover:underline">{rap.tytul}</span>
                  <span className="text-sm text-muted">{rap.wydawca}</span>
                  <span className="text-sm font-bold text-teal mt-auto">Otwórz raport <span aria-hidden="true">↗</span><span className="sr-only"> (nowa karta)</span></span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-6 items-start">
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
    <section aria-labelledby="h-persona" className="mb-12 scroll-mt-20 bg-white border-2 border-ink rounded-2xl p-6 flex flex-wrap gap-8">
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
