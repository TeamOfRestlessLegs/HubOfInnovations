import { useEffect, useRef, useState } from 'react'

// Dyktowanie (speech-to-text) przez wbudowane w przeglądarkę Web Speech API – bez backendu.
// Działa w Chrome, Edge i Safari; w przeglądarkach bez wsparcia (np. Firefox) przycisk się nie pokazuje.
// Uwaga: Chrome przesyła nagranie do rozpoznania na serwery Google.
const Rozpoznawanie = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
export const mowaDostepna = !!Rozpoznawanie

// onTekst(tekst) – wywoływane z każdym rozpoznanym fragmentem (dopisujemy go do pola)
export default function PrzyciskMowy({ onTekst, className = '' }) {
  const [slucha, setSlucha] = useState(false)
  const [podglad, setPodglad] = useState('')
  const [blad, setBlad] = useState('')
  const rec = useRef(null)
  const onTekstRef = useRef(onTekst)
  useEffect(() => { onTekstRef.current = onTekst }, [onTekst])

  useEffect(() => () => rec.current?.abort(), [])

  if (!Rozpoznawanie) return null

  const start = () => {
    setBlad('')
    const r = new Rozpoznawanie()
    r.lang = 'pl-PL'
    r.interimResults = true // podgląd na żywo
    r.continuous = true // słucha do kliknięcia „Zakończ” albo dłuższej ciszy
    r.onresult = (e) => {
      let tymczasowy = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) onTekstRef.current(t.trim())
        else tymczasowy += t
      }
      setPodglad(tymczasowy)
    }
    r.onerror = (e) => {
      setBlad(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'Brak dostępu do mikrofonu – zezwól na niego w ustawieniach przeglądarki.'
        : e.error === 'no-speech' ? 'Nic nie usłyszeliśmy – spróbuj jeszcze raz.' : 'Nie udało się rozpoznać mowy.')
    }
    r.onend = () => { setSlucha(false); setPodglad('') }
    rec.current = r
    r.start()
    setSlucha(true)
  }
  const stop = () => rec.current?.stop()

  return (
    <div className={'flex flex-col gap-1 ' + className}>
      <button type="button" onClick={slucha ? stop : start} aria-pressed={slucha}
        className={'min-h-14 px-4 rounded-xl font-bold text-lg inline-flex items-center justify-center gap-2 border-2 ' + (slucha ? 'bg-[#9B1C1C] border-[#9B1C1C] text-white' : 'bg-white border-ink text-ink')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
        </svg>
        {slucha ? 'Zakończ' : 'Powiedz'}
      </button>
      <p aria-live="polite" className="text-sm min-h-5">
        {slucha && <span className="text-[#9B1C1C] font-bold">● Słucham… {podglad && <span className="font-normal text-ink">„{podglad}”</span>}</span>}
        {!slucha && blad && <span role="alert" className="text-[#9B1C1C] font-bold">{blad}</span>}
      </p>
    </div>
  )
}
