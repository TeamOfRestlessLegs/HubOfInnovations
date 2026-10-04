import { useEffect, useState } from 'react'

// Pasek dostępności: wielkość tekstu (A− / A / A+) i wysoki kontrast.
// Ustawienia zapamiętujemy w przeglądarce, żeby nie trzeba było ich klikać przy każdej wizycie.
const POZIOMY = [0.9, 1, 1.15, 1.3]
const KLUCZ = 'splot-dostepnosc'

function wczytaj() {
  try {
    return { poziom: 1, kontrast: false, ...JSON.parse(localStorage.getItem(KLUCZ)) }
  } catch {
    return { poziom: 1, kontrast: false }
  }
}

export default function Dostepnosc() {
  const [ust, setUst] = useState(wczytaj)

  useEffect(() => {
    // zoom powiększa całą stronę jak przeglądarka – układ przelicza się tak, jak przy powiększeniu 200%
    document.body.style.zoom = POZIOMY[ust.poziom]
    document.documentElement.classList.toggle('kontrast', ust.kontrast)
    try { localStorage.setItem(KLUCZ, JSON.stringify(ust)) } catch { /* brak dostępu – trudno */ }
  }, [ust])

  const przycisk = 'w-10 h-10 inline-flex items-center justify-center rounded-lg border border-line bg-white font-bold text-ink hover:border-ink aria-pressed:bg-ink aria-pressed:text-white aria-pressed:border-ink disabled:opacity-40'

  return (
    <div role="group" aria-label="Ustawienia dostępności" className="flex items-center gap-1.5">
      <span className="text-sm text-muted mr-1 hidden sm:inline">Tekst:</span>
      <button type="button" className={przycisk + ' text-sm'} onClick={() => setUst({ ...ust, poziom: Math.max(0, ust.poziom - 1) })} disabled={ust.poziom === 0} aria-label="Zmniejsz tekst">A−</button>
      <button type="button" className={przycisk} onClick={() => setUst({ ...ust, poziom: 1 })} aria-pressed={ust.poziom === 1} aria-label="Domyślna wielkość tekstu">A</button>
      <button type="button" className={przycisk + ' text-lg'} onClick={() => setUst({ ...ust, poziom: Math.min(POZIOMY.length - 1, ust.poziom + 1) })} disabled={ust.poziom === POZIOMY.length - 1} aria-label="Powiększ tekst">A+</button>
      <button type="button" className={przycisk + ' ml-1'} onClick={() => setUst({ ...ust, kontrast: !ust.kontrast })} aria-pressed={ust.kontrast} aria-label="Wysoki kontrast" title="Wysoki kontrast">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" /></svg>
      </button>
    </div>
  )
}
