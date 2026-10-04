import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDane } from '../data/DaneContext.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { wypelnijPole, naborOtwarty, bezOdpowiedzi } from '../data/nabory.js'
import { prowadzi } from '../data/watekFiszki.js'
import { canvaZFiszki, brakujaceSekcje } from '../data/canva.js'
import CanvaFormularz from '../components/CanvaFormularz.jsx'
import WzorWniosku from '../components/WzorWniosku.jsx'
import WniosekPdf from '../components/WniosekPdf.jsx'
import AsystentPola, { usePropozycje } from '../components/AsystentPola.jsx'
import { aiDostepne, BRAK_AI } from '../data/ai.js'
import { kontekstAI, poleWniosku, propozycjeWniosku, zrodlaPola } from '../data/asystent.js'

// Wniosek do naboru krok po kroku:
// 1. Canva innowacji (część odpowiedzi z fiszki) → 2. pytania naboru (tylko gdy wzór ROPS wymaga czegoś, czego
// Canva nie obejmuje) → 3. formularz wypełniony z fiszki, Canvy i odpowiedzi → 4. podgląd PDF i złożenie.
// Fiszkę można dodać zawsze; wniosek (i Canva) tylko w trakcie naboru.
export default function Wniosek() {
  const { fiszkaId, naborId } = useParams()
  const { fiszki, nabory, wnioski, zapiszWniosek, zlozWniosek } = useDane()
  const { uzytkownik } = useAuth()
  const navigate = useNavigate()

  const fiszka = fiszki.find((f) => String(f.id) === fiszkaId)
  const nabor = nabory.find((n) => n.id === naborId)
  const id = `w-${fiszkaId}-${naborId}`
  const zapisany = wnioski.find((w) => w.id === id)
  const tylkoOdczyt = Boolean(zapisany && zapisany.status !== 'szkic')

  const [canva, setCanva] = useState(() => zapisany?.canva || (fiszka ? canvaZFiszki(fiszka) : {}))
  const [odpowiedzi, setOdpowiedzi] = useState(() => zapisany?.odpowiedzi || {})
  const [pola, setPola] = useState(() => zapisany?.pola || {})
  const [krok, setKrok] = useState(() => (tylkoOdczyt ? 'podglad' : zapisany?.pola ? 'formularz' : 'canva'))
  const [komunikat, setKomunikat] = useState('')
  // Asystent AI: propozycje do pól formularza (autor każdą wstawia albo odrzuca sam)
  const kontekst = fiszka && nabor ? kontekstAI(fiszka, nabor, canva, odpowiedzi) : null
  const ai = usePropozycje(kontekst, 'wniosek')
  const [szkicAI, setSzkicAI] = useState({ pracuje: false, blad: '', rady: [] })

  if (!fiszka || !nabor) return <Brak tekst="Nie znaleziono fiszki lub naboru." />
  // Wniosek przygotowuje prowadzący: autor albo gmina, która przejęła pomysł
  if (!prowadzi(fiszka, uzytkownik) && uzytkownik.rola !== 'rops_admin') return <Brak tekst="Wniosek może przygotować tylko osoba prowadząca pomysł." />

  const brakCanvy = brakujaceSekcje(canva)
  const pytania = nabor.pytania || []
  const bezOdp = bezOdpowiedzi(nabor, odpowiedzi)

  // Puste pola formularza uzupełniamy z fiszki, Canvy i odpowiedzi; tego, co autor już wpisał, nie ruszamy
  const uzupelnijPola = () =>
    setPola((stare) => Object.fromEntries(nabor.pola.map((p) => [p.id, (stare[p.id] || '').trim() ? stare[p.id] : wypelnijPole(p, fiszka, canva, nabor, odpowiedzi)])))
  const idz = (k) => {
    if (!tylkoOdczyt && (k === 'formularz' || k === 'podglad')) uzupelnijPola()
    setKrok(k)
    setKomunikat('')
    window.scrollTo(0, 0)
  }

  const problemy = nabor.pola.flatMap((p) => {
    const t = (pola[p.id] || '').trim()
    if (!t) return [{ pole: p, tekst: 'jest puste' }]
    if (t.length > p.limit) return [{ pole: p, tekst: `przekracza limit o ${t.length - p.limit} znaków` }]
    if (t.length < 150) return [{ pole: p, tekst: 'jest bardzo krótkie – rozwiń je' }]
    return []
  })
  const blokujace = problemy.filter((x) => x.tekst !== 'jest bardzo krótkie – rozwiń je')
  const moznaZlozyc = blokujace.length === 0 && brakCanvy.length === 0 && naborOtwarty(nabor)

  // Docelowo: PUT /api/wnioski/:id (szkic) i POST /api/wnioski/:id/zloz
  const dane = () => ({
    id, fiszkaId: fiszka.id, naborId: nabor.id,
    autorId: zapisany?.autorId || (uzytkownik.rola === 'rops_admin' ? fiszka.autorId : uzytkownik.id),
    autor: zapisany?.autor || (uzytkownik.rola === 'rops_admin' ? fiszka.autor : uzytkownik.imie),
    tytul: fiszka.tytul, pola, canva, odpowiedzi,
  })
  const zapisz = () => {
    zapiszWniosek(dane())
    setKomunikat('Szkic zapisany.')
  }
  const zloz = () => {
    zapiszWniosek(dane())
    zlozWniosek(id)
    navigate('/panel')
  }

  const poprosOPropozycje = async () => {
    setSzkicAI({ pracuje: true, blad: '', rady: [] })
    try {
      const d = await propozycjeWniosku(kontekst, nabor.pola.map((p) => poleWniosku(p, pola[p.id], nabor)))
      ai.ustawWszystkie(d.suggestions)
      setSzkicAI({ pracuje: false, blad: '', rady: d.tips })
    } catch (e) {
      setSzkicAI({ pracuje: false, blad: e.message, rady: [] })
    }
  }
  const ustawPole = (pid) => (tekst) => setPola((st) => ({ ...st, [pid]: tekst }))
  const wstawPropozycje = (pid, poprawSam) => {
    ai.wstaw(pid, pola[pid], ustawPole(pid))
    if (poprawSam) setTimeout(() => { const el = document.getElementById('pole-' + pid); el?.focus(); el?.setSelectionRange(el.value.length, el.value.length) })
  }
  const czekajace = nabor.pola.filter((p) => ai.propozycje[p.id])

  const kroki = [
    { id: 'canva', nazwa: 'Canva innowacji', ok: brakCanvy.length === 0 },
    ...(pytania.length ? [{ id: 'pytania', nazwa: 'Pytania naboru', ok: bezOdp.length === 0 }] : []),
    { id: 'formularz', nazwa: 'Formularz wniosku', ok: blokujace.length === 0 && Object.keys(pola).length > 0 },
    { id: 'podglad', nazwa: 'Podgląd i złożenie', ok: tylkoOdczyt },
  ].map((k, i) => ({ ...k, nazwa: `${i + 1}. ${k.nazwa}` }))
  const nastepny = (k) => kroki[kroki.findIndex((x) => x.id === k) + 1]
  const poprzedni = (k) => kroki[kroki.findIndex((x) => x.id === k) - 1]

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <nav aria-label="Ścieżka" className="text-[15px] mb-4"><Link to="/panel">Moje sprawy</Link> <span className="text-muted">› Wniosek</span></nav>
      <div className="mb-6 max-w-3xl">
        <p className="font-bold text-clay mb-1">{nabor.nazwa}</p>
        <h1 className="font-display font-extrabold text-4xl tracking-tight mb-2">Wniosek: {fiszka.tytul}</h1>
        <p className="text-muted">
          Najpierw rozpisz pomysł na Canvie innowacji{pytania.length ? ' i odpowiedz na kilka pytań naboru' : ''}, potem sprawdź formularz – wypełnimy go za Ciebie. Na koniec zobaczysz gotowy wniosek w PDF. Termin: <strong className="text-ink">{new Date(nabor.termin).toLocaleDateString('pl-PL')}</strong>.
        </p>
        {nabor.wzor && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <WzorWniosku nabor={nabor} />
            <span className="text-[15px] text-muted">Oficjalny wzór ROPS – pola formularza poniżej są z niego odczytane.</span>
          </div>
        )}
        {tylkoOdczyt && <p role="status" className="mt-3 px-4 py-3 rounded-xl bg-teal-light text-teal-dark font-bold">Wniosek złożony – status: {zapisany.status}.</p>}
      </div>

      <ol aria-label="Kroki wniosku" className="flex flex-wrap gap-2 mb-8">
        {kroki.map((k) => (
          <li key={k.id}>
            <button
              type="button"
              onClick={() => idz(k.id)}
              aria-current={krok === k.id ? 'step' : undefined}
              className={'min-h-11 px-4 rounded-full font-bold ' + (krok === k.id ? 'bg-ink text-white' : 'bg-white border-2 border-line text-ink')}
            >
              {k.ok && '✓ '}{k.nazwa}
            </button>
          </li>
        ))}
      </ol>

      {krok === 'canva' && (
        <CanvaFormularz
          odpowiedzi={canva}
          onZmiana={(pid, v) => setCanva((c) => ({ ...c, [pid]: v }))}
          tylkoOdczyt={tylkoOdczyt}
          kontekstAI={kontekst}
          przyciskKoncowy={
            <button type="button" onClick={() => idz(nastepny('canva').id)} className="min-h-12 px-5.5 rounded-xl bg-clay text-white font-bold">
              Dalej: {nastepny('canva').nazwa.replace(/^\d+\. /, '').toLowerCase()} →
            </button>
          }
        />
      )}

      {krok === 'pytania' && (
        <div className="flex flex-wrap gap-8 items-start">
          <section aria-labelledby="pytania-h" className="flex-[999_1_560px] min-w-0 flex flex-col gap-6">
            <div className="bg-white border border-line rounded-2xl p-5">
              <h2 id="pytania-h" className="font-display font-bold text-2xl mb-1">Kilka pytań do tego naboru</h2>
              <p className="text-muted">Wzór wniosku ROPS pyta o rzeczy, których nie ma w Canvie. Odpowiedz własnymi słowami – wystarczy kilka zdań. Z odpowiedzi wypełnimy formularz.</p>
            </div>
            {pytania.map((q, i) => {
              const doPol = nabor.pola.filter((p) => (p.pytania || []).includes(q.id))
              return (
                <div key={q.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-2">
                  <label htmlFor={'pyt-' + q.id} className="font-bold text-lg">{i + 1}. {q.tresc}</label>
                  {q.podpowiedz && <p className="text-muted">{q.podpowiedz}</p>}
                  <textarea id={'pyt-' + q.id} rows={3} value={odpowiedzi[q.id] || ''} readOnly={tylkoOdczyt}
                    onChange={(e) => setOdpowiedzi((o) => ({ ...o, [q.id]: e.target.value }))}
                    className="p-3.5 rounded-xl border border-[#B8C2D0] resize-y read-only:bg-ground" />
                  {doPol.length > 0 && <p className="text-sm text-muted">Potrzebne do: {doPol.map((p) => p.etykieta).join(', ')}</p>}
                </div>
              )
            })}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => idz('canva')} className="min-h-12 px-5 rounded-xl border-2 border-line font-bold">← Canva</button>
              {!tylkoOdczyt && <button type="button" onClick={zapisz} className="min-h-12 px-5 rounded-xl border-2 border-ink font-bold">Zapisz szkic</button>}
              <button type="button" onClick={() => idz('formularz')} className="min-h-12 px-5.5 rounded-xl bg-clay text-white font-bold">Dalej: formularz wniosku →</button>
              {komunikat && <span role="status" className="text-teal-dark font-bold">{komunikat}</span>}
            </div>
          </section>
          <aside aria-label="Pomoc" className="flex-[1_1_300px] min-w-0 bg-ink text-white rounded-2xl p-5 flex flex-col gap-3">
            <h2 className="font-display text-xl font-bold">Dlaczego te pytania?</h2>
            <p className="text-[15px] text-white/85">Każdy nabór ma inny wzór wniosku. Asystent przeczytał wzór ROPS i sprawdził, czego jeszcze brakuje po Canvie – pytamy tylko o to.</p>
            <p className="bg-[#1C2E52] rounded-xl p-3.5 text-[15px]">Odpowiedziano: <strong>{pytania.length - bezOdp.length} z {pytania.length}</strong>. Nie znasz odpowiedzi? Pomiń – uzupełnisz później w formularzu.</p>
          </aside>
        </div>
      )}

      {krok === 'formularz' && (
        <div className="flex flex-wrap gap-8 items-start">
          <form onSubmit={(e) => e.preventDefault()} className="flex-[999_1_560px] min-w-0 flex flex-col gap-6">
            {!tylkoOdczyt && (
              <div className="rounded-2xl border-[3px] border-teal bg-teal-light p-5 flex flex-col gap-3">
                <p className="font-display font-bold text-xl text-teal-dark">💡 Pomoc asystenta</p>
                <p>
                  Asystent może napisać pełniejsze odpowiedzi na podstawie Twojej fiszki, Canvy{pytania.length ? ' i odpowiedzi na pytania naboru' : ''}. Pokaże je pod każdym polem –
                  Ty decydujesz, czy je wstawić. <strong>Nic nie zmieni się bez Twojej zgody.</strong>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={poprosOPropozycje} disabled={!aiDostepne || szkicAI.pracuje} className="min-h-12 px-6 rounded-xl bg-teal text-white font-bold text-lg disabled:opacity-50">
                    {szkicAI.pracuje ? 'Asystent pisze… (to potrwa chwilę)' : czekajace.length ? 'Napisz propozycje od nowa' : 'Poproś asystenta o propozycje'}
                  </button>
                  {czekajace.length > 0 && !szkicAI.pracuje && <span className="font-bold text-teal-dark">Propozycje czekają pod polami poniżej ↓</span>}
                </div>
                {!aiDostepne && <p className="text-[15px] text-muted">{BRAK_AI}</p>}
                {szkicAI.blad && <p role="alert" className="text-[#9B1C1C] font-bold">{szkicAI.blad}</p>}
              </div>
            )}

            {nabor.pola.map((p, i) => {
              const dl = (pola[p.id] || '').length
              const zaDuzo = dl > p.limit
              const zrodla = zrodlaPola(p, nabor)
              return (
                <div key={p.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-2">
                  <label htmlFor={'pole-' + p.id} className="font-bold text-lg">{i + 1}. {p.etykieta}</label>
                  {p.opis && <p id={'opis-' + p.id} className="text-muted -mt-1">{p.opis}</p>}
                  {zrodla.length > 0 && (
                    <ul aria-label="Wypełnione na podstawie" className="flex flex-wrap gap-1.5">
                      {zrodla.map((z) => <li key={z} className="px-2.5 py-1 rounded-full bg-ground border border-line text-xs font-bold text-muted">{z}</li>)}
                    </ul>
                  )}
                  <textarea
                    id={'pole-' + p.id}
                    rows={5}
                    value={pola[p.id] || ''}
                    readOnly={tylkoOdczyt}
                    onChange={(e) => setPola({ ...pola, [p.id]: e.target.value })}
                    aria-describedby={(p.opis ? 'opis-' + p.id + ' ' : '') + 'licznik-' + p.id}
                    className="p-3.5 rounded-xl border border-[#B8C2D0] resize-y read-only:bg-ground"
                  />
                  <p id={'licznik-' + p.id} className={'text-sm text-right ' + (zaDuzo ? 'text-[#9B1C1C] font-bold' : 'text-muted')}>
                    {dl} / {p.limit} znaków{zaDuzo && ' – za dużo'}
                  </p>
                  {!tylkoOdczyt && (
                    <AsystentPola
                      poleId={p.id}
                      propozycja={ai.propozycje[p.id]}
                      limit={p.limit}
                      pracuje={Boolean(ai.pracuje[p.id])}
                      blad={ai.bledy[p.id]}
                      przycisk="💡 Popraw z asystentem"
                      moznaCofnac={ai.cofnij[p.id] !== undefined}
                      onPopros={(polecenie) => ai.popros(poleWniosku(p, pola[p.id], nabor), polecenie)}
                      onWstaw={(poprawSam) => wstawPropozycje(p.id, poprawSam)}
                      onZostaw={() => ai.zostaw(p.id)}
                      onCofnij={() => ai.wycofaj(p.id, ustawPole(p.id))}
                    />
                  )}
                </div>
              )
            })}

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => idz(poprzedni('formularz').id)} className="min-h-12 px-5 rounded-xl border-2 border-line font-bold">
                ← {poprzedni('formularz').nazwa.replace(/^\d+\. /, '')}
              </button>
              {!tylkoOdczyt && <button type="button" onClick={zapisz} className="min-h-12 px-5 rounded-xl border-2 border-ink font-bold">Zapisz szkic</button>}
              <button type="button" onClick={() => idz('podglad')} className="min-h-12 px-6 rounded-xl bg-clay text-white font-bold">Dalej: podgląd wniosku →</button>
              {komunikat && <span role="status" className="text-teal-dark font-bold">{komunikat}</span>}
            </div>
          </form>

          <aside aria-label="Asystent wniosku" className="flex-[1_1_300px] min-w-0 bg-ink text-white rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6">
            <h2 className="font-display text-xl font-bold">Asystent wniosku</h2>
            {czekajace.length > 0 && (
              <div className="bg-[#1C2E52] rounded-xl p-4">
                <p className="font-bold mb-2">Czeka na Twoją decyzję: {czekajace.length} {czekajace.length === 1 ? 'propozycja' : czekajace.length < 5 ? 'propozycje' : 'propozycji'}</p>
                <ul className="flex flex-col gap-1.5 text-[15px]">
                  {czekajace.map((p) => <li key={p.id}><a href={'#pole-' + p.id} className="text-[#5CC8A8] font-bold">{p.etykieta}</a></li>)}
                </ul>
              </div>
            )}
            {szkicAI.rady.length > 0 && (
              <div className="bg-[#1C2E52] rounded-xl p-4">
                <p className="font-bold mb-2">Rady asystenta</p>
                <ul className="flex flex-col gap-1.5 text-[15px] text-white/85 list-disc pl-5">
                  {szkicAI.rady.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            )}
            <div className="bg-[#1C2E52] rounded-xl p-4">
              <p className="font-bold mb-2">Kryteria naboru</p>
              <p className="text-[15px] text-white/85">{nabor.kryteria}</p>
            </div>
            <Braki brakCanvy={brakCanvy} bezOdp={bezOdp} idz={idz} />
            <div className="bg-[#1C2E52] rounded-xl p-4">
              <p className="font-bold mb-2">{problemy.length ? 'Do poprawy' : 'Wszystkie pola wyglądają dobrze'}</p>
              <ul className="flex flex-col gap-1.5 text-[15px]">
                {problemy.map((x) => (
                  <li key={x.pole.id}><a href={'#pole-' + x.pole.id} className="text-[#5CC8A8] font-bold">{x.pole.etykieta}</a> {x.tekst}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-white/70">Propozycje asystenta to tylko pomoc – sprawdź, czy wszystko się zgadza, zanim złożysz wniosek.</p>
          </aside>
        </div>
      )}

      {krok === 'podglad' && (
        <div className="flex flex-wrap gap-8 items-start">
          <section aria-labelledby="podglad-h" className="flex-[999_1_560px] min-w-0 flex flex-col gap-4">
            <div>
              <h2 id="podglad-h" className="font-display font-bold text-2xl mb-1">{tylkoOdczyt ? 'Twój złożony wniosek' : 'Sprawdź swój wniosek'}</h2>
              <p className="text-muted">
                {tylkoOdczyt ? 'Tak wygląda wniosek, który otrzymał ROPS.' : 'Tak zobaczy go ROPS. Przeczytaj spokojnie – jeśli coś jest nie tak, wróć do formularza i popraw.'}
              </p>
            </div>
            <WniosekPdf w={{ ...dane(), status: zapisany?.status && zapisany.status !== 'szkic' ? zapisany.status : 'podglad', zlozono: zapisany?.zlozono }} n={nabor} />
          </section>

          {!tylkoOdczyt && (
            <aside aria-label="Złożenie wniosku" className="flex-[1_1_300px] min-w-0 bg-ink text-white rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6">
              <h2 className="font-display text-xl font-bold">Wszystko się zgadza?</h2>
              <Braki brakCanvy={brakCanvy} bezOdp={bezOdp} idz={idz} />
              {blokujace.length > 0 && (
                <div className="bg-[#1C2E52] rounded-xl p-4">
                  <p className="font-bold mb-2">Zanim złożysz, popraw:</p>
                  <ul className="flex flex-col gap-1.5 text-[15px]">
                    {blokujace.map((x) => <li key={x.pole.id}><strong>{x.pole.etykieta}</strong> {x.tekst}</li>)}
                  </ul>
                </div>
              )}
              {!naborOtwarty(nabor) && <p className="bg-[#1C2E52] rounded-xl p-4 font-bold">Nabór jest zamknięty – wniosku nie można już złożyć.</p>}
              <button type="button" onClick={zloz} disabled={!moznaZlozyc} className="min-h-14 px-6 rounded-xl bg-clay text-white font-bold text-lg disabled:opacity-50">
                Złóż wniosek
              </button>
              <button type="button" onClick={() => idz('formularz')} className="min-h-12 px-5 rounded-xl border-2 border-white/40 font-bold">← Popraw formularz</button>
              <button type="button" onClick={zapisz} className="min-h-12 px-5 rounded-xl border-2 border-white/40 font-bold">Zapisz szkic</button>
              {komunikat && <span role="status" className="text-[#5CC8A8] font-bold">{komunikat}</span>}
            </aside>
          )}
        </div>
      )}
    </main>
  )
}

// Czego brakuje poza samymi polami: Canva i pytania naboru
function Braki({ brakCanvy, bezOdp, idz }) {
  return (
    <>
      {brakCanvy.length > 0 && (
        <div className="bg-[#1C2E52] rounded-xl p-4">
          <p className="font-bold mb-2">Canva niekompletna</p>
          <p className="text-[15px] text-white/85 mb-2">Brakuje: {brakCanvy.map((s) => s.nazwa).join(', ')}.</p>
          <button type="button" onClick={() => idz('canva')} className="text-[#5CC8A8] font-bold">Wróć do Canvy →</button>
        </div>
      )}
      {bezOdp.length > 0 && (
        <div className="bg-[#1C2E52] rounded-xl p-4">
          <p className="font-bold mb-2">Pytania naboru bez odpowiedzi: {bezOdp.length}</p>
          <p className="text-[15px] text-white/85 mb-2">Odpowiedzi pomogą lepiej wypełnić wniosek.</p>
          <button type="button" onClick={() => idz('pytania')} className="text-[#5CC8A8] font-bold">Odpowiedz na pytania →</button>
        </div>
      )}
    </>
  )
}

function Brak({ tekst }) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display font-extrabold text-3xl mb-3">{tekst}</h1>
      <Link to="/panel">← Wróć do panelu</Link>
    </main>
  )
}
