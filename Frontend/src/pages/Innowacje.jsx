import { useState } from 'react'
import KartaInnowacji from '../components/KartaInnowacji.jsx'
import { useDane, opublikowane } from '../data/DaneContext.jsx'
import { ETAPY } from '../data/etapy.js'
import { OBSZARY } from '../data/obszary.js'
import { powiaty } from '../data/zasobnik.js'

// Pomysły mieszkańców (innowacje w toku) – tylko fiszki zatwierdzone przez ROPS.
// Filtr po powiecie pozwala np. urzędnikowi zobaczyć, czego potrzebują mieszkańcy jego terenu.
export default function Innowacje() {
  const [szukaj, setSzukaj] = useState('')
  const [obszar, setObszar] = useState('')
  const [powiat, setPowiat] = useState('')
  const fiszki = opublikowane(useDane().fiszki)

  // Filtrowanie to zwykły JS – przy każdej zmianie widok przelicza się sam
  const tekst = szukaj.toLowerCase()
  const widoczne = fiszki.filter((f) =>
    (!tekst || (f.tytul + ' ' + (f.problem || '')).toLowerCase().includes(tekst)) &&
    (!obszar || f.obszar === obszar) &&
    (!powiat || f.powiat === powiat),
  )

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-display font-extrabold text-5xl tracking-tight mb-2">Pomysły mieszkańców</h1>
      <p className="text-lg text-muted mb-6 max-w-2xl">
        Innowacje w toku – problemy, które mieszkańcy Małopolski chcą rozwiązać, i ich pomysły. Każdy wpis sprawdził ROPS.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <label className="sr-only" htmlFor="szukaj">Szukaj</label>
        <input id="szukaj" type="search" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} placeholder="Szukaj w pomysłach i problemach…"
          className="flex-[999_1_280px] min-w-0 min-h-12 px-4 rounded-lg border border-line bg-white" />
        <label className="sr-only" htmlFor="f-obszar">Obszar</label>
        <select id="f-obszar" value={obszar} onChange={(e) => setObszar(e.target.value)} className="min-h-12 px-3 rounded-lg border border-line bg-white">
          <option value="">Wszystkie obszary</option>
          {OBSZARY.map((o) => <option key={o.id} value={o.id}>{o.nazwa}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-powiat">Powiat</label>
        <select id="f-powiat" value={powiat} onChange={(e) => setPowiat(e.target.value)} className="min-h-12 px-3 rounded-lg border border-line bg-white">
          <option value="">Cała Małopolska</option>
          {powiaty.map((p) => <option key={p.nazwa} value={p.nazwa}>{p.nazwa}</option>)}
        </select>
      </div>

      {/* Kolumna na każdy etap: .map() po etapach, w środku .filter() po fiszkach */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 items-start">
        {ETAPY.map((etap) => {
          const wKolumnie = widoczne.filter((f) => f.etap === etap.nr)
          return (
            <section key={etap.nr} className="bg-[#EDF0F4] rounded-2xl p-3.5 flex flex-col gap-3">
              <div className="px-1.5 pt-1.5">
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-xl font-bold">{etap.nr} · {etap.nazwa}</h2>
                  <span className="px-2.5 rounded-full bg-white text-sm font-bold">{wKolumnie.length}</span>
                </div>
                {etap.opis && <p className="text-sm text-muted">{etap.opis}</p>}
              </div>
              {wKolumnie.map((f) => <KartaInnowacji key={f.id} innowacja={f} />)}
            </section>
          )
        })}
      </div>
    </main>
  )
}
