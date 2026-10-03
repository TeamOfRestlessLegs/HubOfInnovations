import { useState } from 'react'
import KartaInnowacji from '../components/KartaInnowacji.jsx'
import { innowacje } from '../data/innowacje.js'
import { ETAPY } from '../data/etapy.js'

export default function Innowacje() {
  const [szukaj, setSzukaj] = useState('')

  // Filtrowanie to zwykły JS – przy każdym wpisanym znaku widok przelicza się sam
  const widoczne = innowacje.filter((i) =>
    i.tytul.toLowerCase().includes(szukaj.toLowerCase()),
  )

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-display font-extrabold text-5xl tracking-tight mb-2">Innowacje w toku</h1>
      <p className="text-lg text-muted mb-6 max-w-2xl">
        Pomysły, które mieszkańcy Małopolski właśnie rozwijają. Poprzyj te, których potrzebujesz.
      </p>

      <label htmlFor="szukaj" className="sr-only">Szukaj pomysłów</label>
      <input
        id="szukaj"
        type="search"
        value={szukaj}
        onChange={(e) => setSzukaj(e.target.value)}
        placeholder="Szukaj pomysłów…"
        className="w-full max-w-md min-h-12 px-4 mb-8 rounded-lg border border-line bg-white"
      />

      {/* Kolumna na każdy etap: .map() po etapach, w środku .filter() po innowacjach */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 items-start">
        {ETAPY.map((etap) => {
          const wKolumnie = widoczne.filter((i) => i.etap === etap.nr)
          return (
            <section key={etap.nr} className="bg-[#EDF0F4] rounded-2xl p-3.5 flex flex-col gap-3">
              <div className="px-1.5 pt-1.5">
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-xl font-bold">{etap.nr} · {etap.nazwa}</h2>
                  <span className="px-2.5 rounded-full bg-white text-sm font-bold">{wKolumnie.length}</span>
                </div>
                <p className="text-sm text-muted">{etap.opis}</p>
              </div>
              {wKolumnie.map((i) => (
                <KartaInnowacji key={i.id} innowacja={i} />
              ))}
            </section>
          )
        })}
      </div>
    </main>
  )
}
