import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane, STATUSY_WDROZENIA } from '../data/DaneContext.jsx'
import { OBSZARY, obszarPoId } from '../data/obszary.js'
import { powiaty } from '../data/zasobnik.js'

// Panel gminy (JST): zgłasza lokalne wyzwania, widzi sygnały mieszkańców ze swojego powiatu,
// prowadzi pomysły i śledzi ranking potrzeb mieszkańców.
export default function PanelJST() {
  const { uzytkownik: ja, ustawProfil } = useAuth()
  const { fiszki, zgloszenia, wdrozenia } = useDane()

  const powiat = ja.powiat || powiaty[0].nazwa
  const mojeWyzwania = zgloszenia.filter((z) => z.zrodlo === 'jst' && z.autorId === ja.id)
  const prowadzone = fiszki.filter((f) => f.prowadzacy?.id === ja.id)
  const mojeWdrozenia = wdrozenia.filter((w) => w.gminaId === ja.id).sort((a, b) => b.zmieniono.localeCompare(a.zmieniono))

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
        <Kafel nazwa="Do wdrożenia" liczba={mojeWdrozenia.length} link="/baza-wiedzy" />
        <Kafel nazwa="Zgłoszone wyzwania" liczba={mojeWyzwania.length} />
      </div>

      <section className="mb-10">
        <div className="flex flex-wrap justify-between items-end gap-3 mb-4">
          <div>
            <h2 className="font-display font-bold text-2xl mb-1">Do wdrożenia</h2>
            <p className="text-muted text-[15px]">Innowacje z Biblioteki ROPS i pomysły mieszkańców, które zapisaliście. Middleman przygotuje plan pod Wasz budżet i zespół.</p>
          </div>
          <Link to="/baza-wiedzy" className="min-h-11 px-4 inline-flex items-center rounded-lg border-2 border-ink font-bold no-underline text-ink">Szukaj w Bazie wiedzy →</Link>
        </div>
        {mojeWdrozenia.length === 0 && <p className="text-muted">Nic jeszcze nie zapisaliście. W Bazie wiedzy albo w wątku pomysłu użyj „Zapisz” lub „Dopasuj do naszej gminy”.</p>}
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {mojeWdrozenia.map((w) => (
            <li key={w.id}>
              <Link to={'/wdrozenie/' + w.id} className="h-full flex flex-col gap-1.5 bg-white border border-line rounded-2xl px-5 py-4 no-underline text-ink hover:border-ink">
                <span className="text-xs font-bold text-muted uppercase">{w.zasob.typ === 'biblioteka' ? 'innowacja ROPS' : 'pomysł mieszkańców'}</span>
                <strong>{w.zasob.tytul}</strong>
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={'px-2 py-0.5 rounded-full font-bold ' + STATUSY_WDROZENIA[w.status].klasa}>{STATUSY_WDROZENIA[w.status].nazwa}</span>
                  {w.plan && <span className="text-muted">{{ realne: 'realne', realne_po_uproszczeniu: 'po uproszczeniu', nierealne: 'nierealne' }[w.plan.feasibility]}</span>}
                  <span className="text-muted">· {w.plan ? 'plan →' : 'przygotuj plan →'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

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

      <ProsbyOPrzejecie />
      <DoPrzejecia />

      <div className="flex flex-wrap gap-6 items-start mb-10">
        <ZglosWyzwanie powiat={powiat} />
      </div>

      {mojeWyzwania.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-2xl mb-4">Zgłoszone przez Was wyzwania</h2>
          <ul className="flex flex-col gap-2">
            {mojeWyzwania.map((z) => (
              <li key={z.id} className="bg-white border border-line rounded-xl px-4 py-3 flex flex-wrap justify-between gap-2">
                <span>{z.tekst}</span>
                <span className="text-sm text-muted">{new Date(z.data).toLocaleDateString('pl-PL')}</span>
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

const STATUS_PRZEJECIA = {
  czeka: { nazwa: 'Czeka na autora', klasa: 'bg-clay-light text-clay-dark' },
  przyjeta: { nazwa: 'Przyjęta – prowadzicie', klasa: 'bg-teal-light text-teal-dark' },
  odrzucona: { nazwa: 'Odrzucona', klasa: 'bg-[#FDE2E1] text-[#9B1C1C]' },
  wycofana: { nazwa: 'Wycofana', klasa: 'bg-[#E6EAF0] text-muted' },
}

// Prośby tej gminy o przejęcie pomysłów (GET /api/takeover-requests?mine=1)
function ProsbyOPrzejecie() {
  const { uzytkownik: ja } = useAuth()
  const { przejecia, fiszki, wycofajPrzejecie } = useDane()
  const moje = przejecia.filter((p) => p.gminaId === ja.id).sort((a, b) => b.data.localeCompare(a.data))
  if (moje.length === 0) return null
  return (
    <section className="mb-10">
      <h2 className="font-display font-bold text-2xl mb-1">Wasze prośby o przejęcie</h2>
      <p className="text-muted text-[15px] mb-4">Autor pomysłu decyduje, czy oddaje Wam prowadzenie. Czekającą prośbę możecie wycofać.</p>
      <ul className="flex flex-col gap-2">
        {moje.map((p) => {
          const f = fiszki.find((x) => x.id === p.fiszkaId)
          const st = STATUS_PRZEJECIA[p.status]
          return (
            <li key={p.id} className="bg-white border border-line rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex-[1_1_260px] min-w-0">
                <Link to={'/pomysl/' + p.fiszkaId} className="font-bold">{f?.tytul || 'Pomysł'}</Link>
                <p className="text-sm text-muted">wysłana {kiedy(p.data)}{p.decyzja && ` · decyzja ${kiedy(p.decyzja)}`}</p>
              </div>
              <span className={'px-2.5 py-0.5 rounded-full text-sm font-bold ' + st.klasa}>{st.nazwa}</span>
              {p.status === 'czeka' && <button type="button" onClick={() => wycofajPrzejecie(p.id)} className="min-h-10 px-3 rounded-lg border-2 border-line font-bold text-sm">Wycofaj</button>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Opublikowane pomysły mieszkańców, których nikt jeszcze nie prowadzi – według poparć
function DoPrzejecia() {
  const { uzytkownik: ja } = useAuth()
  const { fiszki, przejecia } = useDane()
  const [ile, setIle] = useState(5)
  const wolne = fiszki
    .filter((f) => f.status === 'opublikowana' && !f.prowadzacy && f.autorId !== ja.id)
    .sort((a, b) => liczbaPoparc(b) - liczbaPoparc(a))
  return (
    <section className="mb-10">
      <h2 className="font-display font-bold text-2xl mb-1">Pomysły do przejęcia</h2>
      <p className="text-muted text-[15px] mb-4">Pomysły mieszkańców, których nie prowadzi jeszcze żadna gmina – od najbardziej popieranych. Otwórz wątek i poproś autora o przejęcie.</p>
      {wolne.length === 0 && <p className="text-muted">Teraz nie ma wolnych pomysłów.</p>}
      <ul className="flex flex-col gap-2">
        {wolne.slice(0, ile).map((f) => {
          const wyslana = przejecia.some((p) => p.fiszkaId === f.id && p.gminaId === ja.id && p.status === 'czeka')
          return (
            <li key={f.id} className="bg-white border border-line rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex-[1_1_320px] min-w-0">
                <Link to={'/pomysl/' + f.id} className="font-display text-lg font-bold">{f.tytul}</Link>
                <p className="text-[15px] text-muted line-clamp-1">{f.problem}</p>
              </div>
              <span className="text-right leading-tight"><strong className="font-display text-2xl block">{liczbaPoparc(f)}</strong><span className="text-sm text-muted">poparć</span></span>
              {wyslana
                ? <span className="px-2.5 py-1 rounded-full bg-clay-light text-clay-dark text-sm font-bold">Prośba wysłana</span>
                : <Link to={'/pomysl/' + f.id} className="min-h-11 px-4 inline-flex items-center rounded-lg bg-ink text-white font-bold no-underline">Zobacz i poproś →</Link>}
            </li>
          )
        })}
      </ul>
      {wolne.length > ile && <button type="button" onClick={() => setIle(ile + 5)} className="mt-3 min-h-11 px-5 rounded-xl border-2 border-ink bg-white font-bold">Pokaż więcej · jeszcze {wolne.length - ile}</button>}
    </section>
  )
}

// Wyzwanie gminy trafia do trendów ROPS (POST /api/wyzwania-jst)
function ZglosWyzwanie({ powiat }) {
  const { zglosWyzwanieJST } = useDane()
  const [tekst, setTekst] = useState('')
  const [wyslano, setWyslano] = useState(false)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); zglosWyzwanieJST({ tekst: tekst.trim(), powiat }); setTekst(''); setWyslano(true) }}
      className="flex-[1_1_380px] min-w-0 bg-clay-light rounded-2xl p-6 flex flex-col gap-3"
    >
      <h2 className="font-display font-bold text-2xl">Zgłoś wyzwanie gminy</h2>
      <p className="text-[15px] -mt-1">ROPS zobaczy je w trendach potrzeb regionu.</p>
      <label className="flex flex-col gap-1 font-bold">
        Opis wyzwania
        <textarea rows={3} value={tekst} onChange={(e) => { setTekst(e.target.value); setWyslano(false) }} className="p-3 rounded-xl border border-[#B8C2D0] font-normal bg-white resize-y" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!tekst.trim()} className="min-h-12 px-5 rounded-xl bg-clay text-white font-bold disabled:opacity-50">Zgłoś</button>
        {wyslano && <span role="status" className="font-bold text-clay-dark">Wysłane do ROPS.</span>}
      </div>
    </form>
  )
}

