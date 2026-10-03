import { useState } from 'react'
import PasekEtapu from './PasekEtapu.jsx'

// Dane przychodzą jako "props" – jedna fiszka (data/fiszki.js / DaneContext)
export default function KartaInnowacji({ innowacja }) {
  // useState: zmienna, której zmiana sama odświeża widok
  const [poparte, setPoparte] = useState(false)
  const liczba = innowacja.poparcia + (poparte ? 1 : 0)

  return (
    <article className="bg-white border border-line rounded-xl p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-teal">{innowacja.tagi.join(' · ')}</p>
        <h3 className="font-display text-xl font-bold">{innowacja.tytul}</h3>
        <p className="text-sm text-muted">pow. {innowacja.powiat}</p>
        {innowacja.problem && <p className="text-[15px] text-muted mt-1">{innowacja.problem}</p>}
      </div>

      {/* Renderowanie warunkowe: pokaż tylko, jeśli projekt czegoś szuka */}
      {innowacja.szuka && (
        <span className="self-start px-2.5 py-1 rounded-md bg-clay-light text-clay-dark text-sm font-bold">
          Szuka: {innowacja.szuka}
        </span>
      )}

      <PasekEtapu etap={innowacja.etap} />

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-sm text-muted">{liczba} poparć</span>
        <button
          onClick={() => setPoparte(!poparte)}
          aria-pressed={poparte}
          className={
            'min-h-10 px-3.5 rounded-lg font-bold text-sm border-2 border-clay ' +
            (poparte ? 'bg-clay text-white' : 'bg-white text-clay-dark')
          }
        >
          {poparte ? 'Popierasz ✓' : 'Poprzyj'}
        </button>
      </div>
    </article>
  )
}
