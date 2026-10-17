# GUTS26 — The Hidden Cost of Being a Student

> **GUTS Hackathon 2026** • University of Glasgow  
> Helping students calculate the true cost of accommodation, transit, banking, and healthcare before signing a tenancy.

---

## 📁 Repository Structure

```
GUTS26/
├── frontend/             # Complete Frontend Engineering (Web, Mobile, Shared Engine)
│   ├── web/              # Next.js 16 App Router Web Application
│   ├── mobile/           # React Native Expo Mobile Application
│   ├── shared/           # Shared Types, Calculation Engine, API Contracts & Datasets
│   ├── package.json      # Monorepo Workspace Configuration
│   └── README.md         # Detailed Frontend Architecture & Guides
├── backend/              # Teammates' Backend Services, Database & AI Processing
└── README.md             # Project Overview
```

---

## 🚀 Frontend Quickstart

All frontend code (Web, Mobile, and Shared API Client) is located in the [`frontend/`](./frontend) directory.

### 🌐 1. Run Web App (Next.js 16)
```bash
cd frontend/web
npm run dev
# Open http://localhost:3000
```

### 📱 2. Run Mobile App (React Native Expo)
```bash
cd frontend/mobile
npm run web   # or npm run android / npm run ios
```

For full frontend architecture, API contract specifications, zero-downtime mock fallbacks, and design system documentation, see [frontend/README.md](./frontend/README.md).
