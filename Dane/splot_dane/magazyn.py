"""Przechowywanie danych: SQLite (data/obserwator.sqlite) i eksport CSV.

Każdy zapis to „wstaw albo zaktualizuj”, więc ponowne wczytanie tych samych
danych nie tworzy duplikatów.
"""

from __future__ import annotations

import csv
import json
import sqlite3
from pathlib import Path

from splot_dane import KATALOG_DANYCH, SCIEZKA_BAZY

SCHEMAT = """
CREATE TABLE IF NOT EXISTS gminy (
    id                 INTEGER PRIMARY KEY,
    kod_teryt          TEXT UNIQUE,          -- Obserwator nie podaje TERYT; NULL
    nazwa              TEXT NOT NULL,
    typ                TEXT,                 -- miejska / wiejska / miasto na prawach powiatu / NULL (brak w źródle)
    powiat             TEXT NOT NULL,
    nazwa_zrodlowa     TEXT NOT NULL,        -- np. 'Tarnów (wieś)', 'powiat m. Tarnów'
    id_w_obserwatorze  INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS gminy_klucz ON gminy(nazwa, IFNULL(typ, ''), powiat);

CREATE TABLE IF NOT EXISTS wskazniki (
    id                   INTEGER PRIMARY KEY,
    kod                  TEXT UNIQUE,        -- nadawany w config/wskazniki.yaml
    id_w_obserwatorze    INTEGER NOT NULL UNIQUE,
    nazwa                TEXT NOT NULL,
    kategoria            TEXT,
    jednostka            TEXT,
    opis                 TEXT,
    zrodlo               TEXT,
    poziomy              TEXT,               -- np. 'województwo;powiaty;gminy'
    domyslny_rok         INTEGER,
    obszar_wyzwania      TEXT,
    wyzej_znaczy_gorzej  INTEGER             -- 1 / 0 / NULL (nieokreślone)
);

CREATE TABLE IF NOT EXISTS wartosci (
    wskaznik_id  INTEGER NOT NULL REFERENCES wskazniki(id),
    gmina_id     INTEGER NOT NULL REFERENCES gminy(id),
    rok          INTEGER NOT NULL,
    wartosc      REAL,                       -- NULL = brak danych w źródle
    szczegoly    TEXT,                       -- JSON z licznikiem/mianownikiem z eksportu
    UNIQUE (wskaznik_id, gmina_id, rok)
);

-- dane powiatowe: zapas, gdy wskaźnik nie ma wartości dla gminy
CREATE TABLE IF NOT EXISTS wartosci_powiatow (
    wskaznik_id  INTEGER NOT NULL REFERENCES wskazniki(id),
    powiat       TEXT NOT NULL,
    rok          INTEGER NOT NULL,
    wartosc      REAL,
    szczegoly    TEXT,
    UNIQUE (wskaznik_id, powiat, rok)
);

-- kiedy dane danego wskaźnika i roku faktycznie pobrano z Obserwatora (data pliku w data/raw/)
CREATE TABLE IF NOT EXISTS pobrania (
    wskaznik_id  INTEGER NOT NULL REFERENCES wskazniki(id),
    rok          INTEGER NOT NULL,
    pobrano      TEXT NOT NULL,              -- data ISO, np. 2026-10-03
    UNIQUE (wskaznik_id, rok)
);
"""


