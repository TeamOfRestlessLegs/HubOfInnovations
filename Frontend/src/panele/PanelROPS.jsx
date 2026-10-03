import { useState } from 'react'
import { useDane } from '../data/DaneContext.jsx'
import { ETAPY } from '../data/etapy.js'
import { OBSZARY, obszarPoId } from '../data/obszary.js'
import { DOMYSLNE_POLA, naborOtwarty } from '../data/nabory.js'
import StatusWpisu, { STATUSY } from '../components/StatusWpisu.jsx'
import SzczegolyFiszki from '../components/SzczegolyFiszki.jsx'
import { policz } from '../data/policz.js'
import { SEKCJE } from '../data/canva.js'
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
  { id: 'biblioteka', nazwa: 'Biblioteka' },
  { id: 'nabory', nazwa: 'Nabory' },
  { id: 'trendy', nazwa: 'Trendy potrzeb' },
]

// Panel ROPS (administrator): weryfikacja, Biblioteka, nabory, trendy potrzeb
export default function PanelROPS() {
  const [zakladka, setZakladka] = useState('kolejka')
  const { fiszki, zgloszenia, wnioski, resetujDemo } = useDane()

  const doWeryfikacji = fiszki.filter((i) => i.status === 'do_weryfikacji')
  const prosby = fiszki.filter((i) => i.prosbaOEtap && i.status === 'opublikowana')
  const zlozone = wnioski.filter((w) => w.status === 'zlozony')
  const doZrobienia = doWeryfikacji.length + prosby.length

  const kpi = [
    { nazwa: 'Fiszki do weryfikacji', liczba: doWeryfikacji.length, pilne: doWeryfikacji.length > 0 },
    { nazwa: 'Prośby o wyższy etap', liczba: prosby.length, pilne: prosby.length > 0 },
    { nazwa: 'Wnioski do oceny', liczba: zlozone.length, pilne: zlozone.length > 0 },
    { nazwa: 'Zapytania mieszkańców', liczba: zgloszenia.length },
  ]

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1">Panel ROPS</h1>
          <p className="text-muted text-lg">Weryfikacja zgłoszeń, Biblioteka Innowacji, nabory i potrzeby regionu.</p>
        </div>
        <button onClick={resetujDemo} className="min-h-10 px-3 rounded-lg border border-line text-sm font-bold text-muted hover:bg-white">
          Przywróć dane przykładowe
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-8">
        {kpi.map((k) => (
          <div key={k.nazwa} className={'rounded-2xl p-5 border ' + (k.pilne ? 'bg-clay-light border-[#E8C9AE]' : 'bg-white border-line')}>
            <p className="text-[15px] text-muted mb-1">{k.nazwa}</p>
            <p className="font-display font-extrabold text-4xl">{k.liczba}</p>
          </div>
        ))}
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

      {zakladka === 'kolejka' && <Kolejka doWeryfikacji={doWeryfikacji} prosby={prosby} />}
      {zakladka === 'fiszki' && <TabelaFiszek />}
      {zakladka === 'biblioteka' && <Biblioteka />}
      {zakladka === 'nabory' && <Nabory />}
      {zakladka === 'trendy' && <Trendy />}
    </main>
  )
}

