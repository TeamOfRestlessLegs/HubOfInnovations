import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ETAPY } from '../data/etapy.js'
import { GRUPY } from '../data/fiszka.js'
import { useDane, opublikowane } from '../data/DaneContext.jsx'
import { naborOtwarty } from '../data/nabory.js'
import WzorWniosku from '../components/WzorWniosku.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import SzczegolyFiszki from '../components/SzczegolyFiszki.jsx'
import PasekEtapu from '../components/PasekEtapu.jsx'

// Mieszkaniec sam deklaruje tylko etap 1–2; wyższe wymagają dowodu i zgody ROPS
const MAX_ETAP_AUTORA = 2
const KROKI = ['Problem i dla kogo', 'Twój pomysł', 'Sprawdź i wyślij']

// Fiszka = 6 pól: opis problemu, grupa (wybór + własny tekst), nazwa, krótki opis, etap, istota (nowość).
const PUSTA = { problem: '', grupy: [], grupaInna: '', tytul: '', opis: '', etap: 1, istota: '' }

// Kreator ma dwa tryby: fiszka (zawsze) i wniosek do naboru (tylko gdy ROPS ma otwarty nabór)
export default function Kreator() {
  const { nabory } = useDane()
  const otwarte = nabory.filter(naborOtwarty)
  const [tryb, setTryb] = useState('fiszka')

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <div role="tablist" aria-label="Tryb kreatora" className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#E6EAF0]">
          <button role="tab" aria-selected={tryb === 'fiszka'} onClick={() => setTryb('fiszka')}
            className={'min-h-11 px-4 rounded-lg font-bold ' + (tryb === 'fiszka' ? 'bg-white' : '')}>
            Fiszka pomysłu
          </button>
          <button role="tab" aria-selected={tryb === 'wniosek'} onClick={() => setTryb('wniosek')} disabled={!otwarte.length}
            className={'min-h-11 px-4 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 ' + (tryb === 'wniosek' ? 'bg-white' : '')}>
            Wniosek do naboru
            <span className={'px-2 rounded-full text-xs text-white ' + (otwarte.length ? 'bg-clay' : 'bg-muted')}>
              {otwarte.length ? `${otwarte.length} otwarty` : 'brak naborów'}
            </span>
          </button>
        </div>
      </div>
      {tryb === 'fiszka' ? <KreatorFiszki /> : <WyborNaboru nabory={otwarte} />}
    </>
  )
}

