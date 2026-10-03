import { createContext, useContext, useEffect, useState } from 'react'
import { bibliotekaStartowa } from './biblioteka.js'
import { fiszkiStartowe } from './fiszki.js'
import { naboryStartowe } from './nabory.js'

// Wspólne dane aplikacji – dopóki nie ma backendu, trzymane w localStorage przeglądarki.
// Każda akcja odpowiada jednemu przyszłemu endpointowi API (komentarz obok).
//
// KOLEKCJE:
//   biblioteka  – innowacje ROPS (publiczne; edytuje tylko ROPS)
//   fiszki      – pomysły użytkowników; STATUS: do_weryfikacji | do_poprawy | opublikowana | zarchiwizowana
//   zgloszenia  – zapytania z wyszukiwarki (widzi tylko ROPS, zagregowane w trendach)
//   nabory      – konkursy grantowe tworzone przez ROPS
//   wnioski     – wnioski wygenerowane z fiszki do konkretnego naboru (widzi autor + ROPS)

// v3: Biblioteka ROPS osobno od fiszek, obszary z Mapy Wyzwań, nabory i wnioski
const KLUCZ = 'splot-dane-v3'

const dni = (n) => new Date(Date.now() - n * 864e5).toISOString()
const zgloszeniaStartowe = [
  { tekst: '[przykład] Seniorzy nie mają jak dojechać do lekarza', obszary: ['seniorzy', 'zdrowie'], powiat: 'myślenicki', data: dni(1) },
  { tekst: '[przykład] Babcia nie umie obsługiwać telefonu', obszary: ['seniorzy'], powiat: 'myślenicki', data: dni(1) },
  { tekst: '[przykład] Brak autobusu do przychodni', obszary: ['zdrowie', 'seniorzy'], powiat: 'limanowski', data: dni(2) },
  { tekst: '[przykład] Syn po szkole zamyka się w pokoju i nie chce rozmawiać', obszary: ['psychika'], powiat: 'Kraków', data: dni(2) },
  { tekst: '[przykład] Młodzież nie ma gdzie się spotykać', obszary: ['psychika'], powiat: 'wielicki', data: dni(3) },
  { tekst: '[przykład] Nie stać nas na opał na zimę', obszary: ['ubostwo'], powiat: 'nowosądecki', data: dni(4) },
  { tekst: '[przykład] Dzieci z Ukrainy w klasie nie rozumieją lekcji', obszary: ['cudzoziemcy'], powiat: 'Kraków', data: dni(5) },
  { tekst: '[przykład] Seniorzy samotni w bloku', obszary: ['seniorzy', 'psychika'], powiat: 'krakowski', data: dni(6) },
].map((z, i) => ({ id: 'z' + i, ...z }))

function stanStartowy() {
  return {
    biblioteka: bibliotekaStartowa,
    fiszki: fiszkiStartowe.map((f) => ({
      ...f, status: 'opublikowana', autorId: 'seed', autor: '[autor przykładowy]', prosbaOEtap: false, komentarzRops: '',
    })),
    zgloszenia: zgloszeniaStartowe,
    nabory: naboryStartowe,
    wnioski: [],
  }
}

function wczytaj() {
  try {
    return JSON.parse(localStorage.getItem(KLUCZ)) || stanStartowy()
  } catch {
    return stanStartowy()
  }
}

const DaneContext = createContext(null)
const teraz = () => new Date().toISOString()

