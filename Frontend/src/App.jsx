import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import WymagaLogowania from './auth/WymagaLogowania.jsx'
import Home from './pages/Home.jsx'
import Matchmaking from './pages/Matchmaking.jsx'
import Innowacje from './pages/Innowacje.jsx'
import Kreator from './pages/Kreator.jsx'
import Zasobnik from './pages/Zasobnik.jsx'
import ZasobnikObszar from './pages/ZasobnikObszar.jsx'
import Wniosek from './pages/Wniosek.jsx'
import Logowanie from './pages/Logowanie.jsx'
import Tester from './pages/Tester.jsx'
import Pomysl from './pages/Pomysl.jsx'
import Panel from './pages/Panel.jsx'
import Wdrozenie from './pages/Wdrozenie.jsx'
import BazaWiedzy from './pages/BazaWiedzy.jsx'
import BazaWiedzyInnowacja from './pages/BazaWiedzyInnowacja.jsx'

// Lista stron. Nowa strona = nowy plik w pages/ + jedna linijka tutaj.
// Strony, które coś zapisują (kreator, panel, wniosek), wymagają logowania.
export default function App() {
  return (
    <>
      <Header />
      <div id="tresc" tabIndex={-1} className="outline-none">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/szukaj" element={<Matchmaking />} />
        <Route path="/innowacje" element={<Innowacje />} />
        <Route path="/baza-wiedzy" element={<BazaWiedzy />} />
        <Route path="/baza-wiedzy/:id" element={<BazaWiedzyInnowacja />} />
        <Route path="/baza-wiedzy/:kategoria/:slug" element={<BazaWiedzyInnowacja />} />
        <Route path="/zasobnik" element={<Zasobnik />} />
        <Route path="/zasobnik/:id" element={<ZasobnikObszar />} />
        <Route path="/logowanie" element={<Logowanie />} />
        <Route path="/kreator" element={<WymagaLogowania><Kreator /></WymagaLogowania>} />
        <Route path="/panel" element={<WymagaLogowania><Panel /></WymagaLogowania>} />
        <Route path="/wniosek/:fiszkaId/:naborId" element={<WymagaLogowania><Wniosek /></WymagaLogowania>} />
        <Route path="/tester" element={<Tester />} />
        <Route path="/pomysl/:id" element={<Pomysl />} />
        <Route path="/wdrozenie/:id" element={<WymagaLogowania><Wdrozenie /></WymagaLogowania>} />
      </Routes>
      </div>
    </>
  )
}