// Tryb 2: wybór naboru i fiszki, z której powstanie wniosek
function WyborNaboru({ nabory }) {
  const { fiszki } = useDane()
  const { uzytkownik } = useAuth()
  const moje = opublikowane(fiszki).filter((f) => f.autorId === uzytkownik.id)

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="font-display font-extrabold text-4xl mb-2">Wniosek do naboru</h1>
        <p className="text-muted text-lg">Wniosek powstaje z Twojej zatwierdzonej fiszki – pola wypełnią się same, a potem dopasujesz je do kryteriów naboru.</p>
      </div>
      {nabory.map((n) => (
        <section key={n.id} className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-3">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="font-display font-bold text-2xl">{n.nazwa}</h2>
            <span className="px-3 py-1 rounded-full bg-clay-light text-clay-dark font-bold text-sm self-start">do {new Date(n.termin).toLocaleDateString('pl-PL')}</span>
          </div>
          <p>{n.opis}</p>
          <p className="text-[15px] text-muted"><strong className="text-ink">Kryteria:</strong> {n.kryteria}</p>
          {n.wzor && <div><WzorWniosku nabor={n} /></div>}
          <div className="border-t border-line pt-3">
            <p className="font-bold mb-2">Z której fiszki przygotować wniosek?</p>
            {moje.length === 0 ? (
              <p className="text-muted">Nie masz jeszcze zatwierdzonej fiszki. Najpierw zgłoś pomysł – po weryfikacji ROPS wrócisz tutaj.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {moje.map((f) => (
                  <li key={f.id}>
                    <Link to={`/wniosek/${f.id}/${n.id}`} className="flex justify-between items-center gap-3 min-h-12 px-4 rounded-xl border-2 border-line no-underline text-ink hover:border-ink">
                      <span className="font-bold">{f.tytul}</span>
                      <span className="text-teal font-bold">Przygotuj wniosek →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </main>
  )
}

// Tryb 1: fiszka pomysłu w 4 krokach
function KreatorFiszki() {
  const [params] = useSearchParams()
  const [krok, setKrok] = useState(1)
  // Opis z wyszukiwarki (?problem=) wypełnia się sam
  const [fiszka, setFiszka] = useState({ ...PUSTA, problem: params.get('problem') || '' })
  const { dodajFiszke } = useDane()
  const { uzytkownik } = useAuth()
  const navigate = useNavigate()

  // Pomocnik: zmienia jedno pole fiszki, resztę zostawia
  const ustaw = (pole, wartosc) => setFiszka({ ...fiszka, [pole]: wartosc })
  const przelaczGrupe = (g) =>
    ustaw('grupy', fiszka.grupy.includes(g) ? fiszka.grupy.filter((x) => x !== g) : [...fiszka.grupy, g])

  // Kiedy można przejść dalej – każdy krok ma swoje wymagane pola
  const krokGotowy = {
    1: fiszka.problem.trim() && (fiszka.grupy.length > 0 || fiszka.grupaInna.trim()),
    2: fiszka.tytul.trim() && fiszka.opis.trim() && fiszka.istota.trim(),
    3: true,
  }[krok]

  function wyslij() {
    dodajFiszke({
      ...fiszka,
      problem: fiszka.problem.trim(),
      tytul: fiszka.tytul.trim(),
      opis: fiszka.opis.trim(),
      istota: fiszka.istota.trim(),
      grupaInna: fiszka.grupaInna.trim(),
      autorId: uzytkownik.id,
      autor: uzytkownik.imie,
    })
    navigate('/panel')
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 text-[19px]">
      <p className="font-bold text-clay mb-1">Kreator pomysłów</p>
      <p className="font-bold text-base mb-2">Krok {krok} z {KROKI.length}: {KROKI[krok - 1]}</p>
      <div className="grid grid-cols-3 gap-1.5 mb-8" aria-hidden="true">
        {KROKI.map((k, i) => (
          <div key={k} className={'h-2.5 rounded ' + (i < krok ? 'bg-teal' : 'bg-line')} />
        ))}
      </div>

      {krok === 1 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Jaki problem chcesz rozwiązać?</h1>
          <label htmlFor="problem" className="font-bold">Opis problemu</label>
          <p className="text-muted -mt-4 text-base">Opisz szczegóły problemy, czemu potrzebuje rozwiązania, przez co jest stwarzany?</p>
          <textarea id="problem" rows={4} value={fiszka.problem} onChange={(e) => ustaw('problem', e.target.value)} className="p-4 rounded-xl border-2 border-line bg-white" />

          <fieldset>
            <legend className="font-bold mb-1">Dedykowana grupa</legend>
            <p className="text-muted text-base mb-3">Zaznacz grupy, którym pomoże pomysł, albo wpisz własną.</p>
            <div className="flex flex-wrap gap-2">
              {GRUPY.map((g) => {
                const zaznaczona = fiszka.grupy.includes(g)
                return (
                  <button key={g} type="button" aria-pressed={zaznaczona} onClick={() => przelaczGrupe(g)}
                    className={'min-h-12 px-4 rounded-full font-bold text-base ' + (zaznaczona ? 'border-[3px] border-teal bg-teal-light text-teal-dark' : 'border-2 border-line bg-white')}>
                    {zaznaczona && '✓ '}{g}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <label htmlFor="grupaInna" className="font-bold -mb-3">Inna grupa <span className="font-normal text-muted">(opcjonalnie)</span></label>
          <input id="grupaInna" value={fiszka.grupaInna} onChange={(e) => ustaw('grupaInna', e.target.value)} placeholder="Np. opiekunowie osób z demencją" className="min-h-14 px-4 rounded-xl border-2 border-line bg-white" />
        </section>
      )}

      {krok === 2 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Jaki masz pomysł?</h1>
          <label htmlFor="tytul" className="font-bold -mb-3">Nazwa pomysłu</label>
          <input id="tytul" value={fiszka.tytul} onChange={(e) => ustaw('tytul', e.target.value)} className="min-h-14 px-4 rounded-xl border-2 border-line bg-white" />
          <label htmlFor="opis" className="font-bold -mb-3">Krótki opis pomysłu</label>
          <textarea id="opis" rows={3} value={fiszka.opis} onChange={(e) => ustaw('opis', e.target.value)} placeholder="Co się wydarzy i kto co zrobi?" className="p-4 rounded-xl border-2 border-line bg-white" />
          <label htmlFor="istota" className="font-bold -mb-3">Co jest istotą? Na czym polega nowość?</label>
          <textarea id="istota" rows={3} value={fiszka.istota} onChange={(e) => ustaw('istota', e.target.value)} placeholder="Czym różni się od tego, co już działa?" className="p-4 rounded-xl border-2 border-line bg-white" />

          <fieldset>
            <legend className="font-bold mb-2.5">Etap, na którym jest pomysł</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {ETAPY.filter((e) => e.nr <= MAX_ETAP_AUTORA).map((e) => (
                <button key={e.nr} type="button" role="radio" aria-checked={fiszka.etap === e.nr} onClick={() => ustaw('etap', e.nr)}
                  className={'text-left p-3.5 rounded-xl text-base ' + (fiszka.etap === e.nr ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white')}>
                  <strong className="block">{e.nr} · {e.nazwa}</strong>
                  {e.opis && <span className="text-sm text-muted">{e.opis}</span>}
                </button>
              ))}
            </div>
            <p className="text-base text-muted mt-2">Wyższe etapy potwierdza ROPS – po testach poprosisz o nie w swoim panelu.</p>
          </fieldset>
        </section>
      )}

      {krok === 3 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Tak zobaczą Twoją fiszkę</h1>
          <p className="text-muted">Po wysłaniu sprawdzi ją ROPS. Potem pomysł dostanie swój wątek – z opiniami, pytaniami i aktualnościami.</p>
          <article className="bg-white border-2 border-ink rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-display font-extrabold text-2xl">{fiszka.tytul}</h2>
            <SzczegolyFiszki fiszka={fiszka} />
            <PasekEtapu etap={fiszka.etap} />
          </article>
        </section>
      )}

      <div className="flex justify-between gap-3 mt-8">
        <button
          onClick={() => setKrok(krok - 1)}
          disabled={krok === 1}
          className="min-h-14 px-6 rounded-xl border-2 border-line bg-white font-bold disabled:invisible"
        >
          ← Wstecz
        </button>
        {krok < KROKI.length ? (
          <button onClick={() => setKrok(krok + 1)} disabled={!krokGotowy} className="min-h-14 px-7 rounded-xl bg-teal text-white font-bold disabled:opacity-50">
            Dalej →
          </button>
        ) : (
          <button onClick={wyslij} className="min-h-14 px-7 rounded-xl bg-clay text-white font-bold">
            Wyślij fiszkę
          </button>
        )}
      </div>
      {!krokGotowy && <p className="text-base text-muted text-right mt-2">Uzupełnij wszystkie pola, żeby przejść dalej.</p>}

      {krok === KROKI.length && (
        <div className="mt-8 flex flex-wrap gap-4 items-center bg-ink text-white rounded-2xl p-5">
          <p className="flex-[999_1_300px] text-base">
            <strong className="block">Co dalej z fiszką?</strong>
            Po zatwierdzeniu przez ROPS zobaczą ją wszyscy. Gdy ROPS ogłosi nabór, w „Moich sprawach” pojawi się przycisk „Przygotuj wniosek” — wtedy rozpiszesz pomysł na Canvie innowacji.
          </p>
          <Link to="/panel" className="min-h-12 px-5 inline-flex items-center rounded-xl bg-white text-ink font-bold no-underline">
            Moje sprawy
          </Link>
        </div>
      )}
    </main>
  )
}
