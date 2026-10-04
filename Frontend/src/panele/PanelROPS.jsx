import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import UsunFiszke from '../components/UsunFiszke.jsx'
import DecyzjaZarzadu from '../components/DecyzjaZarzadu.jsx'
import { ETAPY } from '../data/etapy.js'
import { DOMYSLNE_POLA, naborOtwarty } from '../data/nabory.js'
import StatusWpisu, { STATUSY } from '../components/StatusWpisu.jsx'
import SzczegolyFiszki from '../components/SzczegolyFiszki.jsx'
import { policz } from '../data/policz.js'
import { SEKCJE } from '../data/canva.js'
import { liczbaPoparc } from '../data/watekFiszki.js'
import { wczytajPdf } from '../data/plik.js'
import WzorWniosku from '../components/WzorWniosku.jsx'

// Odpowiedź z Canvy jako tekst (wybór → nazwa opcji, lista → po przecinku)
const tekstOdpowiedzi = (p, v) => {
  if (!v || (Array.isArray(v) && !v.length)) return '—'
  if (p.typ === 'wybor') return p.opcje.find((o) => o.id === v)?.nazwa || v
  if (Array.isArray(v)) return v.join(', ')
  return v
}

const ZAKLADKI = [
  { id: 'kolejka', nazwa: 'Kolejka' },
  { id: 'fiszki', nazwa: 'Fiszki' },
  { id: 'nabory', nazwa: 'Nabory' },
  { id: 'trendy', nazwa: 'Trendy potrzeb' },
]

// Panel ROPS (administrator): weryfikacja, fiszki, nabory, trendy potrzeb
export default function PanelROPS() {
  const [zakladka, setZakladka] = useState('kolejka')
  const { fiszki, zgloszenia, wnioski, pytania, resetujDemo } = useDane()
  const pytaniaROPS = pytania.filter((q) => q.do === 'rops' && q.odpowiedzi.length === 0)

  const doWeryfikacji = fiszki.filter((i) => i.status === 'do_weryfikacji')
  const prosby = fiszki.filter((i) => i.prosbaOEtap && i.status === 'opublikowana')
  const zlozone = wnioski.filter((w) => w.status === 'zlozony')
  const doZrobienia = doWeryfikacji.length + prosby.length + pytaniaROPS.length

  const kpi = [
    { nazwa: 'Fiszki do weryfikacji', liczba: doWeryfikacji.length, pilne: doWeryfikacji.length > 0 },
    { nazwa: 'Prośby o wyższy etap', liczba: prosby.length, pilne: prosby.length > 0 },
    { nazwa: 'Pytania w wątkach', liczba: pytaniaROPS.length, pilne: pytaniaROPS.length > 0 },
    { nazwa: 'Wnioski do oceny', liczba: zlozone.length, pilne: zlozone.length > 0 },
    { nazwa: 'Zapytania i wyzwania gmin', liczba: zgloszenia.length },
  ]

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1">Panel ROPS</h1>
          <p className="text-muted text-lg">Weryfikacja zgłoszeń, fiszki, nabory i potrzeby regionu.</p>
        </div>
        <button onClick={resetujDemo} className="min-h-10 px-3 rounded-lg border border-line text-sm font-bold text-muted hover:bg-white">
          Przywróć dane przykładowe
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-8">
        {kpi.map((k) => {
          const klasa = 'rounded-2xl p-5 border no-underline text-ink ' + (k.pilne ? 'bg-clay-light border-[#E8C9AE]' : 'bg-white border-line')
          const tresc = <><p className="text-[15px] text-muted mb-1">{k.nazwa}</p><p className="font-display font-extrabold text-4xl">{k.liczba}</p></>
          return k.link ? <Link key={k.nazwa} to={k.link} className={klasa + ' hover:border-ink'}>{tresc}</Link> : <div key={k.nazwa} className={klasa}>{tresc}</div>
        })}
      </div>

      <div role="tablist" aria-label="Sekcje panelu" className="flex flex-wrap gap-2 border-b-2 border-line mb-7">
        {ZAKLADKI.map((z) => (
          <button
            key={z.id}
            role="tab"
            aria-selected={zakladka === z.id}
            onClick={() => setZakladka(z.id)}
            className={'min-h-12 px-5 -mb-0.5 font-bold text-lg border-b-4 ' + (zakladka === z.id ? 'border-teal text-ink' : 'border-transparent text-muted hover:text-ink')}
          >
            {z.nazwa}
            {z.id === 'kolejka' && doZrobienia > 0 && <span className="ml-2 px-2 rounded-full bg-clay text-white text-sm">{doZrobienia}</span>}
            {z.id === 'nabory' && zlozone.length > 0 && <span className="ml-2 px-2 rounded-full bg-clay text-white text-sm">{zlozone.length}</span>}
          </button>
        ))}
      </div>

      {zakladka === 'kolejka' && <Kolejka doWeryfikacji={doWeryfikacji} prosby={prosby} pytania={pytaniaROPS} />}
      {zakladka === 'fiszki' && <TabelaFiszek />}
      {zakladka === 'nabory' && <Nabory />}
      {zakladka === 'trendy' && <Trendy />}
    </main>
  )
}

