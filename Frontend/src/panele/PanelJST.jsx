import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane } from '../data/DaneContext.jsx'
import { OBSZARY, obszarPoId } from '../data/obszary.js'
import { powiaty } from '../data/zasobnik.js'

// Panel gminy (JST): zgłasza lokalne wyzwania, widzi sygnały mieszkańców ze swojego powiatu,
// prowadzi pomysły i śledzi ranking potrzeb mieszkańców.
export default function PanelJST() {
  const { uzytkownik: ja, ustawProfil } = useAuth()
  const { fiszki, zgloszenia, biblioteka } = useDane()

  const powiat = ja.powiat || powiaty[0].nazwa
  const mojeWyzwania = zgloszenia.filter((z) => z.zrodlo === 'jst' && z.autorId === ja.id)
  const prowadzone = fiszki.filter((f) => f.prowadzacy?.id === ja.id)

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1">Panel gminy</h1>
          <p className="text-muted text-lg">Zgłaszaj wyzwania, sprawdzaj, czego potrzebują mieszkańcy, i wdrażaj sprawdzone innowacje.</p>
        </div>
        <label className="flex flex-col gap-1 font-bold text-[15px]">
          Twój powiat
          <select value={powiat} onChange={(e) => ustawProfil({ powiat: e.target.value })} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal bg-white">
            {powiaty.map((p) => <option key={p.nazwa}>{p.nazwa}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-10">
        <Kafel nazwa="Innowacje w katalogu ROPS" liczba={biblioteka.length} link="/zasobnik?dzial=biblioteka" />
        <Kafel nazwa="Zgłoszone wyzwania" liczba={mojeWyzwania.length} />
      </div>

      <section className="mb-10">
        <div className="flex flex-wrap justify-between items-end gap-3 mb-4">
          <div>
            <h2 className="font-display font-bold text-2xl mb-1">Pomysły prowadzone przez gminę</h2>
            <p className="text-muted text-[15px]">Własne pomysły gminy i te przejęte od mieszkańców (za ich zgodą).</p>
          </div>
          <Link to="/kreator" className="min-h-11 px-4 inline-flex items-center rounded-lg bg-clay text-white font-bold no-underline">+ Zgłoś pomysł gminy</Link>
        </div>
        {prowadzone.length === 0 && <p className="text-muted">Brak. Zgłoś własny pomysł albo przejmij pomysł mieszkańca z jego wątku („Przejmij jako gmina”).</p>}
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {prowadzone.map((f) => (
            <li key={f.id}>
              <Link to={'/pomysl/' + f.id} className="h-full flex flex-col gap-1 bg-white border border-line rounded-2xl px-5 py-4 no-underline text-ink hover:border-ink">
                <span className="text-xs font-bold text-muted uppercase">{f.odJST ? 'pomysł gminy' : 'przejęty od: ' + f.autor}</span>
                <strong>{f.tytul}</strong>
                <span className="text-sm text-muted">{{ opublikowana: 'opublikowany', odrzucona: 'usunięty przez ROPS', zarchiwizowana: 'zarchiwizowany' }[f.status] || 'czeka na ROPS'} · wątek →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-6 items-start mb-10">
        <ZglosWyzwanie powiat={powiat} />
      </div>

      <section className="mb-10 bg-white border border-line rounded-2xl p-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Czego potrzebują mieszkańcy</h2>
          <p className="text-muted text-[15px]">Ranking pomysłów według poparć – najbardziej palące potrzeby w regionie.</p>
        </div>
        <Link to="/innowacje" className="min-h-11 px-4 inline-flex items-center rounded-lg border-2 border-ink font-bold no-underline text-ink">Zobacz ranking →</Link>
      </section>

      {mojeWyzwania.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-2xl mb-4">Zgłoszone przez Was wyzwania</h2>
          <ul className="flex flex-col gap-2">
            {mojeWyzwania.map((z) => (
              <li key={z.id} className="bg-white border border-line rounded-xl px-4 py-3 flex flex-wrap justify-between gap-2">
                <span>{z.tekst}</span>
                <span className="text-sm text-muted">{(z.obszary || []).map((o) => obszarPoId(o)?.nazwa).join(', ')} · {new Date(z.data).toLocaleDateString('pl-PL')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function Kafel({ nazwa, liczba, link }) {
  const tresc = <><p className="text-[15px] text-muted mb-1">{nazwa}</p><p className="font-display font-extrabold text-4xl">{liczba}</p></>
  const klasa = 'rounded-2xl p-5 border bg-white border-line no-underline text-ink'
  return link ? <Link to={link} className={klasa + ' hover:border-ink'}>{tresc}</Link> : <div className={klasa}>{tresc}</div>
}

// Wyzwanie gminy trafia do trendów ROPS (POST /api/wyzwania-jst)
function ZglosWyzwanie({ powiat }) {
  const { zglosWyzwanieJST } = useDane()
  const [obszar, setObszar] = useState('')
  const [tekst, setTekst] = useState('')
  const [wyslano, setWyslano] = useState(false)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); zglosWyzwanieJST({ tekst: tekst.trim(), obszary: [obszar], powiat }); setTekst(''); setObszar(''); setWyslano(true) }}
      className="flex-[1_1_380px] min-w-0 bg-clay-light rounded-2xl p-6 flex flex-col gap-3"
    >
      <h2 className="font-display font-bold text-2xl">Zgłoś wyzwanie gminy</h2>
      <p className="text-[15px] -mt-1">ROPS zobaczy je w trendach potrzeb regionu i podpowie pasujące innowacje.</p>
      <label className="flex flex-col gap-1 font-bold">
        Obszar
        <select value={obszar} onChange={(e) => { setObszar(e.target.value); setWyslano(false) }} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal bg-white">
          <option value="">— wybierz —</option>
          {OBSZARY.map((o) => <option key={o.id} value={o.id}>{o.nazwa}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 font-bold">
        Opis wyzwania
        <textarea rows={3} value={tekst} onChange={(e) => { setTekst(e.target.value); setWyslano(false) }} className="p-3 rounded-xl border border-[#B8C2D0] font-normal bg-white resize-y" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!obszar || !tekst.trim()} className="min-h-12 px-5 rounded-xl bg-clay text-white font-bold disabled:opacity-50">Zgłoś</button>
        {wyslano && <span role="status" className="font-bold text-clay-dark">Wysłane do ROPS.</span>}
      </div>
    </form>
  )
}

