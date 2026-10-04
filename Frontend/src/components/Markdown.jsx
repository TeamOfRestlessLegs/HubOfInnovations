// Prosty i bezpieczny podgląd markdownu z opisu innowacji (nagłówki, listy, cytaty, akapity).
// Bez dangerouslySetInnerHTML – wszystko renderujemy jako zwykły tekst w elementach Reacta.
export default function Markdown({ tekst = '' }) {
  const bloki = []
  let lista = null
  let akapit = []
  const zamknijAkapit = () => { if (akapit.length) { bloki.push({ typ: 'p', tekst: akapit.join(' ') }); akapit = [] } }
  const zamknijListe = () => { if (lista) { bloki.push({ typ: 'ul', elementy: lista }); lista = null } }

  for (const surowa of tekst.split('\n')) {
    const l = surowa.trim()
    const naglowek = l.match(/^#{1,6}\s+(.*)/)
    const punkt = l.match(/^[*-]\s+(.*)/)
    if (!l) { zamknijAkapit(); zamknijListe() }
    else if (naglowek) { zamknijAkapit(); zamknijListe(); bloki.push({ typ: 'h', tekst: naglowek[1].replace(/^\d+\.\s*/, '') }) }
    else if (punkt) { zamknijAkapit(); (lista ||= []).push(punkt[1]) }
    else if (l.startsWith('>')) { zamknijAkapit(); zamknijListe(); bloki.push({ typ: 'q', tekst: l.replace(/^>\s?/, '') }) }
    else { zamknijListe(); akapit.push(l) }
  }
  zamknijAkapit(); zamknijListe()

  return (
    <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
      {bloki.map((b, i) => {
        if (b.typ === 'h') return <h4 key={i} className="font-display font-bold text-lg mt-2">{b.tekst}</h4>
        if (b.typ === 'ul') return <ul key={i} className="list-disc pl-5 flex flex-col gap-1">{b.elementy.map((e, j) => <li key={j}>{e}</li>)}</ul>
        if (b.typ === 'q') return <blockquote key={i} className="border-l-4 border-line pl-3 text-muted">{b.tekst}</blockquote>
        return <p key={i}>{b.tekst}</p>
      })}
    </div>
  )
}
