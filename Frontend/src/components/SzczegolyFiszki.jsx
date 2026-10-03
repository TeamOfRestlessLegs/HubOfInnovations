import { INTENSYWNOSC, CZESTOTLIWOSC, SKALA, znajdz } from '../data/fiszka.js'
import { obszarPoId } from '../data/obszary.js'

// Szczegóły fiszki: problem + kogo dotyczy + jak bardzo / jak często / ilu osób.
// Używane w panelach ROPS, gminy i mieszkańca, żeby wszędzie wyglądało tak samo.
export default function SzczegolyFiszki({ fiszka, pokazPomysl = true }) {
  const intens = znajdz(INTENSYWNOSC, fiszka.intensywnosc)
  const czest = znajdz(CZESTOTLIWOSC, fiszka.czestotliwosc)
  const skala = znajdz(SKALA, fiszka.skala)

  return (
    <div className="flex flex-col gap-3">
      {fiszka.problem && (
        <div>
          <p className="text-sm font-bold text-muted">Problem</p>
          <p className="text-lg">{fiszka.problem}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {obszarPoId(fiszka.obszar) && <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-teal-light text-teal-dark">{obszarPoId(fiszka.obszar).nazwa}</span>}
        {intens && <span className={'px-2.5 py-0.5 rounded-full text-sm font-bold ' + intens.klasa}>{intens.krotko}</span>}
        {czest && <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-[#E6EAF0]">{czest.nazwa}</span>}
        {skala && <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-[#E6EAF0]">{skala.nazwa}</span>}
      </div>

      {fiszka.grupy?.length > 0 && (
        <p className="text-base"><strong>Dla kogo:</strong> {fiszka.grupy.join(', ')}</p>
      )}

      {pokazPomysl && fiszka.opis && (
        <div className="rounded-xl bg-ground p-3.5">
          <p className="text-sm font-bold text-muted">Pomysł: {fiszka.tytul}</p>
          <p>{fiszka.opis}</p>
        </div>
      )}
    </div>
  )
}
