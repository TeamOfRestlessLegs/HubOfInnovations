import { useAuth } from '../auth/AuthContext.jsx'
import PanelMieszkanca from '../panele/PanelMieszkanca.jsx'
import PanelROPS from '../panele/PanelROPS.jsx'

// /panel – dwie role: użytkownik (Moje sprawy) i ROPS = administrator (Panel ROPS)
export default function Panel() {
  const { uzytkownik } = useAuth()
  return uzytkownik.rola === 'rops_admin' ? <PanelROPS /> : <PanelMieszkanca />
}
