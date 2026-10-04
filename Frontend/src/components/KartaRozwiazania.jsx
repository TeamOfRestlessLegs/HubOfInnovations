import { useState } from 'react'
import Markdown from './Markdown.jsx'
import { opisZrodla } from '../data/wyszukiwarka.js'

// Wynik wyszukiwarki – pokazuje wyłącznie pola z odpowiedzi serwisu (results[])
export default function KartaRozwiazania({ r }) {
  const [opis, setOpis] = useState(false)
  const [wszystkie, setWszystkie] = useState(false)
  const fragmenty = wszystkie ? r.fragmenty : r.fragmenty.slice(0, 1)
  const idOpisu = 'opis-' + r.id.replace(/[^a-z0-9]/gi, '-')

  return (
    <article className="bg-white border border-line rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {r.kategoria && <span className="px-2.5 py-0.5 rounded-full bg-ground text-ink text-sm font-bold first-letter:uppercase">{r.kategoria}</span>}
      </div>

      <h3 className="font-display text-2xl font-bold leading-snug">{r.tytul}</h3>
      {r.krotko && <p className="text-[17px]">{r.krotko}</p>}

      {fragmenty.length > 0 && (
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-bold">Fragmenty pasujące do Twojego opisu</p>
            <p className="text-sm text-muted">Wyszukiwarka znalazła te miejsca w opisie innowacji i jej materiałach – to one najbardziej odpowiadają temu, co wpisałeś(-aś).</p>
          </div>
          {fragmenty.map((f, i) => (
            <figure key={i} className="rounded-xl bg-ground border-l-4 border-teal px-4 py-3">
              <blockquote className="text-[15px] whitespace-pre-line line-clamp-6">{f.tekst}</blockquote>
              <figcaption className="text-sm text-muted mt-1">Źródło fragmentu: <strong className="text-ink font-semibold">{opisZrodla(f)}</strong></figcaption>
            </figure>
          ))}
          {r.fragmenty.length > 1 && (
            <button type="button" onClick={() => setWszystkie(!wszystkie)} className="self-start min-h-10 font-bold text-teal-dark underline underline-offset-2">
              {wszystkie ? 'Pokaż mniej fragmentów' : `Pokaż więcej fragmentów (${r.fragmenty.length - 1})`}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {r.opisMd && (
          <button type="button" onClick={() => setOpis(!opis)} aria-expanded={opis} aria-controls={idOpisu} className="min-h-11 px-4 rounded-lg border-2 border-ink font-bold">
            {opis ? 'Zwiń opis' : 'Pełny opis'}
          </button>
        )}
        {r.materialy && (
          <a href={r.materialy} target="_blank" rel="noreferrer" className="min-h-11 px-4 inline-flex items-center rounded-lg bg-teal text-white font-bold no-underline">
            Materiały ↓
          </a>
        )}
        {r.wideo && <a href={r.wideo} target="_blank" rel="noreferrer" className="min-h-11 px-4 inline-flex items-center rounded-lg border-2 border-line font-bold no-underline text-ink">Wideo ↗</a>}
        {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="min-h-11 px-4 inline-flex items-center rounded-lg font-bold">Źródło ↗</a>}
      </div>

      {opis && (
        <div id={idOpisu} className="border-t border-line pt-3">
          <Markdown tekst={r.opisMd} />
          {r.wiecej.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-[15px]">
              {r.wiecej.map((l, i) => <li key={i}><a href={l.url || l} target="_blank" rel="noreferrer">{l.title || l.url || l} ↗</a></li>)}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}
