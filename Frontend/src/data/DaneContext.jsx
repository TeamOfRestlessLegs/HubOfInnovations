import { createContext, useContext, useEffect, useState } from 'react'
import { bibliotekaStartowa } from './biblioteka.js'
import { fiszkiStartowe } from './fiszki.js'
import { naboryStartowe } from './nabory.js'
import { wnioskiStartowe } from './wnioskiStartowe.js'
import { testyStartowe, zgloszeniaTestowStartowe, opinieStartowe } from './tester.js'
import { useAuth, ROLE } from '../auth/AuthContext.jsx'
import { aktualnosciStartowe, komentarzeStartowe, pytaniaStartowe, obserwatorzy, prowadzi } from './watekFiszki.js'

// Wspólne dane aplikacji – dopóki nie ma backendu, trzymane w localStorage przeglądarki.
// Każda akcja odpowiada jednemu przyszłemu endpointowi API (komentarz obok).
//
// KOLEKCJE:
//   biblioteka  – innowacje ROPS (publiczne; edytuje tylko ROPS)
//   fiszki      – pomysły użytkowników; STATUS: do_weryfikacji | do_poprawy | opublikowana | zarchiwizowana
//   zgloszenia  – zapytania z wyszukiwarki (widzi tylko ROPS, zagregowane w trendach)
//   nabory      – konkursy grantowe tworzone przez ROPS
//   wnioski     – wnioski wygenerowane z fiszki do konkretnego naboru (widzi autor + ROPS)
//   watki       – rozmowy (przy fiszce, pytanie do ROPS/eksperta, wdrożenie dla JST); widzą tylko uczestnicy
//   powiadomienia – tworzone AUTOMATYCZNIE przy akcjach (docelowo backend: zdarzenie → powiadomienie + e-mail)
//   aktualnosci, komentarze, pytania – publiczny wątek pomysłu (/pomysl/:id)
//   wdrozenia   – innowacje i pomysły zapisane przez gminę (JST) + plan wdrożenia z Middlemana
//                 { id, gminaId, zasob: { typ: 'biblioteka' | 'fiszka', id, tytul }, status: zapisane | plan | w_realizacji,
//                   ograniczenia, communeId, plan, wersje[], wyslanoDoROPS }
//
// ADRESAT (watek.uczestnicy, powiadomienie.do): id użytkownika albo cała rola: 'rola:rops_admin', 'rola:ekspert'

// v3: Biblioteka ROPS osobno od fiszek, nabory i wnioski
const KLUCZ = 'splot-dane-v3'

const dni = (n) => new Date(Date.now() - n * 864e5).toISOString()
const zgloszeniaStartowe = [
  { tekst: '[przykład] Seniorzy nie mają jak dojechać do lekarza', powiat: 'myślenicki', data: dni(1) },
  { tekst: '[przykład] Babcia nie umie obsługiwać telefonu', powiat: 'myślenicki', data: dni(1) },
  { tekst: '[przykład] Brak autobusu do przychodni', powiat: 'limanowski', data: dni(2) },
  { tekst: '[przykład] Syn po szkole zamyka się w pokoju i nie chce rozmawiać', powiat: 'Kraków', data: dni(2) },
  { tekst: '[przykład] Młodzież nie ma gdzie się spotykać', powiat: 'wielicki', data: dni(3) },
  { tekst: '[przykład] Nie stać nas na opał na zimę', powiat: 'nowosądecki', data: dni(4) },
  { tekst: '[przykład] Dzieci z Ukrainy w klasie nie rozumieją lekcji', powiat: 'Kraków', data: dni(5) },
  { tekst: '[przykład] Seniorzy samotni w bloku', powiat: 'krakowski', data: dni(6) },
].map((z, i) => ({ id: 'z' + i, ...z }))

function stanStartowy() {
  return {
    biblioteka: bibliotekaStartowa,
    fiszki: fiszkiStartowe.map((f) => ({
      ...f, status: 'opublikowana', autorId: 'seed', autor: '[autor przykładowy]', prosbaOEtap: false, komentarzRops: '',
    })),
    zgloszenia: zgloszeniaStartowe,
    nabory: naboryStartowe,
    wnioski: wnioskiStartowe,
    watki: watkiStartowe,
    powiadomienia: [],
    aktualnosci: aktualnosciStartowe,
    komentarze: komentarzeStartowe,
    pytania: pytaniaStartowe,
    wdrozenia: [],
  }
}

