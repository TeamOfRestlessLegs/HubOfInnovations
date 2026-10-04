// Wypełnia ORYGINALNY wzór wniosku (PDF z naboru) treścią pól – tak, jak zrobiłby to wnioskodawca w Wordzie:
// odpowiedź trafia pod nagłówek / instrukcję pola (pustą ramkę ze wzoru zastępuje ramka o potrzebnej wysokości),
// a reszta strony przesuwa się w dół. Nadmiar przechodzi na stronę dodatkową z tym samym nagłówkiem i stopką
// (logotypy). Strony bez pól kopiujemy bez zmian, więc układ wzoru zostaje.
//
// Potrzebne dane naboru (z odczytu wzoru, Backend/ai-service → /asystent/wzor):
//   nabor.uklad[i]    = { szer, wys, gora, dol, ostatni, ciecia } – pas treści, koniec treści, miejsca cięcia (pt od góry)
//   nabor.pola[].miejsce = { page, y, y_end, x0, x1, box } – gdzie wpisać odpowiedź

const ROZMIAR = 10
const WIERSZ = 13.5
const MARGINES = 5          // wewnątrz ramki
const ODSTEP = 4            // nad i pod ramką wstawioną między tekst (gdy wzór nie miał ramki)
const WYMUSZONY_PODZIAL = 80 // tyle wolnego miejsca na dole strony wzoru = autor wstawił tam podział strony

let biblioteki = null
async function wczytajBiblioteki() {
  if (!biblioteki) {
    const [pdfLib, { default: fontkit }, { default: vfs }] = await Promise.all([
      import('pdf-lib'), import('@pdf-lib/fontkit'), import('pdfmake/build/vfs_fonts.js'),
    ])
    const bajty = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    biblioteki = { ...pdfLib, fontkit, czcionka: bajty(vfs['Roboto-Regular.ttf']), czcionkaB: bajty(vfs['Roboto-Medium.ttf']) }
  }
  return biblioteki
}

// Czy nabór ma wzór odczytany na tyle, żeby go wypełnić
export const daSieWypelnic = (n) => Boolean(n?.wzor?.url && n.uklad?.length && n.pola?.some((p) => p.miejsce))

// Dzieli tekst na wiersze o szerokości `szer` (słowa za długie – na kawałki)
function zawin(tekst, font, rozmiar, szer) {
  const wiersze = []
  for (const akapit of tekst.split(/\r?\n/)) {
    let wiersz = ''
    for (const slowo of akapit.split(/\s+/).filter(Boolean)) {
      const proba = wiersz ? wiersz + ' ' + slowo : slowo
      if (font.widthOfTextAtSize(proba, rozmiar) <= szer) { wiersz = proba; continue }
      if (wiersz) wiersze.push(wiersz)
      wiersz = slowo
      while (font.widthOfTextAtSize(wiersz, rozmiar) > szer) {
        let i = wiersz.length - 1
        while (i > 1 && font.widthOfTextAtSize(wiersz.slice(0, i), rozmiar) > szer) i--
        wiersze.push(wiersz.slice(0, i))
        wiersz = wiersz.slice(i)
      }
    }
    wiersze.push(wiersz)
  }
  return wiersze
}

// Czcionka Roboto nie ma kilku znaków typograficznych – zamieniamy je na proste odpowiedniki
const doDruku = (t) => t.replace(/[‐-‒]/g, '-').replace(/…/g, '...').replace(/[   ]/g, ' ').replace(/[^\S\n]+/g, ' ')

