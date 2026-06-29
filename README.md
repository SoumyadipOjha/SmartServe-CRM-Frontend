# Flayx CRM — Frontend

React 18 + TypeScript single-page application for Flayx CRM. Built with Create React App and Chakra UI v2.

**Live app:** https://smart-serve-crm.vercel.app  
**Backend API:** https://smartserve-crm-backend.onrender.com

---

## Recent Features (v2)

| # | Feature | Implementation |
|---|---------|---------------|
| 1 | **Empty states** | `shared/components/EmptyState.tsx` — rendered on every empty list page with icon, copy, and a CTA button |
| 2 | **Toast notifications** | Chakra UI `useToast()` — success/error feedback after every create, update, and delete action |
| 3 | **Email open & click tracking** | `CampaignDetail.tsx` polls `/campaigns/:id/stats` — chart and counters now include an **Opened** and **Clicked** bar |
| 4 | **Task reminders** | Backend-only scheduler; frontend shows tasks with due dates in the customer profile task list |
| 5 | **Onboarding wizard** | `shared/components/OnboardingWizard.tsx` — 3-step modal shown once per user (stored in `localStorage`). Steps: add a customer → create a deal → launch a campaign |
| 6 | **PWA + push notifications** | Service worker at `public/service-worker.js`, `usePushNotifications` hook, and `PushNotificationBanner` component in the layout. App is installable on mobile and desktop |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (Create React App) |
| UI library | Chakra UI v2 |
| Routing | React Router v6 (all pages lazy-loaded) |
| HTTP | Axios |
| Charts | Recharts / Chart.js |
| Icons | React Icons (Feather set) |
| Build | CRA webpack (`CI=false npm run build`) |

---

## Project Structure

Feature-slice layout: each domain owns its pages and services in one place; truly shared code lives in `shared/`.

```
SmartServe-CRM-Frontend/
├── public/
│   ├── index.html
│   ├── manifest.json              # PWA manifest — name, icons, theme colour
│   └── service-worker.js          # App-shell caching + push notification handler
├── src/
│   ├── App.tsx                        # Root — all routes wired, React.lazy loaded
│   ├── index.tsx
│   ├── features/                      # Feature slices — pages + services co-located per domain
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── AuthCallback.tsx
│   │   │   │   └── AcceptInvite.tsx
│   │   │   └── services/
│   │   │       └── auth.service.ts
│   │   ├── campaigns/
│   │   │   ├── pages/
│   │   │   │   ├── Campaigns.tsx
│   │   │   │   ├── CreateCampaign.tsx
│   │   │   │   └── CampaignDetail.tsx
│   │   │   └── services/
│   │   │       └── campaign.service.ts
│   │   ├── customers/
│   │   │   ├── components/
│   │   │   │   ├── BulkUploadButton.tsx
│   │   │   │   └── ExportButton.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Customers.tsx
│   │   │   │   └── CustomerProfile.tsx
│   │   │   └── services/
│   │   │       ├── customer.service.ts
│   │   │       └── task.service.ts
│   │   ├── dashboard/
│   │   │   └── pages/
│   │   │       └── Dashboard.tsx      # Live KPI cards via SSE
│   │   ├── lead-forms/
│   │   │   ├── pages/
│   │   │   │   ├── LeadForms.tsx
│   │   │   │   └── PublicLeadForm.tsx # No-auth public submission page
│   │   │   └── services/
│   │   │       └── lead-form.service.ts
│   │   ├── orders/
│   │   │   ├── pages/
│   │   │   │   └── Orders.tsx
│   │   │   └── services/
│   │   │       └── order.service.ts
│   │   ├── pipeline/
│   │   │   ├── pages/
│   │   │   │   └── Pipeline.tsx       # Kanban deal board
│   │   │   └── services/
│   │   │       ├── deal.service.ts
│   │   │       └── custom-field.service.ts
│   │   ├── revenue/
│   │   │   └── pages/
│   │   │       └── Revenue.tsx
│   │   ├── segments/
│   │   │   ├── pages/
│   │   │   │   └── Segments.tsx
│   │   │   └── services/
│   │   │       └── segment.service.ts
│   │   ├── sequences/
│   │   │   ├── pages/
│   │   │   │   └── Sequences.tsx
│   │   │   └── services/
│   │   │       └── sequence.service.ts
│   │   └── team/
│   │       ├── pages/
│   │       │   └── TeamSettings.tsx
│   │       └── services/
│   │           └── team.service.ts
│   ├── lib/
│   │   └── api-client.ts              # Axios instance with base URL + auth interceptor
│   └── shared/                        # Shared code used by multiple features
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Navigation.tsx
│       │   ├── Pagination.tsx
│       │   ├── EmptyState.tsx             # Reusable empty-list prompt with icon + CTA button
│       │   ├── OnboardingWizard.tsx       # 3-step first-login wizard (localStorage flag per user)
│       │   └── PushNotificationBanner.tsx # Sticky banner to enable push notifications
│       ├── context/
│       │   └── AuthContext.tsx            # JWT storage, user state, demoLogin()
│       ├── hooks/
│       │   └── usePushNotifications.ts    # subscribe() / unsubscribe() via Web Push API
│       ├── services/
│       │   ├── ai.service.ts              # Gemini AI — used by campaigns + segments
│       │   └── analytics.service.ts       # SSE client — used by dashboard
│       ├── types/
│       │   ├── models.ts
│       │   └── customer.ts
│       └── utils/
│           ├── icon-wrapper.tsx
│           └── registerServiceWorker.ts   # Registers /service-worker.js in production only
├── vercel.json                        # SPA rewrites + CI=false build override
├── .env.production                    # Gitignored — set in Vercel dashboard
└── package.json
```

