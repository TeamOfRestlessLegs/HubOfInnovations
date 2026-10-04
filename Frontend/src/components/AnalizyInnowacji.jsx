import { useState } from 'react'
import { aiDostepne, zapytaj } from '../data/ai.js'

// Wiedza z Biblioteki ROPS dla Middlemana (Backend/ai-service/routes/innovations.py):
//   GET  /innovations/{kat}/{slug}/analysis          – jak powstała innowacja, środki, miejsca, ryzyka
//   GET  /innovations/{kat}/{slug}/similar/analysis  – jak zrobiły to podobne projekty
//   POST /innovations/analysis {name}                – to samo po nazwie (409 = nazwa niejednoznaczna → lista kandydatów)
//   POST /innovations/benchmark {description}        – porównanie WŁASNEGO pomysłu z przetestowanymi innowacjami
// Wyniki liczy LLM (kilkanaście sekund), więc dopiero po kliknięciu.
const zl = (x) => (x == null ? 'brak danych' : `${Math.round(x).toLocaleString('pl-PL')} zł`)

export default function AnalizyInnowacji({ w, opis, ograniczenia }) {
  const [wyniki, setWyniki] = useState({})   // { analiza | podobne | benchmark: dane }
  const [pracuje, setPracuje] = useState('')
  const [blad, setBlad] = useState('')
  const [kandydaci, setKandydaci] = useState([])
  const [idAnalizy, setIdAnalizy] = useState(String(w.zasob.id).includes('/') ? w.zasob.id : '')
  if (!aiDostepne) return null

  const zBiblioteki = w.zasob.typ === 'biblioteka'
  const wlasny = !zBiblioteki || !String(w.zasob.id).includes('/')   // pomysł mieszkańca albo wpis demo – nie ma go w serwisie

  const opisWlasny = () => {
    const sz = [`Gmina chce wdrożyć: ${w.zasob.tytul}.`, opis]
    if (ograniczenia?.budget !== '' && ograniczenia?.budget != null) sz.push(`Budżet gminy: ${ograniczenia.budget} zł.`)
    if (ograniczenia?.staff?.length) sz.push('Zespół: ' + ograniczenia.staff.map((s) => `${s.role} (${s.hours_per_week} godz./tydz.)`).join(', ') + '.')
    if (ograniczenia?.target_group) sz.push(`Odbiorcy: ${ograniczenia.target_group}.`)
    if (ograniczenia?.partners) sz.push(`Partnerzy: ${ograniczenia.partners}.`)
    return sz.filter(Boolean).join(' ').slice(0, 3000)
  }

  async function uruchom(klucz, metoda, sciezka, cialo) {
    setPracuje(klucz); setBlad(''); setKandydaci([])
    try {
      setWyniki((x) => ({ ...x, [klucz]: null }))
      const dane = await zapytaj(metoda, sciezka, cialo)
      setWyniki((x) => ({ ...x, [klucz]: dane }))
    } catch (e) {
      if (e.status === 409 && e.dane?.candidates) {
        setKandydaci(e.dane.candidates)
        setBlad(e.dane.detail)
      } else setBlad(e.message)
    } finally {
      setPracuje('')
    }
  }

  const analizaId = (id) => { setIdAnalizy(id); setKandydaci([]); uruchom('analiza', 'GET', `/innovations/${id}/analysis`) }
  const przycisk = 'min-h-11 px-4 rounded-lg border-2 border-ink font-bold text-[15px] disabled:opacity-50'

  return (
    <section aria-labelledby="h-wiedza" className="bg-white border border-line rounded-2xl p-6 mb-8 print:hidden">
      <h2 id="h-wiedza" className="font-display font-bold text-2xl mb-1">Czego uczą wcześniejsze wdrożenia</h2>
      <p className="text-muted mb-4 max-w-3xl">
        Analiza dokumentów ROPS: jak innowacje powstały, ile kosztowały i kogo angażowały. Przyda się przed ułożeniem planu.
      </p>

      <div className="flex flex-wrap gap-2">
        {idAnalizy ? (
          <>
            <button type="button" disabled={Boolean(pracuje)} onClick={() => analizaId(idAnalizy)} className={przycisk}>
              {pracuje === 'analiza' ? 'Analizuję…' : 'Jak powstała ta innowacja'}
            </button>
            <button type="button" disabled={Boolean(pracuje)} onClick={() => uruchom('podobne', 'GET', `/innovations/${idAnalizy}/similar/analysis`)} className={przycisk}>
              {pracuje === 'podobne' ? 'Porównuję…' : 'Jak zrobiły to podobne projekty'}
            </button>
          </>
        ) : zBiblioteki && (
          // Wpis demo: szukamy innowacji o tej nazwie w prawdziwej Bibliotece
          <button type="button" disabled={Boolean(pracuje)} onClick={() => uruchom('analiza', 'POST', '/innovations/analysis', { name: w.zasob.tytul })} className={przycisk}>
            {pracuje === 'analiza' ? 'Szukam i analizuję…' : 'Znajdź i przeanalizuj w Bibliotece ROPS'}
          </button>
        )}
        <button type="button" disabled={Boolean(pracuje)} onClick={() => uruchom('benchmark', 'POST', '/innovations/benchmark', { description: opisWlasny() })} className={przycisk}>
          {pracuje === 'benchmark' ? 'Porównuję…' : wlasny ? 'Porównaj nasz pomysł z przetestowanymi innowacjami' : 'Porównaj z naszymi zasobami'}
        </button>
      </div>
      {pracuje && <p role="status" className="mt-3 text-muted text-[15px]">To trwa zwykle kilkanaście sekund.</p>}

      <div aria-live="polite">
        {blad && <p role="alert" className="mt-3 font-bold text-[#9B1C1C]">{blad}</p>}
        {kandydaci.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {kandydaci.map((k) => (
              <li key={k.id}><button type="button" onClick={() => analizaId(k.id)} className={przycisk}>{k.title} <span className="font-normal text-muted">({k.category})</span></button></li>
            ))}
          </ul>
        )}
      </div>

      {wyniki.analiza && <Analiza a={wyniki.analiza} />}
      {wyniki.podobne && <Porownanie c={wyniki.podobne} tytul="Jak zrobiły to podobne projekty" />}
      {wyniki.benchmark && <Porownanie c={wyniki.benchmark} tytul="Nasz pomysł na tle przetestowanych innowacji" />}
    </section>
  )
}

