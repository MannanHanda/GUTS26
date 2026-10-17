"""Data-integration layer: loads curated datasets and cached API snapshots into domain models.

Each source is loaded independently. A source that fails to load is reported as
``unavailable`` with the error, and the rest of the application keeps working.
Nothing here fabricates a replacement for missing data.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.config import CURATED_DIR, REFERENCE_DIR
from app.models.domain import (
    AccommodationOption,
    Campus,
    ConcessionScheme,
    DataStatus,
    Provenance,
    RouteEstimate,
    SourceStatus,
    SubwayFares,
    SubwayStation,
    TransportMode,
)

log = logging.getLogger(__name__)

ACCOMMODATION_FILE = "uofg_accommodation_2026_27.json"
FARES_FILE = "spt_subway_fares_2026.json"
CAMPUSES_FILE = "campuses.json"
CONCESSIONS_FILE = "concessions.json"
GEO_FILE = "geo_snapshot.json"
GEO_FRESHNESS_DAYS = 90


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower().replace("+", " plus")).strip("-")


def _parse_dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def _freshness(verified: datetime | None, window_days: int | None, now: datetime, base: DataStatus) -> DataStatus:
    if verified and window_days and now - verified > timedelta(days=window_days):
        return "stale"
    return base


class DataRepository:
    def __init__(
        self, curated_dir: Path = CURATED_DIR, reference_dir: Path = REFERENCE_DIR, now: datetime | None = None
    ):
        self.now = now or datetime.now(UTC)
        self._curated = curated_dir
        self._reference = reference_dir
        self._statuses: dict[str, SourceStatus] = {}
        self._accommodations: list[AccommodationOption] = []
        self._accommodations_by_id: dict[str, AccommodationOption] = {}
        self._campuses: dict[str, Campus] = {}
        self._fares: SubwayFares | None = None
        self._stations: list[SubwayStation] = []  # in network order once fares are loaded
        self._concessions: list[ConcessionScheme] = []
        self._geo: dict[str, Any] | None = None
        self._geo_index: dict[str, int] = {}
        self._geo_prov: Provenance | None = None

        for loader in (
            self._load_geo,
            self._load_accommodation,
            self._load_campuses,
            self._load_fares,
            self._load_concessions,
        ):
            loader()
        self._stations = self._stations_in_network_order()

    # ------------------------------------------------------------------ helpers
    def _read(self, path: Path) -> dict[str, Any]:
        return json.loads(path.read_text(encoding="utf-8"))

    def _curated_source(self, raw: dict[str, Any], count: int) -> tuple[Provenance, SourceStatus]:
        src = raw["source"]
        verified = _parse_dt(src.get("last_verified_at"))
        status = _freshness(verified, src.get("freshness_window_days"), self.now, src["status"])
        prov = Provenance(
            source_id=src["source_id"],
            source_name=src["name"],
            source_url=src["source_url"],
            status=status,
            last_verified_at=verified,
            notes=src.get("notes"),
        )
        st = SourceStatus(
            source_id=src["source_id"],
            name=src["name"],
            source_url=src["source_url"],
            retrieval_method="manual_curation",
            status=status,
            last_verified_at=verified,
            freshness_window_days=src.get("freshness_window_days"),
            record_count=count,
            notes=src.get("notes"),
        )
        return prov, st

    def _unavailable(self, source_id: str, name: str, url: str, method: str, exc: Exception) -> None:
        log.error("Source %s unavailable: %s", source_id, exc)
        self._statuses[source_id] = SourceStatus(
            source_id=source_id,
            name=name,
            source_url=url,
            retrieval_method=method,  # type: ignore[arg-type]
            status="unavailable",
            error=f"{type(exc).__name__}: {exc}",
        )

    # ------------------------------------------------------------------ loaders
    def _load_geo(self) -> None:
        try:
            raw = self._read(self._reference / GEO_FILE)
            retrieved = _parse_dt(raw["retrieved_at"])
            status = _freshness(retrieved, GEO_FRESHNESS_DAYS, self.now, "cached")
            n = len(raw["point_ids"])
            for mode in ("walk", "cycle"):
                m = raw["matrices"][mode]["durations_s"]
                if len(m) != n or any(len(r) != n for r in m):
                    raise ValueError(f"{mode} matrix shape mismatch")
            self._geo = raw
            self._geo_index = {pid: i for i, pid in enumerate(raw["point_ids"])}
            notes = (
                "Walking/cycling routes from the FOSSGIS OSRM routers (OpenStreetMap), postcode coordinates "
                "from postcodes.io and Subway station locations from the DfT NaPTAN API, cached at the "
                "retrieval time shown. Refresh with `python -m app.providers.refresh`."
            )
            self._geo_prov = Provenance(
                source_id="geo_routing",
                source_name="OpenStreetMap routing (FOSSGIS) + postcodes.io + NaPTAN",
                source_url="https://routing.openstreetmap.de/",
                status=status,
                retrieved_at=retrieved,
                notes=notes,
            )
            self._stations = [
                SubwayStation(atco_code=code, name=s["name"], latitude=s["lat"], longitude=s["lon"])
                for code, s in raw["subway_stations"].items()
            ]
            self._statuses["geo_routing"] = SourceStatus(
                source_id="geo_routing",
                name=self._geo_prov.source_name,
                source_url=self._geo_prov.source_url,
                retrieval_method="public_api_snapshot",
                status=status,
                retrieved_at=retrieved,
                freshness_window_days=GEO_FRESHNESS_DAYS,
                record_count=n,
                notes=notes,
            )
        except (OSError, ValueError, KeyError, TypeError, ValidationError) as exc:
            self._unavailable(
                "geo_routing",
                "OpenStreetMap routing (FOSSGIS) + postcodes.io + NaPTAN",
                "https://routing.openstreetmap.de/",
                "public_api_snapshot",
                exc,
            )

    def _coords(self, postcode: str) -> tuple[float | None, float | None]:
        if self._geo and postcode in self._geo["postcodes"]:
            p = self._geo["postcodes"][postcode]
            return p["lat"], p["lon"]
        return None, None

    def _load_accommodation(self) -> None:
        try:
            raw = self._read(self._curated / ACCOMMODATION_FILE)
            prov, st = self._curated_source(raw, sum(len(r["rooms"]) for r in raw["residences"]))
            options: list[AccommodationOption] = []
            for res in raw["residences"]:
                for room in res["rooms"]:
                    lat, lon = self._coords(res["postcode"])
                    room_type = room["room_type"]
                    accessible = room.get("accessible")
                    if accessible is None and "accessible" in room_type.lower():
                        accessible = True
                    options.append(
                        AccommodationOption(
                            id=f"{res['residence_id']}--{_slug(room_type)}",
                            residence_id=res["residence_id"],
                            residence_name=res["name"],
                            operator=res["operator"],
                            room_type=room_type,
                            address=res["address"],
                            postcode=res["postcode"],
                            latitude=lat,
                            longitude=lon,
                            weekly_rent_gbp=room["weekly_rent_gbp"],
                            contract_weeks=res["contract_weeks"],
                            contract_start=res["contract_start"],
                            contract_end=res["contract_end"],
                            contract_total_gbp=room["contract_total_gbp"],
                            bills_included=raw["bills_included"],
                            included_services=raw["included_services"],
                            advance_payment_gbp=raw["advance_payment_gbp"],
                            advance_payment_refundable=None,
                            ensuite=room.get("ensuite", res.get("ensuite_all_rooms")),
                            accessible=accessible,
                            studio=room.get("studio", False if res.get("cluster_flat") else None),
                            shared_room=room.get("shared_room", False),
                            published_walk_to_campus=res.get("published_walk_to_campus"),
                            profile_url=res["profile_url"],
                            provenance=prov.model_copy(update={"source_url": res["profile_url"]}),
                        )
                    )
            by_id = {o.id: o for o in options}
            if len(by_id) != len(options):
                raise ValueError("duplicate accommodation ids")
            self._accommodations = options
            self._accommodations_by_id = by_id
            self._statuses[st.source_id] = st
        except (OSError, ValueError, KeyError, TypeError, ValidationError) as exc:
            self._unavailable(
                "uofg_accommodation",
                "University of Glasgow Accommodation Services",
                "https://www.gla.ac.uk/undergraduate/accommodation/fees/",
                "manual_curation",
                exc,
            )

    def _load_campuses(self) -> None:
        try:
            raw = self._read(self._curated / CAMPUSES_FILE)
            for c in raw["campuses"]:
                lat, lon = self._coords(c["postcode"])
                self._campuses[c["campus_id"]] = Campus(**c, latitude=lat, longitude=lon)
            _, st = self._curated_source(raw, len(self._campuses))
            self._statuses[st.source_id] = st
        except (OSError, ValueError, KeyError, TypeError, ValidationError) as exc:
            self._unavailable(
                "uofg_campuses",
                "University of Glasgow campus locations",
                "https://www.gla.ac.uk/explore/maps/",
                "manual_curation",
                exc,
            )

    def _load_fares(self) -> None:
        try:
            raw = self._read(self._curated / FARES_FILE)
            prov, st = self._curated_source(raw, len(raw["season_tickets"]) + 2)
            t = raw["timing_estimate"]
            timing_prov = Provenance(
                source_id="subway_timing_estimate",
                source_name="UK Tram - SPT Subway system overview (secondary)",
                source_url=t["source_url"],
                status="estimated",
                notes=t["notes"],
            )
            self._fares = SubwayFares(
                smartcard_cost_gbp=raw["smartcard_cost_gbp"],
                adult_single_smartcard_gbp=raw["adult_single_smartcard_gbp"],
                adult_daily_smartcard_gbp=raw["adult_daily_smartcard_gbp"],
                season_tickets=raw["season_tickets"],
                network_order=raw["network_order"],
                minutes_per_segment=t["full_circuit_minutes"] / t["stations"],
                average_wait_min=t["peak_headway_minutes"] / 2,
                fares_provenance=prov,
                timing_provenance=timing_prov,
            )
            self._statuses[st.source_id] = st
        except (OSError, ValueError, KeyError, TypeError, ValidationError) as exc:
            self._unavailable(
                "spt_subway_fares",
                "SPT Subway tickets and fares",
                "https://www.spt.co.uk/tickets/subway-tickets/",
                "manual_curation",
                exc,
            )

    def _load_concessions(self) -> None:
        try:
            raw = self._read(self._curated / CONCESSIONS_FILE)
            prov, st = self._curated_source(raw, len(raw["schemes"]))
            self._concessions = [ConcessionScheme(**s, provenance=prov) for s in raw["schemes"]]
            self._statuses[st.source_id] = st
        except (OSError, ValueError, KeyError, TypeError, ValidationError) as exc:
            self._unavailable(
                "transport_scotland_concessions",
                "Transport Scotland concessions",
                "https://www.transport.gov.scot/concessionary-travel/",
                "manual_curation",
                exc,
            )

    # ------------------------------------------------------------------ public API
    def accommodations(self) -> list[AccommodationOption]:
        return list(self._accommodations)

    def accommodation(self, accommodation_id: str) -> AccommodationOption | None:
        return self._accommodations_by_id.get(accommodation_id)

    def campus(self, campus_id: str) -> Campus | None:
        return self._campuses.get(campus_id)

    def subway_fares(self) -> SubwayFares | None:
        return self._fares

    def _stations_in_network_order(self) -> list[SubwayStation]:
        if not self._fares:
            return []
        by_code = {s.atco_code: s for s in self._stations}
        return [by_code[c] for c in self._fares.network_order if c in by_code]

    def subway_stations(self) -> list[SubwayStation]:
        return list(self._stations)

    def concessions(self) -> list[ConcessionScheme]:
        return list(self._concessions)

    def route(self, from_id: str, to_id: str, mode: TransportMode) -> RouteEstimate | None:
        """Cached walking/cycling route between two known points, or None if unknown."""
        if mode not in ("walk", "cycle") or not self._geo or not self._geo_prov:
            return None
        i, j = self._geo_index.get(from_id), self._geo_index.get(to_id)
        if i is None or j is None:
            return None
        m = self._geo["matrices"][mode]
        dur, dist = m["durations_s"][i][j], m["distances_m"][i][j]
        if dur is None or dist is None:
            return None
        return RouteEstimate(duration_min=dur / 60, distance_km=dist / 1000, provenance=self._geo_prov)

    def source_statuses(self) -> list[SourceStatus]:
        return [self._statuses[k] for k in sorted(self._statuses)]

    def dataset_version(self) -> str:
        parts = [f"{s.source_id}:{s.status}:{s.last_verified_at or s.retrieved_at}" for s in self.source_statuses()]
        return "|".join(parts)