// Id wdrożenia: jedna gmina × jeden zasób (np. "wd-demo-jst-biblioteka-dla-seniorow--mobilny-sasiad")
export const idWdrozenia = (gminaId, zasob) => `wd-${gminaId}-${zasob.typ}-${String(zasob.id).replace(/\//g, '--')}`
export const STATUSY_WDROZENIA = {
  zapisane: { nazwa: 'Zapisane', klasa: 'bg-[#E6EAF0] text-ink' },
  plan: { nazwa: 'Plan gotowy', klasa: 'bg-teal-light text-teal-dark' },
  w_realizacji: { nazwa: 'Wdrażamy', klasa: 'bg-clay-light text-clay-dark' },
}

const watkiStartowe = [
  {
    id: 'pytanie-start',
    typ: 'pytanie',
    temat: '[Przykład] Jak zmierzyć efekty klubu dla samotnych seniorów?',
    uczestnicy: ['seed', 'rola:rops_admin', 'rola:ekspert'],
    wiadomosci: [
      { id: 'm0', autorId: 'seed', autor: '[mieszkanka przykładowa]', rola: 'resident', tresc: 'Prowadzimy klub w świetlicy od 3 miesięcy. Chcemy złożyć wniosek, ale nie wiemy, jak pokazać, że seniorom jest mniej samotnie. Czy jest jakaś prosta ankieta?', data: dni(1) },
    ],
    czytali: {},
    utworzono: dni(1),
    zmieniono: dni(1),
  },
]

// Przykładowe nabory / wnioski: brakujące dodajemy, a nowszą `wersję` przykładu podmieniamy (status naboru zostaje)
function zPrzykladami(zapisane, startowe) {
  if (!zapisane) return startowe
  const przyklady = startowe.map((s) => {
    const z = zapisane.find((x) => x.id === s.id)
    if (!z) return s
    return (z.wersja || 0) < (s.wersja || 0) ? { ...s, ...(z.status && { status: z.status }) } : z
  })
  return [...przyklady, ...zapisane.filter((z) => !startowe.some((s) => s.id === z.id))]
}

// Stare zapisy (sprzed nowych modułów) uzupełniamy brakującymi kolekcjami
function wczytaj() {
  try {
    const zapis = JSON.parse(localStorage.getItem(KLUCZ))
    if (!zapis) return stanStartowy()
    const start = stanStartowy()
    return { ...start, ...zapis, nabory: zPrzykladami(zapis.nabory, start.nabory), wnioski: zPrzykladami(zapis.wnioski, start.wnioski) }
  } catch {
    return stanStartowy()
  }
}

// Czy adresat (id albo 'rola:…') to ten użytkownik
export const doMnie = (adresat, u) => !!u && (adresat === u.id || adresat === 'rola:' + u.rola)
// Wątki, które widzi użytkownik
export const mojeWatki = (watki, u) => watki.filter((w) => w.uczestnicy.some((a) => doMnie(a, u)))
// Czy w wątku jest coś nowego od innych
export const nieprzeczytany = (w, u) => {
  const ostatnia = w.wiadomosci.at(-1)
  return !!ostatnia && ostatnia.autorId !== u.id && (!w.czytali[u.id] || w.czytali[u.id] < ostatnia.data)
}

const DaneContext = createContext(null)
const teraz = () => new Date().toISOString()

