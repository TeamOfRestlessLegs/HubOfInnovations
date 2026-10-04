import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane } from '../data/DaneContext.jsx'
import { STATUS_TESTU, KIM_JEST, raport, tenSamZasob } from '../data/tester.js'
import { FormularzOpinii } from '../components/RaportOpinii.jsx'

// Tester innowacji: zgłoś się do testu, oceń rozwiązanie, zaproponuj usprawnienie.
export default function Tester() {
  const { testy, biblioteka, opinie } = useDane()
  const [params] = useSearchParams()

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display font-extrabold text-5xl tracking-tight mb-2">Tester innowacji</h1>
      <p className="text-lg text-muted mb-10 max-w-2xl">
        Sprawdź rozwiązanie w praktyce, zanim trafi do innych gmin. Twoja opinia trafia prosto do autora i ROPS.
      </p>

      <section aria-labelledby="h-testy" className="mb-14">
        <h2 id="h-testy" className="font-display font-extrabold text-3xl mb-1">Testy w terenie</h2>
        <p className="text-muted mb-5">Zgłoś się do testu albo oceń rozwiązanie, które już testujesz.</p>
        <div className="flex flex-col gap-4">
          {testy.map((t) => <KartaTestu key={t.id} test={t} />)}
          {testy.length === 0 && <p className="text-muted">Teraz nie ma otwartych testów.</p>}
        </div>
      </section>

      <section aria-labelledby="h-ocen">
        <h2 id="h-ocen" className="font-display font-extrabold text-3xl mb-1">Oceń sprawdzoną innowację</h2>
        <p className="text-muted mb-5">Korzystasz z rozwiązania z Biblioteki ROPS? Powiedz, co działa i co poprawić.</p>
        <OcenaBiblioteki biblioteka={biblioteka} opinie={opinie} start={params.get('ocen') || ''} />
      </section>
    </main>
  )
}

