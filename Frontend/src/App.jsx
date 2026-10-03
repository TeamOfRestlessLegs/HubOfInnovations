import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import WymagaLogowania from './auth/WymagaLogowania.jsx'
import Home from './pages/Home.jsx'
import Matchmaking from './pages/Matchmaking.jsx'
import Innowacje from './pages/Innowacje.jsx'
import Kreator from './pages/Kreator.jsx'
import Canva from './pages/Canva.jsx'
import Zasobnik from './pages/Zasobnik.jsx'
import Logowanie from './pages/Logowanie.jsx'

// Lista stron. Nowa strona = nowy plik w pages/ + jedna linijka tutaj.
// Strony, które coś zapisują (kreator, canva), wymagają logowania.
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/szukaj" element={<Matchmaking />} />
        <Route path="/innowacje" element={<Innowacje />} />
        <Route path="/zasobnik" element={<Zasobnik />} />
        <Route path="/logowanie" element={<Logowanie />} />
        <Route path="/kreator" element={<WymagaLogowania><Kreator /></WymagaLogowania>} />
        <Route path="/canva" element={<WymagaLogowania><Canva /></WymagaLogowania>} />
      </Routes>
    </>
  )
}
