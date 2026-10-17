"""Read-only loader for the raw research files in data/rawdata.

These files have no verified provenance (no source URL or verification date), so they are served
for display only, always labelled ``unverified``. Nothing here feeds the decision engine. A file that
fails to load is reported as ``unavailable`` with the error and the other datasets keep working.
"""

from __future__ import annotations

import csv
import logging
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from openpyxl import load_workbook

from app.config import RAWDATA_DIR
from app.models.api import ResearchDataset, ResearchTable

log = logging.getLogger(__name__)

LIST_NOTE = (
    "Raw research data, not verified against official sources. Shown for reference only: "
    "recommendations never use these records."
)


@dataclass(frozen=True)
class _Definition:
    id: str
    title: str
    source_file: str
    notes: str
    reader: Callable[[Path], list[ResearchTable]]


def _clean(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _read_csv(path: Path) -> list[ResearchTable]:
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        rows = [{k: _clean(v) for k, v in row.items() if k is not None} for row in reader]
    return [ResearchTable(name=path.name, columns=columns, rows=rows)]


def _read_xlsx(path: Path) -> list[ResearchTable]:
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        tables: list[ResearchTable] = []
        for sheet in workbook.worksheets:
            raw_rows = [r for r in sheet.iter_rows(values_only=True) if any(c is not None for c in r)]
            if not raw_rows:
                continue
            columns = [_clean(c) or f"column_{i + 1}" for i, c in enumerate(raw_rows[0])]
            rows = [{col: _clean(val) for col, val in zip(columns, row, strict=False)} for row in raw_rows[1:]]
            tables.append(ResearchTable(name=sheet.title, columns=columns, rows=rows))
        return tables
    finally:
        workbook.close()


DEFINITIONS: tuple[_Definition, ...] = (
    _Definition(
        id="accommodation-catalogue",
        title="Private student residences (research list)",
        source_file="accomodation_distance_to_unis.csv",
        notes=(
            "Private-operator residences with rent, contract length and facilities as listed in the research file. "
            "These are not University of Glasgow residences. Distances are cached from public APIs and no save "
            "date is recorded. The duplicate copies of this list in the same folder are not served."
        ),
        reader=_read_csv,
    ),
    _Definition(
        id="nearby-stores",
        title="Supermarkets near each residence (research list)",
        source_file="accomodation_nearby_stores.csv",
        notes=(
            "Up to three stores per residence. The store list is typed into fetch_nearby_stores.py and labelled "
            "'verified' there, but no check date is recorded."
        ),
        reader=_read_csv,
    ),
    _Definition(
        id="transport-research",
        title="Student transport research",
        source_file="glasgow_student_transport_research.xlsx",
        notes=(
            "Transport modes, concessions and planners. The workbook marks fares as research leads, not confirmed. "
            "Check live fares and eligibility with the operator."
        ),
        reader=_read_xlsx,
    ),
    _Definition(
        id="bank-accounts",
        title="Student bank account comparison (research)",
        source_file="glasgow_student_bank_accounts_dataset (1).xlsx",
        notes=(
            "Banks and money apps for international students, with a verification checklist. Every entry is marked "
            "'Research lead', with current terms not live-verified, even though its verification-date column shows "
            "2026-10-17."
        ),
        reader=_read_xlsx,
    ),
)


class ResearchRepository:
    def __init__(self, rawdata_dir: Path = RAWDATA_DIR, definitions: tuple[_Definition, ...] = DEFINITIONS):
        self._datasets: dict[str, ResearchDataset] = {}
        for definition in definitions:
            self._datasets[definition.id] = self._load(rawdata_dir, definition)

    def _load(self, rawdata_dir: Path, definition: _Definition) -> ResearchDataset:
        base = {
            "id": definition.id,
            "title": definition.title,
            "source_file": definition.source_file,
            "notes": definition.notes,
        }
        try:
            tables = definition.reader(rawdata_dir / definition.source_file)
            return ResearchDataset(status="unverified", tables=tables, **base)
        except Exception as exc:  # any read or parse failure makes just this dataset unavailable
            log.error("Research dataset %s unavailable: %s", definition.id, exc)
            return ResearchDataset(status="unavailable", error=f"{type(exc).__name__}: {exc}", **base)

    def datasets(self) -> list[ResearchDataset]:
        return list(self._datasets.values())

    def dataset(self, dataset_id: str) -> ResearchDataset | None:
        return self._datasets.get(dataset_id)
