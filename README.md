# The Hidden Cost of Being a Student

> **GUTS Hackathon 2026** — *Make student life cost less.*  
> Frontend Architecture: Responsive Web App (Next.js 16 + React 19 + Tailwind CSS) & Functional Mobile App (React Native Expo).

---

## 💡 The Problem & Value Proposition

Students often make decisions about **accommodation**, **banking**, and **transport** in isolation:
1. They pick cheap accommodation further from campus without factoring in **£70+/month transit passes** or **5+ hours lost weekly** commuting.
2. They sign leases with excluded utility bills, risking **unbudgeted £30+/week winter energy price spikes**.
3. They pay high upfront **5-week security deposits** or miss out on **free 4-year Railcards (saving 1/3 on travel)**.

**Our product brings these three decisions together** so students can see their **True Living Cost** (£/week and £/month) and trade-offs before signing a tenancy.

---

## 🚀 Live Demonstrations & Pages

### Web Application (`/web`)
- **Page 1 — Landing Page (`/`):**
  - Hero headline: *"Make student life cost less."*
  - Interactive **AHA! simulator**: Compares a "cheap outer flat" (£118 rent + £30 bills + £16.50 subway = £164.50 true cost + 5.8h travel) vs. "campus hall" (£185 all-in + 0 commute).
  - Transparent data & Responsible AI ethics declaration.
- **Page 2 — Student Profile Setup (`/onboarding`):**
  - 4-step wizard: Study location (University of Glasgow, Strathclyde, GCU), living budget, weekly journeys, transit preferences, banking priorities, and cost vs. commute trade-off slider.
- **Page 3 — True Living Cost Dashboard (`/dashboard`):**
  - True Weekly Cost, Estimated Monthly, Upfront Cash Barrier, Budget Margin status, and Commuting Burden.
  - **AI Recommended Decision Package** with clear *"Why this was recommended"* rationale and honest trade-offs.
  - Recharts cost distribution chart and dynamic alternative package switcher.
- **Page 4 — Accommodation Comparison (`/accommodation`):**
  - Detailed listing cards comparing advertised rent, excluded bills, deposits, commute times, and true living cost.
  - Filters: En-suite, PBSA halls, private flats, bills-included toggle, and sort by true cost.
- **Module 2 — Banking Comparison (`/banking`):**
  - Overdraft limits, Free 4-Year Railcard perks, international fees, and tailored advice.
- **Module 3 — Transport Passes (`/transport`):**
  - Glasgow Subway Smartcard, First Bus, ScotRail, Nextbike cycling, and break-even analysis vs. pay-as-you-go single fares.
- **Module 4 — NHS Healthcare & Rights (`/healthcare`):**
  - Scotland vs. England advantages: 100% Free Prescriptions (£0) and Free Dental for under 26s.
  - International Student Visa Health Surcharge (IHS) transparency (£776/year).
  - Directory of Glasgow student GP practices, Minor Injuries (Stobhill), and Pharmacy First walk-ins.

### Mobile Application (`/mobile`)
- Native React Native interface (`App.tsx`) with 5 platform-tailored tabs:
  - **True Cost**: Key financial metrics, AI recommended combination, trade-offs, and alternative switcher.
  - **Housing**: Student properties with true cost calculations.
  - **Transit**: Glasgow transit passes with commute time metrics.
  - **Banking**: Overdraft limits and travel incentives.
  - **Health**: NHS Scotland entitlements, £0 prescriptions, and campus clinics.
  - **Budget Quick-Adjust Modal**: Rapid live updates to budget allowance.

---

## 🔌 Teammate Backend Integration (Contract Specification)

Both Web and Mobile integrate with backend services via agreed API contracts defined in `shared/` / `web/src/shared/`:
- `GET /api/v1/universities`
- `GET /api/v1/accommodations?maxRent=200&billsIncluded=true`
- `GET /api/v1/banking`
- `GET /api/v1/transport`
- `POST /api/v1/recommendations` (Accepts `{ profile }`, returns ranked packages with trade-offs)

### Zero-Downtime Resilience
If teammate backends are offline, deploying, or restarting during hackathon judging, the frontend **automatically falls back to our deterministic contract calculation engine and rich Glasgow mock dataset**.

To connect to a live backend:
```bash
# In web/.env.local or production environment:
NEXT_PUBLIC_API_URL=https://your-teammate-backend.com
```

---

## 🛠️ Quick Start Instructions

### 1. Run the Website (Next.js)
```bash
cd web
npm run dev
# Open http://localhost:3000 in your browser
```

### 2. Build Web for Production
```bash
cd web
npm run build
npm run start
```

### 3. Run the Mobile App (Expo)
```bash
cd mobile
npm run web    # or npm run android / npm run ios
```
