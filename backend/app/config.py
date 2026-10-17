"""Environment-based configuration. No secrets are required for the core path."""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.environ.get("UNIWISE_DATA_DIR", REPO_ROOT / "data"))
CURATED_DIR = DATA_DIR / "curated"
REFERENCE_DIR = DATA_DIR / "reference"
# Browser origins allowed to call the API: Next.js dev server (3000) and Expo web (8081).
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://localhost:8081"
CORS_ORIGINS = [o for o in os.environ.get("UNIWISE_CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",") if o]
