// Status wpisu jako kolorowa etykieta z tekstem (nigdy sam kolor)
export const STATUSY = {
  szkic: { nazwa: 'Szkic', klasa: 'bg-[#E6EAF0] text-ink' },
  do_weryfikacji: { nazwa: 'Czeka na weryfikację', klasa: 'bg-clay-light text-clay-dark' },
  do_poprawy: { nazwa: 'Do poprawy', klasa: 'bg-[#FDE2E1] text-[#9B1C1C]' },
  opublikowana: { nazwa: 'Opublikowana', klasa: 'bg-teal-light text-teal-dark' },
  zarchiwizowana: { nazwa: 'Zarchiwizowana', klasa: 'bg-[#E6EAF0] text-muted' },
}

export default function StatusWpisu({ status }) {
  const s = STATUSY[status] || STATUSY.szkic
  return <span className={'inline-block px-2.5 py-0.5 rounded-full text-sm font-bold ' + s.klasa}>{s.nazwa}</span>
}
