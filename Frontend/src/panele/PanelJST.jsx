import { useState } from 'react'
import { useDane, opublikowane } from '../data/DaneContext.jsx'
import { powiaty } from '../data/zasobnik.js'
import { dopasuj } from '../data/dopasuj.js'
import PasekEtapu from '../components/PasekEtapu.jsx'
import { policz } from '../data/policz.js'

const INTENSYWNOSC = {
  bardzo: { nazwa: 'Bardzo poważny', klasa: 'bg-[#FDE2E1] text-[#9B1C1C]' },
  mocno: { nazwa: 'Mocno przeszkadza', klasa: 'bg-clay-light text-clay-dark' },
  utrudnia: { nazwa: 'Utrudnia życie', klasa: 'bg-[#E6EAF0] text-ink' },
  lekko: { nazwa: 'Lekko przeszkadza', klasa: 'bg-[#E6EAF0] text-muted' },
}
const WAGA = { bardzo: 4, mocno: 3, utrudnia: 2, lekko: 1 }

// Panel urzędnika JST: potrzeby z mojego terenu → gotowe innowacje do wdrożenia
export default function PanelJST() {
  // Docelowo powiat bierzemy z konta urzędnika (jst_id); w demo można przełączać
  const [powiat, setPowiat] = useState('myślenicki')
  const { innowacje, zgloszenia, dodajZgloszenie } = useDane()
  const [wyzwanie, setWyzwanie] = useState('')
  const [wyslano, setWyslano] = useState(false)

  const lokalne = zgloszenia.filter((z) => z.powiat === powiat)
  const tematy = policz(lokalne.flatMap((z) => z.tematy))
  const pub = opublikowane(innowacje)
  // Problemy z fiszek mieszkańców z tego powiatu – tylko zatwierdzone przez ROPS,
  // najpoważniejsze na górze
  const fiszki = pub
    .filter((i) => i.powiat === powiat && i.etap < 4)
    .sort((a, b) => (WAGA[b.intensywnosc] || 0) - (WAGA[a.intensywnosc] || 0) || b.poparcia - a.poparcia)
  // Gotowe innowacje (etap 4+) dopasowane do zapytań ORAZ problemów z fiszek
  const opisPotrzeb = [...tematy.map((t) => t.nazwa), ...fiszki.map((f) => f.opis)].join(' ')
  const dlaMnie = dopasuj(opisPotrzeb, pub.filter((i) => i.etap >= 4))

  function zglos(e) {
    e.preventDefault()
    dodajZgloszenie({
      tekst: wyzwanie.trim(),
      tematy: wyzwanie.toLowerCase().split(/[^a-ząćęłńóśźż]+/).filter((s) => s.length > 4).slice(0, 4),
      powiat,
      zrodlo: 'jst',
    })
    setWyzwanie('')
    setWyslano(true)
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1">Panel gminy</h1>
          <p className="text-muted text-lg">Czego potrzebują mieszkańcy Twojego terenu i co już działa gdzie indziej.</p>
        </div>
        <label className="flex flex-col gap-1 font-bold text-sm">
          Powiat
          <select value={powiat} onChange={(e) => setPowiat(e.target.value)} className="min-h-11 px-3 rounded-lg border border-line bg-white font-normal text-base">
            {powiaty.map((p) => <option key={p.nazwa} value={p.nazwa}>{p.nazwa}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section className="flex-[1_1_340px] min-w-0 bg-white border border-line rounded-2xl p-6">
          <h2 className="font-display font-bold text-2xl mb-1">O co pytają mieszkańcy</h2>
          <p className="text-muted text-sm mb-4">Zgłoszenia z wyszukiwarki z pow. {powiat}, bez danych osobowych.</p>
          {tematy.length === 0 ? (
            <p className="text-muted">Brak zgłoszeń z tego powiatu.</p>
          ) : (
            <ul className="flex flex-wrap gap-2 mb-5">
              {tematy.map((t) => (
                <li key={t.nazwa} className="px-3 py-1 rounded-full bg-teal-light text-teal-dark font-bold text-[15px]">
                  {t.nazwa} · {t.liczba}
                </li>
              ))}
            </ul>
          )}
          <ul className="flex flex-col gap-2">
            {lokalne.slice(0, 5).map((z) => (
              <li key={z.id} className="px-3.5 py-2.5 rounded-lg bg-ground text-base">
                {z.tekst}
                <span className="block text-xs text-muted">{new Date(z.data).toLocaleDateString('pl-PL')}{z.zrodlo === 'jst' ? ' · zgłoszenie gminy' : ''}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex-[2_1_480px] min-w-0 flex flex-col gap-4">
          <h2 className="font-display font-bold text-2xl">Gotowe innowacje dla tych potrzeb</h2>
          {dlaMnie.length === 0 && <p className="text-muted">Brak sprawdzonych innowacji pasujących do zgłoszeń z tego powiatu.</p>}
          {dlaMnie.map((i) => (
            <article key={i.id} className="bg-white border border-line rounded-2xl p-5 flex flex-wrap gap-4 items-center">
              <div className="flex-[999_1_300px] min-w-0">
                <h3 className="font-display text-xl font-bold">{i.tytul}</h3>
                <p className="text-muted mb-2">{i.opis}</p>
                <p className="text-sm"><strong>Odpowiada na:</strong> {i.wspolne.join(', ')}</p>
              </div>
              <button disabled title="Middleman – w przygotowaniu" className="min-h-11 px-4 rounded-lg bg-teal text-white font-bold disabled:opacity-60">
                Zaplanuj wdrożenie
              </button>
            </article>
          ))}

          <h2 className="font-display font-bold text-2xl mt-4">Problemy z fiszek mieszkańców ({fiszki.length})</h2>
          <p className="text-muted -mt-2">
            Mieszkańcy pow. {powiat} opisali te problemy i mają pomysł na ich rozwiązanie. Gmina może wesprzeć ich jako partner.
          </p>
          {fiszki.length === 0 && <p className="text-muted">Brak zatwierdzonych fiszek z tego powiatu.</p>}
          {fiszki.map((i) => (
            <article key={i.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-muted">Problem</p>
                  <p className="text-lg">{i.opis}</p>
                </div>
                {INTENSYWNOSC[i.intensywnosc] && (
                  <span className={'px-2.5 py-0.5 rounded-full text-sm font-bold ' + INTENSYWNOSC[i.intensywnosc].klasa}>
                    {INTENSYWNOSC[i.intensywnosc].nazwa}
                  </span>
                )}
              </div>
              <p className="text-base"><strong>Pomysł mieszkańca:</strong> {i.tytul} · {i.poparcia} poparć</p>
              <PasekEtapu etap={i.etap} />
              {i.szuka && <p className="text-sm font-bold text-clay-dark">Szuka: {i.szuka}</p>}
              <div className="flex flex-wrap gap-2">
                <button disabled title="Wkrótce – wymaga backendu" className="min-h-11 px-4 rounded-lg bg-ink text-white font-bold disabled:opacity-60">
                  Zaoferuj wsparcie gminy
                </button>
                <button disabled title="Wkrótce – wymaga backendu" className="min-h-11 px-4 rounded-lg border-2 border-line font-bold disabled:opacity-60">
                  Napisz do autora
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <section className="mt-8 bg-white border border-line rounded-2xl p-6 max-w-3xl">
        <h2 className="font-display font-bold text-2xl mb-1">Zgłoś wyzwanie lokalne</h2>
        <p className="text-muted mb-4">Oficjalne zgłoszenie gminy trafia do trendów ROPS i do dopasowań dla innowatorów.</p>
        <form onSubmit={zglos} className="flex flex-col gap-3">
          <label htmlFor="wyzwanie" className="sr-only">Opis wyzwania</label>
          <textarea
            id="wyzwanie"
            rows={3}
            value={wyzwanie}
            onChange={(e) => { setWyzwanie(e.target.value); setWyslano(false) }}
            placeholder="Np. Rośnie liczba samotnych seniorów w sołectwach bez świetlicy…"
            className="p-3.5 rounded-xl border border-[#B8C2D0] resize-y"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={!wyzwanie.trim()} className="min-h-11 px-5 rounded-lg bg-ink text-white font-bold disabled:opacity-50">
              Zgłoś wyzwanie
            </button>
            {wyslano && <span role="status" className="text-teal-dark font-bold">Zgłoszono.</span>}
          </div>
        </form>
      </section>
    </main>
  )
}
