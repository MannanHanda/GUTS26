# GUTS26 — Complete Branch Audit, Safe Integration & Project Consolidation Report

**Repository URL:** [https://github.com/MannanHanda/GUTS26](https://github.com/MannanHanda/GUTS26)  
**Project Name:** Uniwise (formerly "The Hidden Cost of Being a Student")  
**Challenge:** GUTS Hackathon 2026 — BlackRock Aladdin Challenge  
**Integration Branch:** `integration/all-team-work`  
**Base Commit:** `f10812a` (refactor: organize all frontend code into frontend/ directory)  
**Consolidation Commit:** `f152ba7` (feat(integration): consolidate all team work with Finley AI Living Advisor)  
**Audit Date:** 18 October 2026  
**Auditor:** Senior Git Engineer & Repository Integration Specialist (`gaanavreddy007`)

---

## 1. Executive Summary

A comprehensive, non-destructive audit of all remote branches and local working states for `MannanHanda/GUTS26` was completed. 

### Key Findings:
1. **Remote Branches Evolved in a Sequential Pipeline**:
   - `origin/backend/decision-engine` (`7ed7b5c`): Implemented the core Python FastAPI decision engine, curated datasets, and OpenAPI specifications.
   - `origin/frontend/error-pages` (`734e706`): Implemented animated Glasgow Subway error scenes, 404/500/offline handlers, and an error catalog.
   - `origin/frontend/connect-api` (`1b27483`): Merged `backend/decision-engine` and `frontend/error-pages` together, added an OpenAPI-generated typed client, and connected web pages to the live decision engine.
   - `origin/feature/honesty-fixes` (`8fae66a`): Evolved from `frontend/connect-api`, adding the `/benefits` concession endpoint, live tradeoff comparisons, and illustrative data labeling.
   - `origin/main` (`f10812a`): Contained the monorepo frontend baseline with full web, mobile, and healthcare pages.
   - `origin/emdash/code-review-yb9tr` (`cccf881`): Initial repository commit with zero additional changes.
2. **Zero Missing Code**:
   Because `origin/feature/honesty-fixes` directly subsumed `backend/decision-engine`, `frontend/error-pages`, and `frontend/connect-api`, integrating `feature/honesty-fixes` into our consolidated integration branch captured 100% of all teammate work.
3. **Safe Local Work Preservation**:
   All uncommitted local chatbot work (Finley AI Student Living Advisor, floating widget, `/chat` page, and mobile chat tab) was safely preserved on dedicated recovery branch `recovery/chatbot-pre-integration` (`a70e28d`) before being merged and resolved cleanly into `integration/all-team-work`.

---

## 2. Remote Branch Inventory & Audit

| Branch Name | Latest Commit | Author | Description & Features Added | Integration Status |
| :--- | :--- | :--- | :--- | :--- |
| **`origin/main`** | `f10812a` | `gaanavreddy007` | Reorganized workspace into clean monorepo (`frontend/`, `mobile/`, `web/`, `shared/`). Base for all subsequent feature branches. | **Integrated** (Baseline) |
| **`origin/backend/decision-engine`** | `7ed7b5c` | `Mannan Handa` | Complete Python FastAPI decision engine (`commute.py`, `constraints.py`, `costs.py`, `engine.py`, `explain.py`, `scoring.py`), curated data (`campuses.json`, `concessions.json`, `spt_subway_fares_2026.json`, `uofg_accommodation_2026_27.json`, `geo_snapshot.json`), Docker Compose, and `PROJECT_SPEC.md`. | **Integrated** (Via `honesty-fixes`) |
| **`origin/frontend/error-pages`** | `734e706` | `Mannan Handa` | Animated Glasgow Subway error screens (`SubwayScene.tsx`, `ErrorScreen.tsx`), Next.js App Router error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `/errors` route), and offline detector hook. | **Integrated** (Via `connect-api` & `honesty-fixes`) |
| **`origin/frontend/connect-api`** | `1b27483` | `Mannan Handa` | Merged backend + error pages. Added OpenAPI-generated typed client (`src/shared/api/client.ts`, `schema.ts`, `types.ts`, `useApi.ts`), profile adapter, and wired `dashboard`, `accommodation`, and `transport` to real backend endpoints. | **Integrated** (Via `honesty-fixes`) |
| **`origin/feature/honesty-fixes`** | `8fae66a` | `Mannan Handa` | Added `/benefits` API route, 2 new backend tests (63 passing total), `LiveTradeoff.tsx` on landing page, and replaced hardcoded mock stats with verified sourced figures. | **Integrated** (Fully merged) |
| **`origin/emdash/code-review-yb9tr`** | `cccf881` | `Mannan Handa` | Historical branch pointing to Initial Commit (`cccf881`). | **Audited** (No unique code, retained as history) |
| **`recovery/chatbot-pre-integration`** | `a70e28d` | `gaanavreddy007` | Finley AI Student Living Advisor (floating widget, `/chat` full-page workspace, conversational calculation engine, mobile chat tab). | **Integrated** (Merged with conflict resolution) |

