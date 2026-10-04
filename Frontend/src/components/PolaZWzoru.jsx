import { useEffect, useRef, useState } from 'react'
import { aiDostepne, BRAK_AI } from '../data/ai.js'
import { odczytajWzor, zrodlaPola } from '../data/asystent.js'
import { DOMYSLNE_POLA } from '../data/nabory.js'

// ROPS: pola wniosku i pytania naboru odczytane z wgranego wzoru (PDF) – do sprawdzenia i poprawienia.
// `wartosc` = { pola, pytania } albo null (domyślny szablon). Po wgraniu nowego wzoru odczyt rusza sam
// (wzór, który już był przy otwarciu panelu, czytamy dopiero na kliknięcie).
export default function PolaZWzoru({ wzor, nabor, wartosc, onZmiana }) {
  const [stan, setStan] = useState({ pracuje: false, blad: '', uwagi: [] })
  const odczytany = useRef(wzor?.url || null)

  const odczytaj = async () => {
    odczytany.current = wzor.url
    setStan({ pracuje: true, blad: '', uwagi: [] })
    try {
      const { pola, pytania, uklad, uwagi } = await odczytajWzor(wzor, nabor)
      onZmiana({ pola, pytania, uklad })
      setStan({ pracuje: false, blad: '', uwagi })
    } catch (e) {
      setStan({ pracuje: false, blad: e.message, uwagi: [] })
    }
  }

  useEffect(() => {
    if (wzor && aiDostepne && odczytany.current !== wzor.url) odczytaj()
  }, [wzor?.url]) // eslint-disable-line react-hooks/exhaustive-deps

  const pola = wartosc?.pola || DOMYSLNE_POLA
  const pytania = wartosc?.pytania || []
  const uklad = wartosc?.uklad || null
  // uklad (strony wzoru) jedzie razem z polami – bez niego wniosek nie wypełni oryginalnego PDF
  const zmien = (z) => onZmiana({ pola, pytania, uklad, ...z })
  const zmienPole = (i, zmiany) => zmien({ pola: pola.map((p, j) => (j === i ? { ...p, ...zmiany } : p)) })
  const usunPole = (i) => zmien({ pola: pola.filter((_, j) => j !== i) })
  // Nowe, puste pytanie podpięte pod pole i
  const dodajPytanie = (i) => {
    const id = 'q' + Date.now().toString(36)
    zmien({ pola: pola.map((p, j) => (j === i ? { ...p, pytania: [...(p.pytania || []), id] } : p)), pytania: [...pytania, { id, tresc: '', podpowiedz: '' }] })
  }
  const zmienPytanie = (i, zmiany) => zmien({ pytania: pytania.map((q, j) => (j === i ? { ...q, ...zmiany } : q)) })
  const usunPytanie = (i) => {
    const id = pytania[i].id
    zmien({ pola: pola.map((p) => ({ ...p, pytania: (p.pytania || []).filter((x) => x !== id) })), pytania: pytania.filter((_, j) => j !== i) })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-ground p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">Pola wniosku {wartosc ? '– odczytane ze wzoru' : '– domyślny szablon'}</p>
          <p className="text-[15px] text-muted">
            {wartosc ? 'Sprawdź pola i pytania, o które dopytamy wnioskodawcę. Możesz je poprawić albo usunąć.' : 'Wgraj wzór wniosku (PDF), a asystent odczyta z niego pola i to, o co trzeba dopytać.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wzor && (
            <button type="button" onClick={odczytaj} disabled={!aiDostepne || stan.pracuje} className="min-h-11 px-4 rounded-lg border-2 border-teal text-teal-dark font-bold bg-white disabled:opacity-50">
              {stan.pracuje ? 'Odczytujemy wzór…' : wartosc ? 'Odczytaj ponownie' : 'Odczytaj pola ze wzoru'}
            </button>
          )}
          {wartosc && <button type="button" onClick={() => onZmiana(null)} className="min-h-11 px-4 rounded-lg border-2 border-line font-bold bg-white">Użyj domyślnego szablonu</button>}
        </div>
      </div>
      {!aiDostepne && wzor && <p className="text-[15px] text-muted">{BRAK_AI}</p>}
      {stan.pracuje && <p role="status" className="font-bold text-teal-dark">Asystent czyta wzór wniosku – to może potrwać do minuty…</p>}
      {stan.blad && <p role="alert" className="text-[#9B1C1C] font-bold">{stan.blad}</p>}

      <ol className="flex flex-col gap-3">
        {pola.map((p, i) => (
          <li key={p.id} className="bg-white rounded-xl border border-line p-3.5 flex flex-col gap-2">
            {wartosc ? (
              <>
                <div className="flex flex-wrap gap-2 items-end">
                  <label className="flex-[1_1_260px] flex flex-col gap-1 text-sm font-bold">
                    {i + 1}. Nazwa pola
                    <input value={p.etykieta} onChange={(e) => zmienPole(i, { etykieta: e.target.value })} className="min-h-10 px-3 rounded-lg border border-[#B8C2D0] font-normal text-base" />
                  </label>
                  <label className="w-32 flex flex-col gap-1 text-sm font-bold">
                    Limit znaków
                    <input type="number" min={100} max={10000} value={p.limit} onChange={(e) => zmienPole(i, { limit: e.target.value === '' ? '' : Number(e.target.value) })}
                      onBlur={() => zmienPole(i, { limit: Math.max(100, Math.min(10000, Number(p.limit) || 1500)) })} className="min-h-10 px-3 rounded-lg border border-[#B8C2D0] font-normal text-base" />
                  </label>
                  <button type="button" onClick={() => usunPole(i)} disabled={pola.length === 1} className="min-h-10 px-3 font-bold text-[#9B1C1C] disabled:opacity-40">Usuń</button>
                </div>
                <label className="flex flex-col gap-1 text-sm font-bold">
                  Co trzeba napisać (wskazówka dla wnioskodawcy)
                  <textarea rows={2} value={p.opis || ''} onChange={(e) => zmienPole(i, { opis: e.target.value })} className="p-2.5 rounded-lg border border-[#B8C2D0] font-normal text-[15px]" />
                </label>
              </>
            ) : (
              <p className="font-bold">{i + 1}. {p.etykieta} <span className="font-normal text-muted text-sm">· do {p.limit} znaków</span></p>
            )}
            {wartosc && uklad && (
              <p className={'text-sm ' + (p.miejsce ? 'text-muted' : 'text-clay-dark font-bold')}>
                {p.miejsce ? `Odpowiedź trafi do wzoru na str. ${p.miejsce.page + 1}${p.miejsce.box ? ' (w ramkę ze wzoru)' : ' (pod instrukcją pola)'}.` : 'Nie znaleźliśmy tego pola we wzorze – odpowiedź trafi na stronę dodatkową na końcu wniosku.'}
              </p>
            )}
            {(zrodlaPola(p, { pytania }).length > 0 || wartosc) && (
              <ul aria-label="Na czym opiera się pole" className="flex flex-wrap items-center gap-1.5">
                {zrodlaPola(p, { pytania }).map((z) => <li key={z} className="px-2.5 py-1 rounded-full bg-teal-light text-teal-dark text-xs font-bold">{z}</li>)}
                {wartosc && (
                  <li><button type="button" onClick={() => dodajPytanie(i)} className="min-h-8 px-2.5 rounded-full border-2 border-dashed border-teal text-teal-dark text-xs font-bold">+ Dodaj pytanie do tego pola</button></li>
                )}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {wartosc && (
        <div className="flex flex-col gap-2">
          <p className="font-bold">Pytania, o które dopytamy wnioskodawcę ({pytania.length})</p>
          <p className="text-[15px] text-muted -mt-1">Tylko to, czego wzór wymaga, a czego nie ma w Canvie ani w fiszce.</p>
          {pytania.length === 0 && <p className="text-[15px] text-muted">Brak – Canva i fiszka wystarczą do wypełnienia wzoru.</p>}
          <ol className="flex flex-col gap-2">
            {pytania.map((q, i) => (
              <li key={q.id} className="bg-white rounded-xl border border-line p-3 flex flex-wrap gap-2 items-end">
                <label className="flex-[2_1_260px] flex flex-col gap-1 text-sm font-bold">
                  Pytanie <span className="font-normal text-muted">(do: {pola.filter((p) => (p.pytania || []).includes(q.id)).map((p) => p.etykieta).join(', ') || '—'})</span>
                  <input value={q.tresc} placeholder="Np. Co i kiedy zrobicie w kolejnych miesiącach?" onChange={(e) => zmienPytanie(i, { tresc: e.target.value })} className="min-h-10 px-3 rounded-lg border border-[#B8C2D0] font-normal text-base" />
                </label>
                <label className="flex-[1_1_200px] flex flex-col gap-1 text-sm font-bold">
                  Przykład odpowiedzi
                  <input value={q.podpowiedz || ''} onChange={(e) => zmienPytanie(i, { podpowiedz: e.target.value })} className="min-h-10 px-3 rounded-lg border border-[#B8C2D0] font-normal text-base" />
                </label>
                <button type="button" onClick={() => usunPytanie(i)} className="min-h-10 px-3 font-bold text-[#9B1C1C]">Usuń</button>
              </li>
            ))}
          </ol>
        </div>
      )}
      {stan.uwagi.length > 0 && (
        <details className="text-sm text-muted">
          <summary className="cursor-pointer font-bold">Uwagi z odczytu ({stan.uwagi.length})</summary>
          <ul className="list-disc pl-5 mt-1">{stan.uwagi.map((u) => <li key={u}>{u}</li>)}</ul>
        </details>
      )}
    </div>
  )
}