function Lista({ tytul, pozycje }) {
  if (!pozycje?.length) return null
  return (
    <div>
      {tytul && <h4 className="font-bold">{tytul}</h4>}
      <ul className="list-disc pl-5 text-[15px]">{pozycje.map((p, i) => <li key={i}>{p}</li>)}</ul>
    </div>
  )
}

function Analiza({ a }) {
  const b = a.resources.budget
  return (
    <article className="mt-6 border-t border-line pt-5 flex flex-col gap-4" aria-label={`Analiza: ${a.title}`}>
      <div>
        <h3 className="font-display font-bold text-xl">{a.title}</h3>
        <p className="text-lg">{a.summary}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-ground p-4 flex flex-col gap-2">
          <h4 className="font-bold">Jak powstała</h4>
          {a.origin.problem && <p className="text-[15px]"><strong>Problem:</strong> {a.origin.problem.text}</p>}
          {a.origin.innovator && <p className="text-[15px]"><strong>Innowator:</strong> {a.origin.innovator.text}</p>}
          {a.origin.stages.length > 0 && (
            <ol className="list-decimal pl-5 text-[15px]">{a.origin.stages.map((s, i) => <li key={i}>{s.description}</li>)}</ol>
          )}
        </div>
        <div className="rounded-xl bg-ground p-4 flex flex-col gap-2">
          <h4 className="font-bold">Jakie środki wykorzystała</h4>
          <p className="text-[15px]"><strong>Budżet:</strong> {zl(b?.total_pln)}{b?.note && ` – ${b.note}`}</p>
          {b?.items.length > 0 && <ul className="list-disc pl-5 text-[15px]">{b.items.map((x, i) => <li key={i}>{x.name}: {zl(x.amount_pln)}</li>)}</ul>}
          <Lista tytul="Ludzie" pozycje={a.resources.staff.map((x) => x.text)} />
          <Lista tytul="Sprzęt" pozycje={a.resources.equipment.map((x) => x.text)} />
          <Lista tytul="Partnerzy" pozycje={a.resources.partners.map((x) => x.role ? `${x.name} – ${x.role}` : x.name)} />
        </div>
        <div className="rounded-xl bg-ground p-4 flex flex-col gap-2">
          <h4 className="font-bold">Gdzie była realizowana</h4>
          <Lista tytul="" pozycje={a.location.places.map((p) => `${p.name} (${p.role.replace('_', ' ')})`)} />
          {a.testing.participants_description || a.testing.duration || a.testing.results ? (
            <p className="text-[15px]">
              <strong>Testy:</strong> {[a.testing.participants_description, a.testing.duration, a.testing.results?.text].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-ground p-4 flex flex-col gap-2">
          <h4 className="font-bold">Przy powielaniu pamiętaj</h4>
          <Lista tytul="Wymagania" pozycje={a.replication.requirements.map((x) => x.text)} />
          <Lista tytul="Ryzyka" pozycje={a.replication.risks.map((x) => x.text)} />
        </div>
      </div>
      {a.warnings.length > 0 && <p className="text-sm text-clay-dark">Uwaga: {a.warnings.join(' ')}</p>}
      {a.sources.length > 0 && (
        <details>
          <summary className="font-bold cursor-pointer min-h-11 flex items-center">Źródła analizy ({a.sources.length})</summary>
          <ul className="flex flex-col gap-1 mt-1 text-[15px]">
            {a.sources.map((s) => <li key={s.id}><strong>[S{s.id}] {s.file || s.kind}{s.page ? `, s. ${s.page}` : ''}:</strong> {s.excerpt.slice(0, 220)}{s.excerpt.length > 220 && '…'}</li>)}
          </ul>
        </details>
      )}
    </article>
  )
}

function Porownanie({ c, tytul }) {
  return (
    <article className="mt-6 border-t border-line pt-5 flex flex-col gap-4" aria-label={tytul}>
      <h3 className="font-display font-bold text-xl">{tytul}</h3>
      <p className="text-lg">{c.overview}</p>
      <p className="rounded-xl bg-ground p-3 text-[15px]"><strong>Typowy budżet:</strong> {c.typical_budget}</p>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[560px] text-[15px] text-left">
          <caption className="sr-only">Porównane innowacje</caption>
          <thead><tr className="border-b-2 border-line"><th scope="col" className="p-2">Innowacja</th><th scope="col" className="p-2">Budżet</th><th scope="col" className="p-2">Uczestnicy</th><th scope="col" className="p-2">Czas</th><th scope="col" className="p-2">Partnerzy</th></tr></thead>
          <tbody>
            {c.compared.map((r) => (
              <tr key={r.id} className="border-b border-[#E6EAF0] align-top">
                <th scope="row" className="p-2 font-bold">{r.title}<span className="block font-normal text-sm text-muted">podobieństwo {Math.round(r.similarity * 100)}%</span></th>
                <td className="p-2">{zl(r.budget_pln)}</td>
                <td className="p-2">{r.participants ?? 'brak danych'}</td>
                <td className="p-2">{r.duration || 'brak danych'}</td>
                <td className="p-2">{r.partners.join(', ') || 'brak danych'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Lista tytul="Co się sprawdziło" pozycje={c.what_worked} />
        <Lista tytul="Wspólne ryzyka" pozycje={c.common_risks} />
        <Lista tytul="Typowi partnerzy" pozycje={c.common_partners} />
        <Lista tytul="Typowa obsada" pozycje={c.common_staff} />
        <Lista tytul="Typowe zasoby" pozycje={c.common_resources} />
        <Lista tytul="Rekomendacje" pozycje={c.recommendations} />
      </div>
    </article>
  )
}