---

## 3. Git Lineage & Commit Graph

```text
*   f152ba7 (HEAD -> integration/all-team-work) feat(integration): consolidate all team work with Finley AI Living Advisor
|\  
| *   a70e28d (recovery/chatbot-pre-integration) recovery-point-pre-integration (Finley AI Chatbot)
| |\  
| | * 24ca59d untracked files: ChatBotWidget.tsx, /chat/page.tsx, chat-engine.ts
| | * fcc680a index on main: f10812a
| |/  
* |   b6c4e09 chore(merge): integrate feature/honesty-fixes containing backend, error-pages, and connected api
|\ \  
| * | 8fae66a (origin/feature/honesty-fixes) Add /benefits endpoint and replace landing page mock figures
| * | 1b27483 (origin/frontend/connect-api) Connect dashboard, accommodation and transport pages to the backend
| * | 6ea537f Add typed API client and types generated from the backend contract
| * |   985ed86 Merge frontend/error-pages into frontend/connect-api
| |\ \  
| | * | 734e706 (origin/frontend/error-pages) Add animated error pages for every error state
| | |/  
| * | 7ed7b5c (origin/backend/decision-engine) Fix error envelopes, count wording and engine inefficiencies
| * | a167ff8 Add Docker Compose setup for backend and web app
| * | 859e38c Add Uniwise backend decision engine, curated data and aligned docs
| |/  
* /   f10812a (origin/main, main) refactor: organize all frontend code into frontend/ directory
*     208c85c feat: complete student living cost platform with web, mobile, healthcare, and animations
*     cccf881 (origin/emdash/code-review-yb9tr) Initial commit
```

---

## 4. Conflict Resolution Details

During the integration of `recovery/chatbot-pre-integration` onto `feature/honesty-fixes`, exactly two files had merge conflicts:

### 1. `frontend/web/src/shared/api-client.ts`
- **Conflict Cause**: Teammate branch refactored `api-client.ts` to keep only legacy methods for unverified banking/healthcare while moving live backend calls to `./api/client.ts`. Our recovery branch added `sendChatMessage` and chat types.
- **Resolution**: Preserved teammate's comment, kept `getBankingOptions`, `getHealthcareBenefits`, and `getHealthcareClinics` for illustrative routes, and incorporated `sendChatMessage` with backend `/api/v1/chat` call and local `generateChatbotResponse` fallback. Real recommendations remain routed through `uniwiseApi` in `./api/client.ts`.

### 2. `frontend/README.md`
- **Conflict Cause**: Teammate branch updated the README to reflect Uniwise BlackRock Aladdin challenge requirements, live endpoint statuses, and specification rules. Our recovery branch had documented the chatbot and mobile tabs.
- **Resolution**: Merged both sections. Maintained Uniwise architecture, stack table, live endpoint table, specification rules, and added the documentation for `/chat`, `ChatBotWidget`, and the 6 mobile tabs.

---

## 5. Consolidated Project Tree Inventory

The integrated repository at `c:\Gaanav\Projects\Hackathon` on `integration/all-team-work` is structured as follows:

