import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth, ROLE } from '../auth/AuthContext.jsx'

const linki = [
  { to: '/szukaj', label: 'Znajdź rozwiązanie' },
  { to: '/innowacje', label: 'Innowacje w toku' },
  { to: '/kreator', label: 'Kreator pomysłów' },
  { to: '/zasobnik', label: 'Zasobnik wiedzy' },
]

export default function Header() {
  return (
    <header className="bg-white border-b border-line">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Link to="/" className="flex items-center gap-2.5 text-ink no-underline">
          <Logo />
          <span className="font-display font-extrabold text-lg leading-none">
            Małopolski<br />Splot
          </span>
        </Link>

        <nav aria-label="Główna nawigacja" className="flex flex-wrap gap-1 flex-1">
          {linki.map((l) => (
            // NavLink sam wie, czy jest aktywny – dostajesz isActive
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                'px-3.5 py-3 rounded-lg font-bold no-underline ' +
                (isActive ? 'bg-teal-light text-teal-dark' : 'text-ink hover:bg-ground')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <Konto />
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
        className="flex items-center gap-2.5 min-h-11 pl-1.5 pr-3.5 rounded-full border border-line hover:bg-ground"
      >
        {uzytkownik.zdjecie ? (
          // no-referrer: bez tego zdjęcia z Google czasem się nie ładują
          <img src={uzytkownik.zdjecie} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold">
            {uzytkownik.imie?.[0]}
          </span>
        )}
        <span className="text-left leading-tight">
          <span className="block font-bold text-[15px]">{uzytkownik.imie}</span>
          <span className="block text-xs text-muted">{ROLE[uzytkownik.rola]}</span>
        </span>
      </button>

      {otwarte && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-line rounded-xl shadow-lg p-3 flex flex-col gap-2 z-10">
          <p className="text-sm text-muted px-1 break-all">{uzytkownik.email}</p>

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
