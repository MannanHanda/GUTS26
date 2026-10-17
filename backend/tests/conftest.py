"""Shared fixtures. Tests use the curated dataset and the committed geo snapshot, never live APIs."""

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.providers.repository import DataRepository


@pytest.fixture(scope="session")
def repo() -> DataRepository:
    return DataRepository(now=datetime(2026, 10, 17, tzinfo=UTC))


@pytest.fixture(scope="session")
def client(repo: DataRepository) -> TestClient:
    return TestClient(create_app(repo))
