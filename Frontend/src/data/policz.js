// Zlicza powtórzenia i sortuje malejąco: ['a','b','a'] → [{nazwa:'a',liczba:2},{nazwa:'b',liczba:1}]
export function policz(lista) {
  const licznik = {}
  lista.forEach((x) => { licznik[x] = (licznik[x] || 0) + 1 })
  return Object.entries(licznik)
    .map(([nazwa, liczba]) => ({ nazwa, liczba }))
    .sort((a, b) => b.liczba - a.liczba)
}
