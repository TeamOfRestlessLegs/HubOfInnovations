import { useState } from 'react'
import { CANVA, SEKCJE } from '../data/canva.js'

// Czy na pytanie jest już jakaś odpowiedź
const odpowiedziano = (pytanie, wartosc) => {
  if (pytanie.typ === 'lista') return (wartosc || []).length > 0
  if (pytanie.typ === 'tekst') return (wartosc || '').trim().length > 0
  return wartosc !== undefined && wartosc !== null
}

export default function Canva() {
  const [aktywna, setAktywna] = useState(0)          // indeks sekcji w SEKCJE
  const [odpowiedzi, setOdpowiedzi] = useState({})   // { idPytania: wartość }

  const ustaw = (id, wartosc) => setOdpowiedzi({ ...odpowiedzi, [id]: wartosc })
  const sekcjaGotowa = (s) => s.pytania.every((p) => odpowiedziano(p, odpowiedzi[p.id]))

  const gotowe = SEKCJE.filter(sekcjaGotowa).length
  const sekcja = SEKCJE[aktywna]
  const brakujace = SEKCJE.filter((s) => !sekcjaGotowa(s))

  return (
    <main className="max-w-7xl mx-auto px-6 py-9">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
        <div className="flex-[1_1_520px]">
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1.5">Pełna Canva innowacji</h1>
          <p className="text-lg text-muted max-w-2xl">
            Rozwiń pomysł w kompletny projekt. Z wypełnionej Canvy przygotujemy wniosek do naboru.
          </p>
        </div>
        <div className="bg-white border border-line rounded-xl px-4.5 py-3.5 min-w-64">
          <p className="text-[15px] mb-2"><strong>Gotowość wniosku:</strong> {gotowe} z {SEKCJE.length} sekcji</p>
          <div className="h-2.5 rounded bg-[#E6EAF0]">
            <div className="h-2.5 rounded bg-teal transition-all" style={{ width: `${(gotowe / SEKCJE.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-7 items-start">
        {/* Menu sekcji, pogrupowane jak arkusze #01–#03 */}
        <nav aria-label="Sekcje Canvy" className="flex-[1_1_240px] min-w-0 bg-white border border-line rounded-2xl p-4 flex flex-col gap-4">
          {CANVA.map((arkusz) => (
            <div key={arkusz.arkusz}>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">{arkusz.arkusz}</p>
              <ul className="flex flex-col gap-0.5">
                {arkusz.sekcje.map((s) => {
                  const idx = SEKCJE.findIndex((x) => x.id === s.id)
                  const aktualna = idx === aktywna
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setAktywna(idx)}
                        aria-current={aktualna ? 'step' : undefined}
                        className={
                          'w-full flex items-center gap-2.5 min-h-11 px-2.5 rounded-lg font-bold text-left ' +
                          (aktualna ? 'bg-ink text-white' : 'text-ink hover:bg-ground')
                        }
                      >
                        <span
                          aria-label={sekcjaGotowa(s) ? 'uzupełniona' : 'do uzupełnienia'}
                          className={
                            'w-4.5 h-4.5 rounded-full shrink-0 ' +
                            (sekcjaGotowa(s) ? 'bg-teal' : aktualna ? 'border-[3px] border-[#F29A5C]' : 'border-2 border-[#B8C2D0]')
                          }
                        />
                        {s.nazwa}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <section aria-labelledby="sekcja-h" className="flex-[999_1_560px] min-w-0 bg-white border border-line rounded-2xl p-7 flex flex-col gap-8">
          <div>
            <p className="text-muted font-bold text-[15px]">{sekcja.arkusz} · Sekcja {aktywna + 1} z {SEKCJE.length}</p>
            <h2 id="sekcja-h" className="font-display font-extrabold text-3xl">{sekcja.nazwa}</h2>
          </div>

          {sekcja.pytania.map((p) => (
            <Pytanie key={p.id} pytanie={p} wartosc={odpowiedzi[p.id]} onZmiana={(v) => ustaw(p.id, v)} />
          ))}

          <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-[#E6EAF0]">
            <button
              onClick={() => setAktywna(aktywna - 1)}
              disabled={aktywna === 0}
              className="min-h-12 px-5 rounded-xl border-2 border-line font-bold disabled:invisible"
            >
              ← Wstecz
            </button>
            {aktywna < SEKCJE.length - 1 ? (
              <button onClick={() => setAktywna(aktywna + 1)} className="min-h-12 px-5.5 rounded-xl bg-teal text-white font-bold">
                Dalej: {SEKCJE[aktywna + 1].nazwa} →
              </button>
            ) : (
              <button
                disabled={brakujace.length > 0}
                onClick={() => alert(JSON.stringify(odpowiedzi, null, 2))}
                className="min-h-12 px-5.5 rounded-xl bg-clay text-white font-bold disabled:opacity-50"
              >
                Przygotuj wniosek
              </button>
            )}
          </div>
        </section>

        {/* Asystent – na razie podpowiedzi liczone z odpowiedzi; później tu podepniecie serwis AI */}
        <aside aria-label="Asystent" className="flex-[1_1_280px] min-w-0 bg-ink text-white rounded-2xl p-5 flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold">Asystent</h2>
          {brakujace.length === 0 ? (
            <p className="bg-[#1C2E52] rounded-xl p-3.5">Canva kompletna. Możesz przygotować wniosek do naboru.</p>
          ) : (
            <div className="bg-[#1C2E52] rounded-xl p-3.5">
              <p className="mb-2">Do wniosku brakuje jeszcze:</p>
              <ul className="flex flex-wrap gap-1.5">
                {brakujace.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setAktywna(SEKCJE.findIndex((x) => x.id === s.id))}
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold"
                    >
                      {s.nazwa}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {odpowiedzi.etap === 2 && (
            <p className="bg-[#1C2E52] rounded-xl p-3.5">
              Masz <strong>prototyp</strong>. Zgłoś go do Testera innowacji — opinie testerów pomogą przejść do etapu „Przetestowane”.
            </p>
          )}
        </aside>
      </div>
    </main>
  )
}

// Jeden komponent rysuje każdy typ pytania z data/canva.js
function Pytanie({ pytanie, wartosc, onZmiana }) {
  return (
    <fieldset>
      <legend className="font-bold text-xl mb-1">{pytanie.tytul}</legend>
      {pytanie.opis && <p className="text-muted mb-3">{pytanie.opis}</p>}

      {pytanie.typ === 'wybor' && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
          {pytanie.opcje.map((o) => {
            const wybrana = wartosc === o.id
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={wybrana}
                onClick={() => onZmiana(o.id)}
                className={
                  'text-left p-3.5 rounded-xl min-h-22 ' +
                  (wybrana ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white hover:border-[#B8C2D0]')
                }
              >
                <strong className="block">{o.nazwa}</strong>
                {o.opis && <span className="text-[15px] text-muted">{o.opis}</span>}
              </button>
            )
          })}
        </div>
      )}

      {pytanie.typ === 'lista' && (
        <div className="flex flex-wrap gap-2">
          {pytanie.opcje.map((o) => {
            const lista = wartosc || []
            const zaznaczona = lista.includes(o)
            const limit = pytanie.max && !zaznaczona && lista.length >= pytanie.max
            return (
              <button
                key={o}
                type="button"
                aria-pressed={zaznaczona}
                disabled={limit}
                onClick={() => onZmiana(zaznaczona ? lista.filter((x) => x !== o) : [...lista, o])}
                className={
                  'min-h-11 px-4 rounded-full font-bold text-[15px] disabled:opacity-40 ' +
                  (zaznaczona ? 'border-[3px] border-teal bg-teal-light text-teal-dark' : 'border-2 border-line bg-white')
                }
              >
                {zaznaczona && '✓ '}{o}
              </button>
            )
          })}
        </div>
      )}

      {pytanie.typ === 'tekst' && (
        <textarea
          rows={3}
          aria-label={pytanie.tytul}
          value={wartosc || ''}
          onChange={(e) => onZmiana(e.target.value)}
          className="w-full p-3.5 rounded-xl border border-[#B8C2D0] resize-y"
        />
      )}
    </fieldset>
  )
}
