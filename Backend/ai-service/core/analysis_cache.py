import asyncio
import json
import sqlite3
import threading
from pathlib import Path


class AnalysisCache:
    """Gotowe analizy w SQLite. Klucz ważności = hash kontekstu + model + wersja promptu:
    zmiana danych (przebudowa bazy wektorowej) albo promptu unieważnia wpis i analiza liczy się od nowa."""

    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock:
            self._db.executescript("""
                CREATE TABLE IF NOT EXISTS analyses (
                    innovation_id TEXT PRIMARY KEY, context_hash TEXT NOT NULL, data TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS comparisons (
                    key TEXT PRIMARY KEY, data TEXT NOT NULL);
            """)

    async def get_analysis(self, innovation_id: str, context_hash: str) -> dict | None:
        row = await asyncio.to_thread(
            self._fetch, "SELECT data FROM analyses WHERE innovation_id = ? AND context_hash = ?",
            (innovation_id, context_hash))
        return json.loads(row[0]) if row else None

    async def put_analysis(self, innovation_id: str, context_hash: str, data: dict) -> None:
        await asyncio.to_thread(self._execute, "INSERT OR REPLACE INTO analyses VALUES (?, ?, ?)",
                                (innovation_id, context_hash, json.dumps(data, ensure_ascii=False)))

    async def get_comparison(self, key: str) -> dict | None:
        row = await asyncio.to_thread(self._fetch, "SELECT data FROM comparisons WHERE key = ?", (key,))
        return json.loads(row[0]) if row else None

    async def put_comparison(self, key: str, data: dict) -> None:
        await asyncio.to_thread(self._execute, "INSERT OR REPLACE INTO comparisons VALUES (?, ?)",
                                (key, json.dumps(data, ensure_ascii=False)))

    async def count(self) -> int:
        return (await asyncio.to_thread(self._fetch, "SELECT count(*) FROM analyses", ()))[0]

    def close(self) -> None:
        self._db.close()

    def _fetch(self, sql, params):
        with self._lock:
            return self._db.execute(sql, params).fetchone()

    def _execute(self, sql, params):
        with self._lock:
            self._db.execute(sql, params)
            self._db.commit()
