// Wątek pomysłu (strona /pomysl/:id): aktualności, pytania do ROPS/ekspertów, opinie, poparcia.
// Docelowo: GET /api/fiszki/{id}/watek zwraca to wszystko jednym wywołaniem.

const temu = (n) => new Date(Date.now() - n * 864e5).toISOString()

// Liczba poparć = poparcia z importu (dane przykładowe) + osoby, które kliknęły „Popieram”
export const liczbaPoparc = (f) => (f.poparcia || 0) + (f.poparli?.length || 0)
// Kto prowadzi pomysł: autor, a po przejęciu – tylko gmina (przejęcie jest ostateczne).
// Prowadzący edytuje fiszkę, zadaje pytania, składa wnioski.
export const prowadzacyId = (f) => f.prowadzacy?.id || f.autorId
export const prowadzi = (f, u) => !!u && prowadzacyId(f) === u.id
// Kto ma wgląd w nieopublikowany wątek: autor (także po przejęciu) i gmina prowadząca
export const uczestniczy = (f, u) => !!u && (f.autorId === u.id || f.prowadzacy?.id === u.id)
// Kto śledzi wątek (dostaje powiadomienia o aktualnościach)
export const obserwatorzy = (f) => [...new Set([f.autorId, f.prowadzacy?.id, ...(f.poparli || [])].filter(Boolean))]


export const aktualnosciStartowe = [
  { id: 'a1', fiszkaId: 3, typ: 'opublikowano', tresc: 'Pomysł poparty przez ROPS – jest teraz publiczny.', autor: 'Małopolski Splot', rola: 'system', data: temu(40) },
  { id: 'a2', fiszkaId: 3, typ: 'etap', tresc: 'Potwierdzony etap: Prototyp.', autor: 'Małopolski Splot', rola: 'system', data: temu(20) },
  { id: 'a3', fiszkaId: 3, typ: 'aktualizacja', tresc: 'Rusza miesięczny pilotaż busa – dwa kursy w tygodniu. Zapraszamy seniorów do testowania, zgłoszenia w OPS.', autor: '[pracownik ROPS]', rola: 'rops_admin', data: temu(10) },
]

export const komentarzeStartowe = [
  { id: 'k1', fiszkaId: 3, autorId: 'seed-k1', autor: '[mieszkanka przykładowa]', rola: 'resident', tresc: 'U nas w gminie to samo – po 14:00 nie ma czym wrócić od lekarza.', data: temu(15) },
  { id: 'k2', fiszkaId: 3, autorId: 'seed-e1', autor: '[ekspert przykładowy]', rola: 'ekspert', tresc: 'Warto od razu policzyć koszt kursu na osobę – to pierwsze pytanie gminy przy wdrożeniu. Dobrze sprawdza się model z dyspozytorem w OPS.', data: temu(12) },
  { id: 'k3', fiszkaId: 1, autorId: 'seed-k2', autor: '[mieszkaniec przykładowy]', rola: 'resident', tresc: 'Chętnie pomogę jako wolontariusz, uczę informatyki.', data: temu(4) },
]

export const pytaniaStartowe = [
  {
    id: 'q1', fiszkaId: 3, do: 'rops', autorId: 'seed', autor: '[autor przykładowy]', tresc: 'Czy na bus można dostać dofinansowanie z naboru dla seniorów?', data: temu(9),
    odpowiedzi: [{ autor: 'ROPS', rola: 'rops_admin', tresc: 'Tak – nabór „Aktywni seniorzy” obejmuje transport. Wniosek najlepiej złożyć po zakończeniu testu.', data: temu(8) }],
  },
]
