// Link do wzoru wniosku (PDF) dołączonego przez ROPS do naboru
export default function WzorWniosku({ nabor, jasny = false }) {
  if (!nabor?.wzor) return null
  return (
    <a
      href={nabor.wzor.url}
      download={nabor.wzor.nazwa}
      target="_blank"
      rel="noreferrer"
      className={'inline-flex items-center gap-2 min-h-11 px-4 rounded-lg font-bold no-underline border-2 ' + (jasny ? 'border-white/40 text-white hover:bg-white/10' : 'border-ink text-ink bg-white hover:bg-ground')}
    >
      <span aria-hidden="true" className="text-xs px-1.5 py-0.5 rounded bg-clay text-white">PDF</span>
      Wzór wniosku
      <span className="sr-only">: {nabor.wzor.nazwa}</span>
    </a>
  )
}
