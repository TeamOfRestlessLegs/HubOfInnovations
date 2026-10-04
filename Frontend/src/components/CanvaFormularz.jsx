import { useState } from 'react'
import { CANVA, SEKCJE, sekcjaGotowa, brakujaceSekcje } from '../data/canva.js'
import { poleCanvy, LIMIT_CANVY } from '../data/asystent.js'
import AsystentPola, { usePropozycje } from './AsystentPola.jsx'

// Social Innovation Canvas jako formularz. Sterowany z zewnątrz (odpowiedzi + onZmiana),
// bo żyje wewnątrz wniosku do naboru i zapisuje się razem z nim.
// `kontekstAI` (z data/asystent.js) włącza przy polach do pisania przycisk „Podpowiedz” asystenta AI.
export default function CanvaFormularz({ odpowiedzi, onZmiana, tylkoOdczyt = false, przyciskKoncowy, kontekstAI }) {
  const [aktywna, setAktywna] = useState(0)
  const ai = usePropozycje(kontekstAI, 'canva')
  const sekcja = SEKCJE[aktywna]
  const brakujace = brakujaceSekcje(odpowiedzi)
  const gotowe = SEKCJE.length - brakujace.length

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-line rounded-xl px-4.5 py-3.5 max-w-md">
        <p className="text-[15px] mb-2"><strong>Canva:</strong> {gotowe} z {SEKCJE.length} sekcji uzupełnionych</p>
        <div className="h-2.5 rounded bg-[#E6EAF0]">
          <div className="h-2.5 rounded bg-teal transition-all" style={{ width: `${(gotowe / SEKCJE.length) * 100}%` }} />
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
                  const ok = sekcjaGotowa(s, odpowiedzi)
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setAktywna(idx)}
                        aria-current={aktualna ? 'step' : undefined}
                        className={'w-full flex items-center gap-2.5 min-h-11 px-2.5 rounded-lg font-bold text-left ' + (aktualna ? 'bg-ink text-white' : 'text-ink hover:bg-ground')}
                      >
                        <span
                          aria-label={ok ? 'uzupełniona' : 'do uzupełnienia'}
                          className={'w-4.5 h-4.5 rounded-full shrink-0 ' + (ok ? 'bg-teal' : aktualna ? 'border-[3px] border-[#F29A5C]' : 'border-2 border-[#B8C2D0]')}
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
            <Pytanie key={p.id} pytanie={p} wartosc={odpowiedzi[p.id]} onZmiana={(v) => onZmiana(p.id, v)} tylkoOdczyt={tylkoOdczyt}>
              {kontekstAI && !tylkoOdczyt && p.typ === 'tekst' && (
                <AsystentPola
                  poleId={'canva-' + p.id}
                  propozycja={ai.propozycje[p.id]}
                  limit={LIMIT_CANVY}
                  pracuje={Boolean(ai.pracuje[p.id])}
                  blad={ai.bledy[p.id]}
                  przycisk={(odpowiedzi[p.id] || '').trim() ? '💡 Rozwiń z asystentem' : '💡 Podpowiedz'}
                  moznaCofnac={ai.cofnij[p.id] !== undefined}
                  onPopros={(polecenie) => ai.popros(poleCanvy(p, odpowiedzi[p.id]), polecenie)}
                  onWstaw={(poprawSam) => {
                    ai.wstaw(p.id, odpowiedzi[p.id], (v) => onZmiana(p.id, v))
                    if (poprawSam) setTimeout(() => document.getElementById('canva-' + p.id)?.focus())
                  }}
                  onZostaw={() => ai.zostaw(p.id)}
                  onCofnij={() => ai.wycofaj(p.id, (v) => onZmiana(p.id, v))}
                />
              )}
            </Pytanie>
          ))}

          <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-[#E6EAF0]">
            <button type="button" onClick={() => setAktywna(aktywna - 1)} disabled={aktywna === 0} className="min-h-12 px-5 rounded-xl border-2 border-line font-bold disabled:invisible">
              ← Wstecz
            </button>
            {aktywna < SEKCJE.length - 1 ? (
              <button type="button" onClick={() => setAktywna(aktywna + 1)} className="min-h-12 px-5.5 rounded-xl bg-teal text-white font-bold">
                Dalej: {SEKCJE[aktywna + 1].nazwa} →
              </button>
            ) : (
              przyciskKoncowy
            )}
          </div>
        </section>

        {/* Asystent – na razie podpowiedzi liczone z odpowiedzi; później tu podepniecie serwis AI */}
        <aside aria-label="Asystent Canvy" className="flex-[1_1_280px] min-w-0 bg-ink text-white rounded-2xl p-5 flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold">Asystent</h2>
          {brakujace.length === 0 ? (
            <p className="bg-[#1C2E52] rounded-xl p-3.5">Canva kompletna – możesz przejść do formularza wniosku.</p>
          ) : (
            <div className="bg-[#1C2E52] rounded-xl p-3.5">
              <p className="mb-2">Do wniosku brakuje jeszcze:</p>
              <ul className="flex flex-wrap gap-1.5">
                {brakujace.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setAktywna(SEKCJE.findIndex((x) => x.id === s.id))} className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold">
                      {s.nazwa}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-white/70">Część odpowiedzi wypełniliśmy z Twojej fiszki – sprawdź je.</p>
          {kontekstAI && (
            <p className="bg-[#1C2E52] rounded-xl p-3.5 text-[15px]">
              💡 Nie wiesz, co wpisać? Przy polach do pisania kliknij <strong>„Podpowiedz”</strong> – asystent zaproponuje odpowiedź, a Ty zdecydujesz, czy ją wstawić.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

// Jeden komponent rysuje każdy typ pytania z data/canva.js
function Pytanie({ pytanie, wartosc, onZmiana, tylkoOdczyt, children }) {
  return (
    <fieldset disabled={tylkoOdczyt} className="flex flex-col gap-3">
      <legend className="font-bold text-xl mb-1">{pytanie.tytul}</legend>
      {pytanie.opis && <p className="text-muted">{pytanie.opis}</p>}

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
                className={'text-left p-3.5 rounded-xl min-h-22 ' + (wybrana ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white hover:border-[#B8C2D0]')}
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
                className={'min-h-11 px-4 rounded-full font-bold text-[15px] disabled:opacity-40 ' + (zaznaczona ? 'border-[3px] border-teal bg-teal-light text-teal-dark' : 'border-2 border-line bg-white')}
              >
                {zaznaczona && '✓ '}{o}
              </button>
            )
          })}
        </div>
      )}

      {pytanie.typ === 'tekst' && (
        <textarea
          id={'canva-' + pytanie.id}
          rows={3}
          aria-label={pytanie.tytul}
          value={wartosc || ''}
          onChange={(e) => onZmiana(e.target.value)}
          className="w-full p-3.5 rounded-xl border border-[#B8C2D0] resize-y"
        />
      )}
      {children}
    </fieldset>
  )
}
