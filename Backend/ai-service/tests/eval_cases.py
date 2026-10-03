# Zestaw testowy wyszukiwania: zapytanie -> innowacje, z których co najmniej jedna powinna być w top 3.
# Dopisuj przypadki, gdy znajdziesz zapytanie, które działa źle — to najszybsza droga do poprawy jakości.

EVAL_CASES: list[tuple[str, set[str]]] = [
    ("bezdomność na wsi", {
        "dla-osob-w-kryzysie-bezdomnosci/wiejski-program-pomocy-osobom-w-kryzysie-bezdomnosci-sciezka-feniksa",
        "dla-osob-w-kryzysie-bezdomnosci/szlakiem-ludzi-bezdomnych"}),
    ("gdzie osoba bezdomna może się umyć", {"dla-osob-w-kryzysie-bezdomnosci/szlakiem-ludzi-bezdomnych"}),
    ("seniorzy wykluczeni cyfrowo", {"dla-seniorow/wirtualne-izby-pamieci", "dla-seniorow/merkury"}),
    ("nauka obsługi biletomatów i kiosków samoobsługowych dla starszych", {"dla-seniorow/merkury"}),
    ("pomoc osobom z demencją i problemami z pamięcią", {
        "dla-seniorow/korytarz-wspomnien", "dla-seniorow/kody-qr-na-pomoc-seniorom",
        "dla-seniorow/sciezka-treningu-umyslu", "dla-seniorow/bawita"}),
    ("jak zapobiegać upadkom seniorów w domu", {"dla-seniorow/obu-obuwie-po-domu"}),
    ("nawigacja w budynku dla osób niewidomych", {
        "dla-osob-z-niepelnosprawnoscia-sensoryczna/ngoz-nawigacja-glosowa-osob-zaleznych",
        "dla-osob-z-niepelnosprawnoscia-sensoryczna/my-way-to-culture",
        "dla-osob-z-niepelnosprawnoscia-sensoryczna/blue-sea-eye"}),
    ("aplikacja w polskim języku migowym", {
        "dla-osob-z-niepelnosprawnoscia-sensoryczna/hear-it",
        "dla-osob-z-niepelnosprawnoscia-sensoryczna/wielodziedzinowy-slownik-terminow-specjalistycznych-pl-pjm",
        "dla-osob-z-niepelnosprawnoscia-sensoryczna/glucha-ankieta"}),
    ("aktywizacja zawodowa kobiet z terenów wiejskich", {"dla-rynku-pracy/mobilna-gielda-pracy"}),
    ("wypalenie zawodowe osób z niepełnosprawnością intelektualną", {"dla-rynku-pracy/niewypaleni"}),
    ("teksty łatwe do czytania ETR", {
        "dla-rynku-pracy/konsultant-etr", "dla-dzieci-mlodziezy-i-rodziny/patryk-i-kropka"}),
    ("rozwój mowy u dzieci w spektrum autyzmu", {
        "dla-dzieci-mlodziezy-i-rodziny/jezykolamacz", "dla-dzieci-mlodziezy-i-rodziny/piosenki-uczestniczace"}),
    ("interwencja w rodzinie z problemem przemocy", {"dla-dzieci-mlodziezy-i-rodziny/mobilna-pomoc-terapeutyczna"}),
    ("informacje dla uchodźców z Afganistanu", {
        "dla-cudzoziemcow/wortal-informacyjny", "dla-cudzoziemcow/dialog-ponad-kulturami-1"}),
    ("przechowywanie insuliny w podróży", {"dla-zdrowia-i-medycyny/cold-box"}),
    ("wsparcie pacjenta z chorobą nowotworową", {
        "dla-zdrowia-i-medycyny/oncotriada", "dla-zdrowia-i-medycyny/drogowskazy-ajkum"}),
    ("napęd elektryczny do wózka inwalidzkiego", {
        "dla-osob-o-ograniczonej-mobilnosci/ev-modul-do-wozkow-inwalidzkich"}),
    ("proteza nogi po amputacji", {
        "dla-osob-o-ograniczonej-mobilnosci/chlap-pro", "dla-osob-o-ograniczonej-mobilnosci/cloudleg",
        "dla-osob-o-ograniczonej-mobilnosci/kompleksowa-pomoc-dla-osob-po-amputacji-konczyny-dolnej"}),
    ("Chlap Pro", {"dla-osob-o-ograniczonej-mobilnosci/chlap-pro"}),
    ("otyłość u osób z niepełnosprawnością intelektualną", {
        "dla-osob-z-niepelnosprawnoscia-intelektualna/stop-otylosci-innowacyjna-metoda-pracy-z-osobami-niepelnosprawnymi-intelektualnie"}),
    ("zdrowe rodzeństwo dziecka z niepełnosprawnością", {"dla-dzieci-mlodziezy-i-rodziny/uwaznione-rodzienstwo"}),
    ("terapia lęku w wirtualnej rzeczywistości", {
        "dla-osob-z-niepelnosprawnoscia-intelektualna/podroz-poza-domem-w-wirtualnej-rzeczywistosci"}),
    ("zdalna rehabilitacja oddechowa", {"dla-zdrowia-i-medycyny/telerehabilitacja-oddechowa"}),
    ("rodzice adopcyjni nastolatka", {"dla-dzieci-mlodziezy-i-rodziny/rodzina-adopcyjna-dorasta"}),
]
