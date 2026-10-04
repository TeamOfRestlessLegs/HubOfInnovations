// Szczegóły fiszki – te same pola, które wypełnia autor w Kreatorze:
// opis problemu, dedykowana grupa, nazwa i krótki opis pomysłu, istota (nowość). Etap pokazuje PasekEtapu.
export default function SzczegolyFiszki({ fiszka, pokazPomysl = true }) {
  const grupy = [...(fiszka.grupy || []), fiszka.grupaInna].filter(Boolean)
  return (
    <div className="flex flex-col gap-3">
      {fiszka.problem && (
        <div>
          <p className="text-sm font-bold text-muted">Opis problemu</p>
          <p className="text-lg">{fiszka.problem}</p>
        </div>
      )}

      {grupy.length > 0 && (
        <div>
          <p className="text-sm font-bold text-muted mb-1">Dedykowana grupa</p>
          <ul className="flex flex-wrap gap-2">
            {grupy.map((g) => <li key={g} className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-teal-light text-teal-dark">{g}</li>)}
          </ul>
        </div>
      )}

      {pokazPomysl && fiszka.opis && (
        <div className="rounded-xl bg-ground p-3.5">
          <p className="text-sm font-bold text-muted">Pomysł: {fiszka.tytul}</p>
          <p>{fiszka.opis}</p>
          {fiszka.istota && (
            <>
              <p className="text-sm font-bold text-muted mt-2">Na czym polega nowość</p>
              <p>{fiszka.istota}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
