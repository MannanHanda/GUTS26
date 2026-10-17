"""Data-layer behaviour: provenance, freshness and graceful failure."""

import json
import shutil
from datetime import UTC, datetime, timedelta

from app.config import CURATED_DIR, REFERENCE_DIR
from app.providers.repository import DataRepository


def test_curated_sources_are_labelled_curated(repo):
    statuses = {s.source_id: s for s in repo.source_statuses()}
    assert statuses["uofg_accommodation"].status == "curated"
    assert statuses["uofg_accommodation"].retrieval_method == "manual_curation"


def test_geo_snapshot_is_labelled_cached(repo):
    assert {s.source_id: s.status for s in repo.source_statuses()}["geo_routing"] == "cached"


def test_timing_is_estimated_not_sourced(repo):
    assert repo.subway_fares().timing_provenance.status == "estimated"


def test_old_verification_becomes_stale():
    later = DataRepository(now=datetime.now(UTC) + timedelta(days=400))
    assert {s.source_id: s.status for s in later.source_statuses()}["uofg_accommodation"] == "stale"


def test_missing_source_is_unavailable_and_others_still_load(tmp_path):
    curated = tmp_path / "curated"
    shutil.copytree(CURATED_DIR, curated)
    (curated / "spt_subway_fares_2026.json").unlink()
    degraded = DataRepository(curated_dir=curated, reference_dir=REFERENCE_DIR)
    statuses = {s.source_id: s for s in degraded.source_statuses()}
    assert statuses["spt_subway_fares"].status == "unavailable"
    assert statuses["spt_subway_fares"].error
    assert degraded.accommodations(), "other sources keep working"


def test_malformed_source_is_unavailable_not_fabricated(tmp_path):
    curated = tmp_path / "curated"
    shutil.copytree(CURATED_DIR, curated)
    path = curated / "uofg_accommodation_2026_27.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["residences"][0]["rooms"][0].pop("weekly_rent_gbp")
    path.write_text(json.dumps(data), encoding="utf-8")
    broken = DataRepository(curated_dir=curated, reference_dir=REFERENCE_DIR)
    assert broken.accommodations() == []
    assert {s.source_id: s.status for s in broken.source_statuses()}["uofg_accommodation"] == "unavailable"
