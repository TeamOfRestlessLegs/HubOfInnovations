import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane } from '../data/DaneContext.jsx'

// Usunięcie fiszki – TYLKO ROPS (nie ekspert), zawsze z powodem.
// Działa na każdym etapie: czeka na poparcie, do poprawy albo już opublikowana (poparta przez kogoś innego).
// Po usunięciu pomysł znika z publicznych list, a wątek jest zamknięty.
export default function UsunFiszke({ fiszka }) {
  const { uzytkownik: ja } = useAuth()
  const { odrzucFiszke } = useDane()
  const [otwarte, setOtwarte] = useState(false)
  const [powod, setPowod] = useState('')
  if (ja?.rola !== 'rops_admin' || fiszka.status === 'odrzucona' || fiszka.status === 'zarchiwizowana') return null
  const opublikowana = fiszka.status === 'opublikowana'

  if (!otwarte) {
    return (
      <button type="button" onClick={() => setOtwarte(true)} className="min-h-11 px-5 rounded-lg border-2 border-[#9B1C1C] text-[#9B1C1C] font-bold bg-white">
        Usuń fiszkę
      </button>
    )
  }
  return (
    <div className="basis-full flex flex-col gap-2 rounded-xl border-2 border-[#9B1C1C] bg-white p-4 text-ink">
      <label htmlFor={'usun-' + fiszka.id} className="font-bold">Powód usunięcia (wymagany)</label>
      <textarea id={'usun-' + fiszka.id} rows={3} value={powod} onChange={(e) => setPowod(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0] bg-white" />
      <p className="text-sm text-muted">
        {opublikowana
          ? 'Pomysł jest już publiczny – zniknie z listy i rankingu, a osoby, które go popierają, dostaną powiadomienie. Autor zobaczy powód.'
          : 'Pomysł nie zostanie opublikowany, a wątek się zakończy. Autor zobaczy powód.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!powod.trim()} onClick={() => { odrzucFiszke(fiszka.id, powod.trim()); setOtwarte(false); setPowod('') }}
          className="min-h-11 px-4 rounded-lg bg-[#9B1C1C] text-white font-bold disabled:opacity-50">Usuń i zakończ wątek</button>
        <button type="button" onClick={() => { setOtwarte(false); setPowod('') }} className="min-h-11 px-4 rounded-lg border-2 border-line font-bold">Anuluj</button>
      </div>
    </div>
  )
}
