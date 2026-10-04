"""Układ stron wzoru wniosku (PDF) – żeby wpisać odpowiedzi w oryginalny dokument, zachowując jego wygląd.

Front (pdf-lib) składa wypełniony wniosek z kawałków oryginalnych stron: wstawia odpowiedź pod nagłówkiem /
instrukcją pola (pustą ramkę ze wzoru zastępuje ramką o potrzebnej wysokości), a resztę strony przesuwa w dół.
Do tego potrzebuje od nas (współrzędne w punktach PDF, liczone od GÓRY strony):
  - pasa treści każdej strony (nad nim nagłówek z logotypami, pod nim stopka – powtarzane na stronach dodatkowych),
  - bezpiecznych miejsc cięcia (przerwy między wierszami tekstu),
  - miejsca na odpowiedź dla każdego pola (`Slot`), znalezionego po nagłówku i końcu instrukcji ze wzoru.
"""

import io
import re
from dataclasses import dataclass

import pdfplumber

HEADER_ZONE = 0.16      # obrazy w górnych 16% strony to nagłówek (logotypy)
FOOTER_ZONE = 0.84
MARGIN = 36.0           # pas nagłówka / stopki, gdy strona nie ma logotypów
MAX_BOX = 260.0         # wyższa „ramka” to już raczej tabela albo obramowanie strony
LIST_MARKS = {"•", "-", "–", "−", "o", "▪", "·"}
EDGE_MERGE = 1.5        # podwójne krawędzie (ramka rysowana jako cienki prostokąt) traktujemy jak jedną


@dataclass
class Word:
    page: int
    text: str
    norm: str
    x0: float
    x1: float
    top: float
    bottom: float


def _norm(text: str) -> str:
    return re.sub(r"[^\w]", "", text.lower())


def tokens(text: str) -> list[str]:
    return [t for t in (_norm(w) for w in text.split()) if t]


