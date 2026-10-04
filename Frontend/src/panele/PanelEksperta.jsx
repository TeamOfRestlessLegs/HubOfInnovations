import { Link } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import SzczegolyFiszki from '../components/SzczegolyFiszki.jsx'
import DecyzjaZarzadu from '../components/DecyzjaZarzadu.jsx'

// Panel eksperta: pytania mieszkańców do ekspertów i prośby ROPS o opinię przy pomysłach.
export default function PanelEksperta() {
  const { fiszki, pytania: wszystkie } = useDane()
  const czekajace = fiszki.filter((f) => f.status === 'do_weryfikacji')
  // Pytania w wątkach pomysłów skierowane do ekspertów (od autorów i od ROPS)
  const doEkspertow = wszystkie.filter((q) => q.do === 'ekspert').sort((a, b) => a.odpowiedzi.length - b.odpowiedzi.length || b.data.localeCompare(a.data))
  const bezOdpowiedzi = doEkspertow.filter((q) => q.odpowiedzi.length === 0)

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1">Panel eksperta</h1>
      <p className="text-muted text-lg mb-8">Pomagasz innowatorom i gminom: odpowiadasz na pytania i opiniujesz pomysły na prośbę ROPS.</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-10">
        <div className={'rounded-2xl p-5 border ' + (bezOdpowiedzi.length ? 'bg-clay-light border-[#E8C9AE]' : 'bg-white border-line')}>
          <p className="text-[15px] text-muted mb-1">Pytania w wątkach bez odpowiedzi</p>
          <p className="font-display font-extrabold text-4xl">{bezOdpowiedzi.length}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="font-display font-bold text-2xl mb-1">Pomysły czekające na poparcie ({czekajace.length})</h2>
        <p className="text-muted mb-4">Twoje poparcie publikuje pomysł. Jeśli czegoś brakuje, zaproponuj poprawki – autor je wprowadzi.</p>
        {czekajace.length === 0 && <p className="text-muted">Nic nie czeka.</p>}
        <div className="flex flex-col gap-4">
          {czekajace.map((f) => (
            <article key={f.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
              <div>
                <h3 className="font-display text-xl font-bold">{f.tytul}</h3>
                <p className="text-sm text-muted">{f.autor}{f.odJST && ' (gmina)'}</p>
              </div>
              <SzczegolyFiszki fiszka={f} />
              <DecyzjaZarzadu fiszka={f}>
                <Link to={'/pomysl/' + f.id} className="min-h-11 px-3 inline-flex items-center font-bold">Wątek →</Link>
              </DecyzjaZarzadu>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-bold text-2xl mb-1">Pytania w wątkach pomysłów</h2>
        <p className="text-muted mb-4">Odpowiedź pojawi się publicznie w wątku – pomoże też innym. Opinię o całym pomyśle dodasz w sekcji „Opinie ekspertów”.</p>
        {doEkspertow.length === 0 && <p className="text-muted">Brak pytań do ekspertów.</p>}
        <div className="flex flex-col gap-4">
          {doEkspertow.map((q) => {
            const f = fiszki.find((x) => x.id === q.fiszkaId)
            return (
              <article key={q.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-display text-xl font-bold">{f?.tytul}</h3>
                  <span className={'text-sm font-bold ' + (q.odpowiedzi.length ? 'text-teal-dark' : 'text-clay-dark')}>{q.odpowiedzi.length ? 'odpowiedziano' : '● czeka na odpowiedź'}</span>
                </div>
                {f && <SzczegolyFiszki fiszka={f} pokazPomysl={false} />}
                <p className="rounded-xl bg-ground px-4 py-3"><strong>{q.autor}:</strong> {q.tresc}</p>
                <Link to={'/pomysl/' + q.fiszkaId + '?sekcja=eksperci'} className="self-start min-h-11 px-4 inline-flex items-center rounded-lg bg-ink text-white font-bold no-underline">{q.odpowiedzi.length ? 'Zobacz w wątku' : 'Odpowiedz w wątku'}</Link>
              </article>
            )
          })}
        </div>
      </section>

    </main>
  )
}
