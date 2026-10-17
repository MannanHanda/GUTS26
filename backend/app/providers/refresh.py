"""Refresh the cached geographic snapshot from public APIs.

Run from ``backend/``:  ``python -m app.providers.refresh``

Sources (all public, no API key):
  * postcodes.io            - postcode -> latitude/longitude (ONS data)
  * NaPTAN API (DfT)        - Glasgow Subway station locations
  * FOSSGIS OSRM routers    - walking and cycling distance/duration (OpenStreetMap)

The snapshot is validated before it replaces the previous file. On any failure the
last known good snapshot is preserved and the error is reported with a non-zero exit.
"""

from __future__ import annotations

import csv
import io
import json
import sys
from datetime import UTC, datetime

import httpx

from app.config import CURATED_DIR, REFERENCE_DIR

POSTCODES_URL = "https://api.postcodes.io/postcodes"
NAPTAN_URL = "https://naptan.api.dft.gov.uk/v1/access-nodes?atcoAreaCodes=940&dataFormat=csv"
OSRM_URLS = {
    "walk": "https://routing.openstreetmap.de/routed-foot/table/v1/driving/",
    "cycle": "https://routing.openstreetmap.de/routed-bike/table/v1/driving/",
}
SNAPSHOT_FILE = REFERENCE_DIR / "geo_snapshot.json"
TIMEOUT = httpx.Timeout(30.0)
USER_AGENT = "Uniwise/0.1 (GUTS hackathon; data refresh)"


class RefreshError(RuntimeError):
    pass


def _load(name: str) -> dict:
    return json.loads((CURATED_DIR / name).read_text(encoding="utf-8"))


def fetch_postcodes(client: httpx.Client, postcodes: list[str]) -> dict[str, dict]:
    resp = client.post(POSTCODES_URL, json={"postcodes": postcodes})
    resp.raise_for_status()
    out: dict[str, dict] = {}
    for item in resp.json().get("result", []):
        res = item.get("result")
        if not res:
            raise RefreshError(f"postcodes.io could not resolve {item.get('query')!r}")
        out[item["query"]] = {"lat": float(res["latitude"]), "lon": float(res["longitude"])}
    missing = set(postcodes) - set(out)
    if missing:
        raise RefreshError(f"postcodes.io response missing {sorted(missing)}")
    return out


def fetch_subway_stations(client: httpx.Client, atco_codes: list[str]) -> dict[str, dict]:
    resp = client.get(NAPTAN_URL)
    resp.raise_for_status()
    wanted = set(atco_codes)
    stations: dict[str, dict] = {}
    for row in csv.DictReader(io.StringIO(resp.content.decode("utf-8-sig"))):
        if row["ATCOCode"] in wanted and row["Status"] == "active":
            stations[row["ATCOCode"]] = {
                "name": row["CommonName"].replace(" SPT Subway Station", ""),
                "lat": float(row["Latitude"]),
                "lon": float(row["Longitude"]),
                "naptan_modified": row["ModificationDateTime"],
            }
    missing = wanted - set(stations)
    if missing:
        raise RefreshError(f"NaPTAN response missing Subway stations {sorted(missing)}")
    return stations


def fetch_matrix(client: httpx.Client, base_url: str, points: list[tuple[float, float]]) -> dict:
    coords = ";".join(f"{lon:.6f},{lat:.6f}" for lat, lon in points)
    resp = client.get(base_url + coords, params={"annotations": "duration,distance"})
    resp.raise_for_status()
    body = resp.json()
    if body.get("code") != "Ok":
        raise RefreshError(f"OSRM returned code {body.get('code')!r}")
    n = len(points)
    for key in ("durations", "distances"):
        m = body.get(key)
        if not m or len(m) != n or any(len(r) != n for r in m):
            raise RefreshError(f"OSRM {key} matrix has the wrong shape")
    return {"durations_s": body["durations"], "distances_m": body["distances"]}


def build_snapshot(client: httpx.Client) -> dict:
    accom = _load("uofg_accommodation_2026_27.json")
    campuses = _load("campuses.json")["campuses"]
    fares = _load("spt_subway_fares_2026.json")

    postcodes = sorted({r["postcode"] for r in accom["residences"]} | {c["postcode"] for c in campuses})
    geo = fetch_postcodes(client, postcodes)
    stations = fetch_subway_stations(client, fares["network_order"])

    # One matrix over every point: residences, campuses, stations.
    point_ids: list[str] = []
    points: list[tuple[float, float]] = []
    for r in accom["residences"]:
        point_ids.append(f"residence:{r['residence_id']}")
        points.append((geo[r["postcode"]]["lat"], geo[r["postcode"]]["lon"]))
    for c in campuses:
        point_ids.append(f"campus:{c['campus_id']}")
        points.append((geo[c["postcode"]]["lat"], geo[c["postcode"]]["lon"]))
    for code in fares["network_order"]:
        point_ids.append(f"station:{code}")
        points.append((stations[code]["lat"], stations[code]["lon"]))

    retrieved_at = datetime.now(UTC).replace(microsecond=0).isoformat()
    matrices = {mode: fetch_matrix(client, url, points) for mode, url in OSRM_URLS.items()}
    return {
        "retrieved_at": retrieved_at,
        "sources": {
            "postcodes_io": {"url": POSTCODES_URL, "retrieved_at": retrieved_at},
            "naptan": {"url": NAPTAN_URL, "retrieved_at": retrieved_at},
            "osrm_fossgis": {"url": "https://routing.openstreetmap.de/", "retrieved_at": retrieved_at},
        },
        "postcodes": geo,
        "subway_stations": stations,
        "point_ids": point_ids,
        "matrices": matrices,
    }


def validate_snapshot(snap: dict) -> None:
    n = len(snap["point_ids"])
    if n < 3:
        raise RefreshError("snapshot has too few points")
    for mode, m in snap["matrices"].items():
        for row in m["durations_s"]:
            if len(row) != n or any(v is not None and v < 0 for v in row):
                raise RefreshError(f"invalid {mode} durations")


def main() -> int:
    try:
        with httpx.Client(timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            snap = build_snapshot(client)
        validate_snapshot(snap)
    except (httpx.HTTPError, RefreshError, KeyError, ValueError) as exc:
        kept = "kept previous snapshot" if SNAPSHOT_FILE.exists() else "no previous snapshot exists"
        print(f"Refresh FAILED ({type(exc).__name__}: {exc}); {kept}.", file=sys.stderr)
        return 1
    tmp = SNAPSHOT_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(snap, indent=1), encoding="utf-8")
    tmp.replace(SNAPSHOT_FILE)
    print(f"Snapshot written to {SNAPSHOT_FILE} ({len(snap['point_ids'])} points, {snap['retrieved_at']}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