---

## Architecture

```mermaid
flowchart LR
    subgraph USER["👤  User"]
        B["Browser / PWA"]
    end

    subgraph VERCEL["☁️  Vercel CDN"]
        SPA["React 18 SPA\nChakra UI v2\nReact Router v6"]
    end

    subgraph API["⚙️  Backend API — Render"]
        direction TB
        EX["Express 5 · JWT · Passport"]
        R["customers · orders · deals\ncampaigns · sequences · team\nlead-forms · analytics · ai"]
        SSE["SSE stream\n/api/analytics/stream"]
    end

    subgraph EXTERN["🌐  External"]
        MONGO["MongoDB Atlas"]
        GEMINI["Gemini AI"]
        RESEND["Resend Email"]
        GOAUTH["Google OAuth"]
    end

    B --> SPA
    SPA -->|"REST HTTPS"| EX
    SPA <-->|"live updates"| SSE
    EX --> R
    R <--> MONGO
    R --> GEMINI
    R --> RESEND
    EX <--> GOAUTH

    style USER fill:#EBF8FF,stroke:#3182CE,color:#1A365D
    style VERCEL fill:#EBF8FF,stroke:#3182CE,color:#1A365D
    style API fill:#E6FFFA,stroke:#2C7A7B,color:#1D4044
    style EXTERN fill:#FAF5FF,stroke:#6B46C1,color:#322659
```

---

## Pages & Routes

| Route | Page | Notes |
|-------|------|-------|
| `/login` | Login | Email/password + Google OAuth |
| `/register` | Register | |
| `/dashboard` | Dashboard | Live KPI cards via SSE |
| `/customers` | Customers | Full CRUD |
| `/orders` | Orders | |
| `/campaigns` | Campaigns | Segment builder, send, stats |
| `/segments` | Segments | AND/OR rule builder |
| `/pipeline` | Pipeline | Drag-and-drop Kanban |
| `/revenue` | Revenue | Revenue charts + forecasting |
| `/sequences` | Sequences | Drip email editor |
| `/lead-forms` | LeadForms | Form builder + embed code |
| `/form/:token` | PublicLeadForm | No-auth public submission page |
| `/team` | TeamSettings | Invite members, change roles, remove |
| `/accept-invite` | AcceptInvite | Reads `?token=` from URL |
| `/analytics` | Analytics | |
| `/ai-assistant` | AiAssistant | Gemini chat |
| `/profile` | Profile | |
| `/settings` | Settings | |

---

## Local Setup

### Prerequisites

- Node.js 18+
- Backend running locally or pointed at the production API

### 1. Install

```bash
git clone <repo-url>
cd SmartServe-CRM-Frontend
npm install
```

### 2. Create `.env.local`

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NAME=Flayx
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Run

```bash
npm start
```

App runs at `http://localhost:3000`.

> If you get `Module not found` errors after adding new pages, clear the webpack cache:
> ```powershell
> Remove-Item -Recurse -Force "node_modules\.cache"
> ```
> Then restart the dev server.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend base URL (no trailing slash) |
| `REACT_APP_NAME` | App display name |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth client ID |

All `.env*` files are in `.gitignore`. For production, set these in the Vercel dashboard under **Project → Settings → Environment Variables**.

---

## Deployment (Vercel)

The repo is connected to Vercel for automatic deploys on push to `main`.

**`vercel.json`** overrides the build command and adds SPA rewrites:

```json
{
  "buildCommand": "CI=false npm run build",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

`CI=false` is required because CRA treats all ESLint warnings as build errors in CI mode. Without it, the Vercel build will fail on warnings that are harmless in development.

### PWA / Service Worker

The service worker (`public/service-worker.js`) is registered only in production. It:
- Caches the app shell on install for offline use
- Handles `push` events and calls `self.registration.showNotification()`
- Handles `notificationclick` to focus or open the app window

Push subscriptions are created client-side via `usePushNotifications`, stored server-side at `POST /api/push/subscribe`, and triggered by the task reminder scheduler.

---

## Auth Flow

1. User logs in via `/login` (email/password or Google OAuth)
2. Backend returns a JWT
3. `AuthContext` stores the token in `localStorage` and attaches it as `Authorization: Bearer <token>` on all Axios requests
4. On page load, `AuthContext` validates the stored token against `GET /api/auth/me`
5. Protected routes redirect to `/login` if no valid token is present

### Demo account

A demo account is available without registration:

- **Email:** demo@flayx.app
- **Access:** Click "Try Demo" on the login page, or `POST /api/auth/demo` to get a token programmatically

---

## Dashboard KPI Cards

The dashboard uses Server-Sent Events (`GET /api/analytics/stream`) for live data. KPI values use a compact number formatter:

| Raw value | Displayed as |
|-----------|-------------|
| 1,309,642 | $1.3M |
| 56,940 | $56.9k |
| 842 | $842 |

---

## License

MIT
