import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane } from '../data/DaneContext.jsx'
import UsunFiszke from './UsunFiszke.jsx'

// Decyzja zarządzającego (ROPS albo ekspert) o fiszce czekającej na weryfikację:
// poparcie = publikacja, propozycja poprawek dla autora (trafia do „Rozmów z ekspertami”),
// a tylko ROPS może też usunąć fiszkę z podaniem powodu (wątek się kończy).
export default function DecyzjaZarzadu({ fiszka, children }) {
  const { uzytkownik: ja } = useAuth()
  const { zatwierdz, odeslijDoPoprawy, poprosEksperta } = useDane()
  const [tryb, setTryb] = useState(null) // 'poprawki' | 'ekspert'
  const [tresc, setTresc] = useState('')
  if (!ja || (ja.rola !== 'rops_admin' && ja.rola !== 'ekspert')) return null

  const wyslij = () => {
    ;({ ekspert: poprosEksperta, poprawki: odeslijDoPoprawy })[tryb](fiszka.id, tresc.trim())
    setTryb(null)
    setTresc('')
  }

  if (tryb) {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={'dec-' + fiszka.id} className="font-bold">{{ ekspert: 'O co zapytać ekspertów?', poprawki: 'Jakie poprawki proponujesz?' }[tryb]}</label>
        <textarea id={'dec-' + fiszka.id} rows={3} value={tresc} onChange={(e) => setTresc(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0] bg-white" />
        <p className="text-sm text-muted">{{ ekspert: 'Pytanie pojawi się w „Rozmowach z ekspertami” w wątku.', poprawki: 'Propozycja pojawi się w „Rozmowach z ekspertami”. Autor poprawi fiszkę i wyśle ją ponownie.' }[tryb]}</p>
        <div className="flex gap-2">
          <button type="button" onClick={wyslij} disabled={!tresc.trim()} className="min-h-11 px-4 rounded-lg text-white font-bold disabled:opacity-50 bg-ink">
            {{ ekspert: 'Wyślij do ekspertów', poprawki: 'Wyślij propozycję' }[tryb]}
          </button>
          <button type="button" onClick={() => setTryb(null)} className="min-h-11 px-4 rounded-lg border-2 border-line font-bold">Anuluj</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => zatwierdz(fiszka.id)} className="min-h-11 px-5 rounded-lg bg-teal text-white font-bold">Popieram – opublikuj</button>
      <button type="button" onClick={() => setTryb('poprawki')} className="min-h-11 px-5 rounded-lg border-2 border-ink font-bold">Zaproponuj poprawki</button>
      {ja.rola === 'rops_admin' && (
        <>
          <button type="button" onClick={() => setTryb('ekspert')} className="min-h-11 px-5 rounded-lg border-2 border-line font-bold">Zapytaj ekspertów</button>
          <UsunFiszke fiszka={fiszka} />
        </>
      )}
      {children}
    </div>
  )
}
