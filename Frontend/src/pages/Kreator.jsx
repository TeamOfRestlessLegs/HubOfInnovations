import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ETAPY } from '../data/etapy.js'

const intensywnosc = [
  { id: 'bardzo', nazwa: 'Bardzo poważny problem', opis: 'Powoduje stres, wyklucza albo realnie krzywdzi.' },
  { id: 'mocno', nazwa: 'Mocno przeszkadza', opis: 'Regularnie blokuje ważne sprawy.' },
  { id: 'utrudnia', nazwa: 'Utrudnia życie', opis: 'Trzeba szukać obejść, traci się czas.' },
  { id: 'lekko', nazwa: 'Lekko przeszkadza', opis: 'Da się żyć, ale irytuje.' },
]

export default function Kreator() {
  // Cały stan kreatora w jednym miejscu – później wyślecie go POST-em do backendu
  const [krok, setKrok] = useState(1)
  const [fiszka, setFiszka] = useState({ problem: '', intensywnosc: null, tytul: '', etap: 1 })

  // Pomocnik: zmienia jedno pole fiszki, resztę zostawia
  const ustaw = (pole, wartosc) => setFiszka({ ...fiszka, [pole]: wartosc })

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 text-[19px]">
      <p className="font-bold text-clay mb-1">Kreator pomysłów</p>
      <p className="font-bold text-base mb-2">Krok {krok} z 3</p>
      <div className="grid grid-cols-3 gap-1.5 mb-8" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <div key={n} className={'h-2.5 rounded ' + (n <= krok ? 'bg-teal' : 'bg-line')} />
        ))}
      </div>

      {krok === 1 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Jaki problem chcesz rozwiązać?</h1>
          <label htmlFor="problem" className="text-muted">Opisz go tak, jakbyś mówił(a) sąsiadowi.</label>
          <textarea
            id="problem"
            rows={4}
            value={fiszka.problem}
            onChange={(e) => ustaw('problem', e.target.value)}
            className="p-4 rounded-xl border-2 border-line bg-white"
          />
        </section>
      )}

      {krok === 2 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Jak bardzo ten problem dokucza?</h1>
          <div role="radiogroup" className="flex flex-col gap-2.5">
            {intensywnosc.map((o) => {
              const wybrane = fiszka.intensywnosc === o.id
              return (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={wybrane}
                  onClick={() => ustaw('intensywnosc', o.id)}
                  className={
                    'text-left min-h-18 px-5 py-3.5 rounded-xl ' +
                    (wybrane ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white')
                  }
                >
                  <strong className="block">{o.nazwa}</strong>
                  <span className="text-base text-muted">{o.opis}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {krok === 3 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-display font-extrabold text-4xl">Jaki masz pomysł?</h1>
          <label htmlFor="tytul" className="font-bold">Nazwij go krótko</label>
          <input
            id="tytul"
            value={fiszka.tytul}
            onChange={(e) => ustaw('tytul', e.target.value)}
            className="min-h-14 px-4 rounded-xl border-2 border-line bg-white"
          />
          <p className="font-bold">Na jakim etapie jest pomysł?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ETAPY.map((e) => (
              <button
                key={e.nr}
                role="radio"
                aria-checked={fiszka.etap === e.nr}
                onClick={() => ustaw('etap', e.nr)}
                className={
                  'text-left p-3.5 rounded-xl text-base ' +
                  (fiszka.etap === e.nr ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white')
                }
              >
                <strong className="block">{e.nr} · {e.nazwa}</strong>
                {e.opis && <span className="text-sm text-muted">{e.opis}</span>}
              </button>
            ))}
          </div>
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
        {krok < 3 ? (
          <button onClick={() => setKrok(krok + 1)} className="min-h-14 px-7 rounded-xl bg-teal text-white font-bold">
            Dalej →
          </button>
        ) : (
          <button
            onClick={() => alert(JSON.stringify(fiszka, null, 2))}
            className="min-h-14 px-7 rounded-xl bg-clay text-white font-bold"
          >
            Wyślij fiszkę
          </button>
        )}
      </div>

      {krok === 3 && (
        <div className="mt-8 flex flex-wrap gap-4 items-center bg-ink text-white rounded-2xl p-5">
          <p className="flex-[999_1_300px] text-base">
            <strong className="block">Chcesz pójść dalej?</strong>
            Rozwiń fiszkę w pełną Canvę innowacji — z niej przygotujemy wniosek do naboru.
          </p>
          <Link to="/canva" className="min-h-12 px-5 inline-flex items-center rounded-xl bg-white text-ink font-bold no-underline">
            Otwórz pełną Canvę
          </Link>
        </div>
      )}
    </main>
  )
}
