import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane, STATUSY_WDROZENIA } from '../data/DaneContext.jsx'
import { aiDostepne, BRAK_AI, zapytaj } from '../data/ai.js'

// Middleman Innowacji: gmina podaje swoje zasoby, AI (Backend/ai-service, POST /middleman/plan) układa plan wdrożenia
// innowacji z Biblioteki ROPS albo pomysłu mieszkańców. Kod serwisu pilnuje budżetu i godzin – plan nie udaje, że się da.
// Edytuje gmina, która zapisała; ROPS i eksperci widzą plan do konsultacji.

const WYKONALNOSC = {
  realne: { nazwa: 'Realne', opis: 'Mieści się w budżecie, czasie i liczbie ludzi.', klasa: 'bg-teal-light text-teal-dark border-teal' },
  realne_po_uproszczeniu: { nazwa: 'Realne po uproszczeniu', opis: 'Trzeba coś okroić – zobacz „Co zmieniamy”.', klasa: 'bg-clay-light text-clay-dark border-clay' },
  nierealne: { nazwa: 'Nierealne w tych warunkach', opis: 'Zobacz, czego brakuje i jaka jest najmniejsza sensowna wersja.', klasa: 'bg-[#FDE2E1] text-[#9B1C1C] border-[#9B1C1C]' },
}
const ZRODLA = { budzet_gminy: 'Budżet gminy', partner: 'Partner', grant: 'Grant', wolontariat: 'Wolontariat' }
const ROLE = { pracownik: 'pracownik gminy', wolontariusz: 'wolontariusz', partner: 'partner' }
const PUSTE = { budget: '', staff: [{ role: 'koordynator (pracownik gminy)', hours_per_week: 8 }], months: 6, target_group: '', partners: '', resources: '', notes: '' }
const zl = (x) => `${Math.round(x || 0).toLocaleString('pl-PL')} zł`

export default function Wdrozenie() {
  const { id } = useParams()
  const { uzytkownik: ja } = useAuth()
  const { wdrozenia } = useDane()
  const w = wdrozenia.find((x) => x.id === id)
  if (!w) return <Brak tekst="Nie ma takiego wdrożenia – zapisz innowację albo pomysł z Zasobnika." />
  const wlasciciel = w.gminaId === ja.id
  if (!wlasciciel && !['rops_admin', 'ekspert'].includes(ja.rola)) return <Brak tekst="To wdrożenie należy do innej gminy." />
  return <Edytor key={w.id} w={w} edycja={wlasciciel} />
}

