"""Integration tests: HTTP request -> validation -> data -> decision engine -> response contract."""

import pytest


def _profile(**overrides):
    base = {"campus_id": "gilmorehill", "constraints": {"max_monthly_budget_gbp": 900}}
    base.update(overrides)
    return {"profile": base}


def test_health_reports_datasets(client):
    body = client.get("/api/v1/health").json()
    assert body["status"] == "ok"
    assert body["datasets"]["uofg_accommodation"] == "curated"


def test_sources_status_lists_independent_sources(client):
    ids = {s["source_id"] for s in client.get("/api/v1/sources/status").json()}
    assert {"uofg_accommodation", "geo_routing", "spt_subway_fares"} <= ids


def test_recommendation_happy_path_matches_contract(client):
    r = client.post("/api/v1/recommendations/setup", json=_profile())
    assert r.status_code == 200
    body = r.json()
    assert body["feasibility"] == "feasible"
    assert body["recommended_candidate_id"] == body["ranked"][0]["candidate_id"]
    top = body["ranked"][0]
    assert top["rank"] == 1
    assert {f["factor"] for f in top["score_breakdown"]} == {
        "monthly_cost",
        "commute_time",
        "upfront_cost",
        "evidence_confidence",
    }
    assert top["costs"]["monthly_total_gbp"] is not None
    assert top["costs"]["upfront_total_gbp"] is not None
    assert body["recommendation_id"].startswith("rec_")
    assert any(s["source_id"] == "geo_routing" for s in body["sources"])


def test_recommendation_is_deterministic_over_http(client):
    a = client.post("/api/v1/recommendations/setup", json=_profile()).json()
    b = client.post("/api/v1/recommendations/setup", json=_profile()).json()
    assert [r["candidate_id"] for r in a["ranked"]] == [r["candidate_id"] for r in b["ranked"]]
    assert a["recommendation_id"] == b["recommendation_id"]


def test_impossible_budget_returns_no_feasible_options(client):
    body = client.post(
        "/api/v1/recommendations/setup", json=_profile(constraints={"max_monthly_budget_gbp": 50})
    ).json()
    assert body["feasibility"] == "no_feasible_options"
    assert body["recommended_candidate_id"] is None
    assert body["ranked"] == []
    assert body["relaxation_suggestions"]


def test_changing_priority_over_http_changes_recommendation(client):
    cost = client.post(
        "/api/v1/recommendations/setup",
        json=_profile(priorities={"monthly_cost": 10, "commute_time": 0, "upfront_cost": 0, "evidence_confidence": 0}),
    ).json()
    commute = client.post(
        "/api/v1/recommendations/setup",
        json=_profile(priorities={"monthly_cost": 0, "commute_time": 10, "upfront_cost": 0, "evidence_confidence": 0}),
    ).json()
    assert cost["recommended_candidate_id"] != commute["recommended_candidate_id"]


@pytest.mark.parametrize(
    "bad",
    [
        {"constraints": {"max_monthly_budget_gbp": -5}},
        {"constraints": {"max_monthly_budget_gbp": 999999}},
        {"priorities": {"monthly_cost": 0, "commute_time": 0, "upfront_cost": 0, "evidence_confidence": 0}},
        {"priorities": {"monthly_cost": 11}},
        {"allowed_modes": []},
        {"allowed_modes": ["walk", "walk"]},
        {"student_category": "martian"},
        {"move_in_date": "not-a-date"},
        {"unknown_field": 1},
    ],
)
def test_invalid_profiles_are_422_with_error_envelope(client, bad):
    r = client.post("/api/v1/recommendations/setup", json=_profile(**bad))
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "validation_error"
    assert err["details"]


def test_malformed_json_is_422_not_500(client):
    r = client.post("/api/v1/recommendations/setup", content=b"{not json", headers={"content-type": "application/json"})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"


def test_unknown_campus_is_404_error_envelope(client):
    r = client.post("/api/v1/recommendations/setup", json=_profile(campus_id="nowhere"))
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"


def test_accommodation_detail_and_404(client):
    ok = client.get("/api/v1/accommodations/maclay-residences--standard-ensuite")
    assert ok.status_code == 200
    assert ok.json()["availability"] == "unknown"
    missing = client.get("/api/v1/accommodations/does-not-exist")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "not_found"


def test_accommodation_filters_match_only_known_values(client):
    items = client.get("/api/v1/accommodations?ensuite=true").json()["items"]
    assert items and all(i["ensuite"] is True for i in items)


def test_transport_options_mark_unavailable_rather_than_invent(client):
    body = client.get("/api/v1/transport/options?accommodation_id=cairncross-house--single").json()
    assert {i["mode"] for i in body["items"]} == {"walk", "cycle", "subway"}
    for i in body["items"]:
        if not i["available"]:
            assert i["duration_min"] is None and i["unavailable_reason"]


def test_advance_payment_refundability_is_unknown(client):
    a = client.get("/api/v1/accommodations/cairncross-house--single").json()
    assert a["advance_payment_gbp"] == 200.0
    assert a["advance_payment_refundable"] is None


def test_unknown_path_uses_error_envelope(client):
    r = client.get("/api/v1/does-not-exist")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"


def test_wrong_method_uses_error_envelope(client):
    r = client.delete("/api/v1/health")
    assert r.status_code == 405
    assert r.json()["error"]["code"] == "method_not_allowed"


def test_unexpected_crash_returns_500_envelope(repo):
    from fastapi.testclient import TestClient

    from app.main import create_app

    class BrokenRepo:
        def source_statuses(self):
            raise RuntimeError("simulated failure")

    app = create_app(repo)
    app.state.repo = BrokenRepo()
    r = TestClient(app, raise_server_exceptions=False).get("/api/v1/health")
    assert r.status_code == 500
    assert r.json() == {"error": {"code": "internal_error", "message": "An unexpected error occurred.", "details": []}}


def test_room_counts_in_reasons_match_the_summary(client):
    import re

    body = client.post("/api/v1/recommendations/setup", json=_profile()).json()
    summary_count = int(re.search(r"among (\d+) room option", body["summary"]).group(1))
    for reason in body["ranked"][0]["reasons"]:
        m = re.search(r"among the (\d+) room options", reason)
        if m:
            assert int(m.group(1)) == summary_count
