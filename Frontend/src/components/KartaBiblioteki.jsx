import { Link } from 'react-router-dom'
import { obszarPoId } from '../data/obszary.js'
import AkcjeWdrozenia from './AkcjeWdrozenia.jsx'

// Karta innowacji z Biblioteki ROPS – dokładnie to, co zwraca backend:
// tytuł, krótki opis, załączniki, link „czytaj więcej” (+ opcjonalnie film).
// Używana w wyszukiwarce, Zasobniku i na stronach obszarów.
// i.rops = innowacja z prawdziwej Biblioteki ROPS (serwis AI): kategoria zamiast obszarów, gmina może ją wdrożyć.
export default function KartaBiblioteki({ innowacja: i, podobienstwo, powody }) {
  return (
    <article className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {podobienstwo && <span className="px-2.5 py-0.5 rounded-full bg-teal text-white font-bold text-sm">{podobienstwo}</span>}
        <span className="px-2.5 py-0.5 rounded-full bg-[#E6EAF0] font-bold text-sm">Sprawdzone przez ROPS</span>
        {i.kategoria && <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal-dark font-bold text-sm">{i.kategoria}</span>}
        {(i.obszary || []).map((id) => (
          <span key={id} className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal-dark font-bold text-sm">{obszarPoId(id)?.nazwa}</span>
        ))}
      </div>
      <div>
        <h3 className="font-display text-2xl font-bold">{i.tytul}</h3>
        {i.miejsce && <p className="text-sm text-muted">Wdrożone: {i.miejsce}</p>}
      </div>
      <p className="text-lg">{i.opis}</p>
      {powody?.length > 0 && <p className="text-[15px] text-muted"><strong className="text-ink">Dlaczego pasuje:</strong> {powody.join(' · ')}</p>}

      {(i.zalaczniki?.length > 0 || i.wideo) && (
        <ul className="flex flex-wrap gap-2" aria-label="Załączniki">
          {i.wideo && (
            <li>
              <a href={i.wideo} className="min-h-11 px-3.5 inline-flex items-center gap-2 rounded-lg border-2 border-line font-bold text-[15px] no-underline text-ink hover:bg-ground">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                Film
              </a>
            </li>
          )}
          {(i.zalaczniki || []).map((z) => (
            <li key={z.nazwa}>
              <a href={z.url} className="min-h-11 px-3.5 inline-flex items-center gap-2 rounded-lg border-2 border-line font-bold text-[15px] no-underline text-ink hover:bg-ground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></svg>
                {z.nazwa}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-auto">
        <a href={i.url} target={i.rops ? '_blank' : undefined} rel="noreferrer" className="min-h-11 inline-flex items-center font-bold">
          Czytaj więcej{i.rops && <span className="sr-only"> (strona ROPS, nowa karta)</span>} →
        </a>
        {!i.rops && <Link to={`/tester?ocen=${i.id}`} className="min-h-11 inline-flex items-center font-bold text-muted">Oceń</Link>}
        {/* Gmina: zapis i Middleman – na innowacjach z prawdziwej Biblioteki ROPS */}
        {i.rops && <AkcjeWdrozenia zasob={{ typ: 'biblioteka', id: i.id, tytul: i.tytul }} />}
      </div>
    </article>
  )
}
