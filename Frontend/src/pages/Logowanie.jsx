import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth, ROLE } from '../auth/AuthContext.jsx'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Logowanie() {
  const { uzytkownik, zalogujGoogle, zalogujDemo } = useAuth()
  const [blad, setBlad] = useState('')
  const navigate = useNavigate()
  const lokalizacja = useLocation()
  const powrot = lokalizacja.state?.z || '/'

  if (uzytkownik) return <Navigate to={powrot} replace />

  async function poZalogowaniu(odpowiedz) {
    try {
      await zalogujGoogle(odpowiedz.credential)
      navigate(powrot, { replace: true })
    } catch (e) {
      setBlad(e.message)
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white border border-line rounded-2xl p-8 flex flex-col gap-5">
        <div>
          <h1 className="font-display font-extrabold text-3xl mb-2">Zaloguj się</h1>
          <p className="text-muted">
            Logowanie pozwala dodawać pomysły, popierać innowacje i zgłaszać się do testów.
            Przeglądać i szukać możesz bez konta.
          </p>
        </div>

        {CLIENT_ID ? (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={poZalogowaniu}
              onError={() => setBlad('Nie udało się zalogować przez Google.')}
              text="signin_with"
              shape="pill"
              size="large"
              locale="pl"
            />
          </div>
        ) : (
          <p className="p-4 rounded-xl bg-clay-light text-clay-dark">
            Brak <code>VITE_GOOGLE_CLIENT_ID</code>. Dodaj go w pliku <code>.env.local</code> (instrukcja w README)
            i uruchom ponownie <code>npm run dev</code>.
          </p>
        )}

        {blad && <p role="alert" className="text-clay-dark font-bold">{blad}</p>}

        {/* Widoczne tylko przy `npm run dev` – nie trafia na produkcję */}
        {zalogujDemo && (
          <div className="border-t border-line pt-5">
            <p className="font-bold mb-1">Wejście testowe (tylko lokalnie)</p>
            <p className="text-sm text-muted mb-3">Bez Google – do sprawdzania stron jako różne role.</p>
            <div className="flex flex-col gap-2">
              {Object.entries(ROLE).map(([klucz, nazwa]) => (
                <button
                  key={klucz}
                  onClick={() => { zalogujDemo(klucz); navigate(powrot, { replace: true }) }}
                  className="min-h-11 rounded-lg border-2 border-line font-bold hover:bg-ground"
                >
                  Wejdź jako: {nazwa}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-muted">
          Jesteś pracownikiem gminy lub powiatu? Zaloguj się, a potem poproś o rolę urzędnika JST —
          zatwierdza ją koordynator ROPS.
        </p>
      </div>
    </main>
  )
}
