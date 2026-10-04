import asyncio
import logging
import time

import httpx

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 300  # dane innowacji zmieniają się tylko przy imporcie — krótki cache oszczędza zapytania


class InnovationsClient:
    """Klient serwisu innovations (Java) — szczegóły innowacji: opis, linki, pliki.

    ai-service nie czyta bazy SQL bezpośrednio: schemat należy do serwisu innovations,
    a my zależymy tylko od jego API (GET /api/innovations/{categorySlug}/{slug}).
    """

    def __init__(self, base_url: str, timeout: float):
        self._http = httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=timeout)
        self._cache: dict[str, tuple[float, dict | None]] = {}

    async def close(self) -> None:
        await self._http.aclose()

    async def get_details(self, innovation_ids: list[str]) -> dict[str, dict | None]:
        """{id: szczegóły albo None gdy brak w bazie}. Rzuca httpx.HTTPError, gdy serwis nie odpowiada."""
        details = await asyncio.gather(*(self._get_one(i) for i in innovation_ids))
        return dict(zip(innovation_ids, details))

    async def _get_one(self, innovation_id: str) -> dict | None:
        cached = self._cache.get(innovation_id)
        if cached and time.monotonic() - cached[0] < CACHE_TTL_SECONDS:
            return cached[1]
        category_slug, slug = innovation_id.split("/", 1)
        response = await self._http.get(f"/api/innovations/{category_slug}/{slug}")
        if response.status_code == 404:
            data = None
        else:
            response.raise_for_status()
            data = response.json()
        self._cache[innovation_id] = (time.monotonic(), data)
        return data

    async def enrich(self, hits: list[dict]) -> bool:
        """Dokleja do wyników wyszukiwania opis i linki z serwisu innovations.

        Zwraca False, gdy serwis jest niedostępny — wyniki zostają wtedy bez szczegółów (wyszukiwanie dalej działa).
        """
        try:
            details = await self.get_details([hit["id"] for hit in hits])
        except httpx.HTTPError as e:
            logger.warning("Serwis innovations niedostępny: %s", e)
            return False
        for hit in hits:
            hit.update(to_hit_details(details.get(hit["id"])))
        return True


def to_hit_details(details: dict | None) -> dict:
    if details is None:
        return {}
    files = details.get("files") or []
    return {
        "short_description": details.get("shortDescription"),
        "description_md": details.get("descriptionMd"),
        "links": {
            "source": details.get("sourceUrl"),
            "video": details.get("videoUrl"),
            "materials": details.get("materialsUrl"),
            "learn_more": [
                {"name": f["fileName"], "url": f["sourceUrl"], "pages": f.get("pdfPages")}
                for f in files if f.get("kind") == "dowiedz_sie_wiecej" and f.get("sourceUrl")
            ],
        },
        "documents_count": sum(1 for f in files if f.get("kind") == "z_zip"),
    }
