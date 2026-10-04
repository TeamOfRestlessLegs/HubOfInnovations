import { useEffect, useState } from 'react'
import { wniosekPdf, nazwaPliku } from '../data/wniosekPdf.js'

// Wypełniony wniosek jako PDF (podgląd + pobranie): tak czyta go ROPS, a autor sprawdza przed złożeniem.
export default function WniosekPdf({ w, n }) {
  // PDF odświeżamy tylko, gdy zmieni się treść (bez pliku wzoru – bywa duży)
  const klucz = JSON.stringify([w, n?.nazwa, n?.termin, n?.pola, n?.wzor?.nazwa, n?.uklad?.length])
  const [wynik, setWynik] = useState({ klucz: null, url: null, blad: '' })

  useEffect(() => {
    let adres = null
    let aktualny = true
    wniosekPdf(w, n).then(
      (blob) => {
        if (!aktualny) return
        adres = URL.createObjectURL(blob)
        setWynik({ klucz, url: adres, blad: '' })
      },
      () => aktualny && setWynik({ klucz, url: null, blad: 'Nie udało się przygotować PDF-a wniosku.' }),
    )
    return () => {
      aktualny = false
      if (adres) URL.revokeObjectURL(adres)
    }
  }, [klucz]) // eslint-disable-line react-hooks/exhaustive-deps

  if (wynik.klucz !== klucz) return <p role="status" className="text-muted">Przygotowujemy PDF wniosku…</p>
  if (wynik.blad) return <p role="alert" className="text-[#9B1C1C] font-bold">{wynik.blad}</p>
  const { url } = wynik

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <a href={url} download={nazwaPliku(w)} className="min-h-11 px-4 inline-flex items-center gap-2 rounded-lg bg-ink text-white font-bold no-underline">
          <span aria-hidden="true" className="text-xs px-1.5 py-0.5 rounded bg-clay text-white">PDF</span>
          Pobierz wniosek
        </a>
        <a href={url} target="_blank" rel="noreferrer" className="min-h-11 px-4 inline-flex items-center rounded-lg border-2 border-ink font-bold no-underline text-ink">
          Otwórz w nowej karcie
        </a>
      </div>
      <iframe title={`Wniosek „${w.tytul}” (PDF)`} src={url} className="w-full h-[75vh] min-h-96 rounded-xl border border-line bg-ground" />
    </div>
  )
}
