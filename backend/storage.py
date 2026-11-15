"""
Facial Biometric Assessment Guide
Storage for assessment records.

Author: Dee Williamson
November 2026

The API in app.py only talks to the AssessmentStore interface. To move to a
database, write a new class with the same four methods and return it from
create_store().
"""

import json
import os
import re
import tempfile
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

# Record ids are UUIDs created in the browser. Checking the format also stops
# an id from being used to reach files outside the data folder.
ID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


def is_valid_id(record_id: str) -> bool:
    return bool(ID_PATTERN.match(record_id or ""))


class AssessmentStore(ABC):
    """What the API needs from any storage backend."""

    @abstractmethod
    def list(self) -> list:
        """Return a short summary of every saved assessment."""

    @abstractmethod
    def get(self, record_id: str) -> Optional[dict]:
        """Return one saved assessment, or None if it does not exist."""

    @abstractmethod
    def save(self, record_id: str, record: dict, updated_at: int) -> dict:
        """Create or replace an assessment and return what was stored."""

    @abstractmethod
    def delete(self, record_id: str) -> bool:
        """Delete an assessment. Return False if it did not exist."""


class JsonFileStore(AssessmentStore):
    """Keeps each assessment as one JSON file. Suitable for local use only."""

    def __init__(self, folder: Path):
        self.folder = Path(folder)
        self.folder.mkdir(parents=True, exist_ok=True)

    def _path(self, record_id: str) -> Path:
        return self.folder / f"{record_id}.json"

    def list(self) -> list:
        items = []
        for path in sorted(self.folder.glob("*.json")):
            try:
                stored = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue
            record = stored.get("record", {})
            items.append(
                {
                    "id": stored.get("id"),
                    "service": record.get("meta", {}).get("service", ""),
                    "outcome": record.get("decide", {}).get("outcome", ""),
                    "updatedAt": stored.get("updatedAt", 0),
                }
            )
        return sorted(items, key=lambda item: item["updatedAt"], reverse=True)

    def get(self, record_id: str) -> Optional[dict]:
        path = self._path(record_id)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def save(self, record_id: str, record: dict, updated_at: int) -> dict:
        stored = {"id": record_id, "updatedAt": updated_at, "record": record}
        # Write to a temporary file first so a failed write cannot leave a
        # half-written record behind.
        handle, temp_name = tempfile.mkstemp(dir=self.folder, suffix=".tmp")
        with os.fdopen(handle, "w", encoding="utf-8") as temp_file:
            json.dump(stored, temp_file, ensure_ascii=False, indent=2)
        os.replace(temp_name, self._path(record_id))
        return stored

    def delete(self, record_id: str) -> bool:
        path = self._path(record_id)
        if not path.exists():
            return False
        path.unlink()
        return True


def create_store() -> AssessmentStore:
    """Choose the storage backend. Swap this for a database class later."""
    default_folder = Path(__file__).parent / "data" / "assessments"
    return JsonFileStore(Path(os.environ.get("FBAG_DATA_DIR", default_folder)))
