import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useDane, idWdrozenia, STATUSY_WDROZENIA } from '../data/DaneContext.jsx'

// Dla gminy (JST): „Zapisz” odkłada innowację / pomysł na listę „Do wdrożenia” w Panelu gminy,
// „Dopasuj do naszej gminy” otwiera Middlemana (plan wdrożenia pod budżet i ludzi gminy).
// zasob: { typ: 'biblioteka' | 'fiszka', id, tytul }
export default function AkcjeWdrozenia({ zasob, kompaktowo = false }) {
  const { uzytkownik: ja } = useAuth()
  const { wdrozenia, zapiszDoWdrozenia } = useDane()
  const navigate = useNavigate()
  if (ja?.rola !== 'jst') return null

  const id = idWdrozenia(ja.id, zasob)
  const zapisane = wdrozenia.find((w) => w.id === id)
  const przycisk = 'min-h-11 px-4 inline-flex items-center rounded-lg font-bold no-underline '

  return (
    <div className={'flex flex-wrap items-center gap-2 ' + (kompaktowo ? '' : 'w-full')}>
      {zapisane ? (
        <Link to="/panel" className={przycisk + 'border-2 border-line text-ink'}>
          ✓ {STATUSY_WDROZENIA[zapisane.status].nazwa}<span className="sr-only"> – w Panelu gminy</span>
        </Link>
      ) : (
        <button type="button" onClick={() => zapiszDoWdrozenia(zasob)} className={przycisk + 'border-2 border-ink text-ink'}>
          Zapisz<span className="sr-only">: {zasob.tytul}</span>
        </button>
      )}
      <button type="button" onClick={() => navigate('/wdrozenie/' + zapiszDoWdrozenia(zasob))} className={przycisk + 'bg-clay text-white'}>
        {zapisane?.plan ? 'Plan wdrożenia' : 'Dopasuj do naszej gminy'}
      </button>
    </div>
  )
}