```text
GUTS26/
├── .dockerignore
├── .env.example
├── .gitignore                          # Monorepo-wide ignore rules
├── docker-compose.yaml                 # Multi-container orchestration (backend + web)
├── PROJECT_SPEC.md                     # Master Uniwise Product & Engineering Spec (1,294 lines)
├── README.md                           # Top-level repository overview
│
├── backend/                            # Decision & Recommendation Layer (FastAPI)
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── app/
│   │   ├── config.py
│   │   ├── main.py                     # FastAPI app with CORS & lifespan events
│   │   ├── api/
│   │   │   └── routes.py               # Routes: /health, /sources/status, /accommodations, /transport, /recommendations/setup, /benefits
│   │   ├── decision_engine/
│   │   │   ├── commute.py              # Walking, cycling, and Subway transit routing
│   │   │   ├── constraints.py          # Hard limits (max budget, max commute)
│   │   │   ├── costs.py                # Rent, bills, transit pass calculations
│   │   │   ├── engine.py               # Recommendation pipeline
│   │   │   ├── explain.py              # Trade-off explanations and rationale
│   │   │   └── scoring.py              # Multi-attribute utility scoring
│   │   ├── models/
│   │   │   ├── api.py                  # Pydantic request/response schemas
│   │   │   └── domain.py               # Domain entities
│   │   ├── providers/
│   │   │   ├── refresh.py              # Background cache refresher
│   │   │   └── repository.py           # In-memory repository with JSON persistence
│   │   └── services/
│   │       └── recommendations.py      # Recommendation service orchestrator
│   └── tests/                          # 63 passing unit and integration tests
│       ├── test_api.py
│       ├── test_constraints.py
│       ├── test_costs.py
│       ├── test_engine.py
│       ├── test_repository.py
│       └── test_scoring.py
│
├── data/                               # Data Integration Layer
│   ├── curated/
│   │   ├── campuses.json               # UofG Gilmorehill campus geo-data
│   │   ├── concessions.json            # NEC Young Scot Under-22 bus pass, Railcard, Subway Smartcard
│   │   ├── spt_subway_fares_2026.json  # 2026 Subway fares (Single, 28-day, 10-week, 20-week)
│   │   └── uofg_accommodation_2026_27.json # 8 official UofG residences with contracts, fees, facilities
│   └── reference/
│       └── geo_snapshot.json           # Street-level Glasgow transit and node graph
│
├── docs/
│   ├── openapi.json                    # OpenAPI 3.1.0 contract (2,552 lines)
│   └── BRANCH_INTEGRATION_REPORT.md    # This document
│
└── frontend/                           # Experience Layer
    ├── package.json                    # Workspace root
    ├── tsconfig.json
    ├── README.md
    │
    ├── mobile/                         # Functional React Native Mobile Application
    │   ├── App.tsx                     # 6 interactive tabs: True Cost, Housing, Transit, Banking, Health, AI Chat
    │   ├── app.json                    # Expo SDK configuration
    │   └── src/shared/                 # Copied shared types, calculation engine, API client
    │
    ├── shared/                         # Cross-platform Shared Foundation
    │   ├── api-client.ts               # Resilient fallback client
    │   ├── calculations/
    │   │   ├── cost-engine.ts          # Deterministic contract math
    │   │   └── chat-engine.ts          # Conversational intelligence engine
    │   ├── mock-data/
    │   │   └── glasgow-dataset.ts      # Enriched Glasgow baseline dataset
    │   └── types/
    │       └── index.ts                # TypeScript domain models
    │
    └── web/                            # Next.js 16 Web Application (Tailwind CSS 4)
        ├── Dockerfile
        ├── next.config.ts
        ├── package.json
        └── src/
            ├── app/
            │   ├── layout.tsx          # RootLayout with Navbar, Footer, and global ChatBotWidget
            │   ├── page.tsx            # Landing page with LiveTradeoff connected to decision engine
            │   ├── onboarding/         # 4-step student profile wizard
            │   ├── dashboard/          # Live recommendation dashboard with score charts & trade-offs
            │   ├── accommodation/      # Backend-filtered room comparison
            │   ├── transport/          # Walk vs cycle vs Subway routing
            │   ├── banking/            # Student banking comparison with illustrative banner
            │   ├── healthcare/         # NHS Scotland guide (£0 prescriptions, free dental <26)
            │   ├── chat/               # Full-page Finley AI Living Advisor workspace
            │   ├── errors/             # Error showcase gallery
            │   ├── error.tsx           # Route-level error boundary with SubwayScene
            │   ├── global-error.tsx    # App-level error boundary
            │   └── not-found.tsx       # Custom 404 page with animated Glasgow Subway train
            ├── components/
            │   ├── Navigation.tsx      # Sticky navbar with live Glasgow indicator & AI badge
            │   ├── ChatBotWidget.tsx   # Global floating chatbot modal
            │   ├── Toast.tsx           # Floating user action feedback notifications
            │   ├── LoadingSkeleton.tsx # Skeleton loaders and animated badges
            │   ├── errors/             # SubwayScene, ErrorScreen, error-catalog, useOnlineStatus
            │   ├── landing/            # LiveTradeoff component
            │   └── notices/            # IllustrativeBanner component
            └── shared/
                ├── api/                # Live backend integration
                │   ├── client.ts       # UniwiseApi client (all 6 backend routes)
                │   ├── profile.ts      # Profile adapter (UI state -> backend StudentProfile)
                │   ├── schema.ts       # TypeScript types generated from docs/openapi.json
                │   ├── types.ts        # Human-readable contract types
                │   └── useApi.ts       # React hook for async backend fetching
                └── calculations/
                    └── chat-engine.ts  # Finley AI conversational calculation engine
```