export async function wypelnijWzor(w, n, { stopka } = {}) {
  const { PDFDocument, rgb, fontkit, czcionka, czcionkaB, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } = await wczytajBiblioteki()
  const zrodlo = await PDFDocument.load(await (await fetch(n.wzor.url)).arrayBuffer(), { ignoreEncryption: true })
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(czcionka, { subset: true })
  const fontB = await doc.embedFont(czcionkaB, { subset: true })
  const czarny = rgb(0, 0, 0)
  const szary = rgb(0.35, 0.38, 0.45)

  const polaNaStronie = (i) => n.pola.filter((p) => p.miejsce?.page === i).sort((a, b) => a.miejsce.y - b.miejsce.y)
  const tekstPola = (p) => doDruku((w.pola?.[p.id] || '').trim()) || '—'

  // Wszystkie strony kopiujemy jednym wywołaniem – wspólne zasoby (logotypy, czcionki wzoru) trafiają do pliku raz
  const kopie = await doc.copyPages(zrodlo, zrodlo.getPageIndices())

  // Stan składania: bieżąca strona wyniku, kursor `y`, granica treści `limit`, górny pas `gora` tej strony.
  // `nadmiar` – bieżąca strona to strona dodatkowa (przelana treść); następna strona wzoru dopisuje się pod nią,
  // żeby nie zostawiać prawie pustych stron. Wymuszony podział strony we wzorze (duży biały margines na dole
  // poprzedniej strony, np. przed „Oświadczeniami”) zostaje.
  let biezaca = null
  let y = 0
  let limit = 0
  let poczatek = 0
  let nadmiar = false

  for (let i = 0; i < kopie.length; i++) {
    const u = n.uklad[i]
    const pola = polaNaStronie(i)
    const poprz = n.uklad[i - 1]
    const wymuszona = !poprz || poprz.dol - (poprz.ostatni ?? poprz.dol) > WYMUSZONY_PODZIAL
    const dopisz = nadmiar && !wymuszona && u
    if (!dopisz && (!pola.length || !u)) {
      doc.addPage(kopie[i])                   // strona bez pól i bez przesunięć – bez zmian
      nadmiar = false
      continue
    }
    const { szer: W, wys: H, gora, dol, ciecia } = u
    // Cała strona osadzona RAZ; każdy kawałek to ta sama strona narysowana z przycięciem (clip) do paska [a, b]
    // – plik nie puchnie od kopii treści i logotypów
    const strona = await doc.embedPage(kopie[i])
    const rysuj = (a, b, gdzie) => {          // pasek [a, b] oryginału (pt od góry) w miejscu `gdzie` strony wyniku
      biezaca.pushOperators(pushGraphicsState(), rectangle(0, H - gdzie - (b - a), W, b - a), clip(), endPath())
      biezaca.drawPage(strona, { x: 0, y: a - gdzie })
      biezaca.pushOperators(popGraphicsState())
    }
    // Nowa strona z nagłówkiem i stopką tej strony wzoru
    const nowaStrona = (dodatkowa) => {
      biezaca = doc.addPage([W, H])
      rysuj(0, gora, 0)
      rysuj(dol, H, dol)
      y = poczatek = gora
      limit = dol
      nadmiar = dodatkowa
    }
    if (!dopisz) nowaStrona(false)

    // Kawałek oryginalnej strony [a, b] (pt od góry) – w miejscu kursora, tnąc tylko między wierszami
    const wstawWycinek = (a, b) => {
      while (b - a > 0.5) {
        const miejsce = limit - y
        if (b - a <= miejsce) {
          rysuj(a, b, y)
          y += b - a
          return
        }
        let c = Math.max(...ciecia.filter((x) => x > a + 1 && x <= a + miejsce), -Infinity)
        if (!Number.isFinite(c)) {
          if (y > poczatek + 1) { nowaStrona(true); continue }
          c = a + miejsce                    // nawet pusta strona nie mieści – tniemy na siłę
        }
        rysuj(a, c, y)
        a = c
        nowaStrona(true)
      }
    }

    // Ramka z odpowiedzią (jak komórka tabeli w Wordzie); dzieli się między strony
    const wstawOdpowiedz = (p) => {
      const { x0, x1, box } = p.miejsce
      const wiersze = zawin(tekstPola(p), font, ROZMIAR, x1 - x0 - 2 * MARGINES)
      if (!box) y += ODSTEP
      let k = 0
      while (k < wiersze.length) {
        let mieszczy = Math.floor((limit - y - 2 * MARGINES) / WIERSZ)
        if (mieszczy < 1) { nowaStrona(true); mieszczy = Math.floor((limit - y - 2 * MARGINES) / WIERSZ) }
        const ile = Math.min(mieszczy, wiersze.length - k)
        const wys = ile * WIERSZ + 2 * MARGINES
        biezaca.drawRectangle({ x: x0, y: H - y - wys, width: x1 - x0, height: wys, borderColor: czarny, borderWidth: 0.6 })
        wiersze.slice(k, k + ile).forEach((t, j) => {
          biezaca.drawText(t, { x: x0 + MARGINES, y: H - y - MARGINES - (j + 1) * WIERSZ + 3.5, size: ROZMIAR, font, color: czarny })
        })
        y += wys
        k += ile
        if (k < wiersze.length) nowaStrona(true)
      }
      if (!box) y += ODSTEP
    }

    let od = gora
    for (const p of pola) {
      wstawWycinek(od, Math.max(od, p.miejsce.y))
      wstawOdpowiedz(p)
      od = Math.max(od, p.miejsce.y_end)
    }
    // do końca treści strony – sam biały margines nie przechodzi na nową stronę
    wstawWycinek(od, Math.min(dol, (u.ostatni ?? dol) + 3))
  }

  // Pola, których miejsca nie znaleźliśmy we wzorze – na końcu, żeby nic nie zginęło
  const bezMiejsca = n.pola.filter((p) => !p.miejsce && (w.pola?.[p.id] || '').trim())
  if (bezMiejsca.length) {
    let strona = doc.addPage([595.28, 841.89])
    let y = 60
    strona.drawText('Uzupełnienie wniosku – pola bez miejsca we wzorze', { x: 56, y: 841.89 - y, size: 12, font: fontB })
    y += 24
    for (const p of bezMiejsca) {
      for (const [t, f] of [...zawin(doDruku(p.etykieta), fontB, 11, 483).map((t) => [t, fontB]), ...zawin(tekstPola(p), font, ROZMIAR, 483).map((t) => [t, font])]) {
        if (y > 800) { strona = doc.addPage([595.28, 841.89]); y = 60 }
        strona.drawText(t, { x: 56, y: 841.89 - y, size: f === fontB ? 11 : ROZMIAR, font: f })
        y += WIERSZ
      }
      y += 10
    }
  }

  // Dopisek platformy w górnym marginesie pierwszej strony (kto, kiedy, nr wniosku)
  if (stopka) doc.getPage(0).drawText(doDruku(stopka), { x: 30, y: doc.getPage(0).getHeight() - 10, size: 6.5, font, color: szary })
  doc.setTitle(`Wniosek – ${w.tytul || ''}`)
  doc.setProducer('Małopolski Splot')
  return new Blob([await doc.save()], { type: 'application/pdf' })
}
