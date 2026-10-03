import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ETAPY } from '../data/etapy.js'
import { powiaty } from '../data/zasobnik.js'
import { INTENSYWNOSC, CZESTOTLIWOSC, SKALA, GRUPY } from '../data/fiszka.js'
import { useDane, opublikowane } from '../data/DaneContext.jsx'
import { OBSZARY, obszarPoId, wykryjObszary } from '../data/obszary.js'
import { naborOtwarty } from '../data/nabory.js'
import WzorWniosku from '../components/WzorWniosku.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import SzczegolyFiszki from '../components/SzczegolyFiszki.jsx'
import PasekEtapu from '../components/PasekEtapu.jsx'

// Mieszkaniec sam deklaruje tylko etap 1–2; wyższe wymagają dowodu i zgody ROPS
const MAX_ETAP_AUTORA = 2
const KROKI = ['Problem', 'Kogo dotyczy', 'Twój pomysł', 'Sprawdź i wyślij']

const PUSTA = {
  problem: '', obszar: '', powiat: '', intensywnosc: null, czestotliwosc: null,
  grupy: [], skala: null,
  tytul: '', opis: '', etap: 1, szuka: '',
}

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
          <p className="text-[15px] text-muted"><strong className="text-ink">Obszary:</strong> {n.obszary.map((o) => obszarPoId(o)?.nazwa).join(', ')}</p>
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
  // Opis z wyszukiwarki (?problem=) i obszar ze strony obszaru (?obszar=) wypełniają się same
  const [fiszka, setFiszka] = useState({ ...PUSTA, problem: params.get('problem') || '', obszar: params.get('obszar') || '' })
  const { dodajFiszke } = useDane()
  const { uzytkownik } = useAuth()
  const navigate = useNavigate()

  // Pomocnik: zmienia jedno pole fiszki, resztę zostawia
  const ustaw = (pole, wartosc) => setFiszka({ ...fiszka, [pole]: wartosc })
  const przelaczGrupe = (g) =>
    ustaw('grupy', fiszka.grupy.includes(g) ? fiszka.grupy.filter((x) => x !== g) : [...fiszka.grupy, g])

  // Kiedy można przejść dalej – każdy krok ma swoje wymagane pola
  const krokGotowy = {
    1: fiszka.problem.trim() && fiszka.obszar && fiszka.powiat && fiszka.intensywnosc && fiszka.czestotliwosc,
    2: fiszka.grupy.length > 0 && fiszka.skala,
    3: fiszka.tytul.trim() && fiszka.opis.trim(),
    4: true,
  }[krok]

  function wyslij() {
    const tekst = (fiszka.problem + ' ' + fiszka.opis).toLowerCase()
    dodajFiszke({
      ...fiszka,
      problem: fiszka.problem.trim(),
      tytul: fiszka.tytul.trim(),
      opis: fiszka.opis.trim(),
      szuka: fiszka.szuka.trim(),
      tagi: [obszarPoId(fiszka.obszar)?.nazwa].filter(Boolean),
      // słowa kluczowe dla prostego matchingu – docelowo liczy je serwis AI
      slowa: [...new Set([...tekst.split(/[^a-ząćęłńóśźż]+/).filter((s) => s.length > 4), ...fiszka.grupy])],
      autorId: uzytkownik.id,
      autor: uzytkownik.imie,
    })
    navigate('/panel')
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 text-[19px]">
      <p className="font-bold text-clay mb-1">Kreator pomysłów</p>
      <p className="font-bold text-base mb-2">Krok {krok} z {KROKI.length}: {KROKI[krok - 1]}</p>
      <div className="grid grid-cols-4 gap-1.5 mb-8" aria-hidden="true">
        {KROKI.map((k, i) => (
          <div key={k} className={'h-2.5 rounded ' + (i < krok ? 'bg-teal' : 'bg-line')} />
        ))}
      </div>

      {krok === 1 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Jaki problem chcesz rozwiązać?</h1>
          <label htmlFor="problem" className="text-muted">Opisz go tak, jakbyś mówił(a) sąsiadowi. Co się dzieje i komu to przeszkadza?</label>
          <textarea
            id="problem"
            rows={4}
            value={fiszka.problem}
            onChange={(e) => ustaw('problem', e.target.value)}
            className="p-4 rounded-xl border-2 border-line bg-white"
          />
          <WyborObszaru fiszka={fiszka} ustaw={ustaw} />
          <label htmlFor="powiat" className="font-bold">Gdzie to się dzieje? (powiat)</label>
          <select id="powiat" value={fiszka.powiat} onChange={(e) => ustaw('powiat', e.target.value)} className="min-h-14 px-4 rounded-xl border-2 border-line bg-white">
            <option value="">Wybierz powiat…</option>
            {powiaty.map((p) => <option key={p.nazwa} value={p.nazwa}>{p.nazwa}</option>)}
          </select>
          <Wybor tytul="Jak bardzo dokucza?" opcje={INTENSYWNOSC} wartosc={fiszka.intensywnosc} onWybierz={(v) => ustaw('intensywnosc', v)} kolumny />
          <Wybor tytul="Jak często się zdarza?" opcje={CZESTOTLIWOSC} wartosc={fiszka.czestotliwosc} onWybierz={(v) => ustaw('czestotliwosc', v)} />
        </section>
      )}

      {krok === 2 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Kogo to dotyczy?</h1>
          <p className="text-muted">Zaznacz wszystkie grupy, którym pomógłby Twój pomysł.</p>
          <div className="flex flex-wrap gap-2">
            {GRUPY.map((g) => {
              const zaznaczona = fiszka.grupy.includes(g)
              return (
                <button
                  key={g}
                  aria-pressed={zaznaczona}
                  onClick={() => przelaczGrupe(g)}
                  className={'min-h-12 px-4 rounded-full font-bold text-base ' + (zaznaczona ? 'border-[3px] border-teal bg-teal-light text-teal-dark' : 'border-2 border-line bg-white')}
                >
                  {zaznaczona && '✓ '}{g}
                </button>
              )
            })}
          </div>
          <Wybor tytul="Ile osób ma ten problem?" opcje={SKALA} wartosc={fiszka.skala} onWybierz={(v) => ustaw('skala', v)} />
        </section>
      )}

      {krok === 3 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Jaki masz pomysł?</h1>
          <label htmlFor="tytul" className="font-bold">Nazwij go krótko</label>
          <input id="tytul" value={fiszka.tytul} onChange={(e) => ustaw('tytul', e.target.value)} className="min-h-14 px-4 rounded-xl border-2 border-line bg-white" />
          <label htmlFor="opis" className="font-bold">Na czym polega? Co się wydarzy i kto co zrobi?</label>
          <textarea id="opis" rows={4} value={fiszka.opis} onChange={(e) => ustaw('opis', e.target.value)} className="p-4 rounded-xl border-2 border-line bg-white" />

          <p className="font-bold">Na jakim etapie jest pomysł?</p>
          <div className="grid grid-cols-2 gap-2.5">
            {ETAPY.filter((e) => e.nr <= MAX_ETAP_AUTORA).map((e) => (
              <button
                key={e.nr}
                role="radio"
                aria-checked={fiszka.etap === e.nr}
                onClick={() => ustaw('etap', e.nr)}
                className={'text-left p-3.5 rounded-xl text-base ' + (fiszka.etap === e.nr ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white')}
              >
                <strong className="block">{e.nr} · {e.nazwa}</strong>
                {e.opis && <span className="text-sm text-muted">{e.opis}</span>}
              </button>
            ))}
          </div>
          <p className="text-base text-muted -mt-2">Wyższe etapy potwierdza koordynator ROPS – po testach poprosisz o nie w swoim panelu.</p>

          <label htmlFor="szuka" className="font-bold">Czego szukasz? <span className="font-normal text-muted">(opcjonalnie)</span></label>
          <input id="szuka" value={fiszka.szuka} onChange={(e) => ustaw('szuka', e.target.value)} placeholder="Np. partnera, wolontariuszy, sali na spotkania" className="min-h-14 px-4 rounded-xl border-2 border-line bg-white" />
        </section>
      )}

      {krok === 4 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Tak zobaczą Twoją fiszkę</h1>
          <p className="text-muted">Po wysłaniu sprawdzi ją koordynator ROPS. Potem zobaczą ją mieszkańcy i urzędnicy z pow. {fiszka.powiat}.</p>
          <article className="bg-white border-2 border-ink rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted">pow. {fiszka.powiat}</p>
              <h2 className="font-display font-extrabold text-2xl">{fiszka.tytul}</h2>
            </div>
            <SzczegolyFiszki fiszka={fiszka} />
            <PasekEtapu etap={fiszka.etap} />
            {fiszka.szuka && <p className="text-base font-bold text-clay-dark">Szuka: {fiszka.szuka}</p>}
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
            Po zatwierdzeniu przez ROPS zobaczą ją wszyscy. Gdy ROPS ogłosi pasujący nabór, w „Moich sprawach” pojawi się przycisk „Przygotuj wniosek” — wtedy rozpiszesz pomysł na Canvie innowacji.
          </p>
          <Link to="/panel" className="min-h-12 px-5 inline-flex items-center rounded-xl bg-white text-ink font-bold no-underline">
            Moje sprawy
          </Link>
        </div>
      )}
    </main>
  )
}

