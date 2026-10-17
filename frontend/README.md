# Uniwise — Frontend

> **GUTS Hackathon 2026** — the experience layer for Uniwise.  
> Web app (Next.js 16, React 19, Tailwind CSS 4) and mobile app (React Native with Expo).

This folder is the **experience layer**. The frontends collect the student's profile, call the backend decision engine API, and display results with clear cost breakdowns, trade-offs, and source provenance (see `PROJECT_SPEC.md` §15.1).

---

## 💡 The Problem

Students choose accommodation, transport, and everyday essentials separately using fragmented information across dozens of websites. A cheap room far from campus can cost more once commuting and winter energy bills are added, and advertised rent rarely shows the full monthly and upfront move-in cash barrier.

Uniwise brings these together: the student enters their budget, commute limit, and priorities, and the backend returns the option that fits best overall, with its true costs, trade-offs, unknowns, and sources.

---

## 🧱 Stack

| App | Technology |
|---|---|
| Web (primary demo) | Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind CSS 4, Recharts 3 |
| Mobile (secondary) | Expo SDK 58, React Native 0.88, TypeScript |
| Shared | Types and API client in `shared/`, copied into `web/src/shared/` and `mobile/src/shared/` |

---

## 📄 Pages and Modules

| Page / Route | Purpose | Backend Endpoint / Source | Status |
|---|---|---|---|
| `/` Landing | Explain the problem, live decision comparison (`LiveTradeoff`) | Connected to decision engine example | Live |
| `/onboarding` | Collect student profile (budget, commute, transit modes) | `POST /api/v1/recommendations/setup` | Integrated |
| `/dashboard` | Recommendation, score breakdown chart, reasons, trade-offs | Response of `POST /api/v1/recommendations/setup` | Connected to backend |
| `/accommodation` | Browse, filter, and compare rooms with live filters | `GET /api/v1/accommodations` | Connected to backend |
| `/transport` | Compare walking, cycling, and Subway from residence to campus | `GET /api/v1/transport/options` | Connected to backend |
| `/banking` | Compare student bank accounts and overdraft limits | Curated dataset with Illustrative Data banner | Integrated |
| `/healthcare` | NHS Scotland entitlements (£0 prescriptions, free dental <26) | Curated dataset with Illustrative Data banner | Integrated |
| `/chat` & Global Widget | Finley AI Student Living Advisor chatbot | `POST /api/v1/chat` + deterministic fallback | Integrated |
| `/errors` | Animated Glasgow Subway error screens & offline handling | Dedicated error catalog and online detector | Live |

The mobile app (`mobile/App.tsx`) has matching tabs (`True Cost`, `Housing`, `Transit`, `Banking`, `Health`, `AI Chat`).

---

## 🔌 Backend API Contract

The single source of truth is [`../docs/openapi.json`](../docs/openapi.json), also browsable at `http://127.0.0.1:8000/docs` while the backend runs.

| Method | Path | Used by |
|---|---|---|
| GET | `/api/v1/health` | Connection and data status indicator |
| GET | `/api/v1/sources/status` | Sources and freshness panel |
| GET | `/api/v1/accommodations` | Accommodation page |
| GET | `/api/v1/accommodations/{accommodation_id}` | Accommodation detail |
| GET | `/api/v1/transport/options` | Transport page |
| GET | `/api/v1/benefits` | Concessions and Young Scot under-22 free bus scheme |
| POST | `/api/v1/recommendations/setup` | Onboarding and dashboard |
| POST | `/api/v1/chat` | AI Living Advisor conversational engine |

---

## 🚀 Quick Start

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

```bash
# Production build of the web app
cd frontend/web
npm run build
npm run start
```
