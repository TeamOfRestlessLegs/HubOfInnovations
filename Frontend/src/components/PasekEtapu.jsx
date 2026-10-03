import { ETAPY } from '../data/etapy.js'

// Użycie: <PasekEtapu etap={2} />  → tyle segmentów wypełnionych, ile wynosi etap.
// Liczba segmentów bierze się z ETAPY, więc dodanie etapu nic tu nie psuje.
export default function PasekEtapu({ etap, jasny = false }) {
  const aktualny = ETAPY.find((e) => e.nr === etap)

  return (
    <div>
      <p className={'text-sm mb-1.5 ' + (jasny ? 'text-white/80' : 'text-muted')}>
        Etap: <strong className={jasny ? 'text-white' : 'text-ink'}>{aktualny?.nazwa}</strong> ({etap} z {ETAPY.length})
      </p>
      <div
        className="grid gap-1.5 max-w-80"
        style={{ gridTemplateColumns: `repeat(${ETAPY.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {ETAPY.map((e) => (
          <div
            key={e.nr}
            className={'h-2 rounded ' + (e.nr <= etap ? (jasny ? 'bg-[#5CC8A8]' : 'bg-clay') : (jasny ? 'bg-white/20' : 'bg-line'))}
          />
        ))}
      </div>
    </div>
  )
}
