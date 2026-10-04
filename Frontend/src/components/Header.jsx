import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth, ROLE } from '../auth/AuthContext.jsx'
import Powiadomienia from './Powiadomienia.jsx'
import Dostepnosc from './Dostepnosc.jsx'

// Menu: tylko główne miejsca. Kreator to przycisk „Zgłoś pomysł”, panel i wiadomości są po prawej.
const linki = [
  { to: '/szukaj', label: 'Znajdź rozwiązanie' },
  { to: '/innowacje', label: 'Pomysły' },
  { to: '/baza-wiedzy', label: 'Baza wiedzy' },
]

// Nazwa panelu zależy od roli
const NAZWA_PANELU = { resident: 'Moje sprawy', jst: 'Panel', ekspert: 'Panel eksperta', rops_admin: 'Panel ROPS' }

export default function Header() {
  const { uzytkownik } = useAuth()
  return (
    <header className="bg-white border-b border-line print:hidden">
      {/* Link „przejdź do treści” – pierwszy element dla klawiatury i czytników ekranu */}
      <a href="#tresc" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-ink focus:text-white focus:font-bold">Przejdź do treści</a>
      <div className="border-b border-line bg-ground">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex justify-end">
          <Dostepnosc />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link to="/" className="flex items-center gap-2.5 text-ink no-underline">
          <Logo />
          <span className="font-display font-extrabold text-lg leading-none">
            Małopolski<br />Splot
          </span>
        </Link>

        <nav aria-label="Główna nawigacja" className="flex flex-wrap gap-0.5 flex-1">
          {linki.map((l) => (
            // NavLink sam wie, czy jest aktywny – dostajesz isActive
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                'px-2.5 py-3 rounded-lg font-bold no-underline whitespace-nowrap ' +
                (isActive ? 'bg-teal-light text-teal-dark' : 'text-ink hover:bg-ground')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {uzytkownik?.rola !== 'rops_admin' && uzytkownik?.rola !== 'ekspert' && (
            <Link to="/kreator" className="min-h-11 px-4 inline-flex items-center rounded-lg bg-clay text-white font-bold no-underline whitespace-nowrap hover:bg-clay-dark">
              + Zgłoś pomysł
            </Link>
          )}
          {uzytkownik && (
            <NavLink
              to="/panel"
              className={({ isActive }) =>
                'min-h-11 px-4 inline-flex items-center rounded-lg font-bold no-underline border-2 border-ink whitespace-nowrap ' +
                (isActive ? 'bg-ink text-white' : 'text-ink hover:bg-ground')
              }
            >
              <span className="hidden xl:inline">{NAZWA_PANELU[uzytkownik.rola]}</span>
              <span className="xl:hidden" aria-label={NAZWA_PANELU[uzytkownik.rola]}>Panel</span>
            </NavLink>
          )}
          {uzytkownik && <Powiadomienia />}
          <Konto />
        </div>
      </div>
    </header>
  )
}

// Prawy róg: przycisk logowania albo zalogowana osoba z menu
function Konto() {
  const { uzytkownik, wyloguj, zmienRoleDemo } = useAuth()
  const [otwarte, setOtwarte] = useState(false)

  if (!uzytkownik) {
    return (
      <Link to="/logowanie" className="min-h-11 px-4 inline-flex items-center rounded-lg bg-ink text-white font-bold no-underline">
        Zaloguj się
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOtwarte(!otwarte)}
        aria-expanded={otwarte}
        className="flex items-center gap-2.5 min-h-11 p-1.5 2xl:pr-3.5 rounded-full border border-line hover:bg-ground"
      >
        {uzytkownik.zdjecie ? (
          // no-referrer: bez tego zdjęcia z Google czasem się nie ładują
          <img src={uzytkownik.zdjecie} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold">
            {uzytkownik.imie?.[0]}
          </span>
        )}
        <span className="sr-only">Konto: {uzytkownik.imie}</span>
        <span aria-hidden="true" className="hidden 2xl:block text-left leading-tight">
          <span className="block font-bold text-[15px]">{uzytkownik.imie}</span>
          <span className="block text-xs text-muted">{ROLE[uzytkownik.rola]}</span>
        </span>
      </button>

      {otwarte && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-line rounded-xl shadow-lg p-3 flex flex-col gap-2 z-10">
          <div className="px-1">
            <p className="font-bold">{uzytkownik.imie}</p>
            <p className="text-sm text-muted">{ROLE[uzytkownik.rola]}</p>
            <p className="text-sm text-muted break-all">{uzytkownik.email}</p>
          </div>

          {zmienRoleDemo && (
            <label className="flex flex-col gap-1 px-1 text-sm font-bold">
              Rola (tryb demo)
              <select
                value={uzytkownik.rola}
                onChange={(e) => zmienRoleDemo(e.target.value)}
                className="min-h-10 rounded-lg border border-line px-2 font-normal"
              >
                {Object.entries(ROLE).map(([klucz, nazwa]) => (
                  <option key={klucz} value={klucz}>{nazwa}</option>
                ))}
              </select>
            </label>
          )}

          <button
            onClick={() => { setOtwarte(false); wyloguj() }}
            className="min-h-11 rounded-lg border-2 border-line font-bold hover:bg-ground"
          >
            Wyloguj się
          </button>
        </div>
      )}
    </div>
  )
}

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#14213D" />
      <path d="M7 15 C15 15 16 25 24 25 S33 15 33 15" stroke="#5CC8A8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M7 25 C15 25 16 15 24 15 S33 25 33 25" stroke="#F29A5C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
