import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane } from '../data/DaneContext.jsx'
import { liczbaPoparc } from '../data/watekFiszki.js'

// Pozioma karta pomysłu (widok „Według etapów”): treść po lewej, poparcia i akcje po prawej.
// Etap pokazuje już sekcja, w której leży karta, więc karta nie powtarza paska etapu.
export default function KartaInnowacji({ innowacja: f }) {
  const { uzytkownik: ja } = useAuth()
  const { poprzyj } = useDane()
  const poparte = !!ja && (f.poparli || []).includes(ja.id)
  const autor = ja && f.autorId === ja.id

  return (
    <article className="bg-white border border-line rounded-2xl p-5 flex flex-wrap items-center gap-x-6 gap-y-4 hover:border-ink transition-colors">
      <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-1.5">
        <h3 className="font-display text-xl font-bold leading-snug">
          <Link to={'/pomysl/' + f.id} className="text-ink no-underline hover:underline">{f.tytul}</Link>
        </h3>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{f.powiat ? `pow. ${f.powiat}` : 'Małopolska'}</span>
          {f.odJST && <span className="px-2 py-0.5 rounded bg-ink text-white text-xs font-bold">Pomysł gminy</span>}
          {f.prowadzacy && !f.odJST && <span className="px-2 py-0.5 rounded bg-ground text-ink text-xs font-bold">Prowadzi gmina</span>}
          {f.szuka && <span className="px-2 py-0.5 rounded bg-clay-light text-clay-dark text-xs font-bold">Szuka: {f.szuka}</span>}
        </p>
        {f.problem && <p className="text-[15px] text-ink/80 line-clamp-2 max-w-3xl"><span className="font-bold text-ink">Problem: </span>{f.problem}</p>}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <p className="text-right leading-tight">
          <strong className="font-display font-extrabold text-3xl block">{liczbaPoparc(f)}</strong>
          <span className="text-sm text-muted">poparć</span>
        </p>
        <div className="flex flex-col gap-1.5">
          {ja && !autor && (
            <button type="button" onClick={() => poprzyj(f.id)} aria-pressed={poparte}
              className={'min-h-10 px-4 rounded-lg font-bold text-sm border-2 border-clay ' + (poparte ? 'bg-clay text-white' : 'bg-white text-clay-dark')}>
              {poparte ? 'Popierasz ✓' : 'Poprzyj'}
            </button>
          )}
          <Link to={'/pomysl/' + f.id} className="min-h-10 px-4 inline-flex items-center justify-center rounded-lg bg-ink text-white text-sm font-bold no-underline">Wątek →</Link>
        </div>
      </div>
    </article>
  )
}
