import { useState } from 'react'
import { aiDostepne } from '../data/ai.js'
import { propozycjaPola } from '../data/asystent.js'

const SZYBKIE_PROSBY = ['Krócej', 'Prościej', 'Więcej konkretów']

// Enter w polu = kliknięcie przycisku obok (bez <form> – ramka bywa wewnątrz formularza wniosku)
const naEnter = (fn) => (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    fn()
  }
}

// Stan propozycji asystenta dla wielu pól (wniosek albo Canva). Propozycja: { text, why, historia }
export function usePropozycje(kontekst, rodzaj) {
  const [propozycje, setPropozycje] = useState({})
  const [pracuje, setPracuje] = useState({})
  const [bledy, setBledy] = useState({})
  const [cofnij, setCofnij] = useState({})   // { poleId: tekst sprzed wstawienia }

  const zPola = (id, v) => (s) => {
    const n = { ...s }
    if (v === undefined) delete n[id]
    else n[id] = v
    return n
  }

  // Nowa propozycja dla jednego pola albo poprawka obecnej (`polecenie` = prośba autora, np. „krócej”)
  const popros = async (pole, polecenie) => {
    const poprzednia = propozycje[pole.id]
    setPracuje(zPola(pole.id, true))
    setBledy(zPola(pole.id))
    try {
      const s = await propozycjaPola(kontekst, pole, { rodzaj, poprzednia: polecenie ? poprzednia?.text : undefined, polecenie })
      setPropozycje(zPola(pole.id, {
        text: s.text, why: s.why,
        historia: polecenie ? [...(poprzednia?.historia || []), polecenie] : [],
      }))
    } catch (e) {
      setBledy(zPola(pole.id, e.message))
    } finally {
      setPracuje(zPola(pole.id))
    }
  }

  // Propozycje dla wielu pól naraz (z /asystent/wniosek)
  const ustawWszystkie = (suggestions) =>
    setPropozycje((s) => ({ ...s, ...Object.fromEntries(suggestions.map((x) => [x.field_id, { text: x.text, why: x.why, historia: [] }])) }))

  // Wstawia propozycję do pola i zapamiętuje poprzedni tekst do „Cofnij”
  const wstaw = (id, obecny, ustawTekst) => {
    setCofnij(zPola(id, obecny || ''))
    ustawTekst(propozycje[id].text)
    setPropozycje(zPola(id))
  }
  const zostaw = (id) => setPropozycje(zPola(id))
  const wycofaj = (id, ustawTekst) => {
    ustawTekst(cofnij[id])
    setCofnij(zPola(id))
  }
  const zapomnijCofnij = (id) => cofnij[id] !== undefined && setCofnij(zPola(id))

  return { propozycje, pracuje, bledy, cofnij, popros, ustawWszystkie, wstaw, zostaw, wycofaj, zapomnijCofnij }
}

// Pomoc asystenta przy jednym polu: przycisk „Podpowiedz” albo ramka z propozycją do akceptacji.
// Wszystko duże i opisane słowami – ma to zrozumieć osoba, która pierwszy raz pisze wniosek.
export default function AsystentPola({ poleId, propozycja, limit, pracuje, blad, moznaCofnac, przycisk, onPopros, onWstaw, onZostaw, onCofnij }) {
  const [wlasna, setWlasna] = useState('')

  const wyslij = (tekst) => {
    if (!tekst.trim() || pracuje) return
    onPopros(tekst.trim())
    setWlasna('')
  }

  if (!propozycja) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {przycisk && (
          <button type="button" onClick={() => onPopros()} disabled={!aiDostepne || pracuje}
            className="min-h-11 px-4 rounded-xl border-2 border-teal text-teal-dark font-bold bg-white hover:bg-teal-light disabled:opacity-50">
            {pracuje ? 'Asystent pisze…' : przycisk}
          </button>
        )}
        {moznaCofnac && (
          <button type="button" onClick={onCofnij} className="min-h-11 px-4 rounded-xl border-2 border-line font-bold bg-white">
            ↶ Cofnij – przywróć mój tekst
          </button>
        )}
        {blad && <p role="alert" className="text-[#9B1C1C] font-bold">{blad}</p>}
      </div>
    )
  }

  const dl = propozycja.text.length
  return (
    <section aria-label="Propozycja asystenta" className="rounded-2xl border-[3px] border-teal bg-teal-light p-4 flex flex-col gap-3">
      <p className="font-bold text-lg text-teal-dark">💡 Propozycja asystenta</p>
      {propozycja.why && <p className="text-[15px]"><strong>Co poprawiłem:</strong> {propozycja.why}</p>}

      <div className="bg-white rounded-xl border border-line p-3.5 whitespace-pre-wrap leading-relaxed" aria-live="polite">
        {pracuje ? <span className="text-muted">Asystent pisze nową wersję…</span> : propozycja.text}
      </div>
      <p className={'text-sm text-right ' + (dl > limit ? 'text-[#9B1C1C] font-bold' : 'text-muted')}>{dl} / {limit} znaków</p>

      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={() => onWstaw(false)} disabled={pracuje} className="min-h-12 px-5 rounded-xl bg-teal text-white font-bold disabled:opacity-50">
          ✓ Wstaw tę wersję
        </button>
        <button type="button" onClick={() => onWstaw(true)} disabled={pracuje} className="min-h-12 px-5 rounded-xl border-2 border-teal bg-white text-teal-dark font-bold disabled:opacity-50">
          ✎ Wstaw i popraw sam
        </button>
        <button type="button" onClick={onZostaw} disabled={pracuje} className="min-h-12 px-5 rounded-xl border-2 border-line bg-white font-bold disabled:opacity-50">
          ✕ Zostaw mój tekst
        </button>
      </div>


      <div className="flex flex-col gap-2">
        <p className="font-bold">Chcesz coś zmienić? Kliknij albo napisz własnymi słowami:</p>
        <div className="flex flex-wrap gap-2">
          {SZYBKIE_PROSBY.map((x) => (
            <button key={x} type="button" onClick={() => wyslij(x)} disabled={pracuje} className="min-h-11 px-4 rounded-full border-2 border-line bg-white font-bold disabled:opacity-50">
              {x}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <label htmlFor={`prosba-${poleId}`} className="sr-only">Co zmienić w propozycji</label>
          <input id={`prosba-${poleId}`} value={wlasna} maxLength={500} onChange={(e) => setWlasna(e.target.value)}
            onKeyDown={naEnter(() => wlasna.trim().length >= 2 && wyslij(wlasna))}
            placeholder="Np. dodaj, że pomaga nam koło gospodyń"
            className="flex-[1_1_220px] min-w-0 min-h-11 px-3 rounded-xl border border-[#B8C2D0] bg-white" />
          <button type="button" onClick={() => wyslij(wlasna)} disabled={pracuje || wlasna.trim().length < 2} className="min-h-11 px-4 rounded-xl bg-ink text-white font-bold disabled:opacity-50">
            Poproś o zmianę
          </button>
        </div>
        {propozycja.historia?.length > 0 && (
          <p className="text-sm text-muted">Twoje prośby: {propozycja.historia.map((h) => `„${h}”`).join(', ')} ✓</p>
        )}
        {blad && <p role="alert" className="text-[#9B1C1C] font-bold">{blad}</p>}
      </div>
    </section>
  )
}
