// Wypełniony wniosek jako PDF. Gdy nabór ma wzór ROPS z odczytanym układem – wypełniamy oryginał (wypelnijWzor.js),
// w przeciwnym razie składamy wniosek od zera (pdfmake z czcionką Roboto, polskie znaki działają).
// Biblioteka ładuje się dopiero przy pierwszym PDF-ie, żeby nie spowalniać reszty strony.

import { canvaJakoTekst } from './asystent.js'
import { daSieWypelnic, wypelnijWzor } from './wypelnijWzor.js'

const STATUS = { podglad: 'Podgląd – jeszcze niezłożony', szkic: 'Szkic (niezłożony)', zlozony: 'Złożony – czeka na ocenę', przyjety: 'Wybrany w naborze', odrzucony: 'Niewybrany' }
const data = (d) => (d ? new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')

let pdfMake = null
async function biblioteka() {
  if (!pdfMake) {
    const [{ default: pm }, { default: vfs }] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')])
    pm.addVirtualFileSystem(vfs)
    pdfMake = pm
  }
  return pdfMake
}

export const nazwaPliku = (w) => `wniosek-${(w.tytul || w.id).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`

// w – wniosek (pola, canva, autor, status, daty), n – nabór (nazwa, termin, pola)
export function definicjaPdf(w, n) {
  const metryka = [
    ['Nabór', n?.nazwa || '—'],
    ['Tytuł pomysłu', w.tytul || '—'],
    ['Wnioskodawca', w.autor || '—'],
    ['Status', STATUS[w.status] || w.status],
    ['Data złożenia', data(w.zlozono)],
    ['Termin naboru', data(n?.termin)],
    ['Numer wniosku', w.id],
  ]
  const canva = Object.entries(canvaJakoTekst(w.canva || {}))

  return {
    pageSize: 'A4',
    pageMargins: [50, 60, 50, 60],
    info: { title: `Wniosek – ${w.tytul}`, author: w.autor, subject: n?.nazwa },
    defaultStyle: { font: 'Roboto', fontSize: 10.5, lineHeight: 1.3 },
    ...(w.status === 'szkic' && { watermark: { text: 'SZKIC', opacity: 0.08, bold: true } }),
    header: { text: 'Małopolski Splot · Regionalny Ośrodek Polityki Społecznej w Krakowie', fontSize: 8, color: '#4A5568', margin: [50, 25, 50, 0] },
    footer: (strona, wszystkie) => ({
      columns: [
        { text: `Wygenerowano ${data(new Date())}`, fontSize: 8, color: '#4A5568' },
        { text: `Strona ${strona} z ${wszystkie}`, fontSize: 8, color: '#4A5568', alignment: 'right' },
      ],
      margin: [50, 20, 50, 0],
    }),
    content: [
      { text: 'WNIOSEK', fontSize: 20, bold: true, color: '#14213D' },
      { text: `do naboru „${n?.nazwa || ''}”`, fontSize: 12, margin: [0, 2, 0, 14] },
      {
        table: { widths: [120, '*'], body: metryka.map(([k, v]) => [{ text: k, bold: true, fillColor: '#F5F7FA' }, v]) },
        layout: { hLineColor: '#D8DEE7', vLineColor: '#D8DEE7', paddingTop: () => 4, paddingBottom: () => 4 },
        margin: [0, 0, 0, 18],
      },
      ...(n?.pola || []).flatMap((p, i) => [
        { text: `${i + 1}. ${p.etykieta}`, bold: true, fontSize: 12, color: '#14213D', margin: [0, 8, 0, p.opis ? 1 : 4], headlineLevel: 1 },
        ...(p.opis ? [{ text: p.opis, fontSize: 8.5, italics: true, color: '#4A5568', margin: [0, 0, 0, 4] }] : []),
        {
          table: { widths: ['*'], body: [[{ text: (w.pola?.[p.id] || '').trim() || '— nie wypełniono —', color: (w.pola?.[p.id] || '').trim() ? '#000' : '#4A5568' }]] },
          layout: { hLineColor: '#B8C2D0', vLineColor: '#B8C2D0', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6 },
        },
        { text: `${(w.pola?.[p.id] || '').length} / ${p.limit} znaków`, fontSize: 8, color: '#4A5568', alignment: 'right', margin: [0, 2, 0, 0] },
      ]),
      ...(canva.length ? [
        { text: 'Załącznik: Canva innowacji', bold: true, fontSize: 14, color: '#14213D', pageBreak: 'before', margin: [0, 0, 0, 8] },
        {
          table: { widths: [170, '*'], headerRows: 0, body: canva.map(([k, v]) => [{ text: k, bold: true, fillColor: '#F5F7FA' }, v]) },
          layout: { hLineColor: '#D8DEE7', vLineColor: '#D8DEE7', paddingTop: () => 3, paddingBottom: () => 3 },
        },
      ] : []),
    ],
    // nagłówek pola nie zostaje sam na dole strony
    pageBreakBefore: (wezel, nastepne) => wezel.headlineLevel === 1 && nastepne.length === 0,
  }
}

// Nabór z odczytanym wzorem ROPS → wypełniony ORYGINALNY wzór; bez wzoru – wniosek złożony od zera (pdfmake)
export async function wniosekPdf(w, n) {
  if (daSieWypelnic(n)) {
    const stopka = `Małopolski Splot · wniosek ${w.id} · ${w.autor || ''} · ${STATUS[w.status] || w.status}${w.zlozono ? ' ' + data(w.zlozono) : ''}`
    return wypelnijWzor(w, n, { stopka })
  }
  const pm = await biblioteka()
  return pm.createPdf(definicjaPdf(w, n)).getBlob()
}
