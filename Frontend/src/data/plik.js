// Wczytanie PDF w trybie demo. Docelowo plik idzie do backendu:
// POST /api/nabory/{id}/wzor (multipart/form-data) → { nazwa, url }
export const MAKS_PDF = 2 * 1024 * 1024 // limit localStorage w demo

export function wczytajPdf(plik) {
  return new Promise((ok, blad) => {
    if (!plik) return blad(new Error('Nie wybrano pliku.'))
    if (plik.type !== 'application/pdf') return blad(new Error('To nie jest plik PDF.'))
    if (plik.size > MAKS_PDF) return blad(new Error('W wersji demo plik może mieć maks. 2 MB.'))
    const r = new FileReader()
    r.onload = () => ok({ nazwa: plik.name, url: r.result, rozmiar: plik.size })
    r.onerror = () => blad(new Error('Nie udało się wczytać pliku.'))
    r.readAsDataURL(plik)
  })
}
