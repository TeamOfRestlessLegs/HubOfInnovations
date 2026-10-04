import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth, ROLE } from '../auth/AuthContext.jsx'
import { useDane } from '../data/DaneContext.jsx'
import { naborOtwarty } from '../data/nabory.js'
import { liczbaPoparc, prowadzi, uczestniczy } from '../data/watekFiszki.js'
import { kiedy } from '../data/czas.js'
import SzczegolyFiszki from '../components/SzczegolyFiszki.jsx'
import PasekEtapu from '../components/PasekEtapu.jsx'
import StatusWpisu from '../components/StatusWpisu.jsx'
import WzorWniosku from '../components/WzorWniosku.jsx'
import UsunFiszke from '../components/UsunFiszke.jsx'
import DecyzjaZarzadu from '../components/DecyzjaZarzadu.jsx'
import { GRUPY } from '../data/fiszka.js'
import { ETAPY } from '../data/etapy.js'

// Trzy zakładki wątku: luźna dyskusja, merytoryczne Q&A z ekspertami/ROPS, oficjalna sekcja „twarda”
const ZAKLADKI = [
  { id: 'dyskusja', nazwa: 'Dyskusja', opis: 'Luźne komentarze społeczności' },
  { id: 'eksperci', nazwa: 'Rozmowy z ekspertami', opis: 'Pytania i konsultacje – baza wiedzy' },
  { id: 'oficjalne', nazwa: 'Oficjalne informacje i dokumenty', opis: 'Wpisy ROPS i gminy, statusy, wnioski' },
]

