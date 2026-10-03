import math
import re
from collections import Counter, defaultdict

# Prymitywny "stemming" dla polskiego: obcinamy słowa do rdzenia o stałej długości,
# dzięki czemu "bezdomność" / "bezdomności" / "bezdomnych" dają ten sam token "bezdom".
STEM_LENGTH = 6

STOPWORDS = {
    "dla", "oraz", "które", "który", "która", "którzy", "jest", "się", "nie", "tak", "jak", "aby", "czy",
    "lub", "przez", "jego", "jej", "ich", "tym", "tego", "ten", "ta", "to", "też", "są", "być", "może",
    "można", "przy", "pod", "nad", "bez", "ale", "też", "jako", "gdzie", "kiedy", "co", "na", "w", "z",
    "do", "od", "po", "za", "o", "i", "a", "u", "we", "ze", "mój", "moja", "nasz", "innowacja", "innowacji",
}


def tokenize(text: str) -> list[str]:
    return [
        word[:STEM_LENGTH]
        for word in re.findall(r"\w+", text.lower())
        if len(word) > 2 and word not in STOPWORDS and not word.isdigit()
    ]


class BM25:
    """BM25 w pamięci (indeks odwrócony) — dopasowanie słów kluczowych, którego brakuje wyszukiwaniu wektorowemu."""

    def __init__(self, documents: list[str], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        tokenized = [tokenize(doc) for doc in documents]
        self.doc_lengths = [len(tokens) for tokens in tokenized]
        self.avg_length = sum(self.doc_lengths) / max(len(tokenized), 1)
        self.postings: dict[str, list[tuple[int, int]]] = defaultdict(list)
        for doc_index, tokens in enumerate(tokenized):
            for term, freq in Counter(tokens).items():
                self.postings[term].append((doc_index, freq))
        n = len(tokenized)
        self.idf = {term: math.log(1 + (n - len(p) + 0.5) / (len(p) + 0.5)) for term, p in self.postings.items()}

    def scores(self, query: str) -> dict[int, float]:
        """Zwraca {indeks_dokumentu: wynik} tylko dla dokumentów zawierających któreś słowo zapytania."""
        scores: dict[int, float] = defaultdict(float)
        for term in set(tokenize(query)):
            for doc_index, freq in self.postings.get(term, ()):
                norm = 1 - self.b + self.b * self.doc_lengths[doc_index] / self.avg_length
                scores[doc_index] += self.idf[term] * freq * (self.k1 + 1) / (freq + self.k1 * norm)
        return scores
