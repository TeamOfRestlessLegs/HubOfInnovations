import { createContext, useContext, useState } from 'react'
import { googleLogout } from '@react-oauth/google'

// Kto jest zalogowany – dostępne w każdym komponencie przez useAuth().
//
// DWA TRYBY:
// 1. Bez backendu (brak VITE_API_URL): profil czytamy prosto z tokenu Google,
//    rola zawsze 'resident'. TYLKO DO DEMO – frontend nie może sam sprawdzić,
//    czy token jest prawdziwy.
// 2. Z backendem (VITE_API_URL ustawione): wysyłamy token Google do
//    POST /api/auth/google, backend go weryfikuje, zakłada konto
//    i zwraca użytkownika z rolą z bazy + własny token sesji.

const AuthContext = createContext(null)
const KLUCZ = 'splot-uzytkownik'
const API = import.meta.env.VITE_API_URL

// Dwie role: użytkownik (mieszkaniec, NGO, urzędnik – każdy, kto zgłasza) i ROPS = administrator
export const ROLE = {
  resident: 'Użytkownik',
  rops_admin: 'ROPS (administrator)',
}

// Token Google (JWT) = trzy części oddzielone kropkami; środkowa to dane profilu
function odczytajTokenGoogle(credential) {
  const base64 = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const bajty = Uint8Array.from(atob(base64), (z) => z.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bajty)) // TextDecoder = poprawne polskie znaki
}

function wczytajZapisanego() {
  try {
    return JSON.parse(localStorage.getItem(KLUCZ))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [uzytkownik, setUzytkownik] = useState(wczytajZapisanego)

  const zapisz = (u) => {
    localStorage.setItem(KLUCZ, JSON.stringify(u))
    setUzytkownik(u)
  }

  async function zalogujGoogle(credential) {
    if (API) {
      const odp = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      if (!odp.ok) throw new Error('Serwer odrzucił logowanie')
      // oczekiwany kształt: { id, imie, email, zdjecie, rola, token }
      zapisz(await odp.json())
      return
    }

    const g = odczytajTokenGoogle(credential)
    zapisz({ id: g.sub, imie: g.name, email: g.email, zdjecie: g.picture, rola: 'resident', token: null })
  }

  function wyloguj() {
    googleLogout()
    localStorage.removeItem(KLUCZ)
    setUzytkownik(null)
  }

  // Tylko w trybie demo: przełączanie roli, żeby pokazać panele jury
  const zmienRoleDemo = API ? null : (rola) => zapisz({ ...uzytkownik, rola })

  // Tylko podczas `npm run dev`: wejście bez Google, do testowania stron
  const zalogujDemo = import.meta.env.DEV
    ? (rola) => zapisz({ id: 'demo-' + rola, imie: 'Test ' + ROLE[rola], email: 'demo@splot.local', zdjecie: null, rola, token: null })
    : null

  return (
    <AuthContext.Provider value={{ uzytkownik, zalogujGoogle, zalogujDemo, wyloguj, zmienRoleDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
