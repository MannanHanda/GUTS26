"""Raw research files are served read-only, labelled unverified, and kept out of recommendations."""

from fastapi.testclient import TestClient

from app.main import create_app
from app.providers.research import ResearchRepository


def test_lists_all_research_datasets_as_unverified(client: TestClient) -> None:
    body = client.get("/api/v1/research").json()
    assert body["total"] == 4
    assert {d["id"] for d in body["items"]} == {
        "accommodation-catalogue",
        "nearby-stores",
        "transport-research",
        "bank-accounts",
    }
    assert all(d["status"] == "unverified" for d in body["items"])


def test_accommodation_catalogue_rows_match_the_csv(client: TestClient) -> None:
    body = client.get("/api/v1/research/accommodation-catalogue").json()
    table = body["tables"][0]
    assert table["name"] == "accomodation_distance_to_unis.csv"
    assert len(table["rows"]) == 50
    assert table["rows"][0]["accommodation_name"] == "Blackfriars"
    assert table["rows"][0]["weekly_rent"] == "£169"


def test_xlsx_sheets_become_tables(client: TestClient) -> None:
    body = client.get("/api/v1/research/transport-research").json()
    assert [t["name"] for t in body["tables"]] == ["Glasgow Transport", "Student Travel Tips"]
    transport = body["tables"][0]
    assert transport["columns"][0] == "Transport mode"
    assert transport["rows"][0]["Transport mode"] == "Bus"


def test_bank_accounts_are_marked_as_research_leads_not_verified(client: TestClient) -> None:
    body = client.get("/api/v1/research/bank-accounts").json()
    providers = body["tables"][0]
    assert providers["rows"][0]["Provider"] == "HSBC UK"
    assert providers["rows"][0]["Data confidence"].startswith("Research lead")


def test_unknown_dataset_is_404(client: TestClient) -> None:
    response = client.get("/api/v1/research/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_research_data_never_reaches_recommendations(client: TestClient) -> None:
    # These residence names appear only in the research files, never in the curated accommodation data.
    accommodations = client.get("/api/v1/accommodations").text
    assert "Blackfriars" not in accommodations
    assert "iQ Elgin Place" not in accommodations


def test_missing_file_makes_only_that_dataset_unavailable(tmp_path, repo) -> None:
    # The four files are absent, so every dataset is unavailable and the API says so.
    client = TestClient(create_app(repo, ResearchRepository(tmp_path)))
    listing = client.get("/api/v1/research").json()
    assert all(d["status"] == "unavailable" for d in listing["items"])
    assert all(d["error"] for d in listing["items"])

    response = client.get("/api/v1/research/bank-accounts")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "provider_unavailable"

    # The decision API is unaffected by the research files being absent.
    assert client.get("/api/v1/accommodations").status_code == 200


def test_csv_with_bad_encoding_is_reported_not_crashed(tmp_path, repo) -> None:
    (tmp_path / "accomodation_distance_to_unis.csv").write_bytes(b"\xff\xfe\x00bad")
    research = ResearchRepository(tmp_path)
    dataset = research.dataset("accommodation-catalogue")
    assert dataset is not None
    assert dataset.status == "unavailable"
    assert dataset.error is not None