export function DaneProvider({ children }) {
  const [dane, setDane] = useState(wczytaj)

  // Każda zmiana danych zapisuje się w przeglądarce
  useEffect(() => {
    localStorage.setItem(KLUCZ, JSON.stringify(dane))
  }, [dane])

  // Pomocniki: zmienia / dodaje element kolekcji
  const zmien = (kolekcja, id, zmiany) =>
    setDane((d) => ({ ...d, [kolekcja]: d[kolekcja].map((x) => (x.id === id ? { ...x, ...zmiany } : x)) }))
  const dodaj = (kolekcja, element) =>
    setDane((d) => ({ ...d, [kolekcja]: [element, ...d[kolekcja]] }))

  const akcje = {
    // ── Fiszki ─────────────────────────────────────────────
    // POST /api/fiszki  (status = do_weryfikacji)
    dodajFiszke: (f) => dodaj('fiszki', { ...f, id: Date.now(), status: 'do_weryfikacji', poparcia: 0, prosbaOEtap: false, komentarzRops: '', utworzono: teraz() }),
    // POST /api/fiszki/{id}/weryfikacja  – tylko ROPS
    zatwierdz: (id) => zmien('fiszki', id, { status: 'opublikowana', komentarzRops: '' }),
    odeslijDoPoprawy: (id, komentarz) => zmien('fiszki', id, { status: 'do_poprawy', komentarzRops: komentarz }),
    archiwizuj: (id) => zmien('fiszki', id, { status: 'zarchiwizowana' }),
    // PATCH /api/fiszki/{id}  – autor po poprawkach
    wyslijPonownie: (id) => zmien('fiszki', id, { status: 'do_weryfikacji' }),
    // POST /api/fiszki/{id}/prosba-o-etap  – autor; PATCH etap – tylko ROPS
    poprosOEtap: (id) => zmien('fiszki', id, { prosbaOEtap: true }),
    ustawEtap: (id, etap) => zmien('fiszki', id, { etap, prosbaOEtap: false }),
    odrzucProsbeOEtap: (id) => zmien('fiszki', id, { prosbaOEtap: false }),

    // ── Biblioteka (tylko ROPS) ─────────────────────────────
    // POST /api/biblioteka
    dodajDoBiblioteki: (inn) => dodaj('biblioteka', { ...inn, id: 'b' + Date.now() }),
    // DELETE /api/biblioteka/{id}
    usunZBiblioteki: (id) => setDane((d) => ({ ...d, biblioteka: d.biblioteka.filter((b) => b.id !== id) })),

    // ── Zgłoszenia (z wyszukiwarki) ─────────────────────────
    // zapisywane przez backend przy POST /api/search
    dodajZgloszenie: (z) => dodaj('zgloszenia', { id: 'z' + Date.now(), data: teraz(), ...z }),

    // ── Nabory (tylko ROPS) i wnioski ───────────────────────
    // POST /api/nabory
    dodajNabor: (n) => dodaj('nabory', { ...n, id: 'n' + Date.now(), status: 'otwarty' }),
    // POST /api/nabory/{id}/wzor (PDF) – dodanie lub podmiana wzoru wniosku
    ustawWzorNaboru: (id, wzor) => zmien('nabory', id, { wzor }),
    // PATCH /api/nabory/{id}
    zamknijNabor: (id) => zmien('nabory', id, { status: 'zamkniety' }),
    // PUT /api/wnioski/{id}  – autor zapisuje szkic
    zapiszWniosek: (w) =>
      setDane((d) => d.wnioski.some((x) => x.id === w.id)
        ? { ...d, wnioski: d.wnioski.map((x) => (x.id === w.id ? { ...x, ...w, zmieniono: teraz() } : x)) }
        : { ...d, wnioski: [{ status: 'szkic', utworzono: teraz(), ...w }, ...d.wnioski] }),
    // POST /api/wnioski/{id}/zloz
    zlozWniosek: (id) => zmien('wnioski', id, { status: 'zlozony', zlozono: teraz() }),
    // POST /api/wnioski/{id}/ocena  – tylko ROPS
    ocenWniosek: (id, decyzja) => zmien('wnioski', id, { status: decyzja }),

    // Tylko do demo: przywraca dane przykładowe
    resetujDemo: () => setDane(stanStartowy()),
  }

  return <DaneContext.Provider value={{ ...dane, ...akcje }}>{children}</DaneContext.Provider>
}

export const useDane = () => useContext(DaneContext)

// Co widzi publiczność: tylko opublikowane fiszki
export const opublikowane = (lista) => lista.filter((i) => i.status === 'opublikowana')
