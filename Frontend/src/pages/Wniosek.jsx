import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { wypelnijZFiszki, naborOtwarty } from '../data/nabory.js'
import { prowadzi } from '../data/watekFiszki.js'
import { canvaZFiszki, brakujaceSekcje } from '../data/canva.js'
import CanvaFormularz from '../components/CanvaFormularz.jsx'
import WzorWniosku from '../components/WzorWniosku.jsx'

// Wniosek do naboru w dwóch krokach:
// 1. Canva innowacji (część odpowiedzi z fiszki) → 2. formularz naboru wypełniony z fiszki + Canvy.
// Fiszkę można dodać zawsze; wniosek (i Canva) tylko w trakcie naboru.
export default function Wniosek() {
  const { fiszkaId, naborId } = useParams()
  const { fiszki, nabory, wnioski, zapiszWniosek, zlozWniosek } = useDane()
  const { uzytkownik } = useAuth()
  const navigate = useNavigate()

  const fiszka = fiszki.find((f) => String(f.id) === fiszkaId)
  const nabor = nabory.find((n) => n.id === naborId)
  const id = `w-${fiszkaId}-${naborId}`
  const zapisany = wnioski.find((w) => w.id === id)

  const [canva, setCanva] = useState(() => zapisany?.canva || (fiszka ? canvaZFiszki(fiszka) : {}))
  const [pola, setPola] = useState(() => zapisany?.pola || {})
  const [krok, setKrok] = useState(() => (zapisany?.pola ? 'formularz' : 'canva'))
  const [komunikat, setKomunikat] = useState('')

  if (!fiszka || !nabor) return <Brak tekst="Nie znaleziono fiszki lub naboru." />
  // Wniosek przygotowuje prowadzący: autor albo gmina, która przejęła pomysł
  if (!prowadzi(fiszka, uzytkownik) && uzytkownik.rola !== 'rops_admin') return <Brak tekst="Wniosek może przygotować tylko osoba prowadząca pomysł." />

  const tylkoOdczyt = zapisany && zapisany.status !== 'szkic'
  const brakCanvy = brakujaceSekcje(canva)

  // Puste pola formularza uzupełniamy z fiszki i Canvy; tego, co autor już wpisał, nie ruszamy
  const doFormularza = () => {
    setPola((stare) => Object.fromEntries(nabor.pola.map((p) => [p.id, (stare[p.id] || '').trim() ? stare[p.id] : wypelnijZFiszki(p.zrodlo, fiszka, canva)])))
    setKrok('formularz')
    window.scrollTo(0, 0)
  }

  const problemy = nabor.pola.flatMap((p) => {
    const t = (pola[p.id] || '').trim()
    if (!t) return [{ pole: p, tekst: 'jest puste' }]
    if (t.length > p.limit) return [{ pole: p, tekst: `przekracza limit o ${t.length - p.limit} znaków` }]
    if (t.length < 150) return [{ pole: p, tekst: 'jest bardzo krótkie – rozwiń je' }]
    return []
  })
  const blokujace = problemy.filter((x) => x.tekst !== 'jest bardzo krótkie – rozwiń je')
  const moznaZlozyc = blokujace.length === 0 && brakCanvy.length === 0 && naborOtwarty(nabor)

  // Docelowo: PUT /api/wnioski/:id (szkic) i POST /api/wnioski/:id/zloz
  const dane = () => ({ id, fiszkaId: fiszka.id, naborId: nabor.id, autorId: zapisany?.autorId || (uzytkownik.rola === 'rops_admin' ? fiszka.autorId : uzytkownik.id), autor: zapisany?.autor || (uzytkownik.rola === 'rops_admin' ? fiszka.autor : uzytkownik.imie), tytul: fiszka.tytul, pola, canva })
  const zapisz = () => {
    zapiszWniosek(dane())
    setKomunikat('Szkic zapisany.')
  }
  const zloz = () => {
    zapiszWniosek(dane())
    zlozWniosek(id)
    navigate('/panel')
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <nav aria-label="Ścieżka" className="text-[15px] mb-4"><Link to="/panel">Moje sprawy</Link> <span className="text-muted">› Wniosek</span></nav>
      <div className="mb-6 max-w-3xl">
        <p className="font-bold text-clay mb-1">{nabor.nazwa}</p>
        <h1 className="font-display font-extrabold text-4xl tracking-tight mb-2">Wniosek: {fiszka.tytul}</h1>
        <p className="text-muted">
          Najpierw rozpisz pomysł na Canvie innowacji, potem sprawdź formularz naboru – wypełnimy go z fiszki i Canvy. Termin: <strong className="text-ink">{new Date(nabor.termin).toLocaleDateString('pl-PL')}</strong>.
        </p>
        {nabor.wzor && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <WzorWniosku nabor={nabor} />
            <span className="text-[15px] text-muted">Oficjalny formularz ROPS – treść z Canvy i formularza poniżej przeniesiesz do niego.</span>
          </div>
        )}
        {tylkoOdczyt && <p role="status" className="mt-3 px-4 py-3 rounded-xl bg-teal-light text-teal-dark font-bold">Wniosek złożony – status: {zapisany.status}.</p>}
      </div>

      {/* Kroki */}
      <ol aria-label="Kroki wniosku" className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'canva', nazwa: '1. Canva innowacji', ok: brakCanvy.length === 0 },
          { id: 'formularz', nazwa: '2. Formularz wniosku', ok: blokujace.length === 0 && Object.keys(pola).length > 0 },
        ].map((k) => (
          <li key={k.id}>
            <button
              type="button"
              onClick={() => (k.id === 'formularz' ? doFormularza() : setKrok('canva'))}
              aria-current={krok === k.id ? 'step' : undefined}
              className={'min-h-11 px-4 rounded-full font-bold ' + (krok === k.id ? 'bg-ink text-white' : 'bg-white border-2 border-line text-ink')}
            >
              {k.ok && '✓ '}{k.nazwa}
            </button>
          </li>
        ))}
      </ol>

      {krok === 'canva' ? (
        <CanvaFormularz
          odpowiedzi={canva}
          onZmiana={(pid, v) => setCanva((c) => ({ ...c, [pid]: v }))}
          tylkoOdczyt={tylkoOdczyt}
          przyciskKoncowy={
            <button type="button" onClick={doFormularza} className="min-h-12 px-5.5 rounded-xl bg-clay text-white font-bold">
              Dalej: formularz wniosku →
            </button>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-8 items-start">
          <form onSubmit={(e) => e.preventDefault()} className="flex-[999_1_560px] min-w-0 flex flex-col gap-6">
            {nabor.pola.map((p) => {
              const dl = (pola[p.id] || '').length
              const zaDuzo = dl > p.limit
              return (
                <div key={p.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-2">
                  <label htmlFor={'pole-' + p.id} className="font-bold text-lg">{p.etykieta}</label>
                  <textarea
                    id={'pole-' + p.id}
                    rows={5}
                    value={pola[p.id] || ''}
                    readOnly={tylkoOdczyt}
                    onChange={(e) => setPola({ ...pola, [p.id]: e.target.value })}
                    aria-describedby={'licznik-' + p.id}
                    className="p-3.5 rounded-xl border border-[#B8C2D0] resize-y read-only:bg-ground"
                  />
                  <p id={'licznik-' + p.id} className={'text-sm text-right ' + (zaDuzo ? 'text-[#9B1C1C] font-bold' : 'text-muted')}>
                    {dl} / {p.limit} znaków{zaDuzo && ' – za dużo'}
                  </p>
                </div>
              )
            })}

            {!tylkoOdczyt && (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setKrok('canva')} className="min-h-12 px-5 rounded-xl border-2 border-line font-bold">← Canva</button>
                <button type="button" onClick={zapisz} className="min-h-12 px-5 rounded-xl border-2 border-ink font-bold">Zapisz szkic</button>
                <button type="button" onClick={zloz} disabled={!moznaZlozyc} className="min-h-12 px-6 rounded-xl bg-clay text-white font-bold disabled:opacity-50">
                  Złóż wniosek
                </button>
                {komunikat && <span role="status" className="text-teal-dark font-bold">{komunikat}</span>}
                {!moznaZlozyc && <span className="text-muted text-[15px]">Uzupełnij Canvę i puste pola, popraw limity – wtedy złożysz.</span>}
              </div>
            )}
          </form>

          <aside aria-label="Asystent wniosku" className="flex-[1_1_300px] min-w-0 bg-ink text-white rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6">
            <h2 className="font-display text-xl font-bold">Asystent wniosku</h2>
            <div className="bg-[#1C2E52] rounded-xl p-4">
              <p className="font-bold mb-2">Kryteria naboru</p>
              <p className="text-[15px] text-white/85">{nabor.kryteria}</p>
            </div>
            {brakCanvy.length > 0 && (
              <div className="bg-[#1C2E52] rounded-xl p-4">
                <p className="font-bold mb-2">Canva niekompletna</p>
                <p className="text-[15px] text-white/85 mb-2">Brakuje: {brakCanvy.map((s) => s.nazwa).join(', ')}.</p>
                <button type="button" onClick={() => setKrok('canva')} className="text-[#5CC8A8] font-bold">Wróć do Canvy →</button>
              </div>
            )}
            <div className="bg-[#1C2E52] rounded-xl p-4">
              <p className="font-bold mb-2">{problemy.length ? 'Do poprawy' : 'Wszystkie pola wyglądają dobrze'}</p>
              <ul className="flex flex-col gap-1.5 text-[15px]">
                {problemy.map((x) => (
                  <li key={x.pole.id}><a href={'#pole-' + x.pole.id} className="text-[#5CC8A8] font-bold">{x.pole.etykieta}</a> {x.tekst}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-white/70">
              Przeredagowanie pól pod kryteria przez AI pojawi się po podłączeniu serwisu asystenta (POST /api/asystent/wniosek).
            </p>
          </aside>
        </div>
      )}
    </main>
  )
}

function Brak({ tekst }) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display font-extrabold text-3xl mb-3">{tekst}</h1>
      <Link to="/panel">← Wróć do panelu</Link>
    </main>
  )
}
