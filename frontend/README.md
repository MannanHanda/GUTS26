# Uniwise — Frontend

> **GUTS Hackathon 2026** — the experience layer for Uniwise.
> Web app (Next.js 16, React 19, Tailwind CSS 4) and mobile app (React Native with Expo).

This folder is the **experience layer only**. The frontends collect the student's profile, call the backend API and display its results. They do not calculate the recommendation themselves (see `PROJECT_SPEC.md` §15.1).

---

## 💡 The problem

Students choose accommodation, transport and other essentials separately, using information spread across many websites. A cheap room far from campus can cost more once commuting is added, and advertised rent rarely shows the full monthly and upfront cost.

Uniwise brings these together: the student enters their budget, commute limit and priorities, and the backend returns the option that fits best overall, with its costs, trade-offs, unknowns and sources.

---

## 🧱 Stack

| App | Technology |
|---|---|
| Web (primary demo) | Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind CSS 4, Recharts 3 |
| Mobile (secondary) | Expo SDK 58, React Native 0.88, TypeScript |
| Shared | Types and API client in `shared/`, copied into `web/src/shared/` and `mobile/src/shared/` |

---

## 📄 Pages and their data

| Page | Purpose | Backend endpoint | Status |
|---|---|---|---|
| `/` Landing | Explain the problem and the product | — | Built; its example comparison uses mock numbers that must be replaced |
| `/onboarding` | Collect the student profile (budget, commute limit, priorities, transport modes) | `POST /api/v1/recommendations/setup` | Built, not connected |
| `/dashboard` | Show the recommendation, costs, score breakdown, reasons, trade-offs, unknowns and alternatives | Response of `POST /api/v1/recommendations/setup` | Built, not connected |
| `/accommodation` | Browse, filter and compare rooms | `GET /api/v1/accommodations`, `GET /api/v1/accommodations/{id}` | Built, not connected |
| `/transport` | Compare walking, cycling and Subway from a residence to campus | `GET /api/v1/transport/options` | Built, not connected |
| `/banking` | Compare student bank accounts | None yet (P1) | No verified data — hide or label until sourced |
| `/healthcare` | NHS entitlements and student health information | None (outside the spec's scope) | No verified data — hide or label until sourced |

The mobile app (`mobile/App.tsx`) has matching tabs and follows the same rules.

**Scope today:** University of Glasgow residences and the Gilmorehill campus. The mock dataset and the landing page also mention Strathclyde and Glasgow Caledonian University; the backend has no data for them.

---

## 🔌 Backend API contract

The single source of truth is [`../docs/openapi.json`](../docs/openapi.json), also browsable at `http://127.0.0.1:8000/docs` while the backend runs. Frontend types should be generated from it so the two cannot drift.

| Method | Path | Used by |
|---|---|---|
| GET | `/api/v1/health` | Connection and data status indicator |
| GET | `/api/v1/sources/status` | Sources and freshness panel |
| GET | `/api/v1/accommodations` | Accommodation page |
| GET | `/api/v1/accommodations/{accommodation_id}` | Accommodation detail |
| GET | `/api/v1/transport/options` | Transport page |
| POST | `/api/v1/recommendations/setup` | Onboarding and dashboard; re-called when a preference changes |

Errors always arrive as `{ "error": { "code", "message", "details" } }` with codes `validation_error` (422), `not_found` (404), `method_not_allowed` (405), `provider_unavailable` (503) and `internal_error` (500).

### Rules for displaying results

- Show unknown values as unknown (`null` means unknown, `0` means genuinely zero or included).
- Show monthly and upfront costs separately.
- Show each source's status (`curated`, `cached`, `estimated`, `stale`, `unavailable`) and link to it.
- Present the score as relative to the options that met the student's limits, not as an absolute rating.
- Describe the recommendation as produced by the decision engine — the backend uses no AI.
- When the backend is unreachable, show an error or stale-data state. Never substitute mock data presented as real.

---

## 🛠️ Changes still needed to match the spec

- [x] Web: local calculation engine deleted (`web/src/shared/calculations/cost-engine.ts`). Copies in `shared/` and `mobile/src/shared/` remain for the mobile app.
- [x] Web: mock dataset deleted. Onboarding uses a Glasgow-only campus list and default profile in `web/src/lib/student-profile.ts`.
- [x] Every web page uses `web/src/shared/api/client.ts` (real endpoints, no mock fallback). The legacy `api-client.ts` is deleted.
- [x] TypeScript types generated from `docs/openapi.json` (`npm run generate:api` → `web/src/shared/api/schema.ts`).
- [x] Web dashboard no longer says "AI Recommended". The mobile app's visible label is "Recommended package"; a code comment in `mobile/src/shared/calculations/cost-engine.ts` still says "AI Recommended".
- [x] Web: references to other universities removed. The mobile app still lists them.
- [x] Banking shows the raw bank research from `/api/v1/research/bank-accounts`, marked unverified. Healthcare shows no clinic or cost figures until they are sourced; it lists emergency numbers and official links only.

---

## 🚀 Quick start

Start the backend first (see the root [README](../README.md)), then:

```bash
# Web app
cd frontend/web
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
# Open http://localhost:3000
```

```bash
# Mobile app
cd frontend/mobile
npm install
npm run web    # or: npm run android / npm run ios
```

`NEXT_PUBLIC_API_URL` has no default, so it must be set. The backend accepts browser requests from `http://localhost:3000` (Next.js) and `http://localhost:8081` (Expo web); other origins can be added with the backend's `UNIWISE_CORS_ORIGINS` environment variable.

```bash
# Production build of the web app
cd frontend/web
npm run build
npm run start
```
