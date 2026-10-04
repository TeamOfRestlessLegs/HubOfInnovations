import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import { obszarPoId } from '../data/obszary.js'
import { aiDostepne, zapytaj } from '../data/ai.js'
import { useAuth } from '../auth/AuthContext.jsx'
import Markdown from '../components/Markdown.jsx'
import AkcjeWdrozenia from '../components/AkcjeWdrozenia.jsx'

// Strona jednej innowacji z Bazy wiedzy.
// /baza-wiedzy/:kategoria/:slug – z serwisu AI (GET /innovations/{kategoria}/{slug}); /baza-wiedzy/:id – wpis demo (b1…).
export default function BazaWiedzyInnowacja() {
  const { kategoria, slug, id } = useParams()
  const { biblioteka } = useDane()
  const { uzytkownik: ja } = useAuth()
  const [inn, setInn] = useState(null)
  const [blad, setBlad] = useState('')

  useEffect(() => {
    setInn(null); setBlad('')
    if (id) {
      const b = biblioteka.find((x) => x.id === id)
      if (b) setInn({
        id: b.id, tytul: b.tytul, kategoria: (b.obszary || []).map((o) => obszarPoId(o)?.nazwa).filter(Boolean).join(' · '),
        opis: b.opis, url: b.url !== '#' ? b.url : null, miejsce: b.miejsce, materialy: (b.zalaczniki || []).map((z) => ({ nazwa: z.nazwa, url: z.url })),
      })
      else setBlad('Nie ma takiej innowacji.')
      return
    }
    if (!aiDostepne) { setBlad('Ta innowacja jest dostępna po podłączeniu serwisu AI.'); return }
    zapytaj('GET', `/innovations/${kategoria}/${slug}`).then(
      (d) => setInn({
        id: d.id, tytul: d.title, kategoria: d.category, opis: d.description || d.summary, url: d.url, rops: true,
        materialy: (d.materials || []).map((m) => ({ nazwa: m.file, zrodlo: m.source })),
      }),
      (e) => setBlad(e.message),
    )
  }, [id, kategoria, slug, biblioteka])

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav aria-label="Ścieżka" className="text-[15px] mb-4">
        <Link to="/baza-wiedzy">Baza wiedzy</Link> {inn && <span className="text-muted">› {inn.tytul}</span>}
      </nav>
      {blad && <p role="alert" className="font-bold text-[#9B1C1C]">{blad}</p>}
      {!inn && !blad && <p className="text-muted">Wczytywanie…</p>}
      {inn && (
        <article className="flex flex-col gap-5">
          <header>
            {inn.kategoria && <p className="inline-block px-2.5 py-0.5 mb-3 rounded-full bg-teal-light text-teal-dark font-bold text-sm">{inn.kategoria}</p>}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight break-words" lang="pl">{inn.tytul}</h1>
            {inn.miejsce && <p className="text-muted mt-1">Wdrożone: {inn.miejsce}</p>}
          </header>

          <Markdown tekst={inn.opis} />

          {inn.materialy.length > 0 && (
            <section aria-labelledby="h-mat">
              <h2 id="h-mat" className="font-display text-2xl font-bold mb-3">Materiały</h2>
              <ul className="flex flex-col gap-2">
                {inn.materialy.map((m) => (
                  <li key={m.nazwa} className="bg-white border border-line rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-3">
                    {m.url ? <a href={m.url} className="font-bold">{m.nazwa}</a> : <span className="font-bold break-all">{m.nazwa}</span>}
                    {m.zrodlo && <span className="text-sm text-muted">{m.zrodlo === 'pdf_materialy' ? 'materiały' : 'dowiedz się więcej'}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ja?.rola === 'jst' && (
            <section aria-labelledby="h-mid" className="rounded-2xl bg-clay-light p-5">
              <h2 id="h-mid" className="font-display text-xl font-bold mb-1">Middleman Innowacji – wdrożenie w Waszej gminie</h2>
              <p className="mb-3">Zapisz innowację na liście „Do wdrożenia” albo podaj budżet i liczbę osób, a asystent AI ułoży plan wdrożenia krok po kroku, dopasowany do Waszych zasobów.</p>
              <AkcjeWdrozenia zasob={{ typ: 'biblioteka', id: inn.id, tytul: inn.tytul }} />
            </section>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {inn.url && (
              <a href={inn.url} target="_blank" rel="noreferrer" className="min-h-12 px-5 inline-flex items-center rounded-xl bg-ink text-white font-bold no-underline">
                Pełny opis na stronie ROPS<span className="sr-only"> (nowa karta)</span> →
              </a>
            )}
          </div>
        </article>
      )}
    </main>
  )
}
