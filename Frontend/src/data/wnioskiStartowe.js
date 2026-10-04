// Przykładowe złożone wnioski – do pokazania, jak ROPS widzi wypełniony wzór naboru (PDF).
// Pola odpowiadają polom odczytanym z prawdziwych wzorów ROPS (data/wzory/*.json).

const dni = (n) => new Date(Date.now() - n * 864e5).toISOString()

export const wnioskiStartowe = [
  {
    id: 'w-1-n1', fiszkaId: 1, naborId: 'n1', autorId: 'seed', autor: '[autor przykładowy]', tytul: 'Kawiarenka cyfrowa w remizie',
    status: 'zlozony', utworzono: dni(6), zlozono: dni(2), canva: {}, odpowiedzi: {},
    pola: {
      tytul_innowacji: 'Kawiarenka cyfrowa w remizie – młodzież uczy seniorów telefonu',
      opis_innowacji: 'Raz w tygodniu w remizie OSP licealiści prowadzą dla seniorów „kawiarenkę cyfrową”: przy kawie i cieście uczą obsługi smartfona – wideorozmów z rodziną, odbierania e-recepty, bezpiecznej bankowości i rozpoznawania oszustw. Każdy senior ma swojego stałego „cyfrowego opiekuna” z liceum. Rozwiązanie jest modelem pracy międzypokoleniowej: nie wymaga sali komputerowej ani drogiego sprzętu, a seniorzy uczą się na własnych telefonach, w znanym miejscu we wsi. Wspiera włączenie społeczne, bo seniorzy przestają być odcięci od rodziny i usług, i wpisuje się w deinstytucjonalizację – wsparcie dzieje się w społeczności, nie w instytucji.',
      innowacyjnosc_rozwiazania: 'Kursy komputerowe dla seniorów zwykle odbywają się w mieście, w grupach i na sprzęcie, którego seniorzy nie mają w domu. Nasz pomysł łączy trzy rzeczy, których razem nie spotkaliśmy w Małopolsce: naukę na własnym telefonie seniora, stałą parę „senior – licealista” oraz miejsce, które seniorzy znają i lubią – remizę OSP. Młodzież zalicza godziny wolontariatu, a seniorzy uczą ich w zamian lokalnej historii, więc korzyść jest obustronna.',
      diagnoza_problemu: 'Starsi mieszkańcy wsi w powiecie myślenickim nie umieją korzystać z telefonu – nie zrobią wideorozmowy z rodziną ani nie odbiorą e-recepty, a najbliższa pomoc jest w mieście. Według GUS w województwie małopolskim ponad połowa osób w wieku 65–74 lata nie korzysta regularnie z internetu. Problem zgłaszali sami mieszkańcy na platformie Małopolski Splot (12 poparć) oraz pracownicy GOPS, którzy coraz częściej pomagają seniorom w sprawach wymagających telefonu. Problem odpowiada wyzwaniu „Seniorzy” z Mapy Wyzwań Społecznych.',
      opis_odbiorcow: 'Odbiorcami są seniorzy 65+ z dwóch sołectw gminy Pcim, mieszkający sami lub z dala od dzieci. Wielu z nich ma smartfon od rodziny, ale używa go tylko do dzwonienia. Są zagrożeni wykluczeniem, bo coraz więcej spraw – recepty, bank, kontakt z urzędem i lekarzem – wymaga telefonu, a dojazd do miasta po pomoc jest trudny bez samochodu.',
      zmiana_wprowadzana_innowacja: 'Seniorzy samodzielnie zrobią wideorozmowę z rodziną, odbiorą e-receptę i umówią wizytę u lekarza. Mniej będą zależni od dzieci i pracowników GOPS, rzadziej padną ofiarą oszustw telefonicznych. Cotygodniowe spotkania zmniejszą też samotność – kawiarenka staje się miejscem spotkań, a młodzież i seniorzy lepiej się poznają.',
      wizja_przyszlosci_innowacji: 'Model można powielić w każdej gminie, która ma remizę, świetlicę albo bibliotekę i szkołę średnią w pobliżu. Przygotujemy prosty poradnik dla OSP i szkół (jak dobrać pary, plan 10 spotkań, karty ćwiczeń), żeby kolejne gminy mogły ruszyć bez naszej pomocy. Rozwiązanie można też rozszerzyć na osoby z niepełnosprawnościami i cudzoziemców uczących się polskich e-usług.',
      plan_dzialania_i_koszty: 'Okres przygotowawczy (styczeń–marzec 2027): nabór 25 seniorów i 15 licealistów, szkolenie wolontariuszy z pracy z seniorami (1 600 zł), opracowanie kart ćwiczeń (1 200 zł), zakup 3 telefonów do ćwiczeń (3 000 zł). Okres testowania (kwiecień–grudzień 2027): 30 cotygodniowych spotkań w remizie – koordynacja (6 000 zł), poczęstunek (2 400 zł), ankiety na początku i końcu testu oraz opracowanie modelu końcowego (1 800 zł).',
      wnioskowana_kwota_grantu: '16 000 zł',
      zespol_projektowy_i_doswiadczenie: 'Koordynatorka – emerytowana nauczycielka informatyki, od 5 lat prowadzi zajęcia komputerowe w bibliotece gminnej. Partnerzy: OSP Pcim (sala, poczęstunek) i liceum w Myślenicach (wolontariusze, opiekun szkolnego wolontariatu). Wsparcie merytoryczne: pracownica socjalna GOPS, która zna seniorów z sołectw.',
    },
  },
  {
    id: 'w-3-n2', fiszkaId: 3, naborId: 'n2', autorId: 'seed', autor: '[autor przykładowy]', tytul: 'Bus na telefon dla gminy',
    status: 'zlozony', utworzono: dni(9), zlozono: dni(1), canva: {}, odpowiedzi: {},
    pola: {
      nazwa_innowacji: 'b. Strażnik (Alarm Ally) – w połączeniu z dowozem seniorów na wezwanie',
      doswiadczenie_wnioskodawcy: 'Gminny Ośrodek Pomocy Społecznej od 2015 r. prowadzi usługi opiekuńcze dla seniorów i od 3 lat koordynuje wolontariat sąsiedzki. Organizowaliśmy dowozy seniorów na szczepienia w 2021 r. (ok. 400 kursów) oraz projekt „Senior w sieci” finansowany z budżetu gminy.',
      tytul_uslugi: 'Bus na telefon – dowóz seniorów do lekarza i urzędu na wezwanie',
      opis_uslugi: 'Seniorzy bez samochodu zamawiają kurs dzień wcześniej przez telefon do GOPS. Koordynator łączy zamówienia w jedną trasę, a bus gminny lub kierowcy-wolontariusze zawożą seniorów do przychodni, apteki i urzędu. Celem jest to, by żaden senior nie rezygnował z wizyty u lekarza z powodu braku dojazdu. Usługa korzysta z innowacji „Strażnik (Alarm Ally)” – seniorzy dostają przycisk alarmowy, który pozwala też zamówić kurs jednym przyciśnięciem.',
      daty_realizacji: 'Etap 1: od 01.03.2027 do 31.05.2027. Etap 2: od 01.06.2027 do 31.08.2028.',
      grupa_docelowa: 'c) osoby wymagające wsparcia w codziennym funkcjonowaniu lub ich opiekunowie; d) osoby z niepełnosprawnościami lub o ograniczonej mobilności.',
      diagnoza_problemu: 'Autobus do przychodni w gminie jeździ dwa razy dziennie, a seniorzy bez samochodu nie dojadą do lekarza. W gminie mieszka ok. 1 900 osób 65+, z czego według GOPS ok. 300 nie ma własnego transportu. Seniorzy rezygnują z wizyt kontrolnych, co pogarsza ich zdrowie. Dane pochodzą z Obserwatora Statystyk Społecznych ROPS, ankiety sołtysów i zgłoszeń mieszkańców na platformie Małopolski Splot (31 poparć). Odbiorcy są zagrożeni wykluczeniem z powodu wieku, ograniczonej mobilności i braku transportu.',
      opis_rekrutacji: 'Rekrutacja ciągła od marca 2027: przez sołtysów, parafie, przychodnię i pracowników socjalnych. Kryteria: wiek 65+ lub orzeczenie o niepełnosprawności, brak własnego transportu, zamieszkanie w gminie. Pierwszeństwo mają osoby samotne.',
      liczba_osob: '120 osób objętych wsparciem grantu, w tym 100 osób objętych usługą dowozu.',
      obszar_wdrazania: 'Gmina Laskowa (powiat limanowski) – wszystkie sołectwa, z dowozem do przychodni w Laskowej i Limanowej.',
      oczekiwane_efekty: 'Seniorzy regularnie docierają do lekarza i urzędu; mniej odwołanych wizyt kontrolnych; mniejsza samotność dzięki wspólnym kursom; odciążenie rodzin i pracowników GOPS. Zakładamy co najmniej 1 500 kursów w okresie wdrażania.',
      plan_dzialania: 'Przygotowanie: zatrudnienie koordynatora na 1/2 etatu (3 x 3 000 zł = 9 000 zł), szkolenie 10 kierowców-wolontariuszy (2 000 zł), zakup 100 przycisków alarmowych (100 x 150 zł = 15 000 zł). Wdrażanie: koordynacja (15 x 3 000 zł = 45 000 zł), paliwo i serwis busa (15 x 1 200 zł = 18 000 zł), ubezpieczenie wolontariuszy (1 500 zł). Wskaźnik: 120 osób (70 kobiet, 50 mężczyzn), pomiar – lista uczestników i rejestr kursów.',
      wnioskowana_kwota: '90 500 zł',
      cross_financing: 'b. nie',
      utrzymanie_trwalosci: 'Nie dotyczy – nie przewidujemy wydatków w ramach cross-financingu.',
      zgodnosc_z_zasadami: 'Usługa jest dostępna dla wszystkich seniorów bez względu na płeć. Bus ma rampę dla wózków, a zamówienie przyjmujemy telefonicznie i przez przycisk – bez potrzeby korzystania z internetu. Łączenie kursów w jedną trasę ogranicza zużycie paliwa (zasada „nie czyń poważnych szkód”).',
      utrzymanie_efektow: 'Po zakończeniu grantu gmina wpisze dowóz do programu współpracy z organizacjami pozarządowymi i sfinansuje koordynację z budżetu GOPS. Wolontariusze pozostaną w sieci wolontariatu sąsiedzkiego.',
      deinstytucjonalizacja: 'Usługa pozwala seniorom dłużej mieszkać we własnym domu i korzystać z usług w społeczności lokalnej, zamiast trafiać do placówek opieki całodobowej z powodu braku dojazdu do lekarza.',
    },
  },
]
