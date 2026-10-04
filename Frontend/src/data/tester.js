// Tester innowacji – testy w terenie, zgłoszenia testerów i opinie.
// Docelowo: GET /api/testy, POST /api/testy/{id}/zgloszenia, POST /api/opinie (patrz specyfikacja backendu).
//
// test.zasob  = co testujemy: { typ: 'biblioteka' | 'fiszka', id }
// test.status = rekrutacja | trwa | zakonczony
// opinia      = ocena 1–5 + co działa / co poprawić / pomysł; może dotyczyć testu albo dowolnej innowacji z Biblioteki

export const STATUS_TESTU = {
  rekrutacja: { nazwa: 'Szukamy testerów', klasa: 'bg-clay-light text-clay-dark' },
  trwa: { nazwa: 'Test trwa', klasa: 'bg-teal-light text-teal-dark' },
  zakonczony: { nazwa: 'Zakończony', klasa: 'bg-[#E6EAF0] text-ink' },
}

// Kim jest tester – pomaga autorowi dobrać grupę testową
export const KIM_JEST = ['senior/seniorka', 'opiekun/opiekunka', 'rodzic', 'osoba z niepełnosprawnością', 'pracownik gminy / OPS', 'organizacja pozarządowa', 'inna osoba']

const dni = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const temu = (n) => new Date(Date.now() - n * 864e5).toISOString()

export const testyStartowe = [
  {
    id: 't1',
    tytul: '[Przykład] Teleporady w świetlicy – test w 3 sołectwach',
    opis: 'Sprawdzamy, czy stanowisko teleporad sprawdzi się w gminach bez przychodni. Szukamy seniorów i opiekunów, którzy raz skorzystają z teleporady i powiedzą, co było trudne.',
    zasob: { typ: 'biblioteka', id: 'b2' },
    miejsce: 'pow. limanowski',
    miejsca: 12,
    termin: dni(14),
    status: 'rekrutacja',
  },
  {
    id: 't2',
    tytul: '[Przykład] Bus na telefon – miesiąc pilotażu',
    opis: 'Prototyp busa zamawianego telefonicznie jeździ dwa razy w tygodniu. Testerzy zamawiają kurs i oceniają: zamówienie, punktualność, dostępność dla osób z balkonikiem.',
    zasob: { typ: 'fiszka', id: 3 },
    miejsce: 'pow. limanowski',
    miejsca: 8,
    termin: dni(-3),
    status: 'trwa',
  },
]

export const zgloszeniaTestowStartowe = [
  { id: 'zt1', testId: 't2', uzytkownikId: 'seed-t1', imie: '[tester przykładowy]', kim: 'senior/seniorka', dlaczego: 'Jeżdżę do przychodni co tydzień.', status: 'przyjety', data: temu(10) },
  { id: 'zt2', testId: 't2', uzytkownikId: 'seed-t2', imie: '[tester przykładowy]', kim: 'opiekun/opiekunka', dlaczego: 'Wożę mamę, chcę mieć zastępstwo.', status: 'przyjety', data: temu(9) },
]

export const opinieStartowe = [
  { id: 'o1', zasob: { typ: 'fiszka', id: 3 }, testId: 't2', uzytkownikId: 'seed-t1', imie: '[tester przykładowy]', ocena: 4, dziala: 'Kierowca pomaga wsiąść, kurs przyjechał na czas.', poprawic: 'Trzeba dzwonić dzień wcześniej – za długo.', pomysl: 'SMS z przypomnieniem godziny odbioru.', polecam: true, data: temu(2) },
  { id: 'o2', zasob: { typ: 'fiszka', id: 3 }, testId: 't2', uzytkownikId: 'seed-t2', imie: '[tester przykładowy]', ocena: 3, dziala: 'Rampa dla balkonika.', poprawic: 'Brak kursu po południu, po wizycie czekaliśmy 2 godziny.', pomysl: 'Drugi kurs powrotny ok. 14:00.', polecam: true, data: temu(1) },
  { id: 'o3', zasob: { typ: 'biblioteka', id: 'b1' }, uzytkownikId: 'seed-t3', imie: '[osoba przykładowa]', ocena: 5, dziala: 'Wolontariusze są punktualni i mili.', poprawic: '', pomysl: 'Grafik kursów w gazetce parafialnej.', polecam: true, data: temu(5) },
]

// Raport z opinii o jednym zasobie: średnia, liczba, polecenia, listy uwag
export function raport(opinie) {
  const n = opinie.length
  if (!n) return null
  const srednia = opinie.reduce((a, o) => a + o.ocena, 0) / n
  return {
    liczba: n,
    srednia: Math.round(srednia * 10) / 10,
    polecam: opinie.filter((o) => o.polecam).length,
    rozklad: [5, 4, 3, 2, 1].map((g) => ({ nazwa: `${g} ★`, liczba: opinie.filter((o) => o.ocena === g).length })),
    dziala: opinie.map((o) => o.dziala).filter(Boolean),
    poprawic: opinie.map((o) => o.poprawic).filter(Boolean),
    pomysly: opinie.map((o) => o.pomysl).filter(Boolean),
  }
}

export const tenSamZasob = (a, b) => a.typ === b.typ && String(a.id) === String(b.id)