export function DaneProvider({ children }) {
  const [dane, setDane] = useState(wczytaj)
  const { uzytkownik: ja } = useAuth()

  // Każda zmiana danych zapisuje się w przeglądarce
  useEffect(() => {
    localStorage.setItem(KLUCZ, JSON.stringify(dane))
  }, [dane])

  // Pomocniki: zmienia / dodaje element kolekcji
  const zmien = (kolekcja, id, zmiany) =>
    setDane((d) => ({ ...d, [kolekcja]: d[kolekcja].map((x) => (x.id === id ? { ...x, ...zmiany } : x)) }))
  const dodaj = (kolekcja, element) =>
    setDane((d) => ({ ...d, [kolekcja]: [element, ...d[kolekcja]] }))

  // Powiadomienia – docelowo tworzy je backend przy zdarzeniu (i wysyła e-mail); front tylko je czyta
  const powiadom = (lista) =>
    setDane((d) => ({
      ...d,
      powiadomienia: [
        ...lista.filter((p) => p.do && p.do !== ja?.id).map((p, i) => ({ id: 'p' + Date.now() + i, data: teraz(), czytali: [], ...p })),
        ...d.powiadomienia,
      ],
    }))
  const fiszka = (id) => dane.fiszki.find((f) => f.id === id)
  const ROPS = 'rola:rops_admin'
  const doWatku = (id) => '/pomysl/' + id
  const kto = () => (ja.rola === 'rops_admin' ? 'ROPS' : ja.imie)

  // Wpis na osi czasu wątku + powiadomienie dla wszystkich, którzy śledzą pomysł
  // system = status dodany automatycznie; inaczej oficjalny wpis ROPS albo gminy
  const aktualnosc = (fiszkaId, typ, tresc, { powiadomic = true, system = true } = {}) => {
    dodaj('aktualnosci', { id: 'a' + Date.now() + Math.random().toString(36).slice(2, 5), fiszkaId, typ, tresc, autor: system ? 'Małopolski Splot' : kto(), rola: system ? 'system' : ja.rola, data: teraz() })
    const f = fiszka(fiszkaId)
    if (powiadomic && f) powiadom(obserwatorzy(f).map((a) => ({ do: a, typ: 'aktualnosc', tresc: `${f.tytul}: ${tresc}`, link: doWatku(fiszkaId) + '?sekcja=oficjalne' })))
  }

  // Wiadomość w wątku (tworzy wątek, jeśli go nie ma) + powiadomienia dla pozostałych uczestników
  const wyslijWiadomosc = ({ watekId, temat, typ, zasobId, link, uczestnicy, tresc }) => {
    const w = { id: 'm' + Date.now(), autorId: ja.id, autor: ja.imie, rola: ja.rola, tresc, data: teraz() }
    const adresaci = uczestnicy || []
    setDane((d) => {
      const istnieje = d.watki.find((x) => x.id === watekId)
      if (istnieje) {
        return { ...d, watki: d.watki.map((x) => (x.id === watekId ? { ...x, wiadomosci: [...x.wiadomosci, w], zmieniono: w.data, czytali: { ...x.czytali, [ja.id]: w.data } } : x)) }
      }
      const nowy = { id: watekId, typ, temat, zasobId, link, uczestnicy: [...new Set([ja.id, ...adresaci])], wiadomosci: [w], czytali: { [ja.id]: w.data }, utworzono: w.data, zmieniono: w.data }
      return { ...d, watki: [nowy, ...d.watki] }
    })
    const watek = dane.watki.find((x) => x.id === watekId)
    const komu = [...new Set([...(watek?.uczestnicy || []), ...(uczestnicy || [])])].filter((a) => a !== ja.id && a !== 'rola:' + ja.rola)
    const nadawca = ja.rola === 'rops_admin' ? 'ROPS' : ja.rola === 'resident' ? ja.imie : `${ja.imie} (${ROLE[ja.rola]})`
    powiadom(komu.map((a) => ({ do: a, typ: 'wiadomosc', tresc: `Nowa wiadomość od: ${nadawca} – ${watek?.temat || temat}`, link: '/wiadomosci?w=' + watekId })))
  }

  const akcje = {
    // ── Fiszki ─────────────────────────────────────────────
    // POST /api/fiszki  (status = do_weryfikacji) → powiadomienie dla ROPS
    // Fiszka urzędnika JST dostaje oznaczenie „pomysł gminy”
    dodajFiszke: (f) => {
      const id = Date.now()
      const odJST = ja.rola === 'jst'
      dodaj('fiszki', { ...f, id, status: 'do_weryfikacji', poparcia: 0, poparli: [], prosbaOEtap: false, komentarzRops: '', utworzono: teraz(), ...(odJST && { odJST: true, prowadzacy: { id: ja.id, imie: ja.imie, powiat: ja.powiat } }) })
      powiadom([ROPS, 'rola:ekspert'].map((a) => ({ do: a, typ: 'nowa_fiszka', tresc: `Nowy pomysł czeka na poparcie: ${f.tytul}`, link: doWatku(id) })))
    },
    // POST /api/fiszki/{id}/weryfikacja  – tylko ROPS → powiadomienie dla autora
    // Weryfikacja = poparcie zarządzającego: ROPS albo ekspert. Dopiero wtedy fiszka jest publiczna.
    zatwierdz: (id) => {
      const kogo = ja.rola === 'ekspert' ? `eksperta (${ja.imie})` : 'ROPS'
      zmien('fiszki', id, { status: 'opublikowana', komentarzRops: '', poparcieZarzadu: { id: ja.id, imie: ja.imie, rola: ja.rola, data: teraz() } })
      aktualnosc(id, 'opublikowano', `Pomysł poparty przez ${kogo} – jest teraz publiczny.`)
    },
    // Propozycja poprawek trafia do „Rozmów z ekspertami” w wątku; autor poprawia fiszkę i wysyła ponownie
    odeslijDoPoprawy: (id, komentarz) => {
      const f = fiszka(id)
      zmien('fiszki', id, { status: 'do_poprawy', komentarzRops: komentarz })
      dodaj('pytania', { id: 'q' + Date.now(), fiszkaId: id, typ: 'poprawka', do: 'autor', autorId: ja.id, autor: kto(), rola: ja.rola, tresc: komentarz, data: teraz(), odpowiedzi: [] })
      powiadom([{ do: f.autorId, typ: 'poprawki', tresc: `${ja.rola === 'ekspert' ? 'Ekspert' : 'ROPS'} proponuje poprawki w „${f.tytul}”. Wprowadź je w wątku.`, link: doWatku(id) + '?sekcja=eksperci' }])
    },
    // POST /api/fiszki/{id}/usun {powod} – TYLKO ROPS, na każdym etapie (też po publikacji).
    // Status 'odrzucona': pomysł znika z publicznych list, wątek zamknięty; autor widzi powód.
    odrzucFiszke: (id, powod) => {
      if (ja?.rola !== 'rops_admin') return
      const f = fiszka(id)
      const byla = f.status === 'opublikowana'
      setDane((d) => ({ ...d, przejecia: d.przejecia.map((p) => (p.fiszkaId === id && p.status === 'czeka' ? { ...p, status: 'odrzucona', decyzja: teraz() } : p)) }))
      zmien('fiszki', id, { status: 'odrzucona', powodOdrzucenia: powod, usunietoPrzez: { id: ja.id, imie: ja.imie, data: new Date().toISOString() }, prosbaOEtap: false })
      aktualnosc(id, 'odrzucono', 'ROPS usunął pomysł. Wątek jest zakończony.', { powiadomic: false })
      powiadom([
        { do: f.autorId, typ: 'odrzucenie', tresc: `ROPS usunął Twój pomysł „${f.tytul}”. Powód: ${powod}`, link: doWatku(id) },
        // po publikacji informujemy też popierających i gminę prowadzącą
        ...(byla ? obserwatorzy(f).filter((a) => a !== f.autorId).map((a) => ({ do: a, typ: 'odrzucenie', tresc: `Pomysł „${f.tytul}” został usunięty przez ROPS.`, link: '/innowacje' })) : []),
      ])
    },
    // PUT /api/ideas/{id} – prowadzący (autor, a po przejęciu gmina) edytuje fiszkę;
    // przed publikacją wraca do weryfikacji, a propozycje poprawek są oznaczane jako wprowadzone
    edytujFiszke: (id, pola) => {
      const f = fiszka(id)
      if (!f || !prowadzi(f, ja) || f.status === 'odrzucona' || f.status === 'zarchiwizowana') return
      zmien('fiszki', id, { ...pola, status: f.status === 'opublikowana' ? 'opublikowana' : 'do_weryfikacji' })
      setDane((d) => ({ ...d, pytania: d.pytania.map((q) => (q.fiszkaId === id && q.typ === 'poprawka' ? { ...q, wprowadzona: true } : q)) }))
      if (f.status !== 'opublikowana') {
        powiadom([ROPS, 'rola:ekspert'].map((a) => ({ do: a, typ: 'fiszka_poprawiona', tresc: `Poprawiony pomysł czeka na poparcie: ${f.tytul}`, link: doWatku(id) })))
      }
    },
    archiwizuj: (id) => zmien('fiszki', id, { status: 'zarchiwizowana' }),
    // PATCH /api/fiszki/{id}  – autor po poprawkach
    wyslijPonownie: (id) => {
      zmien('fiszki', id, { status: 'do_weryfikacji' })
      powiadom([{ do: ROPS, typ: 'fiszka_poprawiona', tresc: `Poprawiony pomysł czeka na weryfikację: ${fiszka(id)?.tytul}`, link: '/panel' }])
    },
    // POST /api/fiszki/{id}/prosba-o-etap  – autor; PATCH etap – tylko ROPS
    poprosOEtap: (id) => {
      zmien('fiszki', id, { prosbaOEtap: true })
      powiadom([{ do: ROPS, typ: 'prosba_o_etap', tresc: `Prośba o wyższy etap: ${fiszka(id)?.tytul}`, link: '/panel' }])
    },
    // PATCH /api/ideas/{id}/stage {stage} – ROPS zawsze, gmina tylko przy pomyśle, który prowadzi
    ustawEtap: (id, etap) => {
      const f = fiszka(id)
      const gmina = ja?.rola === 'jst' && f.prowadzacy?.id === ja.id
      if (ja?.rola !== 'rops_admin' && !gmina) return
      zmien('fiszki', id, { etap, prosbaOEtap: false })
      const nazwa = ['', 'Pomysł', 'Prototyp', 'Przetestowane', 'Gotowe do wdrożenia'][etap]
      aktualnosc(id, 'etap', gmina ? `Gmina prowadząca zmieniła etap na: ${nazwa}.` : `Potwierdzony etap: ${nazwa}.`)
    },
    odrzucProsbeOEtap: (id) => zmien('fiszki', id, { prosbaOEtap: false }),
    // ROPS prosi ekspertów o opinię = pytanie do ekspertów w wątku pomysłu
    poprosEksperta: (id, pytanie) => akcje.zadajPytanie(id, 'ekspert', pytanie),

    // ── Wątek pomysłu ──────────────────────────────────────
    // POST/DELETE /api/fiszki/{id}/poparcie – poparcie = śledzenie wątku
    poprzyj: (id) => {
      const f = fiszka(id)
      const juz = (f.poparli || []).includes(ja.id)
      zmien('fiszki', id, { poparli: juz ? f.poparli.filter((x) => x !== ja.id) : [...(f.poparli || []), ja.id] })
      if (!juz) powiadom([{ do: f.autorId, typ: 'poparcie', tresc: `${ja.imie} popiera Twój pomysł „${f.tytul}”.`, link: doWatku(id) }])
    },
    // POST /api/fiszki/{id}/komentarze – opinia mieszkańca albo eksperta (rola decyduje o sekcji)
    dodajKomentarz: (fiszkaId, tresc) => {
      const f = fiszka(fiszkaId)
      dodaj('komentarze', { id: 'k' + Date.now(), fiszkaId, autorId: ja.id, autor: ja.imie, rola: ja.rola, tresc, data: teraz() })
      powiadom([f.autorId, f.prowadzacy?.id].map((a) => ({ do: a, typ: 'opinia_watek', tresc: `${ja.rola === 'ekspert' ? 'Opinia eksperta' : 'Nowy komentarz'} przy „${f.tytul}”`, link: doWatku(fiszkaId) + (ja.rola === 'ekspert' ? '?sekcja=eksperci' : '?sekcja=dyskusja') })))
    },
    // POST /api/fiszki/{id}/pytania – autor (albo ROPS) pyta ROPS lub ekspertów
    zadajPytanie: (fiszkaId, adresat, tresc) => {
      const f = fiszka(fiszkaId)
      dodaj('pytania', { id: 'q' + Date.now(), fiszkaId, do: adresat, autorId: ja.id, autor: kto(), rola: ja.rola, tresc, data: teraz(), odpowiedzi: [] })
      powiadom([{ do: adresat === 'ekspert' ? 'rola:ekspert' : ROPS, typ: 'pytanie', tresc: `Pytanie przy pomyśle „${f.tytul}”`, link: doWatku(fiszkaId) + '?sekcja=eksperci' }])
    },
    // POST /api/pytania/{id}/odpowiedzi – ROPS albo ekspert
    odpowiedzNaPytanie: (pytanieId, tresc) => {
      const q = dane.pytania.find((x) => x.id === pytanieId)
      setDane((d) => ({ ...d, pytania: d.pytania.map((x) => (x.id === pytanieId ? { ...x, odpowiedzi: [...x.odpowiedzi, { autor: kto(), rola: ja.rola, tresc, data: teraz() }] } : x)) }))
      const f = fiszka(q.fiszkaId)
      powiadom([q.autorId, f?.autorId].map((a) => ({ do: a, typ: 'odpowiedz', tresc: `Odpowiedź (${ja.rola === 'ekspert' ? 'ekspert' : 'ROPS'}) przy „${f?.tytul}”`, link: doWatku(q.fiszkaId) + '?sekcja=eksperci' })))
    },
    // POST /api/fiszki/{id}/aktualnosci – ROPS albo prowadzący publikuje, co się dzieje
    // tylko ROPS albo gmina prowadząca pomysł (autor nie publikuje oficjalnych informacji)
    dodajAktualnosc: (fiszkaId, tresc) => aktualnosc(fiszkaId, 'aktualizacja', tresc, { system: false }),
    // ── Przejęcie prowadzenia przez gminę ──────────────────
    // Jedna gmina prowadząca; przejęcie jest ostateczne (bez cofania).
    // Po przejęciu gmina edytuje fiszkę, zmienia etap, składa wnioski i pisze oficjalne wpisy;
    // autor zostaje pomysłodawcą (widzi wątek, ale już go nie prowadzi).

    // POST /api/ideas/{id}/takeover-requests {message} – gmina; kilka gmin może prosić naraz, autor wybiera jedną
    poprosOPrzejecie: (fiszkaId, wiadomosc) => {
      const f = fiszka(fiszkaId)
      if (ja?.rola !== 'jst' || f.status !== 'opublikowana' || f.prowadzacy) return
      if (dane.przejecia.some((p) => p.fiszkaId === fiszkaId && p.gminaId === ja.id && p.status === 'czeka')) return
      dodaj('przejecia', { id: 'pr' + Date.now(), fiszkaId, gminaId: ja.id, imie: ja.imie, powiat: ja.powiat, wiadomosc, status: 'czeka', data: teraz() })
      powiadom([{ do: f.autorId, typ: 'przejecie', tresc: `Gmina (pow. ${ja.powiat}) chce przejąć prowadzenie pomysłu „${f.tytul}”. Zdecyduj w wątku.`, link: doWatku(fiszkaId) }])
    },
    // POST /api/takeover-requests/{id}/withdraw – gmina wycofuje swoją prośbę, dopóki czeka
    wycofajPrzejecie: (id) => setDane((d) => ({ ...d, przejecia: d.przejecia.map((p) => (p.id === id && p.gminaId === ja.id && p.status === 'czeka' ? { ...p, status: 'wycofana', decyzja: teraz() } : p)) })),
    // POST /api/takeover-requests/{id}/decision {accept} – tylko autor.
    // Zgoda: gmina prowadzi, pozostałe czekające prośby do tego pomysłu są automatycznie odrzucane.
    decyzjaPrzejecia: (id, zgoda) => {
      const p = dane.przejecia.find((x) => x.id === id)
      const f = p && fiszka(p.fiszkaId)
      if (!f || f.autorId !== ja.id || p.status !== 'czeka' || f.prowadzacy) return
      const inne = zgoda ? dane.przejecia.filter((x) => x.fiszkaId === f.id && x.id !== id && x.status === 'czeka') : []
      setDane((d) => ({
        ...d,
        przejecia: d.przejecia.map((x) => (x.id === id ? { ...x, status: zgoda ? 'przyjeta' : 'odrzucona', decyzja: teraz() } : inne.some((o) => o.id === x.id) ? { ...x, status: 'odrzucona', decyzja: teraz() } : x)),
        fiszki: zgoda ? d.fiszki.map((x) => (x.id === f.id ? { ...x, prowadzacy: { id: p.gminaId, imie: p.imie, powiat: p.powiat }, prosbaOEtap: false } : x)) : d.fiszki,
      }))
      if (zgoda) aktualnosc(f.id, 'przejecie', `Gmina (pow. ${p.powiat}) prowadzi teraz pomysł. Pomysłodawca: ${f.autor}.`)
      powiadom([
        { do: p.gminaId, typ: 'przejecie_decyzja', tresc: zgoda ? `Autor zgodził się – prowadzicie „${f.tytul}”.` : `Autor nie zgodził się na przejęcie „${f.tytul}”.`, link: doWatku(f.id) },
        ...inne.map((o) => ({ do: o.gminaId, typ: 'przejecie_decyzja', tresc: `Pomysł „${f.tytul}” poprowadzi inna gmina.`, link: doWatku(f.id) })),
      ])
    },

    // ── Biblioteka (tylko ROPS) ─────────────────────────────
    // POST /api/biblioteka
    dodajDoBiblioteki: (inn) => dodaj('biblioteka', { ...inn, id: 'b' + Date.now() }),
    // DELETE /api/biblioteka/{id}
    usunZBiblioteki: (id) => setDane((d) => ({ ...d, biblioteka: d.biblioteka.filter((b) => b.id !== id) })),

    // ── Zgłoszenia (z wyszukiwarki) ─────────────────────────
    // zapisywane przez backend przy POST /api/search
    dodajZgloszenie: (z) => dodaj('zgloszenia', { id: 'z' + Date.now(), data: teraz(), ...z }),

    // ── Nabory (tylko ROPS) i wnioski ───────────────────────
    // POST /api/nabory → powiadomienie dla autorów opublikowanych fiszek
    dodajNabor: (n) => {
      dodaj('nabory', { ...n, id: 'n' + Date.now(), status: 'otwarty' })
      const autorzy = [...new Set(dane.fiszki.filter((f) => f.status === 'opublikowana').map((f) => f.autorId))]
      powiadom(autorzy.map((a) => ({ do: a, typ: 'nabor', tresc: `Ruszył nowy nabór: ${n.nazwa}`, link: '/panel' })))
    },
    // POST /api/nabory/{id}/wzor (PDF) – dodanie lub podmiana wzoru wniosku
    // nowy plik wzoru – stary układ stron już do niego nie pasuje (do ponownego odczytu pól)
    ustawWzorNaboru: (id, wzor) => zmien('nabory', id, { wzor, uklad: null }),
    // PATCH /api/nabory/{id} – pola wniosku, pytania i układ stron odczytane ze wzoru (zatwierdzone przez ROPS)
    ustawPolaNaboru: (id, { pola, pytania, uklad = null }) => zmien('nabory', id, { pola, pytania, uklad }),
    // PATCH /api/nabory/{id}
    zamknijNabor: (id) => zmien('nabory', id, { status: 'zamkniety' }),
    // PUT /api/wnioski/{id}  – autor zapisuje szkic
    zapiszWniosek: (w) =>
      setDane((d) => d.wnioski.some((x) => x.id === w.id)
        ? { ...d, wnioski: d.wnioski.map((x) => (x.id === w.id ? { ...x, ...w, zmieniono: teraz() } : x)) }
        : { ...d, wnioski: [{ status: 'szkic', utworzono: teraz(), ...w }, ...d.wnioski] }),
    // POST /api/wnioski/{id}/zloz
    zlozWniosek: (id) => {
      const w = dane.wnioski.find((x) => x.id === id)
      const n = dane.nabory.find((x) => x.id === w?.naborId)
      zmien('wnioski', id, { status: 'zlozony', zlozono: teraz() })
      powiadom([{ do: ROPS, typ: 'wniosek_zlozony', tresc: 'Złożono nowy wniosek do naboru.', link: '/panel' }])
      if (w) aktualnosc(w.fiszkaId, 'wniosek', `Złożono wniosek do naboru „${n?.nazwa}”.`)
    },
    // POST /api/wnioski/{id}/ocena  – tylko ROPS
    ocenWniosek: (id, decyzja) => {
      const w = dane.wnioski.find((x) => x.id === id)
      const n = dane.nabory.find((x) => x.id === w?.naborId)
      zmien('wnioski', id, { status: decyzja })
      powiadom([{ do: w?.autorId, typ: 'wniosek_oceniony', tresc: `Twój wniosek „${w?.tytul}” został ${decyzja === 'przyjety' ? 'przyjęty' : 'odrzucony'}.`, link: '/panel' }])
      if (w) aktualnosc(w.fiszkaId, 'ocena', decyzja === 'przyjety' ? `Wniosek wybrany w naborze „${n?.nazwa}”. Treść wniosku jest teraz publiczna.` : `Wniosek w naborze „${n?.nazwa}” nie został wybrany.`)
    },

    // ── Komunikacja ─────────────────────────────────────────
    // POST /api/watki (nowy) albo POST /api/watki/{id}/wiadomosci
    wyslijWiadomosc,
    // POST /api/watki/{id}/przeczytane
    oznaczWatek: (id) => setDane((d) => ({ ...d, watki: d.watki.map((w) => (w.id === id ? { ...w, czytali: { ...w.czytali, [ja.id]: teraz() } } : w)) })),
    // POST /api/powiadomienia/przeczytane
    oznaczPowiadomienia: () => setDane((d) => ({ ...d, powiadomienia: d.powiadomienia.map((p) => (doMnie(p.do, ja) && !p.czytali.includes(ja.id) ? { ...p, czytali: [...p.czytali, ja.id] } : p)) })),

    // ── JST ─────────────────────────────────────────────────
    // POST /api/wyzwania-jst – gmina zgłasza lokalne wyzwanie (trafia do trendów ROPS)
    zglosWyzwanieJST: (z) => {
      dodaj('zgloszenia', { id: 'z' + Date.now(), data: teraz(), zrodlo: 'jst', autorId: ja.id, autor: ja.imie, ...z })
      powiadom([{ do: ROPS, typ: 'wyzwanie_jst', tresc: `Gmina zgłasza wyzwanie (pow. ${z.powiat}): ${z.tekst.slice(0, 60)}`, link: '/panel' }])
    },

    // ── Wdrożenia w gminie (Middleman) ──────────────────────
    // POST /api/wdrozenia – gmina zapisuje innowację / pomysł; autor pomysłu dostaje powiadomienie. Zwraca id.
    zapiszDoWdrozenia: (zasob) => {
      const id = idWdrozenia(ja.id, zasob)
      if (dane.wdrozenia.some((w) => w.id === id)) return id
      dodaj('wdrozenia', { id, gminaId: ja.id, gmina: ja.imie, powiat: ja.powiat, zasob, status: 'zapisane', ograniczenia: null, communeId: null, plan: null, wersje: [], utworzono: teraz(), zmieniono: teraz() })
      if (zasob.typ === 'fiszka') {
        const f = fiszka(zasob.id)
        if (f) powiadom([{ do: f.autorId, typ: 'wdrozenie', tresc: `Gmina (pow. ${ja.powiat}) zapisała Twój pomysł „${f.tytul}” do wdrożenia.`, link: doWatku(f.id) }])
      }
      return id
    },
    // PUT /api/wdrozenia/{id}/plan – zapis planu z Middlemana (poprzednie wersje zostają w historii)
    zapiszPlanWdrozenia: (id, { ograniczenia, communeId, plan, polecenie }) =>
      setDane((d) => ({
        ...d,
        wdrozenia: d.wdrozenia.map((w) => (w.id === id ? {
          ...w, ograniczenia, communeId, plan, status: w.status === 'w_realizacji' ? w.status : 'plan', zmieniono: teraz(),
          wersje: [{ data: teraz(), polecenie: polecenie || null, plan }, ...w.wersje].slice(0, 5),
        } : w)),
      })),
    // PATCH /api/wdrozenia/{id} – status; „Wdrażamy” pomysłu mieszkańca → powiadomienie autora
    zmienStatusWdrozenia: (id, status) => {
      const w = dane.wdrozenia.find((x) => x.id === id)
      zmien('wdrozenia', id, { status, zmieniono: teraz() })
      const f = w?.zasob.typ === 'fiszka' && fiszka(w.zasob.id)
      if (f && status === 'w_realizacji') powiadom([{ do: f.autorId, typ: 'wdrozenie', tresc: `Gmina (pow. ${w.powiat}) wdraża Twój pomysł „${f.tytul}”.`, link: doWatku(f.id) }])
    },
    // DELETE /api/wdrozenia/{id}
    usunWdrozenie: (id) => setDane((d) => ({ ...d, wdrozenia: d.wdrozenia.filter((w) => w.id !== id) })),
    // POST /api/wdrozenia/{id}/do-rops – ROPS dostaje plan do konsultacji
    wyslijWdrozenieDoROPS: (id) => {
      const w = dane.wdrozenia.find((x) => x.id === id)
      zmien('wdrozenia', id, { wyslanoDoROPS: teraz() })
      powiadom([{ do: ROPS, typ: 'wdrozenie', tresc: `Gmina (pow. ${w?.powiat}) prosi o konsultację planu wdrożenia: ${w?.zasob.tytul}`, link: '/wdrozenie/' + id }])
    },

    // ── Tester innowacji ────────────────────────────────────
    // POST /api/testy – ROPS ogłasza test
    dodajTest: (t) => dodaj('testy', { ...t, id: 't' + Date.now(), status: 'rekrutacja' }),
    // PATCH /api/testy/{id}
    zmienStatusTestu: (id, status) => zmien('testy', id, { status }),
    // POST /api/testy/{id}/zgloszenia
    zglosSieDoTestu: (testId, z) => {
      dodaj('zgloszeniaTestow', { id: 'zt' + Date.now(), testId, uzytkownikId: ja.id, imie: ja.imie, status: 'zgloszony', data: teraz(), ...z })
      const t = dane.testy.find((x) => x.id === testId)
      powiadom([{ do: ROPS, typ: 'zgloszenie_testu', tresc: `Nowy chętny do testu: ${t?.tytul}`, link: '/panel' }])
    },
    // PATCH /api/testy/zgloszenia/{id} – ROPS przyjmuje / odrzuca
    decyzjaTestera: (id, status) => {
      const z = dane.zgloszeniaTestow.find((x) => x.id === id)
      const t = dane.testy.find((x) => x.id === z?.testId)
      zmien('zgloszeniaTestow', id, { status })
      powiadom([{ do: z?.uzytkownikId, typ: 'tester_decyzja', tresc: status === 'przyjety' ? `Jesteś w grupie testowej: ${t?.tytul}` : `Tym razem nie ma miejsca w teście: ${t?.tytul}`, link: '/tester' }])
    },
    // POST /api/opinie → powiadomienie dla autora fiszki (albo ROPS przy innowacji z Biblioteki)
    dodajOpinie: (o) => {
      dodaj('opinie', { ...o, id: 'o' + Date.now(), uzytkownikId: ja.id, imie: ja.imie, data: teraz() })
      const autor = o.zasob.typ === 'fiszka' ? fiszka(o.zasob.id)?.autorId : ROPS
      powiadom([{ do: autor, typ: 'opinia', tresc: `Nowa opinia testera (${o.ocena}/5)`, link: o.zasob.typ === 'fiszka' ? '/panel' : '/tester' }])
    },

    // Tylko do demo: przywraca dane przykładowe
    resetujDemo: () => setDane(stanStartowy()),
  }

  return <DaneContext.Provider value={{ ...dane, ...akcje }}>{children}</DaneContext.Provider>
}

export const useDane = () => useContext(DaneContext)

// Co widzi publiczność: tylko opublikowane fiszki
export const opublikowane = (lista) => lista.filter((i) => i.status === 'opublikowana')