// Kafelki jednokrotnego wyboru (intensywność, częstotliwość, skala)
function Wybor({ tytul, opcje, wartosc, onWybierz, kolumny = false }) {
  return (
    <fieldset>
      <legend className="font-bold mb-2.5">{tytul}</legend>
      <div className={kolumny ? 'flex flex-col gap-2.5' : 'grid grid-cols-2 sm:grid-cols-4 gap-2.5'}>
        {opcje.map((o) => {
          const wybrana = wartosc === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={wybrana}
              onClick={() => onWybierz(o.id)}
              className={'text-left px-4 py-3 rounded-xl ' + (wybrana ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white')}
            >
              <strong className="block text-base">{o.nazwa}</strong>
              <span className="text-sm text-muted">{o.opis}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

// Obszar z Mapy Wyzwań – z podpowiedzią rozpoznaną z opisu problemu
function WyborObszaru({ fiszka, ustaw }) {
  const podpowiedz = wykryjObszary(fiszka.problem)[0]
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="obszar" className="font-bold">Którego obszaru dotyczy?</label>
      <select id="obszar" value={fiszka.obszar} onChange={(e) => ustaw('obszar', e.target.value)} className="min-h-14 px-4 rounded-xl border-2 border-line bg-white">
        <option value="">Wybierz obszar…</option>
        {OBSZARY.map((o) => <option key={o.id} value={o.id}>{o.nazwa}</option>)}
      </select>
      {podpowiedz && fiszka.obszar !== podpowiedz.id && (
        <button type="button" onClick={() => ustaw('obszar', podpowiedz.id)} className="self-start min-h-11 px-4 rounded-lg bg-teal-light text-teal-dark font-bold text-base">
          Podpowiedź z opisu: {podpowiedz.nazwa} – wybierz
        </button>
      )}
    </div>
  )
}