function KartaTestu({ test: t }) {
  const { uzytkownik: ja } = useAuth()
  const { biblioteka, fiszki, zgloszeniaTestow, opinie, zglosSieDoTestu, dodajOpinie } = useDane()
  const [tryb, setTryb] = useState(null) // 'zgloszenie' | 'opinia'
  const [kim, setKim] = useState(KIM_JEST[0])
  const [dlaczego, setDlaczego] = useState('')
  const [wyslano, setWyslano] = useState('')

  const zasob = t.zasob.typ === 'biblioteka' ? biblioteka.find((b) => b.id === t.zasob.id) : fiszki.find((f) => String(f.id) === String(t.zasob.id))
  const chetni = zgloszeniaTestow.filter((z) => z.testId === t.id)
  const moje = ja && chetni.find((z) => z.uzytkownikId === ja.id)
  const moja = ja && opinie.find((o) => o.testId === t.id && o.uzytkownikId === ja.id)
  const r = raport(opinie.filter((o) => o.testId === t.id))
  const s = STATUS_TESTU[t.status]

  return (
    <article className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <span className={'inline-block px-2.5 py-0.5 rounded-full text-sm font-bold mb-2 ' + s.klasa}>{s.nazwa}</span>
          <h3 className="font-display text-2xl font-bold">{t.tytul}</h3>
          <p className="text-[15px] text-muted">
            {t.zasob.typ === 'biblioteka' ? 'Innowacja z Biblioteki ROPS' : 'Pomysł mieszkańców'}: <strong className="text-ink">{zasob?.tytul}</strong> · {t.miejsce}
          </p>
        </div>
        {r && (
          <p className="text-right">
            <span className="font-display font-extrabold text-3xl">{String(r.srednia).replace('.', ',')}</span><span className="text-muted">/5</span>
            <span className="block text-sm text-muted">{r.liczba} opinii testerów</span>
          </p>
        )}
      </div>
      <p>{t.opis}</p>
      <p className="text-[15px] text-muted">
        Miejsc: <strong className="text-ink">{t.miejsca}</strong> · chętnych: <strong className="text-ink">{chetni.length}</strong>
        {t.status === 'rekrutacja' && <> · zgłoszenia do <strong className="text-ink">{new Date(t.termin).toLocaleDateString('pl-PL')}</strong></>}
      </p>

      {wyslano && <p role="status" className="px-4 py-3 rounded-xl bg-teal-light text-teal-dark font-bold">{wyslano}</p>}

      {!ja ? (
        t.status !== 'zakonczony' && <Link to="/logowanie" className="self-start min-h-11 px-4 inline-flex items-center rounded-lg border-2 border-ink font-bold no-underline text-ink">Zaloguj się, żeby wziąć udział</Link>
      ) : (
        <>
          {moje && !wyslano && (
            <p className="text-[15px]">Twoje zgłoszenie: <strong>{{ zgloszony: 'czeka na decyzję ROPS', przyjety: 'przyjęte – jesteś testerem', odrzucony: 'tym razem bez miejsca' }[moje.status]}</strong></p>
          )}
          {t.status === 'rekrutacja' && !moje && tryb !== 'zgloszenie' && (
            <button type="button" onClick={() => setTryb('zgloszenie')} className="self-start min-h-12 px-5 rounded-xl bg-clay text-white font-bold">Zgłoś się do testu</button>
          )}
          {tryb === 'zgloszenie' && (
            <form
              onSubmit={(e) => { e.preventDefault(); zglosSieDoTestu(t.id, { kim, dlaczego: dlaczego.trim() }); setTryb(null); setWyslano('Zgłoszenie wysłane. ROPS da znać w powiadomieniach.') }}
              className="rounded-xl bg-ground p-4 flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1 font-bold max-w-sm">
                Kim jesteś?
                <select value={kim} onChange={(e) => setKim(e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal bg-white">
                  {KIM_JEST.map((k) => <option key={k}>{k}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 font-bold">
                Dlaczego chcesz testować? (jedno zdanie)
                <input value={dlaczego} onChange={(e) => setDlaczego(e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal bg-white" />
              </label>
              <div className="flex gap-2">
                <button type="submit" className="min-h-12 px-5 rounded-xl bg-clay text-white font-bold">Wyślij zgłoszenie</button>
                <button type="button" onClick={() => setTryb(null)} className="min-h-12 px-5 rounded-xl border-2 border-line font-bold">Anuluj</button>
              </div>
            </form>
          )}
          {t.status === 'trwa' && moje?.status === 'przyjety' && !moja && tryb !== 'opinia' && !wyslano && (
            <button type="button" onClick={() => setTryb('opinia')} className="self-start min-h-12 px-5 rounded-xl bg-clay text-white font-bold">Oceń po teście</button>
          )}
          {tryb === 'opinia' && (
            <FormularzOpinii
              onAnuluj={() => setTryb(null)}
              onWyslij={(o) => { dodajOpinie({ ...o, zasob: t.zasob, testId: t.id }); setTryb(null); setWyslano('Dziękujemy! Opinia trafiła do autora i ROPS.') }}
            />
          )}
          {moja && !wyslano && <p className="text-[15px] text-teal-dark font-bold">Twoja opinia: {moja.ocena}/5 – dziękujemy.</p>}
        </>
      )}
    </article>
  )
}

function OcenaBiblioteki({ biblioteka, opinie, start }) {
  const { uzytkownik: ja } = useAuth()
  const { dodajOpinie } = useDane()
  const [id, setId] = useState(start)
  const [wyslano, setWyslano] = useState(false)
  const inn = biblioteka.find((b) => b.id === id)
  const jego = inn ? opinie.filter((o) => tenSamZasob(o.zasob, { typ: 'biblioteka', id: inn.id })) : []
  const r = raport(jego)

  if (!ja) return <Link to="/logowanie" className="min-h-11 px-4 inline-flex items-center rounded-lg border-2 border-ink font-bold no-underline text-ink">Zaloguj się, żeby ocenić</Link>

  return (
    <div className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 max-w-3xl">
      <label className="flex flex-col gap-1 font-bold">
        Którą innowację oceniasz?
        <select value={id} onChange={(e) => { setId(e.target.value); setWyslano(false) }} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal">
          <option value="">— wybierz —</option>
          {biblioteka.map((b) => <option key={b.id} value={b.id}>{b.tytul}</option>)}
        </select>
      </label>
      {inn && r && <p className="text-[15px] text-muted">Dotychczas: <strong className="text-ink">{String(r.srednia).replace('.', ',')}/5</strong> z {r.liczba} opinii.</p>}
      {wyslano ? (
        <p role="status" className="px-4 py-3 rounded-xl bg-teal-light text-teal-dark font-bold">Dziękujemy! ROPS zobaczy Twoją opinię i propozycje.</p>
      ) : inn && (
        <FormularzOpinii onWyslij={(o) => { dodajOpinie({ ...o, zasob: { typ: 'biblioteka', id: inn.id } }); setWyslano(true) }} />
      )}
    </div>
  )
}
