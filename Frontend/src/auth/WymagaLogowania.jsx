import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

// Owija strony, które wymagają logowania:
//   <WymagaLogowania><Kreator /></WymagaLogowania>
// Opcjonalnie tylko dla wybranych ról:
//   <WymagaLogowania role={['rops_admin']}><PanelAdmina /></WymagaLogowania>
export default function WymagaLogowania({ children, role }) {
  const { uzytkownik } = useAuth()
  const lokalizacja = useLocation()

  if (!uzytkownik) {
    // zapamiętujemy, skąd przyszedł, żeby po logowaniu wrócić w to samo miejsce
    return <Navigate to="/logowanie" state={{ z: lokalizacja.pathname }} replace />
  }

  if (role && !role.includes(uzytkownik.rola)) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display font-extrabold text-3xl mb-3">Brak dostępu</h1>
        <p className="text-muted">Ta strona jest dostępna tylko dla innej roli.</p>
      </main>
    )
  }

  return children
}
