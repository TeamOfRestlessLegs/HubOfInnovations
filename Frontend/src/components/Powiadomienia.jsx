import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane, doMnie } from '../data/DaneContext.jsx'
import { kiedy } from '../data/czas.js'

// Dzwonek w nagłówku: powiadomienia (GET /api/powiadomienia). Rozmowy toczą się tylko w wątkach pomysłów.
// Docelowo nowe powiadomienia przychodzą na żywo (WebSocket / SSE) i e-mailem.
export default function Powiadomienia() {
  const { uzytkownik: ja } = useAuth()
  const { powiadomienia, oznaczPowiadomienia } = useDane()
  const [otwarte, setOtwarte] = useState(false)
  const ref = useRef(null)

  const moje = powiadomienia.filter((p) => doMnie(p.do, ja))
  const nowe = moje.filter((p) => !p.czytali.includes(ja.id)).length

  // Zamknięcie po kliknięciu obok albo Esc
  useEffect(() => {
    if (!otwarte) return
    const klik = (e) => !ref.current?.contains(e.target) && setOtwarte(false)
    const esc = (e) => e.key === 'Escape' && setOtwarte(false)
    document.addEventListener('mousedown', klik)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', klik); document.removeEventListener('keydown', esc) }
  }, [otwarte])

  const przelacz = () => {
    if (otwarte && nowe) oznaczPowiadomienia()
    setOtwarte(!otwarte)
  }

  return (
    <div className="flex items-center gap-1">

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={przelacz}
          aria-expanded={otwarte}
          aria-label={`Powiadomienia${nowe ? `, ${nowe} nowe` : ''}`}
          className="relative w-11 h-11 inline-flex items-center justify-center rounded-full hover:bg-ground text-ink"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" strokeLinejoin="round" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
          {nowe > 0 && <Licznik n={nowe} />}
        </button>

        {otwarte && (
          <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] bg-white border border-line rounded-xl shadow-lg z-20">
            <div className="flex justify-between items-center px-4 py-3 border-b border-line">
              <p className="font-bold">Powiadomienia</p>
              {nowe > 0 && <button type="button" onClick={oznaczPowiadomienia} className="text-sm font-bold text-teal min-h-9">Oznacz jako przeczytane</button>}
            </div>
            {moje.length === 0 ? (
              <p className="p-4 text-muted text-[15px]">Nic nowego. Damy znać, gdy ROPS odpowie albo coś się zmieni.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {moje.slice(0, 20).map((p) => (
                  <li key={p.id} className="border-b border-line last:border-0">
                    <Link to={p.link} onClick={() => { setOtwarte(false); oznaczPowiadomienia() }} className={'flex gap-3 px-4 py-3 no-underline text-ink hover:bg-ground ' + (p.czytali.includes(ja.id) ? '' : 'bg-teal-light/40')}>
                      <span aria-hidden="true" className={'mt-1.5 w-2 h-2 rounded-full shrink-0 ' + (p.czytali.includes(ja.id) ? 'bg-transparent' : 'bg-clay')} />
                      <span className="flex flex-col">
                        <span className="text-[15px] leading-snug">{p.tresc}</span>
                        <span className="text-xs text-muted">{kiedy(p.data)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Licznik({ n }) {
  return (
    <span aria-hidden="true" className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full bg-clay text-white text-xs font-bold flex items-center justify-center">
      {n > 9 ? '9+' : n}
    </span>
  )
}