function Edytor({ w, edycja }) {
  const { uzytkownik: ja } = useAuth()
  const { fiszki, zapiszPlanWdrozenia, zmienStatusWdrozenia, usunWdrozenie, wyslijWdrozenieDoROPS } = useDane()
  const navigate = useNavigate()
  const [ograniczenia, setOgraniczenia] = useState(w.ograniczenia || PUSTE)
  const [communeId, setCommuneId] = useState(w.communeId || '')
  const [gminy, setGminy] = useState([])
  const [zasob, setZasob] = useState(null)        // opis innowacji / pomysłu do pokazania
  const [polecenie, setPolecenie] = useState('')
  const [pracuje, setPracuje] = useState('')
  const [blad, setBlad] = useState('')
  const [komunikat, setKomunikat] = useState('')
  const plan = w.plan

  const fiszka = w.zasob.typ === 'fiszka' ? fiszki.find((f) => String(f.id) === String(w.zasob.id)) : null
  useEffect(() => {
    if (w.zasob.typ === 'biblioteka' && aiDostepne) {
      zapytaj('GET', '/innovations/' + w.zasob.id).then(setZasob, (e) => setBlad(e.message))
    }
  }, [w.zasob])
  useEffect(() => {
    if (aiDostepne && ja.powiat) zapytaj('GET', '/observer/communes?county=' + encodeURIComponent(ja.powiat)).then(setGminy, () => {})
  }, [ja.powiat])

  const ustaw = (k, v) => setOgraniczenia((o) => ({ ...o, [k]: v }))
  const ustawOsobe = (i, k, v) => ustaw('staff', ograniczenia.staff.map((s, j) => (j === i ? { ...s, [k]: v } : s)))

  // Walidacja jak w serwisie (model/middleman.py) + ostrzeżenia o sprzecznościach
  const budzet = ograniczenia.budget === '' ? NaN : Number(ograniczenia.budget)
  const bledy = [
    !(budzet >= 0) && 'Podaj budżet gminy (może być 0 zł).',
    !(ograniczenia.months >= 1 && ograniczenia.months <= 36) && 'Czas wdrożenia: od 1 do 36 miesięcy.',
    ograniczenia.staff.some((s) => s.role.trim().length < 2) && 'Każda osoba w zespole potrzebuje nazwy roli.',
    ograniczenia.staff.some((s) => !(s.hours_per_week >= 0 && s.hours_per_week <= 40)) && 'Godziny pracownika: od 0 do 40 tygodniowo.',
  ].filter(Boolean)
  const ostrzezenia = [
    ograniczenia.staff.some((s) => Number(s.hours_per_week) === 0) && 'Ktoś w zespole ma 0 godzin tygodniowo – nie będzie miał czasu na wdrożenie.',
    budzet === 0 && 'Budżet 0 zł: plan oprze się na partnerach, wolontariacie albo grancie – albo wyjdzie „nierealny”.',
    ograniczenia.staff.length === 0 && 'Bez pracowników gminy całość musi wziąć na siebie partner albo wolontariusze.',
  ].filter(Boolean)

  const zrodlo = () => (w.zasob.typ === 'biblioteka'
    ? { type: 'library', id: w.zasob.id }
    : { type: 'idea', title: fiszka?.tytul || w.zasob.tytul, problem: fiszka?.problem || '', description: fiszka?.opis || w.zasob.tytul })
  const cialo = () => ({
    source: zrodlo(), commune_id: communeId ? Number(communeId) : null,
    constraints: { ...ograniczenia, budget: budzet, months: Number(ograniczenia.months),
      staff: ograniczenia.staff.map((s) => ({ role: s.role.trim(), hours_per_week: Number(s.hours_per_week) })) },
  })

  async function wykonaj(nazwa, sciezka, dodatkowo = {}) {
    setPracuje(nazwa); setBlad(''); setKomunikat('')
    try {
      const nowy = await zapytaj('POST', sciezka, { ...cialo(), ...dodatkowo })
      zapiszPlanWdrozenia(w.id, { ograniczenia, communeId: communeId || null, plan: nowy, polecenie: dodatkowo.instruction })
      setKomunikat(dodatkowo.instruction ? 'Plan poprawiony i zapisany.' : 'Plan gotowy i zapisany w Panelu gminy.')
      setPolecenie('')
    } catch (e) {
      setBlad(e.message)
    } finally {
      setPracuje('')
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <nav aria-label="Ścieżka" className="text-[15px] mb-4 print:hidden"><Link to="/panel">{edycja ? 'Panel gminy' : 'Panel'}</Link> <span className="text-muted">› Wdrożenie</span></nav>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div className="max-w-3xl">
          <p className="font-bold text-clay mb-1">Middleman Innowacji · {w.zasob.typ === 'biblioteka' ? 'innowacja z Biblioteki ROPS' : 'pomysł mieszkańców'}</p>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-2">{w.zasob.tytul}</h1>
          <p className="text-muted">{edycja ? 'Podaj, czym dysponuje gmina – Middleman dopasuje wdrożenie do Waszych realiów.' : `Plan gminy: ${w.gmina} (pow. ${w.powiat}).`}</p>
        </div>
        <span className={'px-3 py-1 rounded-full text-sm font-bold ' + STATUSY_WDROZENIA[w.status].klasa}>{STATUSY_WDROZENIA[w.status].nazwa}</span>
      </div>

      <OpisZasobu w={w} zasob={zasob} fiszka={fiszka} />

      <div aria-live="polite" className="print:hidden">
        {komunikat && <p role="status" className="mb-4 px-4 py-3 rounded-xl bg-teal-light text-teal-dark font-bold">{komunikat}</p>}
        {blad && <p role="alert" className="mb-4 px-4 py-3 rounded-xl bg-[#FDE2E1] text-[#9B1C1C] font-bold">{blad}</p>}
      </div>

      {edycja && (
        <form onSubmit={(e) => { e.preventDefault(); wykonaj('plan', '/middleman/plan') }} className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-5 mb-8 print:hidden">
          <h2 className="font-display font-bold text-2xl">Czym dysponuje gmina?</h2>
          {!aiDostepne && <p role="status" className="px-4 py-3 rounded-xl bg-clay-light text-clay-dark font-bold">{BRAK_AI}</p>}
          <fieldset disabled={!aiDostepne || Boolean(pracuje)} className="flex flex-col gap-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1 font-bold">
                Budżet gminy (zł)
                <input type="number" min="0" step="100" required value={ograniczenia.budget} onChange={(e) => ustaw('budget', e.target.value)} className="min-h-12 px-3 rounded-xl border-2 border-line font-normal" />
              </label>
              <label className="flex flex-col gap-1 font-bold">
                Czas wdrożenia (miesiące)
                <input type="number" min="1" max="36" value={ograniczenia.months} onChange={(e) => ustaw('months', e.target.value)} className="min-h-12 px-3 rounded-xl border-2 border-line font-normal" />
              </label>
              <label className="flex flex-col gap-1 font-bold">
                Gmina (dane z Obserwatora)
                <select value={communeId} onChange={(e) => setCommuneId(e.target.value)} className="min-h-12 px-3 rounded-xl border-2 border-line font-normal bg-white">
                  <option value="">{gminy.length ? 'Wybierz gminę (opcjonalnie)' : 'Bez danych gminy'}</option>
                  {gminy.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="font-bold mb-2">Pracownicy gminy przy wdrożeniu</legend>
              <ul className="flex flex-col gap-2">
                {ograniczenia.staff.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-end gap-2">
                    <label className="flex flex-col gap-1 flex-[1_1_240px] text-[15px]">
                      Rola<input value={s.role} onChange={(e) => ustawOsobe(i, 'role', e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0]" />
                    </label>
                    <label className="flex flex-col gap-1 w-36 text-[15px]">
                      Godz. tygodniowo<input type="number" min="0" max="40" value={s.hours_per_week} onChange={(e) => ustawOsobe(i, 'hours_per_week', e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0]" />
                    </label>
                    <button type="button" onClick={() => ustaw('staff', ograniczenia.staff.filter((_, j) => j !== i))} className="min-h-11 px-3 rounded-lg border-2 border-line font-bold text-sm">
                      Usuń<span className="sr-only"> osobę {i + 1}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => ustaw('staff', [...ograniczenia.staff, { role: '', hours_per_week: 4 }])} className="mt-2 min-h-11 px-4 rounded-lg border-2 border-ink font-bold text-[15px]">+ Dodaj osobę</button>
            </fieldset>

            <div className="grid sm:grid-cols-2 gap-4">
              <Pole etykieta="Dla kogo i ilu osób?" podpowiedz="Np. 30 seniorów z trzech sołectw" wartosc={ograniczenia.target_group} onZmiana={(v) => ustaw('target_group', v)} limit={500} />
              <Pole etykieta="Partnerzy" podpowiedz="Np. OSP, szkoła, koło gospodyń, parafia" wartosc={ograniczenia.partners} onZmiana={(v) => ustaw('partners', v)} limit={1000} />
              <Pole etykieta="Co już macie" podpowiedz="Np. sala w świetlicy, bus gminny, 2 laptopy" wartosc={ograniczenia.resources} onZmiana={(v) => ustaw('resources', v)} limit={1000} />
              <Pole etykieta="Uwagi" podpowiedz="Np. teren górzysty, dużo osób bez internetu" wartosc={ograniczenia.notes} onZmiana={(v) => ustaw('notes', v)} limit={2000} />
            </div>
          </fieldset>

          {bledy.length > 0 && <ul className="text-[15px] font-bold text-[#9B1C1C] list-disc pl-5">{bledy.map((b) => <li key={b}>{b}</li>)}</ul>}
          {ostrzezenia.length > 0 && <ul className="text-[15px] text-clay-dark list-disc pl-5">{ostrzezenia.map((o) => <li key={o}>{o}</li>)}</ul>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!aiDostepne || bledy.length > 0 || Boolean(pracuje)} className="min-h-12 px-6 rounded-xl bg-clay text-white font-bold disabled:opacity-50">
              {pracuje === 'plan' ? 'Middleman układa plan…' : plan ? 'Przygotuj plan od nowa' : 'Przygotuj plan wdrożenia'}
            </button>
            {pracuje === 'plan' && <span className="text-muted text-[15px]">To trwa zwykle kilkanaście sekund.</span>}
          </div>
        </form>
      )}

      {plan && <WidokPlanu plan={plan} budzet={Number(w.ograniczenia?.budget ?? budzet)} />}
      {!plan && !edycja && <p className="text-muted">Gmina nie przygotowała jeszcze planu.</p>}

      {plan && edycja && (
        <section className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 mt-8 print:hidden">
          <form onSubmit={(e) => { e.preventDefault(); wykonaj('popraw', '/middleman/plan/revise', { previous: plan, instruction: polecenie.trim() }) }} className="flex flex-col gap-2">
            <label htmlFor="polecenie" className="font-bold">Popraw plan poleceniem</label>
            <div className="flex flex-wrap gap-2">
              <input id="polecenie" value={polecenie} onChange={(e) => setPolecenie(e.target.value)} maxLength={500} placeholder="Np. bez samochodu, taniej o 20%, start dopiero od stycznia"
                className="flex-[1_1_320px] min-h-12 px-4 rounded-xl border-2 border-line" />
              <button type="submit" disabled={!aiDostepne || polecenie.trim().length < 3 || Boolean(pracuje)} className="min-h-12 px-5 rounded-xl bg-ink text-white font-bold disabled:opacity-50">
                {pracuje === 'popraw' ? 'Poprawiam…' : 'Popraw'}
              </button>
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <label className="flex items-center gap-2 font-bold">
              Status
              <select value={w.status} onChange={(e) => zmienStatusWdrozenia(w.id, e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal bg-white">
                {Object.entries(STATUSY_WDROZENIA).map(([k, s]) => <option key={k} value={k}>{s.nazwa}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => window.print()} className="min-h-11 px-4 rounded-lg border-2 border-ink font-bold">Drukuj / zapisz PDF</button>
            <button type="button" onClick={() => { wyslijWdrozenieDoROPS(w.id); setKomunikat('Plan wysłany do ROPS – dostaniecie odpowiedź w powiadomieniach.') }} className="min-h-11 px-4 rounded-lg border-2 border-ink font-bold">
              {w.wyslanoDoROPS ? 'Wyślij ponownie do ROPS' : 'Poproś ROPS o konsultację'}
            </button>
            <button type="button" onClick={() => { usunWdrozenie(w.id); navigate('/panel') }} className="min-h-11 px-4 rounded-lg font-bold text-[#9B1C1C]">Usuń z listy</button>
          </div>
          {w.wersje?.length > 1 && <p className="text-sm text-muted">Poprzednie wersje planu: {w.wersje.length - 1} (zapisane przy poprawkach).</p>}
        </section>
      )}
    </main>
  )
}

function OpisZasobu({ w, zasob, fiszka }) {
  if (w.zasob.typ === 'fiszka') {
    if (!fiszka) return null
    return (
      <section className="bg-ground rounded-2xl p-5 mb-6 flex flex-col gap-1 print:hidden">
        <p><strong>Problem:</strong> {fiszka.problem}</p>
        <p><strong>Pomysł:</strong> {fiszka.opis}</p>
        <Link to={'/pomysl/' + fiszka.id} className="font-bold min-h-11 inline-flex items-center">Wątek pomysłu →</Link>
      </section>
    )
  }
  if (!zasob) return null
  return (
    <section className="bg-ground rounded-2xl p-5 mb-6 flex flex-col gap-2 print:hidden">
      <p className="text-sm font-bold text-teal">{zasob.category}</p>
      <p className="line-clamp-4">{zasob.description}</p>
      <p className="text-sm text-muted">Materiały ROPS: {zasob.materials.length ? zasob.materials.map((m) => m.file).join(', ') : 'brak'} – Middleman bierze z nich fragmenty do planu.</p>
      <a href={zasob.url} target="_blank" rel="noreferrer" className="font-bold min-h-11 inline-flex items-center">Pełny opis na stronie ROPS<span className="sr-only"> (nowa karta)</span> →</a>
    </section>
  )
}

function WidokPlanu({ plan, budzet }) {
  const wyk = WYKONALNOSC[plan.feasibility]
  return (
    <article className="flex flex-col gap-6" aria-labelledby="plan-tytul">
      <div className={'rounded-2xl border-2 p-5 ' + wyk.klasa}>
        <p className="text-sm font-bold uppercase tracking-wider">Ocena wykonalności</p>
        <p className="font-display font-extrabold text-2xl">{wyk.nazwa}</p>
        <p>{wyk.opis}</p>
      </div>

      <section className="bg-white border border-line rounded-2xl p-6">
        <h2 id="plan-tytul" className="font-display font-bold text-2xl mb-2">{plan.title}</h2>
        <p className="text-lg">{plan.summary}</p>
      </section>

      {(plan.gaps.length > 0 || plan.minimum) && (
        <Sekcja tytul="Czego brakuje, żeby to zadziałało">
          {plan.gaps.length > 0 && <ul className="list-disc pl-5">{plan.gaps.map((g) => <li key={g}>{g}</li>)}</ul>}
          {plan.minimum && (
            <p className="mt-2 rounded-xl bg-ground p-3">
              <strong>Najmniejsza sensowna wersja:</strong> {plan.minimum.description}
              {plan.minimum.budget != null && ` · budżet od ${zl(plan.minimum.budget)}`}
              {plan.minimum.staff != null && ` · osób: ${plan.minimum.staff}`}
              {plan.minimum.months != null && ` · miesięcy: ${plan.minimum.months}`}
            </p>
          )}
        </Sekcja>
      )}

      {plan.adaptations.length > 0 && (
        <Sekcja tytul="Co zmieniamy względem oryginału">
          <ul className="flex flex-col gap-2">{plan.adaptations.map((a, i) => <li key={i}><strong>{a.change}</strong> – {a.reason}</li>)}</ul>
        </Sekcja>
      )}

      <Sekcja tytul="Krok po kroku">
        <ol className="flex flex-col gap-3">
          {plan.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[110px_1fr] gap-3 border-b border-[#E6EAF0] last:border-0 pb-3">
              <span className="font-bold text-muted">{s.week_from === s.week_to ? `Tydz. ${s.week_from}` : `Tydz. ${s.week_from}–${s.week_to}`}</span>
              <span>
                <strong className="block">{s.title}</strong>
                <ul className="list-disc pl-5 text-[15px]">{s.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                <span className="text-sm text-muted">Odpowiada: {s.owner}</span>
              </span>
            </li>
          ))}
        </ol>
      </Sekcja>

      {plan.roles.length > 0 && (
        <Sekcja tytul={`Kto co robi (pracownicy gminy: ${plan.staff_hours_used} godz. tygodniowo)`}>
          <ul className="grid sm:grid-cols-2 gap-3">
            {plan.roles.map((r, i) => (
              <li key={i} className="rounded-xl bg-ground p-3">
                <strong>{r.who}</strong> <span className="text-sm text-muted">· {ROLE[r.type]} · {r.hours_per_week} godz./tydz.</span>
                <ul className="list-disc pl-5 text-[15px]">{r.tasks.map((t) => <li key={t}>{t}</li>)}</ul>
              </li>
            ))}
          </ul>
        </Sekcja>
      )}

      <Sekcja tytul="Budżet">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[520px] text-[15px] text-left">
            <thead><tr className="border-b-2 border-line"><th scope="col" className="p-2">Pozycja</th><th scope="col" className="p-2">Źródło</th><th scope="col" className="p-2 text-right">Kwota</th></tr></thead>
            <tbody>
              {plan.budget.map((b, i) => (
                <tr key={i} className="border-b border-[#E6EAF0]">
                  <td className="p-2">{b.item}{b.note && <span className="block text-sm text-muted">{b.note}</span>}</td>
                  <td className="p-2">{ZRODLA[b.source]}</td>
                  <td className="p-2 text-right tabular-nums">{zl(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={'mt-3 font-bold ' + (plan.within_budget ? 'text-teal-dark' : 'text-[#9B1C1C]')}>
          Z budżetu gminy: {zl(plan.municipal_budget_used)} z {zl(budzet)} {plan.within_budget ? '✓ mieści się' : '– przekracza budżet'}
        </p>
        {Object.entries(plan.budget_by_source).filter(([k]) => k !== 'budzet_gminy').length > 0 && (
          <p className="text-[15px] text-muted">Poza budżetem gminy: {Object.entries(plan.budget_by_source).filter(([k]) => k !== 'budzet_gminy').map(([k, v]) => `${ZRODLA[k]} ${zl(v)}`).join(' · ')}</p>
        )}
      </Sekcja>

      <div className="grid md:grid-cols-2 gap-6">
        <Sekcja tytul="Ryzyka"><ul className="list-disc pl-5">{plan.risks.map((r) => <li key={r}>{r}</li>)}</ul></Sekcja>
        <Sekcja tytul="Jak sprawdzić, że działa"><ul className="list-disc pl-5">{plan.kpis.map((k) => <li key={k}>{k}</li>)}</ul></Sekcja>
      </div>

      {plan.local_context.length > 0 && (
        <Sekcja tytul="Dane gminy (Obserwator Statystyk Społecznych ROPS)">
          <ul className="list-disc pl-5 text-[15px]">
            {plan.local_context.map((x) => <li key={x.name}>{x.name}: <strong>{x.value} {x.unit}</strong> ({x.year}{x.comparison ? `, ${x.comparison}` : ''})</li>)}
          </ul>
        </Sekcja>
      )}

      {(plan.sources.length > 0 || plan.checks.length > 0) && (
        <details className="bg-white border border-line rounded-2xl p-5">
          <summary className="font-bold cursor-pointer min-h-11 flex items-center">Na czym oparto plan</summary>
          {plan.sources.length > 0 && (
            <ul className="flex flex-col gap-2 mt-2 text-[15px]">
              {plan.sources.map((s, i) => <li key={i}><span className="font-bold">{s.file}{s.page ? `, s. ${s.page}` : ''}:</span> {s.text.slice(0, 300)}{s.text.length > 300 && '…'}</li>)}
            </ul>
          )}
          {plan.checks.length > 0 && <p className="mt-2 text-sm text-muted">Kontrole serwisu: {plan.checks.join(' ')}</p>}
          <p className="mt-2 text-sm text-muted">Model: {plan.model}. Plan to propozycja – sprawdź kwoty z lokalnymi cenami.</p>
        </details>
      )}
    </article>
  )
}

function Sekcja({ tytul, children }) {
  return (
    <section className="bg-white border border-line rounded-2xl p-6">
      <h2 className="font-display font-bold text-xl mb-3">{tytul}</h2>
      {children}
    </section>
  )
}

function Pole({ etykieta, podpowiedz, wartosc, onZmiana, limit }) {
  return (
    <label className="flex flex-col gap-1 font-bold">
      {etykieta}
      <textarea rows={2} value={wartosc} maxLength={limit} placeholder={podpowiedz} onChange={(e) => onZmiana(e.target.value)} className="p-3 rounded-xl border-2 border-line font-normal resize-y" />
    </label>
  )
}

function Brak({ tekst }) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display font-extrabold text-3xl mb-3">{tekst}</h1>
      <Link to="/zasobnik?dzial=biblioteka">← Biblioteka Innowacji</Link>
    </main>
  )
}