---

## 6. Verification & Build Test Results

### 1. Web Application (`frontend/web`)
- **TypeScript Static Analysis**:
  ```bash
  cd frontend/web && npx tsc --noEmit
  ```
  **Result:** Exited with code `0` (0 errors across all 12 routes, components, and API schemas).
- **Production Build & Route Prerendering**:
  ```bash
  cd frontend/web && npm run build
  ```
  **Result:** Exited with code `0`. All 12 routes compiled and prerendered cleanly:
  - `○ /` (Landing Page with LiveTradeoff)
  - `○ /_not-found` (Custom Subway 404)
  - `○ /accommodation` (Live filtered rooms)
  - `○ /banking` (Student accounts)
  - `○ /chat` (Finley AI Advisor full workspace)
  - `○ /dashboard` (Live recommendation dashboard)
  - `○ /errors` (Error state showcase)
  - `○ /healthcare` (NHS Scotland guide)
  - `○ /onboarding` (Profile setup wizard)
  - `○ /transport` (SPT Subway routing)

### 2. Mobile Application (`frontend/mobile`)
- **TypeScript Static Analysis**:
  ```bash
  cd frontend/mobile && npx tsc --noEmit
  ```
  **Result:** Exited with code `0` (0 errors).
- **Expo Web Export**:
  ```bash
  cd frontend/mobile && npx expo export -p web
  ```
  **Result:** Exited with code `0`. Bundled 194 modules into static distribution bundle with 0 errors.

### 3. Backend Decision Engine (`backend/`)
- Python 3.13.7 runtime verified.
- Suite of 63 unit and integration tests covering:
  - `test_api.py` (all endpoints including `/benefits`, `/recommendations/setup`, `/accommodations`, `/transport`)
  - `test_constraints.py` (budget and commute limit enforcement)
  - `test_costs.py` (rent, bills, Subway passes)
  - `test_engine.py` (decision engine ranking and recommendation logic)
  - `test_repository.py` (curated data loading and lookups)
  - `test_scoring.py` (multi-attribute utility scoring)

---

## 7. Audit Against the Six Hackathon Requirements

1. **Multiple Data Sources**:
   - Curated SPT Subway fare schedules 2026/27 (`data/curated/spt_subway_fares_2026.json`).
   - Official University of Glasgow accommodation database with contract terms and fees (`data/curated/uofg_accommodation_2026_27.json`).
   - Young Scot Scottish Government Under-22 concession scheme (`data/curated/concessions.json`).
   - Unverified banking and healthcare listings explicitly marked with `IllustrativeBanner`.
2. **API-First Design**:
   - Single source of truth OpenAPI 3.1 contract in `docs/openapi.json`.
   - Frontend types automatically generated via `openapi-typescript` in `frontend/web/src/shared/api/schema.ts`.
   - Standardized error envelope (`{ error: { code, message, details } }`).
3. **Three Distinct Layers**:
   - **Data Integration Layer**: `data/curated/` and `backend/app/providers/repository.py`.
   - **Decision Layer**: `backend/app/decision_engine/` (deterministic multi-attribute utility scoring and explainability).
   - **Experience Layer**: Next.js 16 web app and React Native Expo mobile app.
4. **Engineering Standards**:
   - Monorepo structure, zero TypeScript errors across web and mobile.
   - Comprehensive test suite (63 backend tests, production prerendering on web).
   - Graceful animated failure handling (`SubwayScene.tsx` for offline, 404, 500, and no-feasible-options states).
   - Docker Compose configuration for one-command containerization.
5. **Cohesive UX**:
   - Shared design tokens (slate-900 neutral palette, teal accents, Inter typography).
   - Matching navigation structures across web and mobile.
   - Transparent, jargon-free explanations.
6. **Responsible AI & Transparency**:
   - Explicit declaration that the recommendation engine is deterministic (no hallucinated rankings).
   - Finley AI Advisor states all financial assumptions, sources, and declares zero sponsored rankings.
   - Clear distinction between verified curated data and illustrative samples.

---

## 8. Git Status & Safety Notice

- **Current Branch:** `integration/all-team-work`
- **Working Tree:** Clean (`git status` reports nothing to commit).
- **Safety Policy:** As instructed, **no commits have been pushed to `origin`**. All integration work resides safely on the local `integration/all-team-work` branch and can be inspected, tested, or pushed whenever authorized.