class Magazyn:
    def __init__(self, sciezka: Path | str | None = None):
        self.sciezka = Path(sciezka) if sciezka else SCIEZKA_BAZY
        if str(self.sciezka) != ":memory:":
            self.sciezka.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(self.sciezka))
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA foreign_keys = ON")
        self.db.executescript(SCHEMAT)

    def zamknij(self) -> None:
        self.db.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.db.commit()
        self.zamknij()

    def zatwierdz(self) -> None:
        self.db.commit()

    # --- gminy ---------------------------------------------------------------

    def zapisz_gmine(self, g: dict) -> int:
        """Wstaw albo zaktualizuj gminę. Klucz: TERYT, a bez niego (nazwa, typ, powiat)."""
        wiersz = None
        if g.get("kod_teryt"):
            wiersz = self.db.execute("SELECT id FROM gminy WHERE kod_teryt = ?", (g["kod_teryt"],)).fetchone()
        if wiersz is None:
            wiersz = self.db.execute(
                "SELECT id FROM gminy WHERE nazwa = ? AND IFNULL(typ, '') = IFNULL(?, '') AND powiat = ?",
                (g["nazwa"], g.get("typ"), g["powiat"]),
            ).fetchone()
        pola = (g.get("kod_teryt"), g["nazwa"], g.get("typ"), g["powiat"], g["nazwa_zrodlowa"], g.get("id_w_obserwatorze"))
        if wiersz:
            self.db.execute(
                "UPDATE gminy SET kod_teryt=?, nazwa=?, typ=?, powiat=?, nazwa_zrodlowa=?, id_w_obserwatorze=? WHERE id=?",
                (*pola, wiersz["id"]),
            )
            return wiersz["id"]
        kursor = self.db.execute(
            "INSERT INTO gminy (kod_teryt, nazwa, typ, powiat, nazwa_zrodlowa, id_w_obserwatorze) VALUES (?,?,?,?,?,?)",
            pola,
        )
        return kursor.lastrowid

    def mapa_nazw_zrodlowych(self) -> dict[str, int]:
        """nazwa_zrodlowa -> id gminy (nazwy źródłowe są w Obserwatorze unikalne)."""
        return {r["nazwa_zrodlowa"]: r["id"] for r in self.db.execute("SELECT id, nazwa_zrodlowa FROM gminy")}

    # --- wskaźniki -----------------------------------------------------------

    def zapisz_wskaznik(self, w: dict) -> int:
        """Wstaw albo zaktualizuj wskaźnik po id_w_obserwatorze. Pola nieprzekazane zostają bez zmian."""
        kolumny = [k for k in (
            "kod", "nazwa", "kategoria", "jednostka", "opis", "zrodlo", "poziomy",
            "domyslny_rok", "obszar_wyzwania", "wyzej_znaczy_gorzej",
        ) if k in w]
        wiersz = self.db.execute(
            "SELECT id FROM wskazniki WHERE id_w_obserwatorze = ?", (w["id_w_obserwatorze"],)
        ).fetchone()
        if wiersz:
            if kolumny:
                self.db.execute(
                    f"UPDATE wskazniki SET {', '.join(f'{k}=?' for k in kolumny)} WHERE id=?",
                    (*[w[k] for k in kolumny], wiersz["id"]),
                )
            return wiersz["id"]
        if "nazwa" not in w:
            w = {**w, "nazwa": f"wskaźnik {w['id_w_obserwatorze']}"}
            kolumny = ["nazwa", *kolumny]
        kolumny = ["id_w_obserwatorze", *kolumny]
        kursor = self.db.execute(
            f"INSERT INTO wskazniki ({', '.join(kolumny)}) VALUES ({', '.join('?' * len(kolumny))})",
            [w[k] for k in kolumny],
        )
        return kursor.lastrowid

    def wskaznik(self, *, kod: str | None = None, id_w_obserwatorze: int | None = None) -> sqlite3.Row | None:
        if kod is not None:
            return self.db.execute("SELECT * FROM wskazniki WHERE kod = ?", (kod,)).fetchone()
        return self.db.execute("SELECT * FROM wskazniki WHERE id_w_obserwatorze = ?", (id_w_obserwatorze,)).fetchone()

    # --- wartości ------------------------------------------------------------

    def zapisz_wartosc(self, wskaznik_id: int, gmina_id: int, rok: int, wartosc: float | None, szczegoly: dict | None = None) -> None:
        self.db.execute(
            """INSERT INTO wartosci (wskaznik_id, gmina_id, rok, wartosc, szczegoly) VALUES (?,?,?,?,?)
               ON CONFLICT (wskaznik_id, gmina_id, rok) DO UPDATE SET wartosc=excluded.wartosc, szczegoly=excluded.szczegoly""",
            (wskaznik_id, gmina_id, rok, wartosc, json.dumps(szczegoly or {}, ensure_ascii=False)),
        )

    def zapisz_wartosc_powiatu(self, wskaznik_id: int, powiat: str, rok: int, wartosc: float | None, szczegoly: dict | None = None) -> None:
        self.db.execute(
            """INSERT INTO wartosci_powiatow (wskaznik_id, powiat, rok, wartosc, szczegoly) VALUES (?,?,?,?,?)
               ON CONFLICT (wskaznik_id, powiat, rok) DO UPDATE SET wartosc=excluded.wartosc, szczegoly=excluded.szczegoly""",
            (wskaznik_id, powiat, rok, wartosc, json.dumps(szczegoly or {}, ensure_ascii=False)),
        )

    def zapisz_pobranie(self, wskaznik_id: int, rok: int, pobrano: str) -> None:
        self.db.execute(
            """INSERT INTO pobrania (wskaznik_id, rok, pobrano) VALUES (?,?,?)
               ON CONFLICT (wskaznik_id, rok) DO UPDATE SET pobrano=excluded.pobrano""",
            (wskaznik_id, rok, pobrano),
        )

    def data_pobrania(self, wskaznik_id: int, rok: int) -> str | None:
        r = self.db.execute("SELECT pobrano FROM pobrania WHERE wskaznik_id = ? AND rok = ?", (wskaznik_id, rok)).fetchone()
        return r[0] if r else None

    def liczba_wierszy(self, tabela: str) -> int:
        assert tabela in {"gminy", "wskazniki", "wartosci", "wartosci_powiatow", "pobrania"}
        return self.db.execute(f"SELECT COUNT(*) FROM {tabela}").fetchone()[0]

    # --- eksport -------------------------------------------------------------

    def eksportuj_wartosci_csv(self, sciezka: Path | None = None) -> Path:
        """Format długi: gmina, typ, powiat, wskaźnik, kod, rok, wartość, jednostka."""
        sciezka = sciezka or KATALOG_DANYCH / "wartosci.csv"
        wiersze = self.db.execute(
            """SELECT g.nazwa AS gmina, g.typ, g.powiat, w.nazwa AS wskaznik, w.kod, v.rok, v.wartosc, w.jednostka
               FROM wartosci v JOIN gminy g ON g.id = v.gmina_id JOIN wskazniki w ON w.id = v.wskaznik_id
               ORDER BY w.kod, v.rok, g.powiat, g.nazwa"""
        ).fetchall()
        with open(sciezka, "w", newline="", encoding="utf-8") as f:
            pis = csv.writer(f)
            pis.writerow(["gmina", "typ_gminy", "powiat", "wskaznik", "kod_wskaznika", "rok", "wartosc", "jednostka"])
            for r in wiersze:
                pis.writerow([r["gmina"], r["typ"] or "", r["powiat"], r["wskaznik"], r["kod"] or "", r["rok"],
                              "" if r["wartosc"] is None else r["wartosc"], r["jednostka"] or ""])
        return sciezka

    def eksportuj_katalog_csv(self, sciezka: Path | None = None) -> Path:
        sciezka = sciezka or KATALOG_DANYCH / "katalog_wskaznikow.csv"
        wiersze = self.db.execute("SELECT * FROM wskazniki ORDER BY id").fetchall()
        with open(sciezka, "w", newline="", encoding="utf-8") as f:
            pis = csv.writer(f)
            pis.writerow(["id", "nazwa", "kategoria", "jednostka", "opis", "dostepne_poziomy", "zrodlo", "domyslny_rok"])
            for r in wiersze:
                pis.writerow([r["id_w_obserwatorze"], r["nazwa"], r["kategoria"] or "", r["jednostka"] or "",
                              r["opis"] or "", r["poziomy"] or "", r["zrodlo"] or "", r["domyslny_rok"] or ""])
        return sciezka