// Wątek pomysłu: panel główny (fiszka, poparcie, nabory) + 3 zakładki. Widzą go wszyscy.
// Docelowo GET /api/fiszki/{id}/watek.
export default function Pomysl() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { uzytkownik: ja } = useAuth()
  const { fiszki, aktualnosci, komentarze, pytania, nabory, wnioski } = useDane()
  const f = fiszki.find((x) => String(x.id) === id)
  if (!f) return <Brak tekst="Nie ma takiego pomysłu." />
  // Publiczny wątek widzą wszyscy; przed poparciem – tylko prowadzący, ROPS i eksperci
  const zarzadza = ja?.rola === 'rops_admin' || ja?.rola === 'ekspert'
  if (f.status !== 'opublikowana' && !uczestniczy(f, ja) && !zarzadza) return <Brak tekst={f.status === 'odrzucona' ? 'Ten pomysł został usunięty przez ROPS.' : 'Ten pomysł jeszcze nie jest publiczny – czeka na poparcie ROPS albo eksperta.'} />

  const edycja = params.has('edycja')
  // Odrzucony przez ROPS albo zarchiwizowany = wątek zamknięty (tylko do odczytu)
  const zakonczona = f.status === 'zarchiwizowana' || f.status === 'odrzucona'
  const zakladka = ZAKLADKI.some((z) => z.id === params.get('sekcja')) ? params.get('sekcja') : 'dyskusja'
  const mojProwadzony = prowadzi(f, ja)
  const osCzasu = aktualnosci.filter((a) => a.fiszkaId === f.id).sort((a, b) => b.data.localeCompare(a.data))
  const ekspertow = komentarze.filter((k) => k.fiszkaId === f.id && k.rola === 'ekspert')
  const dyskusja = komentarze.filter((k) => k.fiszkaId === f.id && k.rola !== 'ekspert')
  const jegoPytania = pytania.filter((q) => q.fiszkaId === f.id)
  const jegoWnioski = wnioski.filter((w) => w.fiszkaId === f.id)
  const liczniki = { dyskusja: dyskusja.length, eksperci: jegoPytania.length + ekspertow.length, oficjalne: osCzasu.length }
  // Pozycja w rankingu poparć (weryfikacja społeczna)
  const ranking = [...fiszki.filter((x) => x.status === 'opublikowana')].sort((a, b) => liczbaPoparc(b) - liczbaPoparc(a))
  const miejsce = ranking.findIndex((x) => x.id === f.id) + 1

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <nav aria-label="Ścieżka" className="text-[15px] mb-4"><Link to="/innowacje">Pomysły</Link> <span className="text-muted">› {f.tytul}</span></nav>

      {/* Panel główny */}
      <Naglowek f={f} ja={ja} miejsce={miejsce} />
      <div className="flex flex-col gap-3 mb-6">
        <Weryfikacja f={f} ja={ja} />
        <ProsbaPrzejecia f={f} ja={ja} />
        {f.status === 'opublikowana' && nabory.filter(naborOtwarty).map((n) => (
          <BannerNaboru key={n.id} f={f} n={n} wniosek={jegoWnioski.find((w) => w.naborId === n.id)} prowadzacy={mojProwadzony} />
        ))}
        <PrzejmijJakoGmina f={f} ja={ja} />
      </div>
      <section aria-labelledby="h-o" className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 mb-8">
        <h2 id="h-o" className="font-display font-bold text-2xl">O pomyśle</h2>
        {mojProwadzony && !zakonczona && edycja ? (
          <EdycjaFiszki f={f} onKoniec={() => setParams((p) => { p.delete('edycja'); return p }, { replace: true })} />
        ) : (
          <>
            <SzczegolyFiszki fiszka={f} />
            <ZmianaEtapu f={f} ja={ja} />
            {mojProwadzony && !zakonczona && (
              <button type="button" onClick={() => setParams((p) => { p.set('edycja', '1'); return p }, { replace: true })}
                className={'self-start min-h-11 px-4 rounded-lg font-bold ' + (f.status === 'do_poprawy' ? 'bg-ink text-white' : 'border-2 border-line')}>
                {f.status === 'do_poprawy' ? 'Wprowadź poprawki' : 'Edytuj fiszkę'}
              </button>
            )}
          </>
        )}
      </section>

      {/* Zakładki wątku */}
      <div role="tablist" aria-label="Sekcje wątku" className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        {ZAKLADKI.map((z) => (
          <button key={z.id} type="button" role="tab" id={'tab-' + z.id} aria-selected={zakladka === z.id} aria-controls={'panel-' + z.id}
            onClick={() => setParams({ sekcja: z.id }, { replace: true })}
            className={'text-left px-4 py-3 rounded-xl border-2 ' + (zakladka === z.id ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>
            <span className="flex justify-between items-center gap-2 font-bold">{z.nazwa}<span className={'px-2 rounded-full text-sm ' + (zakladka === z.id ? 'bg-white/20' : 'bg-ground')}>{liczniki[z.id]}</span></span>
            <span className={'block text-sm ' + (zakladka === z.id ? 'text-white/75' : 'text-muted')}>{z.opis}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={'panel-' + zakladka} aria-labelledby={'tab-' + zakladka}>
        {zakladka === 'dyskusja' && (
          <Opinie id="opinie" tytul="Dyskusja" opis="Otwarta dyskusja dla wszystkich: masz podobny problem, pomysł albo chcesz pomóc? Napisz. Rozmowy autora z ekspertami możesz czytać w sąsiedniej zakładce."
            lista={dyskusja} mozePisac={!zakonczona && !!ja && ja.rola !== 'ekspert' && ja.rola !== 'rops_admin'} fiszkaId={f.id} pusto="Bądź pierwszą osobą, która zabierze głos." />
        )}
        {zakladka === 'eksperci' && (
          <div className="flex flex-col gap-12">
            <Pytania f={f} ja={ja} lista={jegoPytania} mojProwadzony={mojProwadzony && !zakonczona} />
            <Opinie id="eksperci" tytul="Konsultacje ekspertów" opis="Opinie ekspertów i mentorów o całym pomyśle – co dopracować."
              lista={ekspertow} mozePisac={!zakonczona && ja?.rola === 'ekspert'} fiszkaId={f.id} pusto="Żaden ekspert jeszcze się nie wypowiedział." />
          </div>
        )}
        {zakladka === 'oficjalne' && (
          <Oficjalne f={f} ja={ja} lista={osCzasu} wnioski={jegoWnioski} nabory={nabory} mozeDodac={ja?.rola === 'rops_admin' || (ja?.rola === 'jst' && f.prowadzacy?.id === ja.id)} />
        )}
      </div>
    </main>
  )
}

function Naglowek({ f, ja, miejsce }) {
  const { poprzyj } = useDane()
  const poparte = !!ja && (f.poparli || []).includes(ja.id)
  const autor = ja && f.autorId === ja.id
  return (
    <header className="mb-6 flex flex-wrap justify-between gap-6 items-start">
      <div className="max-w-3xl flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {f.status !== 'opublikowana' && <StatusWpisu status={f.status} />}
          {f.odJST && <span className="px-2.5 py-0.5 rounded-full bg-ink text-white font-bold text-sm">Pomysł gminy{f.prowadzacy?.powiat && ` · pow. ${f.prowadzacy.powiat}`}</span>}
          {f.prowadzacy && !f.odJST && <span className="px-2.5 py-0.5 rounded-full bg-clay-light text-clay-dark font-bold text-sm">Prowadzi gmina · pow. {f.prowadzacy.powiat}</span>}
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">{f.tytul}</h1>
        <p className="text-muted">{f.odJST ? 'Zgłosiła gmina' : 'Pomysłodawca'}: <strong className="text-ink">{f.autor}</strong></p>
        <div className="max-w-md mt-1"><PasekEtapu etap={f.etap} /></div>
      </div>
      <div className="flex flex-col items-start lg:items-end gap-2">
        <p className="font-display font-extrabold text-4xl leading-none">{liczbaPoparc(f)}</p>
        <p className="text-muted text-[15px] -mt-1">poparć{miejsce > 0 && <> · <strong className="text-ink">#{miejsce}</strong> w <Link to="/innowacje?widok=ranking">rankingu</Link></>}</p>
        {!ja ? (
          <Link to="/logowanie" className="min-h-12 px-5 inline-flex items-center rounded-xl border-2 border-clay text-clay-dark font-bold no-underline">Zaloguj się, żeby poprzeć</Link>
        ) : !autor && f.status === 'opublikowana' && (
          <button type="button" onClick={() => poprzyj(f.id)} aria-pressed={poparte}
            className={'min-h-12 px-5 rounded-xl font-bold border-2 border-clay ' + (poparte ? 'bg-clay text-white' : 'bg-white text-clay-dark')}>
            {poparte ? 'Popierasz i śledzisz ✓' : 'Popieram i śledzę'}
          </button>
        )}
        {!ja ? null : !autor && f.status === 'opublikowana' && <p className="text-sm text-muted max-w-56 lg:text-right">Dostaniesz powiadomienie o każdej aktualności.</p>}
      </div>
    </header>
  )
}

// Pasek weryfikacji: status dla autora, decyzja dla ROPS/eksperta
function Weryfikacja({ f, ja }) {
  if (f.status === 'opublikowana' || f.status === 'zarchiwizowana') {
    // ROPS może usunąć także pomysł już poparty (np. przez eksperta)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        {f.poparcieZarzadu ? <p className="text-[15px] text-muted">Poparty przez {f.poparcieZarzadu.rola === 'ekspert' ? 'eksperta' : 'ROPS'}: <strong className="text-ink">{f.poparcieZarzadu.imie}</strong></p> : <span />}
        <UsunFiszke fiszka={f} />
      </div>
    )
  }
  if (f.status === 'odrzucona') {
    return (
      <div role="status" className="rounded-2xl p-5 flex flex-col gap-2 border-2 border-[#9B1C1C] bg-[#FDE2E1] text-[#5C1010]">
        <p className="font-bold text-lg">ROPS usunął ten pomysł. Wątek jest zakończony.</p>
        {f.powodOdrzucenia && <p><strong>Powód:</strong> „{f.powodOdrzucenia}”</p>}
        <p className="text-[15px]">Pomysł nie jest publiczny – widzą go tylko autor, ROPS i eksperci. Nie można go już edytować ani komentować.</p>
      </div>
    )
  }
  const zarzadza = ja?.rola === 'rops_admin' || ja?.rola === 'ekspert'
  return (
    <div className={'rounded-2xl p-5 flex flex-col gap-3 border-2 ' + (f.status === 'do_poprawy' ? 'border-[#E8A9A6] bg-[#FDE2E1]' : 'border-[#E8C9AE] bg-clay-light')}>
      <p className="font-bold">
        {f.status === 'do_poprawy'
          ? 'Zaproponowano poprawki – czekamy, aż autor je wprowadzi.'
          : 'Pomysł czeka na poparcie ROPS albo eksperta. Do tego czasu widzi go tylko autor (oraz ROPS i eksperci).'}
      </p>
      {f.status === 'do_poprawy' && f.komentarzRops && <p>„{f.komentarzRops}” <Link to="?sekcja=eksperci">Zobacz w Rozmowach z ekspertami →</Link></p>}
      {zarzadza && f.status === 'do_weryfikacji' && <DecyzjaZarzadu fiszka={f} />}
      {f.status === 'do_poprawy' && <div className="flex flex-wrap gap-2"><UsunFiszke fiszka={f} /></div>}
    </div>
  )
}

// Autor poprawia fiszkę (te same 6 pól co w Kreatorze) i wysyła ją ponownie do poparcia
function EdycjaFiszki({ f, onKoniec }) {
  const { edytujFiszke } = useDane()
  const [pola, setPola] = useState({ problem: f.problem || '', grupy: f.grupy || [], grupaInna: f.grupaInna || '', tytul: f.tytul || '', opis: f.opis || '', istota: f.istota || '', etap: Math.min(f.etap || 1, 2) })
  const ustaw = (k, v) => setPola({ ...pola, [k]: v })
  const gotowe = pola.problem.trim() && (pola.grupy.length || pola.grupaInna.trim()) && pola.tytul.trim() && pola.opis.trim() && pola.istota.trim()
  const pole = 'p-3 rounded-xl border border-[#B8C2D0] bg-white'
  return (
    <form onSubmit={(e) => { e.preventDefault(); edytujFiszke(f.id, { ...pola, etap: f.status === 'opublikowana' ? f.etap : pola.etap }); onKoniec() }} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 font-bold">Opis problemu<textarea rows={3} value={pola.problem} onChange={(e) => ustaw('problem', e.target.value)} className={pole + ' font-normal'} /></label>
      <fieldset>
        <legend className="font-bold mb-2">Dedykowana grupa</legend>
        <div className="flex flex-wrap gap-2">
          {GRUPY.map((g) => {
            const z = pola.grupy.includes(g)
            return <button key={g} type="button" aria-pressed={z} onClick={() => ustaw('grupy', z ? pola.grupy.filter((x) => x !== g) : [...pola.grupy, g])}
              className={'min-h-11 px-4 rounded-full font-bold text-[15px] ' + (z ? 'border-[3px] border-teal bg-teal-light text-teal-dark' : 'border-2 border-line bg-white')}>{z && '✓ '}{g}</button>
          })}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 font-bold">Inna grupa<input value={pola.grupaInna} onChange={(e) => ustaw('grupaInna', e.target.value)} className={pole + ' font-normal min-h-11'} /></label>
      <label className="flex flex-col gap-1 font-bold">Nazwa pomysłu<input value={pola.tytul} onChange={(e) => ustaw('tytul', e.target.value)} className={pole + ' font-normal min-h-11'} /></label>
      <label className="flex flex-col gap-1 font-bold">Krótki opis pomysłu<textarea rows={3} value={pola.opis} onChange={(e) => ustaw('opis', e.target.value)} className={pole + ' font-normal'} /></label>
      <label className="flex flex-col gap-1 font-bold">Co jest istotą? Na czym polega nowość?<textarea rows={3} value={pola.istota} onChange={(e) => ustaw('istota', e.target.value)} className={pole + ' font-normal'} /></label>
      {f.status !== 'opublikowana' && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="font-bold mb-2">Etap</legend>
          {ETAPY.filter((e) => e.nr <= 2).map((e) => (
            <button key={e.nr} type="button" role="radio" aria-checked={pola.etap === e.nr} onClick={() => ustaw('etap', e.nr)}
              className={'min-h-11 px-4 rounded-xl font-bold ' + (pola.etap === e.nr ? 'border-[3px] border-teal bg-teal-light' : 'border-2 border-line bg-white')}>{e.nr} · {e.nazwa}</button>
          ))}
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!gotowe} className="min-h-12 px-5 rounded-xl bg-clay text-white font-bold disabled:opacity-50">{f.status === 'opublikowana' ? 'Zapisz zmiany' : 'Zapisz i wyślij do poparcia'}</button>
        <button type="button" onClick={onKoniec} className="min-h-12 px-5 rounded-xl border-2 border-line font-bold">Anuluj</button>
      </div>
    </form>
  )
}

// Gmina chce przejąć pomysł – decyduje autor
// Prośby gmin o przejęcie: autor wybiera jedną (przejęcie jest ostateczne), gmina widzi stan swojej prośby
function ProsbaPrzejecia({ f, ja }) {
  const { przejecia, decyzjaPrzejecia, wycofajPrzejecie } = useDane()
  if (!ja || f.prowadzacy) return null
  const czekajace = przejecia.filter((p) => p.fiszkaId === f.id && p.status === 'czeka')
  if (ja.id === f.autorId && czekajace.length) {
    return (
      <section aria-label="Prośby o przejęcie" className="rounded-2xl border-2 border-clay bg-clay-light p-5 flex flex-col gap-3">
        <p className="font-bold">{czekajace.length === 1 ? 'Gmina chce poprowadzić Twój pomysł.' : `${czekajace.length} gminy chcą poprowadzić Twój pomysł – możesz wybrać jedną.`}</p>
        <p className="text-[15px]">Po zgodzie gmina przejmuje prowadzenie na stałe: edytuje fiszkę, zmienia etap, składa wnioski do naborów i publikuje oficjalne informacje. Ty zostajesz w wątku jako pomysłodawca.</p>
        {czekajace.map((p) => (
          <div key={p.id} className="rounded-xl bg-white p-4 flex flex-col gap-2">
            <p><strong>{p.imie}</strong> · pow. {p.powiat} <span className="text-sm text-muted">· {kiedy(p.data)}</span></p>
            {p.wiadomosc && <p className="italic">„{p.wiadomosc}”</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => decyzjaPrzejecia(p.id, true)} className="min-h-11 px-5 rounded-lg bg-clay text-white font-bold">Zgadzam się</button>
              <button type="button" onClick={() => decyzjaPrzejecia(p.id, false)} className="min-h-11 px-5 rounded-lg border-2 border-clay-dark text-clay-dark font-bold">Nie zgadzam się</button>
            </div>
          </div>
        ))}
      </section>
    )
  }
  const moja = czekajace.find((p) => p.gminaId === ja.id)
  if (moja) {
    return (
      <div role="status" className="rounded-2xl bg-clay-light p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-bold text-clay-dark">Prośba o przejęcie wysłana {kiedy(moja.data)} – czekacie na decyzję autora.</span>
        <button type="button" onClick={() => wycofajPrzejecie(moja.id)} className="min-h-11 px-4 rounded-lg border-2 border-clay-dark text-clay-dark font-bold bg-white">Wycofaj prośbę</button>
      </div>
    )
  }
  return null
}

function PrzejmijJakoGmina({ f, ja }) {
  const { przejecia, poprosOPrzejecie } = useDane()
  const [otwarte, setOtwarte] = useState(false)
  const [wiadomosc, setWiadomosc] = useState('')
  if (ja?.rola !== 'jst' || f.status !== 'opublikowana' || f.prowadzacy || f.autorId === ja.id) return null
  if (przejecia.some((p) => p.fiszkaId === f.id && p.gminaId === ja.id && p.status === 'czeka')) return null
  const wczesniej = przejecia.find((p) => p.fiszkaId === f.id && p.gminaId === ja.id && p.status === 'odrzucona')
  return (
    <div className="rounded-2xl border border-line bg-white p-5 flex flex-col gap-3">
      <p><strong>Chcecie wdrożyć ten pomysł w gminie?</strong> Poproś autora o przejęcie prowadzenia. Przejęcie jest na stałe – autor zostaje pomysłodawcą, a Wy prowadzicie wątek.</p>
      {wczesniej && <p className="text-[15px] text-muted">Autor nie zgodził się na Waszą wcześniejszą prośbę ({kiedy(wczesniej.decyzja)}).</p>}
      {otwarte ? (
        <form onSubmit={(e) => { e.preventDefault(); poprosOPrzejecie(f.id, wiadomosc.trim()); setOtwarte(false) }} className="flex flex-col gap-2">
          <label htmlFor="przejecie" className="font-bold">Wiadomość do autora</label>
          <textarea id="przejecie" rows={2} value={wiadomosc} onChange={(e) => setWiadomosc(e.target.value)} placeholder="Np. mamy lokal i budżet, chcemy uruchomić to w 3 sołectwach." className="p-3 rounded-xl border border-[#B8C2D0]" />
          <div className="flex gap-2">
            <button type="submit" className="min-h-11 px-5 rounded-lg bg-ink text-white font-bold">Wyślij prośbę</button>
            <button type="button" onClick={() => setOtwarte(false)} className="min-h-11 px-4 rounded-lg border-2 border-line font-bold">Anuluj</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOtwarte(true)} className="self-start min-h-11 px-5 rounded-lg border-2 border-ink font-bold">Przejmij jako gmina</button>
      )}
    </div>
  )
}

// Gmina prowadząca sama zmienia etap swojego pomysłu (ROPS robi to w swoim panelu)
function ZmianaEtapu({ f, ja }) {
  const { ustawEtap } = useDane()
  const [etap, setEtap] = useState(f.etap)
  if (ja?.rola !== 'jst' || f.prowadzacy?.id !== ja.id || f.status !== 'opublikowana') return null
  return (
    <form onSubmit={(e) => { e.preventDefault(); ustawEtap(f.id, etap) }} className="flex flex-wrap items-end gap-2 rounded-xl bg-ground p-4">
      <label className="flex flex-col gap-1 font-bold text-[15px]">
        Etap projektu (prowadzicie ten pomysł)
        <select value={etap} onChange={(e) => setEtap(Number(e.target.value))} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] bg-white font-normal">
          {ETAPY.map((x) => <option key={x.nr} value={x.nr}>{x.nr} · {x.nazwa}</option>)}
        </select>
      </label>
      <button type="submit" disabled={etap === f.etap} className="min-h-11 px-4 rounded-lg bg-ink text-white font-bold disabled:opacity-50">Zmień etap</button>
    </form>
  )
}

function BannerNaboru({ f, n, wniosek, prowadzacy }) {
  const stan = !wniosek ? null : wniosek.status
  return (
    <div className="rounded-2xl bg-ink text-white p-5 flex flex-wrap justify-between items-center gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-[#5CC8A8]">Nabór otwarty</p>
        <p className="font-display font-bold text-xl">{n.nazwa}</p>
        <p className="text-white/80 text-[15px]">Zgłoszenia do {new Date(n.termin).toLocaleDateString('pl-PL')}. Ten pomysł może wziąć udział w naborze.</p>
      </div>
      {prowadzacy ? (
        <div className="flex flex-wrap gap-2">
          <WzorWniosku nabor={n} jasny />
          {stan === 'zlozony' ? (
            <span className="min-h-11 px-4 inline-flex items-center rounded-lg bg-white/10 font-bold">Wniosek złożony – czeka na ocenę</span>
          ) : stan === 'przyjety' || stan === 'odrzucony' ? (
            <span className="min-h-11 px-4 inline-flex items-center rounded-lg bg-white/10 font-bold">Wniosek {stan === 'przyjety' ? 'wybrany' : 'niewybrany'}</span>
          ) : (
            <Link to={`/wniosek/${f.id}/${n.id}`} className="min-h-11 px-5 inline-flex items-center rounded-lg bg-clay text-white font-bold no-underline">
              {stan === 'szkic' ? 'Dokończ wniosek' : 'Zgłoś do naboru'}
            </Link>
          )}
        </div>
      ) : (
        <p className="text-white/80 text-[15px] max-w-xs">Wniosek może złożyć osoba prowadząca pomysł. Popierając, pomagasz mu w ocenie.</p>
      )}
    </div>
  )
}

function Pytania({ f, ja, lista, mojProwadzony }) {
  const { zadajPytanie } = useDane()
  const [adresat, setAdresat] = useState('rops')
  const [tresc, setTresc] = useState('')
  const mozePytac = f.status !== 'odrzucona' && f.status !== 'zarchiwizowana' && (mojProwadzony || ja?.rola === 'rops_admin')
  return (
    <section id="pytania" aria-labelledby="h-pyt" className="scroll-mt-20 flex flex-col gap-4">
      <div>
        <h2 id="h-pyt" className="font-display font-bold text-2xl">Pytania i propozycje poprawek</h2>
        <p className="text-muted">Prowadzący pyta, ROPS i eksperci odpowiadają i proponują poprawki. Wszystko jest jawne – tworzy bazę wiedzy dla innych.</p>
      </div>
      {lista.length === 0 && <p className="text-muted">Jeszcze nikt nie zadał pytania.</p>}
      <ul className="flex flex-col gap-3">
        {lista.map((q) => <Pytanie key={q.id} q={q} ja={ja} autor={f.autorId === ja?.id} />)}
      </ul>
      {!mozePytac && <p className="text-[15px] text-muted rounded-xl bg-white border border-line px-4 py-3">Pytania do ROPS i ekspertów zadaje autor pomysłu (albo gmina, która go prowadzi). Możesz je czytać, a swoje uwagi dodać w zakładce „Dyskusja”.</p>}
      {mozePytac && (
        <form onSubmit={(e) => { e.preventDefault(); zadajPytanie(f.id, adresat, tresc.trim()); setTresc('') }} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="font-bold mb-2">Zapytaj</legend>
            {[['rops', 'ROPS'], ['ekspert', 'Eksperta']].map(([v, l]) => (
              <label key={v} className={'min-h-11 px-4 inline-flex items-center rounded-full font-bold cursor-pointer ' + (adresat === v ? 'border-[3px] border-teal bg-teal-light text-teal-dark' : 'border-2 border-line')}>
                <input type="radio" name="adresat" value={v} checked={adresat === v} onChange={() => setAdresat(v)} className="sr-only" />{l}
              </label>
            ))}
          </fieldset>
          <label htmlFor="pytanie" className="sr-only">Treść pytania</label>
          <textarea id="pytanie" rows={3} value={tresc} onChange={(e) => setTresc(e.target.value)} placeholder="Np. jak policzyć koszty? Czy potrzebna jest zgoda sanepidu?" className="p-3 rounded-xl border border-[#B8C2D0]" />
          <button type="submit" disabled={!tresc.trim()} className="self-start min-h-11 px-5 rounded-lg bg-ink text-white font-bold disabled:opacity-50">Wyślij pytanie</button>
        </form>
      )}
    </section>
  )
}

function Pytanie({ q, ja, autor }) {
  const { odpowiedzNaPytanie } = useDane()
  const [tresc, setTresc] = useState('')
  const mozeOdpowiedziec = (q.do === 'rops' && ja?.rola === 'rops_admin') || (q.do === 'ekspert' && ja?.rola === 'ekspert') || (q.do === 'autor' && autor)
  return (
    <li className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-sm text-muted">
        {q.typ === 'poprawka'
          ? <span className="px-2 py-0.5 rounded-full bg-[#FDE2E1] text-[#9B1C1C] font-bold text-xs mr-2">propozycja poprawek</span>
          : <span className="px-2 py-0.5 rounded-full bg-[#E6EAF0] text-ink font-bold text-xs mr-2">do {q.do === 'rops' ? 'ROPS' : 'eksperta'}</span>}
        <strong className="text-ink">{q.autor}</strong> · {kiedy(q.data)}
        {q.typ === 'poprawka'
          ? (q.wprowadzona ? <span className="ml-2 font-bold text-teal-dark">✓ autor wprowadził poprawki</span> : <span className="ml-2 font-bold text-clay-dark">czeka na autora</span>)
          : q.odpowiedzi.length === 0 && <span className="ml-2 font-bold text-clay-dark">czeka na odpowiedź</span>}
      </p>
      <p className="font-semibold">{q.tresc}</p>
      {q.odpowiedzi.map((o, i) => (
        <div key={i} className="ml-4 pl-4 border-l-4 border-teal">
          <p className="text-sm text-muted"><span className="px-1.5 py-0.5 rounded bg-ink text-white font-bold text-xs mr-1.5">{ROLE[o.rola]?.replace(' (administrator)', '')}</span><strong className="text-ink">{o.autor}</strong> · {kiedy(o.data)}</p>
          <p>{o.tresc}</p>
        </div>
      ))}
      {mozeOdpowiedziec && (
        <form onSubmit={(e) => { e.preventDefault(); odpowiedzNaPytanie(q.id, tresc.trim()); setTresc('') }} className="flex flex-col gap-2">
          <label htmlFor={'odp-' + q.id} className="font-bold">Odpowiedz</label>
          <textarea id={'odp-' + q.id} rows={2} value={tresc} onChange={(e) => setTresc(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0]" />
          <button type="submit" disabled={!tresc.trim()} className="self-start min-h-11 px-4 rounded-lg bg-teal text-white font-bold disabled:opacity-50">Opublikuj odpowiedź</button>
        </form>
      )}
    </li>
  )
}

function Opinie({ id, tytul, opis, lista, mozePisac, fiszkaId, pusto }) {
  const { dodajKomentarz } = useDane()
  const { uzytkownik: ja } = useAuth()
  const [tresc, setTresc] = useState('')
  return (
    <section id={id} aria-labelledby={'h-' + id} className="scroll-mt-20 flex flex-col gap-4">
      <div>
        <h2 id={'h-' + id} className="font-display font-bold text-2xl">{tytul} <span className="text-muted font-normal text-xl">({lista.length})</span></h2>
        <p className="text-muted">{opis}</p>
      </div>
      {lista.length === 0 && <p className="text-muted">{pusto}</p>}
      <ul className="flex flex-col gap-3">
        {lista.map((k) => (
          <li key={k.id} className="bg-white border border-line rounded-2xl p-5">
            <p className="text-sm text-muted mb-1">
              <strong className="text-ink">{k.autor}</strong>
              {k.rola === 'jst' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-ink text-white font-bold text-xs">gmina</span>}
              {' · '}{kiedy(k.data)}
            </p>
            <p>{k.tresc}</p>
          </li>
        ))}
      </ul>
      {!ja && id === 'opinie' && (
        <p className="text-[15px] rounded-xl bg-white border border-line px-4 py-3">Przeglądasz jako gość. <Link to="/logowanie" className="font-bold">Zaloguj się</Link>, żeby dodać komentarz.</p>
      )}
      {mozePisac && (
        <form onSubmit={(e) => { e.preventDefault(); dodajKomentarz(fiszkaId, tresc.trim()); setTresc('') }} className="flex flex-col gap-2">
          <label htmlFor={'nowa-' + id} className="font-bold">Twoja opinia</label>
          <textarea id={'nowa-' + id} rows={3} value={tresc} onChange={(e) => setTresc(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0] bg-white" />
          <button type="submit" disabled={!tresc.trim()} className="self-start min-h-11 px-5 rounded-lg bg-ink text-white font-bold disabled:opacity-50">Opublikuj</button>
        </form>
      )}
    </section>
  )
}

// Sekcja „twarda”: oficjalne aktualizacje (ROPS, gmina, twórca), statusy i dokumenty (wnioski)
function Oficjalne({ f, ja, lista, wnioski, nabory, mozeDodac }) {
  const { dodajAktualnosc } = useDane()
  const [tresc, setTresc] = useState('')
  const mojProwadzony = prowadzi(f, ja)
  // Wniosek publiczny dopiero po wybraniu w naborze; prowadzący i ROPS widzą swoje na każdym etapie
  const dokumenty = wnioski.filter((w) => w.status === 'przyjety' || mojProwadzony || ja?.rola === 'rops_admin')
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="h-dok" className="flex flex-col gap-4">
        <div>
          <h2 id="h-dok" className="font-display font-bold text-2xl">Dokumenty</h2>
          <p className="text-muted">Wnioski przygotowane w generatorze. Publiczne stają się po wybraniu w naborze.</p>
        </div>
        {dokumenty.length === 0 && <p className="text-muted">Brak dokumentów.</p>}
        {dokumenty.map((w) => <Dokument key={w.id} w={w} n={nabory.find((x) => x.id === w.naborId)} edycja={mojProwadzony && w.status === 'szkic'} />)}
      </section>

      <section aria-labelledby="h-akt" className="flex flex-col gap-4">
        <div>
          <h2 id="h-akt" className="font-display font-bold text-2xl">Oficjalne informacje</h2>
          <p className="text-muted">Wpisy publikują tylko ROPS i gmina prowadząca pomysł. Zmiany statusu dodają się same.</p>
        </div>
        {mozeDodac && (
          <form onSubmit={(e) => { e.preventDefault(); dodajAktualnosc(f.id, tresc.trim()); setTresc('') }} className="flex flex-col gap-2">
            <label htmlFor="aktualizacja" className="font-bold">Oficjalna informacja</label>
            <textarea id="aktualizacja" rows={3} value={tresc} onChange={(e) => setTresc(e.target.value)} placeholder="Np. podpisaliśmy umowę z gminą, start w listopadzie." className="p-3 rounded-xl border border-[#B8C2D0] bg-white" />
            <button type="submit" disabled={!tresc.trim()} className="self-start min-h-11 px-5 rounded-lg bg-ink text-white font-bold disabled:opacity-50">Opublikuj</button>
          </form>
        )}
        {lista.length === 0 && <p className="text-muted">Brak oficjalnych informacji.</p>}
        <ul className="flex flex-col gap-3">
          {lista.map((a) => a.rola === 'system' ? (
            <li key={a.id} className="rounded-2xl bg-ground border border-line px-5 py-3">
              <p className="text-sm text-muted mb-0.5"><span className="px-1.5 py-0.5 rounded bg-white border border-line text-ink font-bold text-xs mr-1.5">Status</span>{kiedy(a.data)}</p>
              <p>{a.tresc}</p>
            </li>
          ) : (
            <li key={a.id} className="bg-white border border-line rounded-2xl p-5">
              <p className="text-sm text-muted mb-1">
                <span className="px-1.5 py-0.5 rounded bg-ink text-white font-bold text-xs mr-1.5">{a.rola === 'jst' ? 'Gmina' : 'ROPS'}</span>
                <strong className="text-ink">{a.autor}</strong> · {kiedy(a.data)}
              </p>
              <p>{a.tresc}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const STATUS_DOKUMENTU = { szkic: 'Szkic', zlozony: 'Złożony – czeka na ocenę', przyjety: 'Wybrany w naborze', odrzucony: 'Niewybrany' }

function Dokument({ w, n, edycja }) {
  const [otwarty, setOtwarty] = useState(w.status === 'przyjety')
  return (
    <article className={'bg-white rounded-2xl p-5 flex flex-col gap-3 border-2 ' + (w.status === 'przyjety' ? 'border-teal' : 'border-line')}>
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <p className="text-sm font-bold text-muted uppercase tracking-wider">Wniosek · {STATUS_DOKUMENTU[w.status]}</p>
          <h3 className="font-display font-bold text-xl">{n?.nazwa}</h3>
        </div>
        <div className="flex gap-2">
          {edycja && <Link to={`/wniosek/${w.fiszkaId}/${w.naborId}`} className="min-h-10 px-3 inline-flex items-center rounded-lg bg-clay text-white font-bold text-sm no-underline">Dokończ</Link>}
          <button type="button" onClick={() => setOtwarty(!otwarty)} aria-expanded={otwarty} className="min-h-10 px-3 rounded-lg border-2 border-ink font-bold text-sm">{otwarty ? 'Zwiń' : 'Czytaj'}</button>
        </div>
      </div>
      {otwarty && (
        <dl className="flex flex-col gap-4">
          {(n?.pola || []).map((p) => (
            <div key={p.id}>
              <dt className="font-bold">{p.etykieta}</dt>
              <dd className="whitespace-pre-line">{w.pola?.[p.id] || '—'}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}

function Brak({ tekst }) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display font-extrabold text-3xl mb-3">{tekst}</h1>
      <Link to="/innowacje">← Wróć do pomysłów</Link>
    </main>
  )
}