class Layout:
    def __init__(self, pdf: bytes):
        self.pages: list[dict] = []
        self.words: list[Word] = []
        self._edges: list[list[dict]] = []
        self._box_cache: dict[int, list] = {}
        with pdfplumber.open(io.BytesIO(pdf)) as doc:
            for i, page in enumerate(doc.pages):
                w, h = float(page.width), float(page.height)
                words = page.extract_words(keep_blank_chars=False, use_text_flow=False)
                top = max([float(im["bottom"]) for im in page.images if im["top"] < h * HEADER_ZONE] + [MARGIN]) + 0.5
                bottom = min([float(im["top"]) for im in page.images if im["bottom"] > h * FOOTER_ZONE] + [h - MARGIN]) - 0.5
                body = [x for x in words if x["bottom"] > top and x["top"] < bottom]
                self.words += [Word(i, x["text"], _norm(x["text"]), x["x0"], x["x1"], x["top"], x["bottom"])
                               for x in body if _norm(x["text"])]
                self._edges.append(sorted((e for e in page.edges if e["orientation"] == "h"), key=lambda e: e["top"]))
                self.pages.append({
                    "width": round(w, 2), "height": round(h, 2), "top": round(top, 1), "bottom": round(bottom, 1),
                    "cuts": self._cuts(body, top, bottom),
                    # gdzie kończy się treść strony (tekst, ramki) – pod tym tylko biały margines
                    "last": round(max([x["bottom"] for x in body] + [e["bottom"] for e in page.edges
                                      if top < e["bottom"] < bottom] + [top]), 1),
                    "x0": round(min((x["x0"] for x in body), default=MARGIN * 2), 1),
                    "x1": round(max((x["x1"] for x in body), default=w - MARGIN * 2), 1),
                })

    @staticmethod
    def _cuts(words: list[dict], top: float, bottom: float) -> list[float]:
        """Środki przerw między wierszami – tam można przeciąć stronę bez przecinania tekstu."""
        bands: list[list[float]] = []
        for x in sorted(words, key=lambda x: x["top"]):
            if bands and x["top"] < bands[-1][1] - 1:
                bands[-1][1] = max(bands[-1][1], x["bottom"])
            else:
                bands.append([x["top"], x["bottom"]])
        cuts = [top] + [round((a[1] + b[0]) / 2, 1) for a, b in zip(bands, bands[1:]) if b[0] - a[1] >= 1] + [bottom]
        return sorted(set(cuts))

    # ------------------------------------------------------------------ szukanie tekstu

    def find(self, text: str, start: int = 0, longest: int = 8) -> tuple[int, int] | None:
        """(pierwsze, ostatnie) słowo pierwszego wystąpienia początku `text` – najpierw 8 słów, potem coraz mniej."""
        toks = tokens(text)
        for n in range(min(longest, len(toks)), min(3, len(toks)) - 1, -1):
            want = toks[:n]
            for i in range(start, len(self.words) - n + 1):
                if all(self.words[i + k].norm == want[k] for k in range(n)):
                    return i, i + n - 1
        return None

    def find_end(self, text: str, start: int, stop: int) -> int | None:
        """Ostatnie słowo KOŃCÓWKI `text` (ostatnie słowa instrukcji pola) w słowach [start, stop)."""
        toks = tokens(text)
        for n in range(min(8, len(toks)), min(2, len(toks)) - 1, -1):
            want = toks[-n:]
            for i in range(start, min(len(self.words), stop) - n + 1):
                if all(self.words[i + k].norm == want[k] for k in range(n)):
                    return i + n - 1
        return None

    # ------------------------------------------------------------------ miejsce na odpowiedź

    def _through_list(self, idx: int, stop: int) -> int:
        """Koniec instrukcji bywa podany w środku listy opcji / zdania – idziemy dalej, dopóki kolejne wiersze to
        ciąg dalszy (mała litera) albo punkty listy („b)”, „c.”, „•”). Zatrzymuje nas nagłówek następnej sekcji."""
        for _ in range(40):
            line = (self.words[idx].page, self.words[idx].top)
            j = idx + 1
            while j < stop and (self.words[j].page, self.words[j].top) <= (line[0], line[1] + 2):
                j += 1
            if j >= stop:
                return idx
            first = self.words[j].text
            if not (re.fullmatch(r"[a-zA-Z][).]", first) or first in LIST_MARKS or first[:1].islower()):
                return idx
            k = j
            while k + 1 < stop and self.words[k + 1].page == self.words[j].page and abs(self.words[k + 1].top - self.words[j].top) < 2:
                k += 1
            idx = k
        return idx

    def _line_bottom(self, w: Word) -> float:
        return max(x.bottom for x in self.words if x.page == w.page and abs(x.top - w.top) < 2)

    def _boxes(self, page: int) -> list[tuple[float, float, float, float]]:
        """Puste ramki strony: dwie kolejne poziome krawędzie o tej samej szerokości, bez tekstu między nimi."""
        if page in self._box_cache:
            return self._box_cache[page]
        p = self.pages[page]
        merged: list[dict] = []
        for e in self._edges[page]:
            if e["width"] < p["width"] * 0.3 or not (p["top"] - 1 <= e["top"] <= p["bottom"] + 1):
                continue
            if merged and e["top"] - merged[-1]["top"] <= EDGE_MERGE and abs(e["x0"] - merged[-1]["x0"]) < 3:
                merged[-1] = {**merged[-1], "bottom": max(merged[-1]["bottom"], e["bottom"])}
                continue
            merged.append(dict(e))
        boxes = []
        for a, b in zip(merged, merged[1:]):
            if abs(a["x0"] - b["x0"]) > 3 or abs(a["x1"] - b["x1"]) > 3 or not 8 < b["top"] - a["top"] < MAX_BOX:
                continue
            if any(w.page == page and a["top"] < w.top and w.bottom < b["top"] + 1 and w.x0 >= a["x0"] - 1
                   and w.x1 <= a["x1"] + 1 for w in self.words):
                continue
            boxes.append((a["top"] - 0.5, b["bottom"] + 0.5, a["x0"], a["x1"]))
        self._box_cache[page] = boxes
        return boxes

    def slots(self, fields: list[tuple[str, str]]) -> list[dict | None]:
        """Miejsce odpowiedzi każdego pola [(anchor, after)]: pierwsza pusta ramka między jego nagłówkiem a nagłówkiem
        następnego pola; bez ramki – pod końcem instrukcji (`after`), a gdy jej nie znajdziemy – tuż przed
        następnym polem. Nagłówków szukamy po kolei, żeby powtórzone słowa nie myliły pól."""
        found: list[tuple[int, int] | None] = []
        pos = 0
        for anchor, _ in fields:
            hit = self.find(anchor, pos) or self.find(anchor)
            found.append(hit)
            if hit:
                pos = hit[1] + 1
        starts = sorted(h[0] for h in found if h)
        result = []
        for (anchor, after), hit in zip(fields, found):
            if hit is None:
                result.append(None)
                continue
            a0, a1 = hit
            nxt = next((s for s in starts if s > a0), None)
            stop = nxt if nxt is not None else min(len(self.words), a1 + 400)
            head = self.words[a1]
            here = (head.page, self._line_bottom(head))
            limit = (self.words[nxt].page, self.words[nxt].top) if nxt is not None else (head.page + 1, 1e9)
            box = next(((pg, b) for pg in range(here[0], limit[0] + 1) if pg < len(self.pages) for b in self._boxes(pg)
                        if here <= (pg, b[0] + 1) and (pg, b[1] - 1) <= limit), None)
            if box:
                page, (y0, y1, x0, x1) = box
            else:
                end = self.find_end(after, a0, stop) if after.strip() else None
                if end is not None:
                    end = self._through_list(end, stop)
                if end is None and nxt is not None and stop - 1 > a1:
                    end = stop - 1          # tuż przed następnym polem (za całą instrukcją / listą / tabelą)
                w = self.words[end if end is not None else a1]
                page, y0 = w.page, self._line_bottom(w) + 3
                y1, x0, x1 = y0, self.pages[page]["x0"], self.pages[page]["x1"]
            result.append({"page": page, "y": round(y0, 1), "y_end": round(y1, 1), "x0": round(x0, 1),
                           "x1": round(x1, 1), "box": box is not None})
        return result

    def slot(self, anchor: str, after: str) -> dict | None:
        return self.slots([(anchor, after)])[0]
