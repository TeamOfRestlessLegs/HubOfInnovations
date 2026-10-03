// Prosty matchmaking na słowach kluczowych – działa bez backendu.
// Docelowo podmieniacie ciało funkcji na:
//   const r = await fetch('/api/match', { method: 'POST', body: JSON.stringify({ opis }) })
// i zwracacie wynik z serwisu AI w tym samym kształcie.

// Polskie słowa mają różne końcówki (dojechać / dojazd), więc porównujemy początki słów.
const rdzen = (s) => s.slice(0, 5)

function slowaZTekstu(tekst) {
  return tekst
    .toLowerCase()
    .split(/[^a-ząćęłńóśźż-]+/)
    .filter((s) => s.length > 3)
}

export function dopasuj(opis, lista) {
  const rdzenie = slowaZTekstu(opis).map(rdzen)

  return lista
    .map((i) => {
      // które słowa kluczowe innowacji pojawiły się w opisie
      const wspolne = i.slowa.filter((s) => rdzenie.includes(rdzen(s)))
      return { ...i, wspolne }
    })
    .filter((i) => i.wspolne.length > 0)
    .sort((a, b) => b.wspolne.length - a.wspolne.length)
}

// Etykieta słowna zamiast procentów – łatwiej zrozumieć mieszkańcom i jury
export function stopienPodobienstwa(liczba) {
  if (liczba >= 3) return 'Bardzo podobne'
  if (liczba === 2) return 'Podobne'
  return 'Częściowo podobne'
}

// Tematy, które "zrozumiał" system – unikalne wspólne słowa z wyników
export function rozpoznaneTematy(wyniki) {
  return [...new Set(wyniki.flatMap((w) => w.wspolne))].slice(0, 6)
}
