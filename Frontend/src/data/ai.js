// Klient serwisu AI (Backend/ai-service): Biblioteka Innowacji ROPS, Obserwator, Middleman.
// Adres w .env.local: VITE_AI_URL=http://localhost:8000. Bez niego te funkcje pokazują komunikat.

const AI = (import.meta.env.VITE_AI_URL || '').replace(/\/$/, '')
export const aiDostepne = Boolean(AI)
export const BRAK_AI = 'Ta funkcja wymaga serwisu AI – ustaw VITE_AI_URL w pliku .env.local i uruchom Backend/ai-service.'

// zapytaj('POST', '/middleman/plan', {…}) → JSON; błąd → Error z komunikatem serwera (po polsku)
export async function zapytaj(metoda, sciezka, cialo) {
  if (!AI) throw new Error(BRAK_AI)
  let odp
  try {
    odp = await fetch(AI + sciezka, {
      method: metoda,
      headers: cialo ? { 'Content-Type': 'application/json' } : {},
      body: cialo ? JSON.stringify(cialo) : undefined,
    })
  } catch {
    throw new Error('Nie udało się połączyć z serwisem AI. Sprawdź, czy działa.')
  }
  if (!odp.ok) {
    let tekst = `Błąd serwisu AI (${odp.status})`
    try {
      const d = await odp.json()
      tekst = typeof d.detail === 'string' ? d.detail : (d.detail || []).map((x) => `${x.loc?.slice(-1)[0]}: ${x.msg}`).join('; ') || tekst
    } catch { /* odpowiedź bez JSON */ }
    throw new Error(tekst)
  }
  return odp.json()
}

// Innowacja z Biblioteki ROPS (id = "kategoria/slug") → kształt karty KartaBiblioteki
export const zBibliotekiROPS = (i) => ({
  id: i.id, tytul: i.title, opis: i.summary || i.description, kategoria: i.category, url: i.url, rops: true,
})
