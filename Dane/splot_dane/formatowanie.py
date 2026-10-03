"""Zapis liczb po polsku (przecinek dziesiętny, spacja tysięcy)."""

from __future__ import annotations


def liczba_pl(x: float | None, miejsca: int | None = None) -> str:
    if x is None:
        return "brak danych"
    if miejsca is None:
        miejsca = 0 if float(x).is_integer() else 2
    tekst = f"{x:,.{miejsca}f}".replace(",", " ").replace(".", ",")
    return tekst.replace("-", "−") if tekst.startswith("-") else tekst


def z_jednostka(x: float | None, jednostka: str, miejsca: int | None = None) -> str:
    if x is None:
        return "brak danych"
    return f"{liczba_pl(x, miejsca)}{'%' if jednostka == '%' else (' ' + jednostka if jednostka else '')}"


def zmiana_pl(x: float | None, jednostka: str) -> str:
    if x is None:
        return "–"
    znak = "+" if x > 0 else ""
    jedn = " p.p." if jednostka == "%" else ""
    return f"{znak}{liczba_pl(x)}{jedn}"
