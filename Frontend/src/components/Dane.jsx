// Prezentacja danych z Mapy Wyzwań: kafle z liczbą i prosty wykres słupkowy.
// Dane przychodzą z data/obszary.js (docelowo GET /api/obszary – ROPS edytuje je w panelu).

const fmt = (v) => String(v).replace('.', ',')

// Jedna kluczowa liczba: duża wartość, krótki opis, zmiana i źródło
export function KafelLiczby({ liczba }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-1.5">
      <p className="font-display font-extrabold text-4xl tracking-tight text-ink leading-none">{liczba.wartosc}</p>
      <p className="text-[15px] leading-snug">{liczba.opis}</p>
      {liczba.zmiana && <p className="text-sm font-bold text-clay-dark">{liczba.zmiana}</p>}
      {liczba.zrodlo && <p className="text-xs text-muted mt-auto pt-1">Źródło: {liczba.zrodlo}</p>}
    </div>
  )
}

// Poziome słupki – jedna seria (kolor teal), wartości opisane wprost, opcjonalna linia odniesienia.
// Pod spodem widok tabeli dla czytników ekranu i dla tych, którzy wolą liczby.
export function WykresSlupkowy({ wykres }) {
  const { tytul, jednostka = '', slupki, odniesienie, zrodlo } = wykres
  const max = Math.max(...slupki.map((s) => s.wartosc), odniesienie?.wartosc || 0) * 1.15
  const proc = (v) => `${(v / max) * 100}%`

  return (
    <figure className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-4">
      <figcaption className="font-bold text-lg">{tytul}</figcaption>

      <div className="flex flex-col gap-3" aria-hidden="true">
        {slupki.map((s) => (
          <div key={s.etykieta} className="group grid grid-cols-[110px_1fr] items-center gap-3" title={`${s.etykieta}: ${fmt(s.wartosc)}${jednostka}`}>
            <span className="text-[15px] text-right">{s.etykieta}</span>
            <div className="flex items-center gap-2 min-h-8">
              <div className="h-6 rounded-r bg-teal group-hover:bg-teal-dark transition-colors" style={{ width: proc(s.wartosc) }} />
              <span className="text-[15px] font-bold text-ink tabular-nums">{fmt(s.wartosc)}{jednostka}</span>
            </div>
          </div>
        ))}
        {odniesienie && (
          <div className="grid grid-cols-[110px_1fr] items-center gap-3 pt-2 border-t border-dashed border-line" title={`${odniesienie.etykieta}: ${fmt(odniesienie.wartosc)}${jednostka}`}>
            <span className="text-[15px] text-right text-muted">Ogółem</span>
            <div className="flex items-center gap-2 min-h-8">
              <div className="h-6 rounded-r bg-[#B8C2D0]" style={{ width: proc(odniesienie.wartosc) }} />
              <span className="text-[15px] font-bold text-ink tabular-nums">{fmt(odniesienie.wartosc)}{jednostka}</span>
            </div>
          </div>
        )}
      </div>

      {odniesienie && <p className="text-sm text-muted">Szary słupek: {odniesienie.etykieta}.</p>}

      <details className="text-[15px]">
        <summary className="cursor-pointer font-bold min-h-11 flex items-center">Pokaż jako tabelę</summary>
        <table className="mt-2 w-full text-left border-collapse">
          <caption className="sr-only">{tytul}</caption>
          <thead>
            <tr className="border-b border-line"><th scope="col" className="py-1.5">Kategoria</th><th scope="col" className="py-1.5 text-right">Wartość</th></tr>
          </thead>
          <tbody>
            {slupki.map((s) => (
              <tr key={s.etykieta} className="border-b border-line/60"><th scope="row" className="py-1.5 font-normal">{s.etykieta}</th><td className="py-1.5 text-right tabular-nums">{fmt(s.wartosc)}{jednostka}</td></tr>
            ))}
            {odniesienie && (
              <tr><th scope="row" className="py-1.5 font-normal text-muted">{odniesienie.etykieta}</th><td className="py-1.5 text-right tabular-nums text-muted">{fmt(odniesienie.wartosc)}{jednostka}</td></tr>
            )}
          </tbody>
        </table>
      </details>

      {zrodlo && <p className="text-xs text-muted">Źródło: {zrodlo}</p>}
    </figure>
  )
}

// Licznik na liście (np. pomysły wg powiatu) – krótkie słupki z liczbą
export function ListaSlupkow({ tytul, pozycje }) {
  const max = Math.max(...pozycje.map((p) => p.liczba), 1)
  return (
    <div>
      <p className="font-bold mb-2">{tytul}</p>
      <ul className="flex flex-col gap-1.5">
        {pozycje.map((p) => (
          <li key={p.nazwa} className="grid grid-cols-[minmax(90px,160px)_1fr] items-center gap-3 text-[15px]">
            <span className="truncate">{p.nazwa}</span>
            <span className="flex items-center gap-2">
              <span className="h-4 rounded-r bg-clay" style={{ width: `${(p.liczba / max) * 100}%`, maxWidth: 'calc(100% - 2rem)' }} aria-hidden="true" />
              <span className="font-bold tabular-nums">{p.liczba}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
