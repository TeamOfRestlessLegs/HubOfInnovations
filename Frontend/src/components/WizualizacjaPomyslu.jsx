import { useState } from 'react'
import { aiDostepne, BRAK_AI } from '../data/ai.js'
import { wizualizacjaPomyslu } from '../data/asystent.js'

const STYLE = [
  { id: 'ilustracja', nazwa: 'Ilustracja' },
  { id: 'szkic', nazwa: 'Szkic' },
  { id: 'fotorealistyczna', nazwa: 'Zdjęcie' },
]

// Asystent kreatora: obraz poglądowy pomysłu (np. przedmiotu, miejsca, usługi) – autor może poprosić o zmianę
// albo pobrać obraz. Obraz nie jest zapisywany w fiszce; to pomoc przy prototypowaniu.
export default function WizualizacjaPomyslu({ fiszka }) {
  const [styl, setStyl] = useState('ilustracja')
  const [wynik, setWynik] = useState(null)
  const [polecenie, setPolecenie] = useState('')
  const [pracuje, setPracuje] = useState(false)
  const [blad, setBlad] = useState('')

  const gotowa = fiszka.tytul.trim().length >= 3 && fiszka.opis.trim().length >= 10

  const rysuj = async (zPoleceniem) => {
    setPracuje(true)
    setBlad('')
    try {
      setWynik(await wizualizacjaPomyslu(fiszka, { styl, polecenie: zPoleceniem ? polecenie.trim() : undefined }))
      if (zPoleceniem) setPolecenie('')
    } catch (e) {
      setBlad(e.message)
    } finally {
      setPracuje(false)
    }
  }

  return (
    <section aria-labelledby="h-wizualizacja" className="rounded-2xl border-2 border-line bg-white p-5 flex flex-col gap-4">
      <div>
        <h2 id="h-wizualizacja" className="font-display font-bold text-2xl">Zobacz swój pomysł</h2>
        <p className="text-muted">Asystent narysuje obraz poglądowy na podstawie nazwy i opisu. To tylko pomoc – nic nie zmienia w fiszce.</p>
      </div>

      <fieldset>
        <legend className="font-bold mb-2">Styl obrazu</legend>
        <div className="flex flex-wrap gap-2">
          {STYLE.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={styl === s.id} onClick={() => setStyl(s.id)}
              className={'min-h-11 px-4 rounded-lg font-bold ' + (styl === s.id ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white')}>
              {s.nazwa}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <button type="button" onClick={() => rysuj(false)} disabled={!gotowa || pracuje || !aiDostepne}
          className="min-h-12 px-5 rounded-xl bg-clay text-white font-bold disabled:opacity-50">
          {pracuje && !wynik ? 'Rysuję…' : wynik ? 'Narysuj od nowa' : 'Narysuj mój pomysł'}
        </button>
        {!aiDostepne && <p className="text-sm text-muted mt-2">{BRAK_AI}</p>}
        {aiDostepne && !gotowa && <p className="text-sm text-muted mt-2">Najpierw wpisz nazwę i krótki opis pomysłu.</p>}
      </div>

      <div role="status" aria-live="polite">
        {pracuje && <p className="font-bold">Obraz powstaje – to potrwa kilkanaście sekund.</p>}
        {blad && <p role="alert" className="text-red-700 font-bold">{blad}</p>}
      </div>

      {wynik && (
        <figure className="flex flex-col gap-3 m-0">
          <img src={wynik.image} alt={wynik.caption} className="w-full max-w-lg rounded-xl border border-line" />
          <figcaption className="text-muted">{wynik.caption} Obraz wygenerowała sztuczna inteligencja.</figcaption>
          <a href={wynik.image} download={'pomysl-wizualizacja.png'} className="min-h-11 px-4 inline-flex items-center self-start rounded-lg border-2 border-ink font-bold no-underline text-ink">
            Pobierz obraz
          </a>

          <label htmlFor="poprawka-obrazu" className="font-bold mt-1">Chcesz coś zmienić?</label>
          <div className="flex flex-wrap gap-2">
            <input id="poprawka-obrazu" value={polecenie} onChange={(e) => setPolecenie(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && polecenie.trim().length >= 2 && !pracuje) { e.preventDefault(); rysuj(true) } }}
              maxLength={300} placeholder="np. dodaj drewniany stół, jaśniejsze kolory"
              className="min-h-12 px-4 rounded-xl border-2 border-line bg-white flex-1 min-w-56" />
            <button type="button" onClick={() => rysuj(true)} disabled={pracuje || polecenie.trim().length < 2}
              className="min-h-12 px-5 rounded-xl border-2 border-ink font-bold disabled:opacity-50">
              Zmień obraz
            </button>
          </div>
        </figure>
      )}
    </section>
  )
}
