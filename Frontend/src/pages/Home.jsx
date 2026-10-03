import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { innowacje } from '../data/innowacje.js'

const podpowiedzi = ['transport dla seniorów', 'wykluczenie cyfrowe', 'samotność osób starszych', 'opieka wytchnieniowa']

export default function Home() {
  const [opis, setOpis] = useState('')
  const navigate = useNavigate()

  // Przejście do wyszukiwarki z opisem w adresie: /szukaj?q=...
  const szukaj = (tekst) => navigate('/szukaj?q=' + encodeURIComponent(tekst))

  return (
    <main>
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-14 flex flex-wrap gap-14 items-center">
        <div className="flex-[999_1_560px] min-w-0">
          <p className="font-bold text-teal mb-4">Małopolski Hub Innowacji Społecznych · ROPS Kraków</p>
          <h1 className="font-display font-extrabold text-5xl leading-[1.05] tracking-tight mb-5">
            Opisz problem w swojej okolicy. Pokażemy, kto już go rozwiązał.
          </h1>
          <p className="text-xl text-muted mb-8 max-w-xl">
            Pisz zwyczajnie, własnymi słowami. Porównamy Twój opis z Biblioteką Innowacji Społecznych.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); szukaj(opis) }}
            className="bg-white border-2 border-ink rounded-2xl p-5 flex flex-col gap-3.5 max-w-2xl"
          >
            <label htmlFor="problem" className="font-bold text-lg">Co się dzieje w Twojej okolicy?</label>
            <textarea
              id="problem"
              rows={3}
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              placeholder="Np. Seniorzy z naszej wsi nie mają jak dojechać do przychodni…"
              className="p-3.5 rounded-xl border border-[#B8C2D0] resize-y"
            />
            <button
              type="submit"
              disabled={!opis.trim()}
              className="self-end min-h-13 px-6 rounded-xl bg-teal text-white font-bold text-lg disabled:opacity-50"
            >
              Znajdź podobne rozwiązania →
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <span className="text-[15px] text-muted">Często szukane:</span>
            {podpowiedzi.map((p) => (
              <button
                key={p}
                onClick={() => szukaj(p)}
                className="px-3.5 py-2 rounded-full bg-teal-light text-teal-dark text-[15px] font-bold"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <PodgladDopasowania />
      </section>

      <section className="bg-white border-y border-line">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="font-display font-extrabold text-4xl mb-2">Od czego chcesz zacząć?</h2>
          <p className="text-lg text-muted mb-8">Każdy wchodzi do Splotu z innej strony.</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
            <KartaRoli to="/szukaj" tytul="Mieszkaniec lub NGO" link="Opisz problem →"
              opis="Masz problem w okolicy albo pomysł, jak coś zmienić. Znajdź gotowe rozwiązania i ludzi, którzy Cię poprą." />
            <KartaRoli to="/zasobnik" tytul="Samorząd (JST)" link="Przeglądaj innowacje →"
              opis="Szukasz sprawdzonej usługi dla mieszkańców. Zobacz, co działa w innych gminach Małopolski." />
            <KartaRoli to="/kreator" tytul="Innowator" link="Otwórz Kreator →" akcent
              opis="Masz pomysł na innowację społeczną. Zbuduj fiszkę, zbierz poparcie i złóż wniosek w naborze." />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="font-display font-extrabold text-4xl mb-8">Jak działa Splot</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {[
            ['Opisz', 'Problem albo pomysł — swoimi słowami.'],
            ['Dopasuj', 'Pokazujemy podobne przypadki i sprawdzone innowacje.'],
            ['Zaadaptuj', 'Asystent układa plan wdrożenia pod Twoje zasoby.'],
            ['Testuj i rozwijaj', 'Mieszkańcy testują, mentorzy ROPS pomagają.'],
          ].map(([tytul, opis], i) => (
            <li key={tytul} className="p-6 bg-white border-t-4 border-ink rounded-b-xl">
              <span className="font-display font-extrabold text-4xl text-[#B8C2D0]">0{i + 1}</span>
              <p className="font-bold text-xl mt-2 mb-1">{tytul}</p>
              <p className="text-muted">{opis}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ink text-white">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex-[1_1_520px]">
            <p className="inline-block mb-2.5 px-3 py-1 rounded-full bg-[#F29A5C] text-ink font-bold text-sm">Nabór otwarty do [data]</p>
            <h2 className="font-display font-extrabold text-3xl mb-2">[Nazwa naboru grantowego]</h2>
            <p className="text-white/85 text-lg">Masz fiszkę? Rozwiń ją w pełną Canvę, a przygotujemy z niej wniosek.</p>
          </div>
          <Link to="/kreator" className="min-h-13 px-6 inline-flex items-center rounded-xl bg-white text-ink font-bold text-lg no-underline">
            Przygotuj wniosek
          </Link>
        </div>
      </section>
    </main>
  )
}

function KartaRoli({ to, tytul, opis, link, akcent = false }) {
  return (
    <Link to={to} className="flex flex-col gap-3 p-7 rounded-2xl bg-ground border border-line text-ink no-underline hover:border-ink">
      <span className="font-display font-bold text-2xl">{tytul}</span>
      <span className="text-muted">{opis}</span>
      <span className={'mt-auto font-bold ' + (akcent ? 'text-clay' : 'text-teal')}>{link}</span>
    </Link>
  )
}

// Ilustracja "splotu": zgłoszenie mieszkańca → dopasowana innowacja
function PodgladDopasowania() {
  const przyklad = innowacje.find((i) => i.tytul === 'Mobilny Sąsiad')
  return (
    <div aria-hidden="true" className="flex-[1_1_380px] min-w-0">
      <div className="bg-white border border-line rounded-2xl px-5 py-4 shadow-[0_2px_0_#D8DEE7]">
        <p className="text-xs font-bold text-clay uppercase tracking-wider mb-1">Zgłoszenie · pow. myślenicki</p>
        <p>„Starsi sąsiedzi nie mają jak dojechać do lekarza…”</p>
      </div>
      <svg viewBox="0 0 380 110" className="w-full h-[110px] block">
        <path d="M60 0 C60 55 320 55 320 110" stroke="#F29A5C" strokeWidth="4" fill="none" />
        <path d="M320 0 C320 55 60 55 60 110" stroke="#5CC8A8" strokeWidth="4" fill="none" />
      </svg>
      <div className="bg-ink text-white rounded-2xl px-6 py-5">
        <p className="text-xs font-bold text-[#5CC8A8] uppercase tracking-wider mb-2">Bardzo podobny przypadek</p>
        <p className="font-display font-bold text-2xl mb-1">{przyklad.tytul}</p>
        <p className="text-white/85">{przyklad.opis}</p>
      </div>
    </div>
  )
}
