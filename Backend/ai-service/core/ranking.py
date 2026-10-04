RRF_K = 60


def rrf(rankings: dict[str, list], weights: dict[str, float]) -> list[tuple[object, float]]:
    """Reciprocal Rank Fusion: łączy rankingi z różnych metod bez porównywania ich surowych wyników.

    Wynik 0..1: 1 = element pierwszy we wszystkich rankingach.
    """
    scores: dict[object, float] = {}
    for name, ids in rankings.items():
        for rank, item_id in enumerate(ids):
            scores[item_id] = scores.get(item_id, 0) + weights[name] / (RRF_K + rank + 1)
    best_possible = sum(weights.values()) / (RRF_K + 1)
    return sorted(((i, round(s / best_possible, 4)) for i, s in scores.items()), key=lambda x: -x[1])
