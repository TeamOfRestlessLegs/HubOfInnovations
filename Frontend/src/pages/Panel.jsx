import { useAuth } from '../auth/AuthContext.jsx'
import PanelMieszkanca from '../panele/PanelMieszkanca.jsx'
import PanelJST from '../panele/PanelJST.jsx'
import PanelEksperta from '../panele/PanelEksperta.jsx'
import PanelROPS from '../panele/PanelROPS.jsx'

// /panel – osobny panel dla każdej roli
const PANELE = { resident: PanelMieszkanca, jst: PanelJST, ekspert: PanelEksperta, rops_admin: PanelROPS }

export default function Panel() {
  const { uzytkownik } = useAuth()
  const Widok = PANELE[uzytkownik.rola] || PanelMieszkanca
  return <Widok />
}
