// Obszary z „Mapy Wyzwań Społecznych” – ROPS Kraków, Dział Innowacji Społecznych
// (opracowana w projekcie „Inkubator Włączenia Społecznego 2.0”).
// UWAGA: dane w Mapie są OGÓLNOPOLSKIE – tak je podpisujemy w interfejsie.
//
// Docelowo te dane edytuje ROPS w panelu (szybka aktualizacja), a backend zwraca je z GET /api/obszary.
// `slowa` – słowa kluczowe do rozpoznania obszaru w opisie problemu (MVP; docelowo klasyfikator / embeddingi).

export const ZRODLO_MAPY = 'Mapa Wyzwań Społecznych, ROPS Kraków – dane ogólnopolskie'

export const OBSZARY = [
  {
    id: 'rodzina',
    nazwa: 'Rodzina i piecza zastępcza',
    krotko: 'Wsparcie rodzin w opiece nad dziećmi i rozwój rodzinnej pieczy zastępczej.',
    slowa: ['rodzina', 'rodzic', 'dziecko', 'dzieci', 'piecza', 'zastępcza', 'adopcja', 'rodzeństwo', 'wychowanie', 'opiekuńczo'],
    definicja:
      'Rodzina pełni podstawowe role wychowawcze i opiekuńcze. Gdy przeżywa trudności, otrzymuje wsparcie, które ma przywrócić jej te zdolności. Piecza zastępcza zapewnia dziecku bezpieczeństwo, wsparcie emocjonalne i warunki do rozwoju, gdy rodzice biologiczni nie mogą się nim opiekować.',
    dane: [
      'W 2023 r. liczba dzieci w pieczy zastępczej wzrosła względem 2022 r. o 3,5%.',
      'Deinstytucjonalizację spowalnia zbyt mała liczba rodzin zastępczych w stosunku do potrzeb.',
      'Brakuje części form wsparcia rodzin zastępczych przewidzianych w ustawie, a współpraca powiatów i gmin jest niedostateczna.',
      'Do instytucjonalnej pieczy trafiają też dzieci poniżej 10. roku życia, a placówki bywają przepełnione.',
      'Duża część dzieci w pieczy to dzieci starsze, z licznych rodzeństw, z niepełnosprawnościami lub chorobami przewlekłymi.',
    ],
    zrodla: ['Piecza zastępcza w 2023 roku – GUS', 'Wsparcie systemu pieczy zastępczej w procesie deinstytucjonalizacji – NIK, 2022'],
    wyzwania: [
      'Więcej pozytywnie zweryfikowanych kandydatów na rodziny zastępcze.',
      'Priorytet dla rodzinnej pieczy zastępczej.',
      'Lepsza współpraca między powiatami w systemie pieczy.',
      'Nierozdzielanie rodzeństwa przy umieszczaniu w pieczy.',
      'Skracanie pobytu w pieczy i szybkie kierowanie dzieci z uregulowaną sytuacją do docelowej formy opieki.',
      'Spójne standardy pracy ośrodków adopcyjnych.',
    ],
    persona: {
      imie: 'Ania i Staś',
      cechy: ['Rodzeństwo z dysfunkcyjnej rodziny', 'Ania (7 lat) ma zespół Downa, Staś (12 lat) jest niedosłyszący', 'Nieufni i wycofani', 'Byli w wielu rodzinach zastępczych i placówkach'],
      cele: ['Piecza rodzinna bez rozdzielania rodzeństwa', 'Specjalistyczne wsparcie związane z niepełnosprawnością', 'Wzmocnienie kompetencji społecznych'],
      wyzwania: ['Niepełnosprawność obojga dzieci', 'Trudne doświadczenia z rodziny', 'Brak stabilnego miejsca pobytu'],
      motywacje: ['Mieć „prawdziwą” rodzinę', 'Wychowywać się razem, w jednym miejscu', 'Być akceptowanymi przez rówieśników'],
    },
    raporty: [],
  },
  {
    id: 'bezdomnosc',
    nazwa: 'Bezdomność',
    krotko: 'Najbardziej jaskrawa forma wykluczenia – coraz częściej dotyczy młodych ludzi.',
    slowa: ['bezdom', 'noclegownia', 'schronisko', 'eksmisja', 'mieszkanie', 'nocleg', 'ulica', 'dach'],
    definicja:
      'Bezdomność to sytuacja osób, które nie mają i własnym staraniem nie mogą zapewnić sobie schronienia spełniającego minimalne warunki mieszkalne. Wynika zwykle z wielu przenikających się przyczyn: bezrobocia, ubóstwa, uzależnień, przemocy, zadłużenia, eksmisji, rozpadu rodziny czy zaburzeń psychicznych.',
    dane: [],
    zrodla: [],
    wyzwania: [
      'Rośnie liczba młodych osób w kryzysie bezdomności (0–25 lat).',
      '„Niewidzialność” młodych bezdomnych – nie wyglądają na osoby w kryzysie i trudno ich policzyć.',
      'Potrzeba odrębnego podejścia do nastolatków – niepełnoletność utrudnia wsparcie instytucjonalne.',
      'Brak oferty noclegowni i schronisk dostosowanej do młodych osób.',
      'Luka we wsparciu byłych wychowanków placówek opiekuńczo-wychowawczych.',
      '„Bezrodzinowość” – brak lub utrata silnych więzi w okresie dorastania.',
    ],
    persona: {
      imie: 'Kuba',
      cechy: ['22 lata, były wychowanek placówki opiekuńczo-wychowawczej', 'Objawy uzależnienia od substancji psychoaktywnych', 'Nie utrzymał mieszkania wspieranego'],
      cele: ['Schronienie i jedzenie na najbliższe dni', 'Dostęp do prądu (telefon to kontakt ze znajomymi)', 'Schludny wygląd, żeby nikt „nie zauważył”'],
      wyzwania: ['Znalezienie noclegu na najbliższe dni', 'Brak osób wspierających w drodze ku dorosłości'],
      motywacje: ['„Żeby nikt nie zobaczył, że nie mam domu”', '„Chcę zrobić coś ze swoim życiem”'],
    },
    raporty: [
      'Bezdomność młodzieży i młodych dorosłych w Polsce – Fundacja „Po Drugie”, 2023',
      'Działania aktywizujące i wspierające osoby bezdomne – NIK, 2020',
      'Raport na temat osób bezdomnych – M. Baranowski, 2010',
      'Diagnoza sytuacji osób doświadczających bezdomności w Warszawie, 2022',
    ],
  },
  {
    id: 'niepelnosprawnosc',
    nazwa: 'Niepełnosprawność',
    krotko: 'Dostęp do pracy, edukacji, informacji i samodzielnego życia.',
    slowa: ['niepełnospraw', 'wózek', 'niewidom', 'niesłysz', 'niedosłysz', 'rehabilitac', 'dostępnoś', 'bariery', 'asystent'],
    definicja:
      'Niepełnosprawność to trwałe naruszenie sprawności organizmu, które istotnie obniża zdolność do pracy i samodzielnego życia. Może być wrodzona albo powstać w wyniku wypadku lub choroby – dotyczy dużej części społeczeństwa na różnych etapach życia.',
    dane: [
      'Wskaźnik zatrudnienia osób z niepełnosprawnością w wieku 16–64 lat wyniósł pod koniec 2023 r. 30,1%.',
      'Według NSP 2021 osób z niepełnosprawnościami było 5,4 mln – 14,3% ludności (12,2% w 2011 r.).',
      'Najważniejsze potrzeby: mieszkalnictwo, czas wolny, rehabilitacja, praca i informacja; najsłabiej zaspokojony jest dostęp do informacji (PFRON, 2024).',
      'Kluczowy moment wymagający nowych rozwiązań: przejście z edukacji w dorosłość i na rynek pracy.',
    ],
    zrodla: ['Bank Danych Lokalnych GUS', 'Badanie potrzeb osób niepełnosprawnych w Polsce 2024 – PFRON', 'Wyzwania polityki publicznej – PIE'],
    wyzwania: [
      'Większy dostęp do rynku pracy.',
      'Wykształcenie pozwalające na samodzielność i rozwój zawodowy.',
      'Budowanie samodzielnych relacji społecznych.',
      'Wsparcie emocjonalne.',
      'Wsparcie techniczne, infrastrukturalne i dostępność.',
      'Samodzielne przemieszczanie się i korzystanie z usług bez asysty.',
      'Dostęp do opieki medycznej, fizjoterapii i pomocy w codziennych czynnościach.',
      'Rozwój zainteresowań.',
      'Dostosowanie mieszkań do potrzeb i ograniczeń funkcjonalnych.',
    ],
    persona: {
      imie: 'Krystian',
      cechy: ['38 lat, mieszka sam w małej miejscowości', 'Pracuje zdalnie jako operator danych, obsługuje komputer wzrokiem', 'Porażenie czterokończynowe, nie mówi'],
      cele: ['Codzienne czynności bez „obciążania” innych', 'Znajomi i życie towarzyskie', 'Rozwój zawodowy i uznanie'],
      wyzwania: ['Samotność, brak przyjaciół', 'Samoobsługa: ubieranie się, wyjście z domu', 'Utrzymanie zdrowia'],
      motywacje: ['„Mieć w życiu coś więcej niż tylko pracę”', 'Wyjść z domu, kiedy chce', 'Decydować o sobie'],
    },
    raporty: [
      'Strategia na rzecz Osób z Niepełnosprawnościami 2021–2030',
      'E-podręcznik dostępny dla wszystkich – Fundacja Instytut Rozwoju Regionalnego, 2013',
      'Konwencja o prawach osób niepełnosprawnych – poradnik RPO, 2013',
      'Sami-Dzielni! Standardy mieszkalnictwa wspomaganego, 2023',
      'Projektowanie bez barier – Stowarzyszenie Przyjaciół Integracji',
    ],
  },
  {
    id: 'ubostwo',
    nazwa: 'Ubóstwo',
    krotko: 'Ubóstwo skrajne rośnie – także wśród pracujących, rolników i seniorów.',
    slowa: ['ubóstw', 'bieda', 'biedn', 'pieniądz', 'głód', 'jedzenie', 'opał', 'ogrzew', 'zadłuż', 'zasiłek', 'bezroboc', 'praca'],
    definicja:
      'Ubóstwo ekonomiczne dotyka różne grupy w różnym stopniu. Szczególnie narażeni są beneficjenci świadczeń społecznych, rolnicy i mieszkańcy wsi poza aglomeracjami. Bieda często dotyczy też osób pracujących na nisko opłacanych stanowiskach.',
    dane: [
      'W 2023 r. ubóstwo skrajne dotyczyło 6,6% gospodarstw domowych – wzrost o 2 pp. rok do roku.',
      'Ubóstwo skrajne w 2023 r.: rolnicy 14,1%, renciści 8,4%, pracownicy 6,4%, emeryci 5,9%.',
      'Wśród osób z wykształceniem co najwyżej gimnazjalnym w ubóstwie skrajnym żyła średnio co ósma (12,8%).',
      'Blisko 78% osób korzystających z pomocy żywnościowej uważa, że ich sytuacja pogorszyła się w ostatnim roku.',
      'Lęk przed biedą deklaruje 30% osób – najwięcej od 2015 r.',
    ],
    zrodla: ['Zasięg ubóstwa ekonomicznego w Polsce w 2023 r. – GUS', 'Raport o biedzie 2023 – Szlachetna Paczka', 'Poverty Watch 2023 – EAPN Polska'],
    wyzwania: [
      'Ubóstwo dzieci – dobrej jakości wczesna opieka i edukacja.',
      'Ubóstwo seniorów i osób z niepełnosprawnościami.',
      'Ubóstwo osób pracujących, np. rolników na niewielkich areałach.',
      'Bezrobotni i bezdomni – zatrudnienie socjalne i spółdzielczość socjalna.',
      'Ubóstwo uchodźców z Ukrainy.',
      'Ubóstwo energetyczne.',
      'Głód i niedożywienie.',
    ],
    persona: {
      imie: 'Tomek',
      cechy: ['60 lat, do niedawna mieszkał z matką', 'Wykształcenie techniczne, pracował w gospodarstwie rolnym', 'Na rencie rolniczej, nie pracuje'],
      cele: ['Bezpieczeństwo finansowe i zdrowotne', 'Praca dorywcza', 'Opał na zimę'],
      wyzwania: ['Samotność, brak sieci wsparcia', 'Rezygnacja i poczucie beznadziei', 'Zagrożenie alkoholizmem'],
      motywacje: ['„Żeby się spotkać, napić razem herbaty”', '„Mieć pewność, że będę mieć co jeść i ogrzeję dom”'],
    },
    raporty: [
      'Raport o biedzie 2023 – Szlachetna Paczka',
      'Poverty Watch 2023 – EAPN Polska',
      'Zasięg ubóstwa ekonomicznego w Polsce w 2023 r. – GUS',
      'Poverty Watch 2022 – EAPN Polska',
    ],
  },
  {
    id: 'cudzoziemcy',
    nazwa: 'Integracja cudzoziemców',
    krotko: 'Równe szanse dla migrantów w dostępie do usług, pracy i edukacji.',
    slowa: ['cudzoziem', 'migrant', 'uchodźc', 'ukrain', 'język', 'tłumacz', 'integrac', 'obcokrajow'],
    definicja:
      'Integracja cudzoziemców to część polityk włączających, które dają wszystkim mieszkańcom gmin równe szanse w życiu ekonomicznym, społecznym, kulturowym i politycznym – także osobom, które nie mówią po polsku.',
    dane: [
      'Integracja to proces wielostronny, a nie asymilacja.',
      'Model lokalnej integracji obejmuje m.in. partycypacyjne projektowanie działań z organizacjami migrantów, planowanie w oparciu o badania i koordynację przez jedną jednostkę samorządu.',
      'Działania potrzebują stabilnego finansowania, wychodzącego poza krótkie projekty bez gwarancji kontynuacji.',
      'Równy dostęp wymaga też programów celowanych, np. kursów języka polskiego dla dzieci i dorosłych.',
    ],
    zrodla: ['Model lokalnej polityki włączania migrantów i migrantek w życie miast – OBM UW, 2023'],
    wyzwania: [
      'Równy dostęp migrantów do usług społecznych.',
      'Usługi dostosowane do potrzeb – tłumacz, asysta kulturowa, indywidualne programy integracji.',
      'Włączenie kulturowe, w tym dzieci i młodzieży szkolnej.',
      'Rynek pracy otwarty na cudzoziemców – język branżowy, uznawanie kwalifikacji.',
      'Integracja dzieci migrantów w systemie edukacji.',
      'Przeciwdziałanie stereotypom.',
      'Zdrowie psychiczne cudzoziemców.',
    ],
    persona: {
      imie: 'Swietłana',
      cechy: ['37 lat, pochodzi z Ukrainy', 'Dwoje dzieci: 4 i 9 lat; mąż został w Ukrainie', 'Nauczycielka historii – w Polsce szuka pracy poza zawodem'],
      cele: ['Bezpieczeństwo dla siebie i rodziny', 'Praca i mieszkanie', 'Przedszkole i szkoła dla dzieci'],
      wyzwania: ['Wynajem mieszkania – niechęć wynajmujących', 'Adaptacja dzieci, które nie mówią po polsku'],
      motywacje: ['Odnaleźć się w Polsce i zintegrować', 'Duża motywacja wewnętrzna, chęć zmiany'],
    },
    raporty: [
      'Model lokalnej polityki włączania migrantów i migrantek – OBM UW, 2023',
      'Biała Księga. Wyzwania systemowego wsparcia uchodźców, 2022',
      'Polacy i Ukraińcy – wyzwania integracji uchodźców – PIE, 2023',
      'Uchodźcy z Ukrainy w Polsce. Wyzwania i potencjał integracji – Deloitte, 2022',
    ],
  },
  {
    id: 'zdrowie',
    nazwa: 'Zdrowie',
    krotko: 'Profilaktyka, dostęp do opieki i samotność, która też szkodzi zdrowiu.',
    slowa: ['zdrow', 'lekarz', 'przychodni', 'szpital', 'chorob', 'leczen', 'karetk', 'otyłoś', 'serce', 'dieta', 'profilakty', 'opiekun', 'opieka'],
    definicja:
      'Edukacja zdrowotna, dostęp do opieki medycznej, profilaktyka i zdrowe środowisko to kluczowe obszary wspierające zdrowie fizyczne i psychiczne ludzi oraz całych społeczności.',
    dane: [
      'Choroba niedokrwienna serca jest i pozostanie największym wyzwaniem systemu ochrony zdrowia.',
      'Udary to druga najczęstsza przyczyna zgonów i poważne źródło niepełnosprawności.',
      'Rośnie liczba zachorowań na nowotwory, chorobę Alzheimera i inne choroby otępienne.',
      'Pandemia nasiliła samotność osób starszych mieszkających w pojedynkę – izolacja szkodzi pamięci, uwadze i zdrowiu psychicznemu.',
      'Główne przyczyny zwiększonej umieralności to palenie tytoniu i nieodpowiednia dieta.',
    ],
    zrodla: ['Raport o samotności 2021 – Szlachetna Paczka', 'Polska: Profil systemu ochrony zdrowia 2023 – OECD', 'Dziennik Urzędowy Ministra Zdrowia, 2021'],
    wyzwania: [
      'Edukacja o zdrowym stylu życia, profilaktyce, diecie i aktywności.',
      'Równy dostęp do dobrej opieki zdrowotnej.',
      'Dostosowanie opieki do rosnącej liczby osób starszych, w tym opieki długoterminowej.',
      'Inwestowanie w zdrowie dzieci i młodzieży.',
      'Świadomość zdrowia psychicznego i przeciwdziałanie stygmatyzacji.',
    ],
    persona: {
      imie: 'Stanisław',
      cechy: ['56 lat, pracuje na etat i opiekuje się chorą matką', 'Zaniedbuje własne zdrowie', 'Otyłość i choroba serca, wycofany społecznie'],
      cele: ['Równowaga między pracą, życiem a opieką', 'Więcej energii i lepsze zdrowie', 'Silniejsze relacje społeczne'],
      wyzwania: ['Fizyczne i emocjonalne obciążenie opieką', 'Niepokój o własne zdrowie'],
      motywacje: ['Bezpieczeństwo matki', 'Chwila dla siebie, spotkanie z kimś'],
    },
    raporty: [
      'Raport o samotności 2021 – Szlachetna Paczka',
      'Mapy potrzeb zdrowotnych – BASiW, 2021',
      'State of Health in the EU – Polska, 2023',
    ],
  },
  {
    id: 'psychika',
    nazwa: 'Zdrowie psychiczne',
    krotko: 'Kryzys psychiczny dzieci, młodzieży i dorosłych oraz niedofinansowana opieka.',
    slowa: ['psychi', 'depresj', 'samotn', 'stres', 'lęk', 'samobój', 'kryzys', 'emocj', 'terapi', 'izolac'],
    definicja:
      'Zdrowie psychiczne to równowaga emocjonalna, psychiczna i społeczna – zdolność radzenia sobie ze stresem, budowania relacji i podejmowania decyzji. To nie tylko brak choroby, ale warunek dobrego samopoczucia i rozwoju.',
    dane: [
      'Młodzi coraz częściej zmagają się z brakiem motywacji i samoakceptacji.',
      'Rośnie liczba prób samobójczych wśród dzieci i młodzieży.',
      'Nadmierne korzystanie z urządzeń i internetu wiąże się ze stanami depresyjnymi i problemami z postrzeganiem ciała.',
      'Finansowanie opieki psychiatrycznej jest bardzo niskie – ok. 3% wydatków NFZ.',
      'Problemy mogą być częstsze niż zgłaszane – przez stygmatyzację i słaby dostęp do usług.',
    ],
    zrodla: ['Młode głowy. Otwarcie o zdrowiu psychicznym – Fundacja UNAWEZA, 2023', 'Polska: Profil systemu ochrony zdrowia 2023 – OECD', 'Diagnoza stanu polskiego społeczeństwa, Kraków 2022'],
    wyzwania: [
      'Edukacja o zdrowiu psychicznym – szczególnie dzieci, młodzieży i seniorów.',
      'Wzmacnianie kompetencji rodziców w rozpoznawaniu sygnałów kryzysu.',
      'Przejście z opieki instytucjonalnej na środowiskową.',
      'Ograniczanie stygmatyzacji, która zniechęca do szukania pomocy.',
    ],
    persona: {
      imie: 'Mateusz',
      cechy: ['17 lat, liceum w dużym mieście', 'Większość czasu spędza w sieci', 'Po trudnym rozstaniu odczuwa pustkę'],
      cele: ['Cele poza światem wirtualnym', 'Wsparcie w trudnych emocjach', 'Przełamanie izolacji'],
      wyzwania: ['Mało kontaktów z rówieśnikami', 'Trudność w rozumieniu emocji, niska motywacja'],
      motywacje: ['Czuć się ważnym i akceptowanym', 'Poczucie bezpieczeństwa w kryzysie'],
    },
    raporty: [
      'Pomiędzy pandemią COVID-19 a wojną w Ukrainie. Diagnoza stanu polskiego społeczeństwa, 2022',
      'Polska: Profil systemu ochrony zdrowia 2023',
      'People at Work 2022: A Global Workforce View – ADP',
      'Młode głowy. Otwarcie o zdrowiu psychicznym – UNAWEZA, 2023',
    ],
  },
  {
    id: 'seniorzy',
    nazwa: 'Seniorzy',
    krotko: 'Samotność, zdrowie, finanse i cyfryzacja w starzejącym się społeczeństwie.',
    slowa: ['senior', 'starsz', 'emeryt', 'babci', 'dziadk', 'wiek', 'starość', 'telefon', 'internet', 'cyfrow', 'dojazd', 'dojecha', 'transport', 'autobus', 'samotn'],
    definicja:
      'Starzejące się społeczeństwo wymaga skutecznych działań w opiece zdrowotnej i opiekuńczej oraz wsparcia godnej starości. Osoby starsze powinny być pełnoprawną częścią społeczeństwa i żyć bezpiecznie, bez dyskryminacji i izolacji, możliwie niezależnie.',
    dane: [
      'Największe problemy, w których seniorzy oczekują wsparcia: zdrowie, samotność, finanse i cyfryzacja.',
      'Wielu seniorów mieszka w budynkach z barierami architektonicznymi – szczególnie uciążliwe dla osób samotnych.',
      'Groźna jest wielolekowość – przyjmowanie wielu leków i suplementów naraz.',
      'Poczucie samotności łączy się z sytuacją materialną – im gorsza, tym większa samotność.',
    ],
    zrodla: ['Sytuacja osób starszych w Polsce w 2022 r. – GUS', 'Wielolekowość seniorów w Polsce – FCIS, 2021', 'Ocena potrzeb w zakresie wsparcia dla Seniorów – SeniorApp, 2023'],
    wyzwania: [
      'Dostosowanie usług zdrowotnych i instytucji do starzejącego się społeczeństwa, także z użyciem technologii.',
      'Projektowanie uniwersalne przestrzeni i mieszkań, rozwój mieszkalnictwa senioralnego.',
      'Odpowiedzialne korzystanie z leków i suplementów.',
      'Szersza oferta aktywizacji i integracji seniorów.',
      'Rozwój kompetencji cyfrowych seniorów.',
      'Lepszy dostęp do usług opiekuńczych w gminach.',
    ],
    persona: {
      imie: 'Janina',
      cechy: ['73 lata, mieszka sama w małym mieście', 'Niedawno straciła męża, rzadko wychodzi z domu', 'Wiele schorzeń, przyjmuje sporo leków i suplementów'],
      cele: ['Mniej samotności, więcej aktywności', 'Poczucie wartości i użyteczności', 'Świadome dbanie o zdrowie i leki'],
      wyzwania: ['Samotność i brak integracji', 'Nadużywanie leków', 'Zmiana życia po utracie małżonka'],
      motywacje: ['Sens i przyjemność w prostych rzeczach', 'Lepsze samopoczucie, wyjście do ludzi'],
    },
    raporty: [
      'Sytuacja osób starszych w Polsce w 2022 r. – GUS',
      'Wielolekowość seniorów w Polsce – FCIS, 2021',
      'Ocena potrzeb w zakresie wsparcia dla Seniorów w Polsce – SeniorApp, 2023',
    ],
  },
]

export const obszarPoId = (id) => OBSZARY.find((o) => o.id === id)

// Rozpoznaje obszary w tekście (MVP – słowa kluczowe). Zwraca obszary posortowane od najlepszego.
export function wykryjObszary(tekst) {
  const t = (tekst || '').toLowerCase()
  return OBSZARY
    .map((o) => ({ obszar: o, trafienia: o.slowa.filter((s) => t.includes(s)).length }))
    .filter((x) => x.trafienia > 0)
    .sort((a, b) => b.trafienia - a.trafienia)
    .map((x) => x.obszar)
}
