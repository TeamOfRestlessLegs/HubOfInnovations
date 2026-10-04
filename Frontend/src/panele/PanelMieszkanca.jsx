import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane } from '../data/DaneContext.jsx'
import { ETAPY } from '../data/etapy.js'
import { naborOtwarty } from '../data/nabory.js'
import PasekEtapu from '../components/PasekEtapu.jsx'
import StatusWpisu from '../components/StatusWpisu.jsx'
import SzczegolyFiszki from '../components/SzczegolyFiszki.jsx'
import WzorWniosku from '../components/WzorWniosku.jsx'
import { RaportOpinii } from '../components/RaportOpinii.jsx'
import { STATUS_TESTU, tenSamZasob } from '../data/tester.js'

const STATUS_WNIOSKU = {
  szkic: { nazwa: 'Szkic', klasa: 'bg-[#E6EAF0] text-ink' },
  zlozony: { nazwa: 'Złożony – czeka na ocenę', klasa: 'bg-clay-light text-clay-dark' },
  przyjety: { nazwa: 'Przyjęty', klasa: 'bg-teal-light text-teal-dark' },
  odrzucony: { nazwa: 'Odrzucony', klasa: 'bg-[#FDE2E1] text-[#9B1C1C]' },
}

// Panel użytkownika: moje pomysły (status, uwagi ROPS, etapy) i moje wnioski do naborów
export default function PanelMieszkanca() {
  const { uzytkownik } = useAuth()
  const { fiszki, nabory, wnioski, testy, zgloszeniaTestow, opinie, pytania, poprosOEtap } = useDane()
  const sledzone = fiszki.filter((f) => (f.poparli || []).includes(uzytkownik.id) && f.autorId !== uzytkownik.id)
  const mojeTesty = zgloszeniaTestow.filter((z) => z.uzytkownikId === uzytkownik.id)
  const moje = fiszki.filter((f) => f.autorId === uzytkownik.id)
  const mojeWnioski = wnioski.filter((w) => w.autorId === uzytkownik.id)
  const otwarte = nabory.filter(naborOtwarty)

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight mb-1">Moje sprawy</h1>
          <p className="text-muted text-lg">Twoje pomysły, wnioski i to, co dalej.</p>
        </div>
        <Link to="/kreator" className="min-h-12 px-5 inline-flex items-center rounded-xl bg-clay text-white font-bold no-underline">
          + Nowy pomysł
        </Link>
      </div>

      {mojeWnioski.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display font-bold text-2xl mb-4">Moje wnioski</h2>
          <ul className="flex flex-col gap-3">
            {mojeWnioski.map((w) => {
              const n = nabory.find((x) => x.id === w.naborId)
              const s = STATUS_WNIOSKU[w.status] || STATUS_WNIOSKU.szkic
              return (
                <li key={w.id} className="bg-white border border-line rounded-2xl p-5 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="font-bold">{w.tytul}</p>
                    <p className="text-sm text-muted">{n?.nazwa}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={'px-2.5 py-0.5 rounded-full text-sm font-bold ' + s.klasa}>{s.nazwa}</span>
                    <Link to={`/wniosek/${w.fiszkaId}/${w.naborId}`} className="font-bold min-h-11 inline-flex items-center">
                      {w.status === 'szkic' ? 'Dokończ →' : 'Zobacz →'}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {sledzone.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display font-bold text-2xl mb-4">Śledzone pomysły</h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {sledzone.map((f) => (
              <li key={f.id}>
                <Link to={'/pomysl/' + f.id} className="h-full flex flex-col gap-1 bg-white border border-line rounded-2xl px-5 py-4 no-underline text-ink hover:border-ink">
                  <strong>{f.tytul}</strong>
                  <span className="text-sm text-muted">{f.powiat && `pow. ${f.powiat} · `}otwórz wątek →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mojeTesty.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display font-bold text-2xl mb-4">Moje testy</h2>
          <ul className="flex flex-col gap-2">
            {mojeTesty.map((z) => {
              const t = testy.find((x) => x.id === z.testId)
              return (
                <li key={z.id} className="bg-white border border-line rounded-2xl px-5 py-4 flex flex-wrap justify-between items-center gap-3">
                  <span><strong>{t?.tytul}</strong> <span className={'ml-2 px-2 py-0.5 rounded-full text-xs font-bold ' + STATUS_TESTU[t?.status || 'rekrutacja'].klasa}>{STATUS_TESTU[t?.status || 'rekrutacja'].nazwa}</span></span>
                  <span className="text-[15px]">{{ zgloszony: 'Czeka na decyzję ROPS', przyjety: 'Jesteś testerem', odrzucony: 'Bez miejsca' }[z.status]} · <Link to="/tester" className="font-bold">Tester →</Link></span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <h2 className="font-display font-bold text-2xl mb-4">Moje pomysły</h2>
      {moje.length === 0 && (
        <p className="bg-white border border-line rounded-2xl p-6 text-muted">
          Nie masz jeszcze żadnych pomysłów. <Link to="/kreator" className="font-bold">Zgłoś pierwszy w Kreatorze →</Link>
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {moje.map((i) => {
          const nastepny = ETAPY.find((e) => e.nr === i.etap + 1 && e.opis)
          // Nabory, do których pasuje ta fiszka (ten sam obszar), a wniosku jeszcze nie ma
          const pasujace = i.status === 'opublikowana'
            ? otwarte.filter((n) => !wnioski.some((w) => w.fiszkaId === i.id && w.naborId === n.id))
            : []
          return (
            <li key={i.id} className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex flex-wrap justify-between gap-3 items-start">
                <div>
                  <h3 className="font-display text-xl font-bold"><Link to={'/pomysl/' + i.id} className="text-ink no-underline hover:underline">{i.tytul}</Link></h3>
                  {i.powiat && <p className="text-sm text-muted">pow. {i.powiat}</p>}
                </div>
                <StatusWpisu status={i.status} />
              </div>
              <SzczegolyFiszki fiszka={i} />
              <PasekEtapu etap={i.etap} />
              {i.status === 'odrzucona' && (
                <div className="rounded-xl bg-[#FDE2E1] p-4 flex flex-col gap-1 text-[#5C1010]">
                  <p className="font-bold">ROPS usunął ten pomysł – wątek zakończony</p>
                  {i.powodOdrzucenia && <p><strong>Powód:</strong> „{i.powodOdrzucenia}”</p>}
                  <p className="text-[15px]">Pomysł nie jest publiczny. Możesz zgłosić nowy, dopracowany pomysł.</p>
                </div>
              )}

              {i.prosbaPrzejecia && (
                <Link to={'/pomysl/' + i.id} className="rounded-xl bg-clay-light p-4 font-bold text-clay-dark no-underline">Gmina (pow. {i.prosbaPrzejecia.powiat}) chce poprowadzić ten pomysł – zdecyduj w wątku →</Link>
              )}
              {i.prowadzacy && !i.odJST && <p className="text-[15px]">Pomysł prowadzi gmina (pow. {i.prowadzacy.powiat}). Jesteś pomysłodawcą.</p>}
              <Rozmowa fiszka={i} pytan={pytania.filter((q) => q.fiszkaId === i.id && q.odpowiedzi.length).length} />
              {opinie.some((o) => tenSamZasob(o.zasob, { typ: 'fiszka', id: i.id })) && (
                <RaportOpinii tytul="Raport z testów – co mówią testerzy" opinie={opinie.filter((o) => tenSamZasob(o.zasob, { typ: 'fiszka', id: i.id }))} />
              )}

              {i.status === 'do_weryfikacji' && (
                <p className="text-muted text-base">Pomysł czeka na poparcie ROPS albo eksperta. Po poparciu zobaczą go wszyscy.</p>
              )}

              {i.status === 'do_poprawy' && (
                <div className="rounded-xl bg-[#FDE2E1] p-4 flex flex-col gap-2">
                  <p className="font-bold text-[#9B1C1C]">Propozycja poprawek</p>
                  <p>{i.komentarzRops}</p>
                  <Link to={'/pomysl/' + i.id + '?edycja=1'} className="self-start min-h-11 px-4 inline-flex items-center rounded-lg bg-ink text-white font-bold no-underline">Wprowadź poprawki</Link>
                </div>
              )}

              {i.prosbaPrzejecia && (
                <Link to={'/pomysl/' + i.id} className="rounded-xl bg-clay-light p-4 font-bold text-clay-dark no-underline">Gmina (pow. {i.prosbaPrzejecia.powiat}) chce poprowadzić ten pomysł – zdecyduj w wątku →</Link>
              )}
              {i.prowadzacy && !i.odJST && <p className="text-[15px]">Pomysł prowadzi gmina (pow. {i.prowadzacy.powiat}). Jesteś pomysłodawcą.</p>}
              <Rozmowa fiszka={i} pytan={pytania.filter((q) => q.fiszkaId === i.id && q.odpowiedzi.length).length} />
              {opinie.some((o) => tenSamZasob(o.zasob, { typ: 'fiszka', id: i.id })) && (
                <RaportOpinii tytul="Raport z testów – co mówią testerzy" opinie={opinie.filter((o) => tenSamZasob(o.zasob, { typ: 'fiszka', id: i.id }))} />
              )}

              {pasujace.map((n) => (
                <div key={n.id} className="rounded-xl bg-clay-light p-4 flex flex-wrap justify-between items-center gap-3">
                  <p><strong>Trwa nabór pasujący do tego pomysłu:</strong> {n.nazwa} (do {new Date(n.termin).toLocaleDateString('pl-PL')})</p>
                  <div className="flex flex-wrap gap-2">
                  <WzorWniosku nabor={n} />
                  <Link to={`/wniosek/${i.id}/${n.id}`} className="min-h-11 px-4 inline-flex items-center rounded-lg bg-clay text-white font-bold no-underline">
                    Przygotuj wniosek
                  </Link>
                  </div>
                </div>
              ))}

              {i.status === 'opublikowana' && nastepny && (
                i.prosbaOEtap ? (
                  <p className="text-base text-clay-dark font-bold">Prośba o etap „{nastepny.nazwa}” czeka na decyzję ROPS.</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => poprosOEtap(i.id)} className="min-h-11 px-4 rounded-lg border-2 border-ink font-bold">
                      Poproś o etap: {nastepny.nazwa}
                    </button>
                    {nastepny.nr >= 3 && <span className="text-sm text-muted">ROPS sprawdzi, czy rozwiązanie było testowane z odbiorcami.</span>}
                  </div>
                )
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}

// Wejście do wątku pomysłu – tam toczą się wszystkie rozmowy (dyskusja, eksperci, oficjalne)
function Rozmowa({ fiszka, pytan }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link to={'/pomysl/' + fiszka.id} className="min-h-11 px-4 inline-flex items-center rounded-lg bg-ink text-white font-bold no-underline">
        Wątek pomysłu{pytan ? ` · ${pytan} odp.` : ''} →
      </Link>
    </div>
  )
}