// ── Kolejka ────────────────────────────────────────────────
function Kolejka({ doWeryfikacji, prosby }) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-display font-bold text-2xl mb-4">Nowe fiszki ({doWeryfikacji.length})</h2>
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
  const { zatwierdz, odeslijDoPoprawy } = useDane()
  const [komentarz, setKomentarz] = useState('')
  const [poprawki, setPoprawki] = useState(false)

  return (
    <article className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold">{i.tytul}</h3>
          <p className="text-sm text-muted">{i.autor} · pow. {i.powiat}</p>
        </div>
        <StatusWpisu status={i.status} />
      </div>
      <SzczegolyFiszki fiszka={i} />
      <p className="text-base"><span className="text-muted">Etap (deklaracja autora):</span> <strong>{ETAPY.find((e) => e.nr === i.etap)?.nazwa}</strong>
        {i.szuka && <> · <span className="text-muted">Szuka:</span> <strong>{i.szuka}</strong></>}</p>

      {poprawki ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={'kom-' + i.id} className="font-bold">Co autor ma poprawić?</label>
          <textarea id={'kom-' + i.id} rows={2} value={komentarz} onChange={(e) => setKomentarz(e.target.value)} className="p-3 rounded-xl border border-[#B8C2D0]" />
          <div className="flex gap-2">
            <button onClick={() => odeslijDoPoprawy(i.id, komentarz.trim())} disabled={!komentarz.trim()} className="min-h-11 px-4 rounded-lg bg-ink text-white font-bold disabled:opacity-50">
              Odeślij do autora
            </button>
            <button onClick={() => setPoprawki(false)} className="min-h-11 px-4 rounded-lg border-2 border-line font-bold">Anuluj</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => zatwierdz(i.id)} className="min-h-11 px-5 rounded-lg bg-teal text-white font-bold">Zatwierdź i opublikuj</button>
          <button onClick={() => setPoprawki(true)} className="min-h-11 px-5 rounded-lg border-2 border-ink font-bold">Do poprawy</button>
        </div>
      )}
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
              <th scope="col" className="p-3">Obszar</th>
              <th scope="col" className="p-3">Powiat</th>
              <th scope="col" className="p-3">Status</th>
              <th scope="col" className="p-3">Etap</th>
              <th scope="col" className="p-3"><span className="sr-only">Akcje</span></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i) => (
              <tr key={i.id} className="border-b border-[#E6EAF0] last:border-0">
                <td className="p-3"><span className="font-bold block">{i.tytul}</span><span className="text-sm text-muted">{i.autor}</span></td>
                <td className="p-3">{obszarPoId(i.obszar)?.nazwa || '—'}</td>
                <td className="p-3">{i.powiat}</td>
                <td className="p-3"><StatusWpisu status={i.status} /></td>
                <td className="p-3">
                  <label className="sr-only" htmlFor={'etap-' + i.id}>Etap: {i.tytul}</label>
                  <select id={'etap-' + i.id} value={i.etap} onChange={(e) => ustawEtap(i.id, Number(e.target.value))} className="min-h-10 px-2 rounded-lg border border-line bg-white">
                    {ETAPY.map((e) => <option key={e.nr} value={e.nr}>{e.nr} · {e.nazwa}</option>)}
                  </select>
                </td>
                <td className="p-3 text-right">
                  {i.status !== 'zarchiwizowana' && (
                    <button onClick={() => archiwizuj(i.id)} className="min-h-10 px-3 rounded-lg border-2 border-line font-bold text-sm">Archiwizuj</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── Biblioteka: szybkie dodawanie innowacji ROPS ───────────
function Biblioteka() {
  const { biblioteka, dodajDoBiblioteki, usunZBiblioteki } = useDane()
  const puste = { tytul: '', opis: '', obszary: [], url: '', wideo: '', miejsce: '', zalaczniki: '' }
  const [nowa, setNowa] = useState(puste)
  const [dodano, setDodano] = useState(false)
  const ustaw = (k, v) => { setNowa({ ...nowa, [k]: v }); setDodano(false) }
  const przelaczObszar = (id) => ustaw('obszary', nowa.obszary.includes(id) ? nowa.obszary.filter((x) => x !== id) : [...nowa.obszary, id])

  function dodaj(e) {
    e.preventDefault()
    dodajDoBiblioteki({
      ...nowa,
      // załączniki: każda linia „nazwa | adres”
      zalaczniki: nowa.zalaczniki.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter(([n]) => n).map(([nazwa, url]) => ({ nazwa, url: url || '#' })),
      slowa: (nowa.tytul + ' ' + nowa.opis).toLowerCase().split(/[^a-ząćęłńóśźż]+/).filter((s) => s.length > 4),
    })
    setNowa(puste)
    setDodano(true)
  }

  return (
    <div className="flex flex-wrap gap-6 items-start">
      <form onSubmit={dodaj} className="flex-[1_1_380px] min-w-0 bg-white border border-line rounded-2xl p-6 flex flex-col gap-3">
        <h2 className="font-display font-bold text-2xl">Dodaj innowację</h2>
        <p className="text-muted text-[15px] -mt-1">Od razu pojawi się w Zasobniku i w wynikach wyszukiwarki.</p>
        <Pole etykieta="Tytuł" wartosc={nowa.tytul} onZmiana={(v) => ustaw('tytul', v)} />
        <Pole etykieta="Krótki opis" wartosc={nowa.opis} onZmiana={(v) => ustaw('opis', v)} wiersze={3} />
        <fieldset>
          <legend className="font-bold mb-2">Obszary</legend>
          <div className="flex flex-wrap gap-2">
            {OBSZARY.map((o) => (
              <button type="button" key={o.id} aria-pressed={nowa.obszary.includes(o.id)} onClick={() => przelaczObszar(o.id)}
                className={'min-h-10 px-3 rounded-full text-sm font-bold border-2 ' + (nowa.obszary.includes(o.id) ? 'bg-teal-light border-teal text-teal-dark' : 'border-line')}>
                {o.nazwa}
              </button>
            ))}
          </div>
        </fieldset>
        <Pole etykieta="Link „czytaj więcej”" wartosc={nowa.url} onZmiana={(v) => ustaw('url', v)} />
        <Pole etykieta="Link do filmu (opcjonalnie)" wartosc={nowa.wideo} onZmiana={(v) => ustaw('wideo', v)} />
        <Pole etykieta="Gdzie wdrożono" wartosc={nowa.miejsce} onZmiana={(v) => ustaw('miejsce', v)} />
        <Pole etykieta="Załączniki – jeden w linii: nazwa | adres" wartosc={nowa.zalaczniki} onZmiana={(v) => ustaw('zalaczniki', v)} wiersze={3} />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={!nowa.tytul.trim() || !nowa.opis.trim() || !nowa.obszary.length} className="min-h-11 px-5 rounded-lg bg-teal text-white font-bold disabled:opacity-50">
            Dodaj do Biblioteki
          </button>
          {dodano && <span role="status" className="text-teal-dark font-bold">Dodano.</span>}
        </div>
      </form>

      <section className="flex-[2_1_480px] min-w-0">
        <h2 className="font-display font-bold text-2xl mb-4">W Bibliotece ({biblioteka.length})</h2>
        <ul className="flex flex-col gap-2">
          {biblioteka.map((b) => (
            <li key={b.id} className="bg-white border border-line rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
              <div className="min-w-0">
                <p className="font-bold">{b.tytul}</p>
                <p className="text-sm text-muted">{(b.obszary || []).map((o) => obszarPoId(o)?.nazwa).join(', ')} · {(b.zalaczniki || []).length} załączników</p>
              </div>
              <button onClick={() => usunZBiblioteki(b.id)} className="min-h-10 px-3 rounded-lg border-2 border-line font-bold text-sm">Usuń</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
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
  const puste = { nazwa: '', opis: '', kryteria: '', obszary: [], termin: '', wzor: null }
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
                  do {new Date(n.termin).toLocaleDateString('pl-PL')} · {n.obszary.map((o) => obszarPoId(o)?.nazwa).join(', ')} ·{' '}
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
        <p className="text-muted text-[15px] -mt-1">W Kreatorze pojawi się tryb „Wniosek do naboru”, a autorzy pasujących fiszek dostaną propozycję w panelu.</p>
        <Pole etykieta="Nazwa naboru" wartosc={nowy.nazwa} onZmiana={(v) => ustaw('nazwa', v)} />
        <Pole etykieta="Opis" wartosc={nowy.opis} onZmiana={(v) => ustaw('opis', v)} wiersze={2} />
        <Pole etykieta="Kryteria oceny" wartosc={nowy.kryteria} onZmiana={(v) => ustaw('kryteria', v)} wiersze={2} />
        <fieldset>
          <legend className="font-bold mb-2">Obszary</legend>
          <div className="flex flex-wrap gap-2">
            {OBSZARY.map((o) => (
              <button type="button" key={o.id} aria-pressed={nowy.obszary.includes(o.id)}
                onClick={() => ustaw('obszary', nowy.obszary.includes(o.id) ? nowy.obszary.filter((x) => x !== o.id) : [...nowy.obszary, o.id])}
                className={'min-h-10 px-3 rounded-full text-sm font-bold border-2 ' + (nowy.obszary.includes(o.id) ? 'bg-teal-light border-teal text-teal-dark' : 'border-line')}>
                {o.nazwa}
              </button>
            ))}
          </div>
        </fieldset>
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
        <button type="submit" disabled={!nowy.nazwa.trim() || !nowy.termin || !nowy.obszary.length} className="self-start min-h-11 px-5 rounded-lg bg-ink text-white font-bold disabled:opacity-50">
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
  const { zgloszenia, fiszki } = useDane()
  // Sygnały potrzeb: zapytania z wyszukiwarki + fiszki (każda fiszka to też zgłoszony problem)
  const sygnaly = [
    ...zgloszenia.map((z) => ({ obszary: z.obszary || [], powiat: z.powiat })),
    ...fiszki.map((f) => ({ obszary: f.obszar ? [f.obszar] : [], powiat: f.powiat })),
  ]
  const wgObszaru = policz(sygnaly.flatMap((s) => s.obszary)).map((x) => ({ ...x, nazwa: obszarPoId(x.nazwa)?.nazwa || x.nazwa }))
  const wgPowiatu = policz(sygnaly.filter((s) => s.powiat).map((s) => s.powiat)).slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted max-w-3xl">
        Każde zapytanie w wyszukiwarce i każda fiszka to sygnał potrzeby, przypisany do obszaru z Mapy Wyzwań. Tu widać, gdzie potrzeby rosną – także tam, gdzie w Bibliotece brakuje innowacji.
      </p>
      <div className="flex flex-wrap gap-6 items-start">
        <RankingSlupkowy tytul="Potrzeby według obszarów" opis={`${sygnaly.length} sygnałów: zapytania i fiszki`} dane={wgObszaru} />
        <RankingSlupkowy tytul="Skąd przychodzą zgłoszenia" opis="Sygnały z przypisanym powiatem" dane={wgPowiatu} />
      </div>
      <section className="bg-white border border-line rounded-2xl p-6">
        <h2 className="font-display font-bold text-2xl mb-4">Ostatnie zapytania</h2>
        <ul className="flex flex-col gap-2">
          {zgloszenia.slice(0, 8).map((z) => (
            <li key={z.id} className="flex flex-wrap justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-ground">
              <span>{z.tekst}</span>
              <span className="text-sm text-muted">
                {(z.obszary || []).map((o) => obszarPoId(o)?.nazwa).join(', ') || 'obszar nierozpoznany'} · {new Date(z.data).toLocaleDateString('pl-PL')}
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