// ── Kolejka ────────────────────────────────────────────────
function Kolejka({ doWeryfikacji, prosby, pytania }) {
  const { fiszki } = useDane()
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-display font-bold text-2xl mb-4">Pytania w wątkach pomysłów ({pytania.length})</h2>
        {pytania.length === 0 && <p className="text-muted">Brak pytań bez odpowiedzi.</p>}
        <ul className="flex flex-col gap-2">
          {pytania.map((q) => (
            <li key={q.id}>
              <Link to={'/pomysl/' + q.fiszkaId + '?sekcja=eksperci'} className="flex flex-col gap-1 px-5 py-4 rounded-2xl bg-white border border-line no-underline text-ink hover:border-ink">
                <span className="text-sm text-muted">{fiszki.find((f) => f.id === q.fiszkaId)?.tytul} · {q.autor}</span>
                <span className="font-semibold">{q.tresc}</span>
                <span className="text-sm font-bold text-teal">Odpowiedz w wątku →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display font-bold text-2xl mb-1">Pomysły czekające na poparcie ({doWeryfikacji.length})</h2>
        <p className="text-muted mb-4">Popiera ROPS albo ekspert. Po poparciu pomysł jest publiczny.</p>
        {doWeryfikacji.length === 0 && <p className="text-muted">Nic nie czeka. Nowe fiszki z Kreatora pojawią się tutaj.</p>}
        <div className="flex flex-col gap-4">
          {doWeryfikacji.map((i) => <KartaWeryfikacji key={i.id} fiszka={i} />)}
        </div>
      </section>
      <section>
        <h2 className="font-display font-bold text-2xl mb-4">Prośby o wyższy etap ({prosby.length})</h2>
        {prosby.length === 0 && <p className="text-muted">Brak próśb. Autorzy wysyłają je z panelu „Moje sprawy”.</p>}
        <div className="flex flex-col gap-4">
          {prosby.map((i) => <KartaProsby key={i.id} fiszka={i} />)}
        </div>
      </section>
    </div>
  )
}

function KartaWeryfikacji({ fiszka: i }) {
  return (
    <article className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold">{i.tytul}</h3>
          <p className="text-sm text-muted">{i.autor}{i.odJST && ' (gmina)'}</p>
        </div>
        <StatusWpisu status={i.status} />
      </div>
      <SzczegolyFiszki fiszka={i} />
      <p className="text-base"><span className="text-muted">Etap (deklaracja autora):</span> <strong>{ETAPY.find((e) => e.nr === i.etap)?.nazwa}</strong></p>
      <DecyzjaZarzadu fiszka={i}>
        <Link to={'/pomysl/' + i.id} className="min-h-11 px-3 inline-flex items-center font-bold">Wątek pomysłu →</Link>
      </DecyzjaZarzadu>
    </article>
  )
}

function KartaProsby({ fiszka: i }) {
  const { ustawEtap, odrzucProsbeOEtap } = useDane()
  const nastepny = ETAPY.find((e) => e.nr === i.etap + 1)
  return (
    <article className="bg-white border border-line rounded-2xl p-5 flex flex-wrap gap-4 items-center">
      <div className="flex-[999_1_300px] min-w-0">
        <h3 className="font-display text-xl font-bold">{i.tytul}</h3>
        <p className="text-muted">
          {ETAPY.find((e) => e.nr === i.etap)?.nazwa} → <strong className="text-ink">{nastepny?.nazwa}</strong>
          {nastepny?.nr >= 3 && ' · sprawdź, czy było testowane z odbiorcami'}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => ustawEtap(i.id, i.etap + 1)} className="min-h-11 px-4 rounded-lg bg-teal text-white font-bold">Potwierdź etap</button>
        <button onClick={() => odrzucProsbeOEtap(i.id)} className="min-h-11 px-4 rounded-lg border-2 border-line font-bold">Odrzuć</button>
      </div>
    </article>
  )
}

// ── Fiszki (wszystkie) ─────────────────────────────────────
function TabelaFiszek() {
  const { fiszki, ustawEtap, archiwizuj } = useDane()
  const [filtr, setFiltr] = useState('wszystkie')
  const lista = filtr === 'wszystkie' ? fiszki : fiszki.filter((i) => i.status === filtr)

  return (
    <section>
      <label className="inline-flex items-center gap-2 mb-4 font-bold">
        Status
        <select value={filtr} onChange={(e) => setFiltr(e.target.value)} className="min-h-10 px-2 rounded-lg border border-line bg-white font-normal">
          <option value="wszystkie">Wszystkie</option>
          {Object.entries(STATUSY).map(([k, s]) => <option key={k} value={k}>{s.nazwa}</option>)}
        </select>
      </label>
      <div className="overflow-x-auto bg-white border border-line rounded-2xl">
        <table className="w-full min-w-[820px] text-left text-[15px]">
          <thead className="text-muted border-b-2 border-line">
            <tr>
              <th scope="col" className="p-3">Pomysł</th>
              <th scope="col" className="p-3">Autor</th>
              <th scope="col" className="p-3">Poparcia</th>
              <th scope="col" className="p-3">Status</th>
              <th scope="col" className="p-3">Etap</th>
              <th scope="col" className="p-3"><span className="sr-only">Akcje</span></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i) => (
              <tr key={i.id} className="border-b border-[#E6EAF0] last:border-0">
                <td className="p-3"><Link to={'/pomysl/' + i.id} className="font-bold">{i.tytul}</Link></td>
                <td className="p-3">{i.autor}{i.odJST && ' (gmina)'}</td>
                <td className="p-3">{liczbaPoparc(i)}</td>
                <td className="p-3"><StatusWpisu status={i.status} />{i.status === 'odrzucona' && i.powodOdrzucenia && <span className="block text-sm text-muted mt-1 max-w-56">{i.powodOdrzucenia}</span>}</td>
                <td className="p-3">
                  <label className="sr-only" htmlFor={'etap-' + i.id}>Etap: {i.tytul}</label>
                  <select id={'etap-' + i.id} value={i.etap} onChange={(e) => ustawEtap(i.id, Number(e.target.value))} className="min-h-10 px-2 rounded-lg border border-line bg-white">
                    {ETAPY.map((e) => <option key={e.nr} value={e.nr}>{e.nr} · {e.nazwa}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-2 min-w-56">
                    {i.status === 'opublikowana' && (
                      <button onClick={() => archiwizuj(i.id)} className="min-h-10 px-3 rounded-lg border-2 border-line font-bold text-sm">Archiwizuj</button>
                    )}
                    <UsunFiszke fiszka={i} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Pole({ etykieta, wartosc, onZmiana, wiersze }) {
  return (
    <label className="flex flex-col gap-1 font-bold">
      {etykieta}
      {wiersze ? (
        <textarea rows={wiersze} value={wartosc} onChange={(e) => onZmiana(e.target.value)} className="p-3 rounded-lg border border-[#B8C2D0] font-normal" />
      ) : (
        <input value={wartosc} onChange={(e) => onZmiana(e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal" />
      )}
    </label>
  )
}

// ── Nabory i ocena wniosków ────────────────────────────────
function Nabory() {
  const { nabory, wnioski, dodajNabor, zamknijNabor, ocenWniosek, ustawWzorNaboru } = useDane()
  const puste = { nazwa: '', opis: '', kryteria: '', termin: '', wzor: null }
  const [nowy, setNowy] = useState(puste)
  const [otwartyWniosek, setOtwartyWniosek] = useState(null)
  const ustaw = (k, v) => setNowy({ ...nowy, [k]: v })

  function dodaj(e) {
    e.preventDefault()
    dodajNabor({ ...nowy, pola: DOMYSLNE_POLA })
    setNowy(puste)
  }

  return (
    <div className="flex flex-col gap-8">
      {nabory.map((n) => {
        const jegoWnioski = wnioski.filter((w) => w.naborId === n.id && w.status !== 'szkic')
        return (
          <section key={n.id} className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-3">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <h2 className="font-display font-bold text-2xl">{n.nazwa}</h2>
                <p className="text-muted text-[15px]">
                  do {new Date(n.termin).toLocaleDateString('pl-PL')} ·{' '}
                  <strong className={naborOtwarty(n) ? 'text-teal-dark' : 'text-muted'}>{naborOtwarty(n) ? 'otwarty' : 'zamknięty'}</strong>
                </p>
              </div>
              {naborOtwarty(n) && <button onClick={() => zamknijNabor(n.id)} className="min-h-10 px-3 rounded-lg border-2 border-line font-bold text-sm">Zamknij nabór</button>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {n.wzor ? <WzorWniosku nabor={n} /> : <p className="text-[15px] text-clay-dark font-bold">Brak wzoru wniosku (PDF).</p>}
              <WyborPdf etykieta={n.wzor ? 'Podmień wzór' : 'Dodaj wzór wniosku (PDF)'} onWybierz={(w) => ustawWzorNaboru(n.id, w)} />
            </div>
            <h3 className="font-bold mt-2">Złożone wnioski ({jegoWnioski.length})</h3>
            {jegoWnioski.length === 0 && <p className="text-muted">Jeszcze nikt nie złożył wniosku.</p>}
            <ul className="flex flex-col gap-2">
              {jegoWnioski.map((w) => (
                <li key={w.id} className="rounded-xl bg-ground p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="font-bold">{w.tytul}</p>
                      <p className="text-sm text-muted">{w.autor} · status: {w.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setOtwartyWniosek(otwartyWniosek === w.id ? null : w.id)} aria-expanded={otwartyWniosek === w.id} className="min-h-10 px-3 rounded-lg border-2 border-ink font-bold text-sm">
                        {otwartyWniosek === w.id ? 'Zwiń' : 'Czytaj wniosek'}
                      </button>
                      {w.status === 'zlozony' && (
                        <>
                          <button onClick={() => ocenWniosek(w.id, 'przyjety')} className="min-h-10 px-3 rounded-lg bg-teal text-white font-bold text-sm">Przyjmij</button>
                          <button onClick={() => ocenWniosek(w.id, 'odrzucony')} className="min-h-10 px-3 rounded-lg border-2 border-line font-bold text-sm">Odrzuć</button>
                        </>
                      )}
                    </div>
                  </div>
                  {otwartyWniosek === w.id && (
                    <dl className="flex flex-col gap-3 bg-white rounded-lg p-4">
                      {n.pola.map((p) => (
                        <div key={p.id}>
                          <dt className="font-bold">{p.etykieta}</dt>
                          <dd className="whitespace-pre-line text-[15px]">{w.pola?.[p.id] || '—'}</dd>
                        </div>
                      ))}
                      {w.canva && (
                        <details className="border-t border-line pt-3">
                          <summary className="font-bold cursor-pointer min-h-11 flex items-center">Canva innowacji autora</summary>
                          <div className="flex flex-col gap-2 mt-2">
                            {SEKCJE.map((s) => (
                              <div key={s.id}>
                                <p className="font-bold text-[15px]">{s.nazwa}</p>
                                {s.pytania.map((p) => (
                                  <p key={p.id} className="text-[15px]"><span className="text-muted">{p.tytul}{/[?:]$/.test(p.tytul) ? "" : ":"}</span> {tekstOdpowiedzi(p, w.canva[p.id])}</p>
                                ))}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <form onSubmit={dodaj} className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-3 max-w-3xl">
        <h2 className="font-display font-bold text-2xl">Ogłoś nabór</h2>
        <p className="text-muted text-[15px] -mt-1">Nabór pojawi się w wątkach opublikowanych pomysłów, a ich autorzy dostaną powiadomienie.</p>
        <Pole etykieta="Nazwa naboru" wartosc={nowy.nazwa} onZmiana={(v) => ustaw('nazwa', v)} />
        <Pole etykieta="Opis" wartosc={nowy.opis} onZmiana={(v) => ustaw('opis', v)} wiersze={2} />
        <Pole etykieta="Kryteria oceny" wartosc={nowy.kryteria} onZmiana={(v) => ustaw('kryteria', v)} wiersze={2} />
        <label className="flex flex-col gap-1 font-bold max-w-xs">
          Termin składania
          <input type="date" value={nowy.termin} onChange={(e) => ustaw('termin', e.target.value)} className="min-h-11 px-3 rounded-lg border border-[#B8C2D0] font-normal" />
        </label>
        <div className="flex flex-col gap-1">
          <p className="font-bold">Wzór wniosku (PDF)</p>
          <p className="text-[15px] text-muted">Oficjalny formularz naboru – wnioskodawcy pobiorą go przy przygotowaniu wniosku.</p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {nowy.wzor && <WzorWniosku nabor={nowy} />}
            <WyborPdf etykieta={nowy.wzor ? 'Zmień plik' : 'Wybierz plik PDF'} onWybierz={(w) => ustaw('wzor', w)} />
            {nowy.wzor && <button type="button" onClick={() => ustaw('wzor', null)} className="min-h-11 px-3 font-bold text-[#9B1C1C]">Usuń</button>}
          </div>
        </div>
        <p className="text-sm text-muted">Pola wniosku: domyślny szablon ({DOMYSLNE_POLA.map((p) => p.etykieta).join(', ')}).</p>
        <button type="submit" disabled={!nowy.nazwa.trim() || !nowy.termin} className="self-start min-h-11 px-5 rounded-lg bg-ink text-white font-bold disabled:opacity-50">
          Ogłoś nabór
        </button>
      </form>
    </div>
  )
}

// Przycisk wyboru PDF (input type=file schowany pod etykietą)
function WyborPdf({ etykieta, onWybierz }) {
  const [blad, setBlad] = useState('')
  return (
    <span className="inline-flex flex-col gap-1">
      <label className="min-h-11 px-4 inline-flex items-center rounded-lg border-2 border-dashed border-[#B8C2D0] font-bold cursor-pointer hover:border-ink focus-within:outline-2 focus-within:outline-teal">
        {etykieta}
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            setBlad('')
            wczytajPdf(e.target.files[0]).then(onWybierz, (err) => setBlad(err.message))
            e.target.value = ''
          }}
        />
      </label>
      {blad && <span role="alert" className="text-sm text-[#9B1C1C] font-bold">{blad}</span>}
    </span>
  )
}

// ── Trendy potrzeb (agregacja – widoczna tylko dla ROPS) ───
function Trendy() {
  const { zgloszenia } = useDane()
  // Sygnały potrzeb: zapytania z wyszukiwarki i wyzwania zgłoszone przez gminy
  const wgPowiatu = policz(zgloszenia.filter((z) => z.powiat).map((z) => z.powiat)).slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted max-w-3xl">
        Każde zapytanie w wyszukiwarce i wyzwanie zgłoszone przez gminę to sygnał potrzeby. Tu widać, czego szukają mieszkańcy i skąd przychodzą zgłoszenia.
      </p>
      <div className="flex flex-wrap gap-6 items-start">
        <RankingSlupkowy tytul="Skąd przychodzą zgłoszenia" opis="Sygnały z przypisanym powiatem" dane={wgPowiatu} />
      </div>
      <section className="bg-white border border-line rounded-2xl p-6">
        <h2 className="font-display font-bold text-2xl mb-4">Ostatnie zapytania i wyzwania gmin</h2>
        <ul className="flex flex-col gap-2">
          {zgloszenia.slice(0, 8).map((z) => (
            <li key={z.id} className="flex flex-wrap justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-ground">
              <span>{z.zrodlo === 'jst' && <span className="mr-2 px-2 py-0.5 rounded-full bg-clay-light text-clay-dark text-xs font-bold">gmina</span>}{z.tekst}</span>
              <span className="text-sm text-muted">
                {new Date(z.data).toLocaleDateString('pl-PL')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// Ranking jako poziome słupki: jedna seria, jeden kolor, wartość zawsze podpisana tekstem
function RankingSlupkowy({ tytul, opis, dane }) {
  const max = Math.max(1, ...dane.map((d) => d.liczba))
  return (
    <section className="flex-[1_1_380px] min-w-0 bg-white border border-line rounded-2xl p-6">
      <h2 className="font-display font-bold text-2xl mb-1">{tytul}</h2>
      <p className="text-muted text-sm mb-5">{opis}</p>
      {dane.length === 0 && <p className="text-muted">Brak danych.</p>}
      <ol className="flex flex-col gap-3">
        {dane.map((d) => (
          <li key={d.nazwa} title={`${d.nazwa}: ${d.liczba}`} className="grid grid-cols-[minmax(120px,190px)_1fr_auto] items-center gap-3">
            <span className="text-[15px] font-bold">{d.nazwa}</span>
            <span className="h-3 bg-[#EDF0F4] rounded" aria-hidden="true">
              <span className="block h-3 rounded-r bg-teal" style={{ width: `${(d.liczba / max) * 100}%` }} />
            </span>
            <span className="text-[15px] tabular-nums text-muted w-6 text-right">{d.liczba}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
