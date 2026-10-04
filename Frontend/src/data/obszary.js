// Obszary z „Mapy Wyzwań Społecznych” – ROPS Kraków, Dział Innowacji Społecznych
// (opracowana w projekcie „Inkubator Włączenia Społecznego 2.0”).
// UWAGA: dane w Mapie są OGÓLNOPOLSKIE – tak je podpisujemy w interfejsie.
//
// Docelowo te dane edytuje ROPS w panelu (szybka aktualizacja), a backend zwraca je z GET /api/obszary.
// zrodla: [{tytul, url?}] – źródła danych; raporty: [{tytul, wydawca, url, okladka}] – „Dowiedz się więcej” (linki i okładki z PDF Mapy).
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
    liczby: [
      { wartosc: '+3,5%', opis: 'więcej dzieci w pieczy zastępczej w 2023 r. niż rok wcześniej', zrodlo: 'GUS' },
    ],
    dane: [
      'Deinstytucjonalizację spowalnia zbyt mała liczba rodzin zastępczych w stosunku do potrzeb.',
      'Brakuje części form wsparcia rodzin zastępczych przewidzianych w ustawie, a współpraca powiatów i gmin jest niedostateczna.',
      'Do instytucjonalnej pieczy trafiają też dzieci poniżej 10. roku życia, a placówki bywają przepełnione.',
      'Duża część dzieci w pieczy to dzieci starsze, z licznych rodzeństw, z niepełnosprawnościami lub chorobami przewlekłymi.',
    ],
    zrodla: [
      {tytul: "Piecza zastępcza w 2023 roku – GUS", url: "https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/6000/1/8/1/piecza_zastepcza_w_2023_r..pdf"},
      {tytul: "Wsparcie systemu pieczy zastępczej w procesie deinstytucjonalizacji – NIK, 2022", url: "https://www.nik.gov.pl/aktualnosci/deinstytucjonalizacji-pieczy-zastepczej.html"},
    ],
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
    raporty: [
      {tytul: "Piecza zastępcza w 2023 r.", wydawca: "Główny Urząd Statystyczny", url: "https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/6000/1/8/1/piecza_zastepcza_w_2023_r..pdf", okladka: "/raporty/rodzina-1.jpg"},
      {tytul: "Wsparcie systemu pieczy zastępczej w procesie deinstytucjonalizacji", wydawca: "Najwyższa Izba Kontroli, 2022", url: "https://www.nik.gov.pl/kontrole/P/22/031/", okladka: "/raporty/rodzina-2.jpg"},
    ],
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
      {tytul: "Bezdomność młodzieży i młodych dorosłych w Polsce", wydawca: "Fundacja „Po Drugie”, 2023", url: "https://podrugie.pl/dodaj-mnie-raport-z-projektu/", okladka: "/raporty/bezdomnosc-1.jpg"},
      {tytul: "Działania aktywizujące i wspierające osoby bezdomne", wydawca: "Najwyższa Izba Kontroli, 2020", url: "https://www.nik.gov.pl/kontrole/P/18/096/", okladka: "/raporty/bezdomnosc-2.jpg"},
      {tytul: "Raport na temat osób bezdomnych", wydawca: "Mariusz Baranowski, 2010", url: "https://open.icm.edu.pl/items/edfec420-329f-4b2c-874c-2a6c28f99f3a", okladka: "/raporty/bezdomnosc-3.jpg"},
      {tytul: "Diagnoza sytuacji osób doświadczających bezdomności w Warszawie", wydawca: "Urząd m.st. Warszawy, 2022", url: "https://wsparcie.um.warszawa.pl/problematyka-bezdomnosci-w-warszawie", okladka: "/raporty/bezdomnosc-4.jpg"},
    ],
  },
  {
    id: 'niepelnosprawnosc',
    nazwa: 'Niepełnosprawność',
    krotko: 'Dostęp do pracy, edukacji, informacji i samodzielnego życia.',
    slowa: ['niepełnospraw', 'wózek', 'niewidom', 'niesłysz', 'niedosłysz', 'rehabilitac', 'dostępnoś', 'bariery', 'asystent'],
    definicja:
      'Niepełnosprawność to trwałe naruszenie sprawności organizmu, które istotnie obniża zdolność do pracy i samodzielnego życia. Może być wrodzona albo powstać w wyniku wypadku lub choroby – dotyczy dużej części społeczeństwa na różnych etapach życia.',
    liczby: [
      { wartosc: '5,4 mln', opis: 'osób z niepełnosprawnościami w Polsce (NSP 2021)', zrodlo: 'GUS' },
      { wartosc: '14,3%', opis: 'ludności to osoby z niepełnosprawnościami', zmiana: '12,2% w 2011 r.', zrodlo: 'GUS, NSP 2021' },
      { wartosc: '30,1%', opis: 'wskaźnik zatrudnienia osób z niepełnosprawnością w wieku 16–64 lat (koniec 2023 r.)', zrodlo: 'GUS, BDL' },
    ],
    wykres: {
      tytul: 'Odsetek ludności z niepełnosprawnościami',
      jednostka: '%',
      slupki: [{ etykieta: 'NSP 2011', wartosc: 12.2 }, { etykieta: 'NSP 2021', wartosc: 14.3 }],
      zrodlo: 'GUS, Narodowe Spisy Powszechne',
    },
    dane: [
      'Najważniejsze potrzeby: mieszkalnictwo, czas wolny, rehabilitacja, praca i informacja; najsłabiej zaspokojony jest dostęp do informacji (PFRON, 2024).',
      'Kluczowy moment wymagający nowych rozwiązań: przejście z edukacji w dorosłość i na rynek pracy.',
    ],
    zrodla: [
      {tytul: "Bank Danych Lokalnych – GUS"},
      {tytul: "Badanie potrzeb osób niepełnosprawnych w Polsce 2024 – PFRON", url: "https://www.pfron.org.pl/fileadmin/Badania_i_analizy/2024/2024-08-07_Raport_koncowy/Raport_koncowy_Badanie_potrzeb_ON_w_Polsce_2024.pdf"},
      {tytul: "Wyzwania polityki publicznej – PIE", url: "https://pie.net.pl/wp-content/uploads/2019/12/Raport_PIE-Wyzwania-polityki-publicznej.pdf"},
    ],
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
      {tytul: "Strategia na rzecz Osób z Niepełnosprawnościami 2021–2030", wydawca: "Monitor Polski 2021, poz. 218", url: "https://niepelnosprawni.gov.pl/p,170,strategia-na-rzecz-osob-z-niepelnosprawnosciami-2021-2030", okladka: "/raporty/niepelnosprawnosc-1.jpg"},
      {tytul: "Konwencja o prawach osób niepełnosprawnych. Poradnik", wydawca: "Rzecznik Praw Obywatelskich, 2013", url: "https://bip.brpo.gov.pl/sites/default/files/BIULETYN%20RPO%20%E2%80%93%20Materia%C5%82y%20nr%2082%20KPON.pdf", okladka: "/raporty/niepelnosprawnosc-2.jpg"},
      {tytul: "E-podręcznik dostępny dla wszystkich", wydawca: "Fundacja Instytut Rozwoju Regionalnego, 2013", url: "https://www.power.gov.pl/media/13591/e_podrecznik_dostepny_dla_wszystkich.pdf", okladka: "/raporty/niepelnosprawnosc-3.jpg"},
      {tytul: "Sami-Dzielni! Nowe standardy mieszkalnictwa wspomaganego", wydawca: "ROPS w Krakowie, 2023", url: "https://rops.krakow.pl/dzial-publikacje/sami-dzielni-nowe-standardy-mieszkalnictwa-wspomaganego-dla-osob-z-niepelnosprawnosciami-sprzezonymi-2023-1", okladka: "/raporty/niepelnosprawnosc-4.jpg"},
      {tytul: "Projektowanie bez barier – wytyczne", wydawca: "Stowarzyszenie Przyjaciół Integracji", url: "https://www.power.gov.pl/media/13910/projektowanie_zus.pdf", okladka: "/raporty/niepelnosprawnosc-5.jpg"},
    ],
  },
  {
    id: 'ubostwo',
    nazwa: 'Ubóstwo',
    krotko: 'Ubóstwo skrajne rośnie – także wśród pracujących, rolników i seniorów.',
    slowa: ['ubóstw', 'bieda', 'biedn', 'pieniądz', 'głód', 'jedzenie', 'opał', 'ogrzew', 'zadłuż', 'zasiłek', 'bezroboc', 'praca'],
    definicja:
      'Ubóstwo ekonomiczne dotyka różne grupy w różnym stopniu. Szczególnie narażeni są beneficjenci świadczeń społecznych, rolnicy i mieszkańcy wsi poza aglomeracjami. Bieda często dotyczy też osób pracujących na nisko opłacanych stanowiskach.',
    liczby: [
      { wartosc: '6,6%', opis: 'gospodarstw domowych w ubóstwie skrajnym (2023 r.)', zmiana: '+2 pp. rok do roku', zrodlo: 'GUS' },
      { wartosc: '12,8%', opis: 'osób z wykształceniem co najwyżej gimnazjalnym żyje w ubóstwie skrajnym – co ósma' },
      { wartosc: '78%', opis: 'korzystających z pomocy żywnościowej mówi, że ich sytuacja pogorszyła się w ostatnim roku' },
      { wartosc: '30%', opis: 'osób deklaruje lęk przed biedą – najwięcej od 2015 r.' },
    ],
    wykres: {
      tytul: 'Ubóstwo skrajne w 2023 r. według grupy',
      jednostka: '%',
      slupki: [
        { etykieta: 'Rolnicy', wartosc: 14.1 },
        { etykieta: 'Renciści', wartosc: 8.4 },
        { etykieta: 'Pracownicy', wartosc: 6.4 },
        { etykieta: 'Emeryci', wartosc: 5.9 },
      ],
      odniesienie: { etykieta: 'ogółem gospodarstwa domowe', wartosc: 6.6 },
      zrodlo: 'GUS, Zasięg ubóstwa ekonomicznego w Polsce w 2023 r.',
    },
    dane: [],
    zrodla: [
      {tytul: "Zasięg ubóstwa ekonomicznego w Polsce w 2023 r. – GUS", url: "https://stat.gov.pl/obszary-tematyczne/warunki-zycia/ubostwo-pomoc-spoleczna/zasieg-ubostwa-ekonomicznego-w-polsce-w-2023-roku,14,11.html"},
      {tytul: "Raport o biedzie 2023 – Szlachetna Paczka", url: "https://www.szlachetnapaczka.pl/aktualnosci/na-co-nie-stac-polakow-raport-o-biedzie-2023-szlachetnej-paczki/"},
      {tytul: "Poverty Watch 2023 – EAPN Polska", url: "https://www.eapn.org.pl/eapn/uploads/2023/10/poverty_watch_23_v12_10_v2_ost.pdf"},
    ],
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
      {tytul: "Raport o biedzie 2023", wydawca: "Szlachetna Paczka", url: "https://www.szlachetnapaczka.pl/raport-o-biedzie/", okladka: "/raporty/ubostwo-1.jpg"},
      {tytul: "Poverty Watch 2023. Monitoring ubóstwa i polityki społecznej", wydawca: "EAPN Polska", url: "https://www.eapn.org.pl/eapn/uploads/2023/10/poverty_watch_23_v12_10_v2_ost.pdf", okladka: "/raporty/ubostwo-2.jpg"},
      {tytul: "Zasięg ubóstwa ekonomicznego w Polsce w 2023 r.", wydawca: "Główny Urząd Statystyczny", url: "https://stat.gov.pl/obszary-tematyczne/warunki-zycia/ubostwo-pomoc-spoleczna/zasieg-ubostwa-ekonomicznego-w-polsce-w-2023-roku,14,11.html", okladka: "/raporty/ubostwo-3.jpg"},
      {tytul: "Poverty Watch 2022. Monitoring ubóstwa finansowego", wydawca: "EAPN Polska", url: "https://www.eapn.org.pl/eapn/uploads/2022/10/monitoring_ubostwa_2022_ost.pdf", okladka: "/raporty/ubostwo-4.jpg"},
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
    zrodla: [
      {tytul: "Model lokalnej polityki włączania migrantów i migrantek w życie miast – OBM UW, 2023", url: "https://www.migracje.uw.edu.pl/wp-content/uploads/2023/08/Model_polityki_wlaczania_migrantow.pdf"},
    ],
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
      {tytul: "Model lokalnej polityki włączania migrantów i migrantek w życie miast", wydawca: "OBM UW, 2023", url: "https://nomada.info.pl/wp-content/uploads/2023/08/Model_polityki_wlaczania_migrantow_i_migrantek_FIN.pdf", okladka: "/raporty/cudzoziemcy-1.jpg"},
      {tytul: "Biała Księga. Wyzwania systemowego wsparcia uchodźców", wydawca: "Fundacja im. Stefana Batorego, 2022", url: "https://www.batory.org.pl/wp-content/uploads/2022/06/Okragly_stol_Biala-ksiega_www_S.pdf", okladka: "/raporty/cudzoziemcy-2.jpg"},
      {tytul: "Polacy i Ukraińcy – wyzwania integracji uchodźców", wydawca: "Polski Instytut Ekonomiczny, 2023", url: "https://pie.net.pl/wp-content/uploads/2023/05/Wyzwania-integracji-.pdf", okladka: "/raporty/cudzoziemcy-3.jpg"},
      {tytul: "Uchodźcy z Ukrainy w Polsce. Wyzwania i potencjał integracji", wydawca: "Deloitte, 2022", url: "https://www2.deloitte.com/content/dam/Deloitte/pl/Documents/Reports/pl-Uchodzcy-z-Ukrainy-w-Polsce-Report.pdf", okladka: "/raporty/cudzoziemcy-4.jpg"},
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
    zrodla: [
      {tytul: "Raport o samotności 2021 – Szlachetna Paczka", url: "https://www.szlachetnapaczka.pl/wp-content/uploads/2021/03/raport_o_samotnosci_2021.pdf"},
      {tytul: "Polska: Profil systemu ochrony zdrowia 2023 – OECD", url: "https://www.oecd.org/pl/publications/2023/12/poland-country-health-profile-2023_80434439.html"},
      {tytul: "Dziennik Urzędowy Ministra Zdrowia, 2021, poz. 69", url: "https://dziennikmz.mz.gov.pl/DUM_MZ/2021/69/akt.pdf"},
    ],
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
      {tytul: "Raport o samotności 2021. Pierwszy rok pandemii", wydawca: "Szlachetna Paczka", url: "https://www.szlachetnapaczka.pl/raport-o-samotnosci/", okladka: "/raporty/zdrowie-1.jpg"},
      {tytul: "Mapy potrzeb zdrowotnych", wydawca: "Ministerstwo Zdrowia, 2021", url: "https://dziennikmz.mz.gov.pl/legalact/2021/69/", okladka: "/raporty/zdrowie-2.jpg"},
      {tytul: "Polska: Profil systemu ochrony zdrowia 2023", wydawca: "OECD, State of Health in the EU", url: "https://www.oecd.org/pl/publications/polska-profil-systemu-ochrony-zdrowia-2023_b12d3d03-pl.html", okladka: "/raporty/zdrowie-3.jpg"},
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
      'Problemy mogą być częstsze niż zgłaszane – przez stygmatyzację i słaby dostęp do usług.',
    ],
    liczby: [
      { wartosc: '~3%', opis: 'wydatków NFZ przeznacza się na opiekę psychiatryczną' },
    ],
    zrodla: [
      {tytul: "Młode głowy. Otwarcie o zdrowiu psychicznym – Fundacja UNAWEZA, 2023", url: "https://mlodeglowy.pl/wp-content/uploads/2023/04/MLODE-GLOWY.-Otwarcie-o-zdrowiu-psychicznym_-Raport-final.pdf"},
      {tytul: "Raport z badania kondycji psychicznej młodzieży („Żyj z sensem”), 2022", url: "https://rep.up.krakow.pl/xmlui/bitstream/handle/11716/13321/Solecki%20-%20Raport%20z%20badania%20kondycji%20psychicznej%20m%c5%82odzierzy.pdf?sequence=1&isAllowed=y"},
      {tytul: "Polska: Profil systemu ochrony zdrowia 2023 – OECD", url: "https://www.oecd.org/pl/publications/2023/12/poland-country-health-profile-2023_80434439.html"},
      {tytul: "People at Work 2022 – ADP Research Institute", url: "https://pl.adp.com/baza-wiedzy-hr/insights/people-at-work-2022-a-global-workforce-view.aspx"},
      {tytul: "Diagnoza stanu polskiego społeczeństwa, Kraków 2022", url: "http://fundacjaprofuturo.pl/wp-content/uploads/2023/04/Pomi%C4%99dzy-pandemi%C4%85-COVID-19-a-wojn%C4%85-w-Ukrainie-Diagonoza.2022-ebook.pdf"},
    ],
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
      {tytul: "Pomiędzy pandemią COVID-19 a wojną w Ukrainie. Diagnoza stanu polskiego społeczeństwa", wydawca: "Kraków 2022", url: "http://fundacjaprofuturo.pl/wp-content/uploads/2023/04/Pomi%C4%99dzy-pandemi%C4%85-COVID-19-a-wojn%C4%85-w-Ukrainie-Diagonoza.2022-ebook.pdf", okladka: "/raporty/psychika-1.jpg"},
      {tytul: "Raport z badania kondycji psychicznej młodzieży", wydawca: "dr Roman Solecki, 2022", url: "https://rep.up.krakow.pl/xmlui/bitstream/handle/11716/13321/Solecki%20-%20Raport%20z%20badania%20kondycji%20psychicznej%20m%c5%82odzierzy.pdf?sequence=1&isAllowed=y", okladka: "/raporty/psychika-2.jpg"},
      {tytul: "Młode głowy. Otwarcie o zdrowiu psychicznym", wydawca: "Fundacja UNAWEZA, 2023", url: "https://mlodeglowy.pl/wp-content/uploads/2023/04/MLODE-GLOWY.-Otwarcie-o-zdrowiu-psychicznym_-Raport-final.pdf", okladka: "/raporty/psychika-3.jpg"},
      {tytul: "Polska: Profil systemu ochrony zdrowia 2023", wydawca: "OECD, State of Health in the EU", url: "https://www.oecd.org/pl/publications/2023/12/poland-country-health-profile-2023_80434439.html", okladka: "/raporty/psychika-4.jpg"},
      {tytul: "People at Work 2022: A Global Workforce View", wydawca: "ADP Research Institute", url: "https://pl.adp.com/baza-wiedzy-hr/insights/people-at-work-2022-a-global-workforce-view.aspx", okladka: "/raporty/psychika-5.jpg"},
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
    zrodla: [
      {tytul: "Sytuacja osób starszych w Polsce w 2022 r. – GUS", url: "https://stat.gov.pl/obszary-tematyczne/osoby-starsze/osoby-starsze/sytuacja-osob-starszych-w-polsce-w-2022-roku,2,5.html"},
      {tytul: "Wielolekowość seniorów w Polsce – FCIS, 2021", url: "https://fundacjafcis.pl/wielolekowosc-seniorow-w-polsce-aspekty-prawno-spoleczne-i-medyczne-raport/"},
      {tytul: "Ocena potrzeb w zakresie wsparcia dla Seniorów – SeniorApp, 2023", url: "https://seniorapp.pl/wp-content/uploads/2023/10/Raport_SeniorApp_2023_19.10.23_small.pdf"},
      {tytul: "Program „Opieka 75+” na rok 2024 – MRiPS", url: "https://www.gov.pl/web/rodzina/program-opieka-75-edycja-2024"},
    ],
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
      {tytul: "Sytuacja osób starszych w Polsce w 2022 r.", wydawca: "Główny Urząd Statystyczny", url: "https://stat.gov.pl/obszary-tematyczne/osoby-starsze/osoby-starsze/sytuacja-osob-starszych-w-polsce-w-2022-roku,2,5.html", okladka: "/raporty/seniorzy-2.jpg"},
      {tytul: "Wielolekowość seniorów w Polsce. Aspekty prawno-społeczne i medyczne", wydawca: "FCIS, 2021", url: "https://fundacjafcis.pl/wielolekowosc-seniorow-w-polsce-aspekty-prawno-spoleczne-i-medyczne-raport/", okladka: "/raporty/seniorzy-1.jpg"},
      {tytul: "Ocena potrzeb w zakresie wsparcia dla Seniorów w Polsce", wydawca: "SeniorApp, 2023", url: "https://seniorapp.pl/wp-content/uploads/2023/10/Raport_SeniorApp_2023_19.10.23_small.pdf", okladka: "/raporty/seniorzy-3.jpg"},
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
