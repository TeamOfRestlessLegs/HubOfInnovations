"""Splot – dane z Internetowego Obserwatora Statystyk Społecznych i wypełnianie wniosków."""

from pathlib import Path

KATALOG_GLOWNY = Path(__file__).resolve().parent.parent
KATALOG_DANYCH = KATALOG_GLOWNY / "data"
KATALOG_KONFIGURACJI = KATALOG_GLOWNY / "config"
SCIEZKA_BAZY = KATALOG_DANYCH / "obserwator.sqlite"

ZRODLO_SERWISU = "Internetowy Obserwator Statystyk Społecznych ROPS Kraków (obserwator.rops.krakow.pl)"
