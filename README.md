# VelopX

> _Velocity meets intelligence_ — the auto parts intelligence platform for Sub-Saharan Africa.

Connects parts dealers, garages, dispatchers, insurance assessors, and insurers on a single platform.

---

## Repository Structure

```
velopx/
├── backend/          # Node.js/TypeScript API (Express, Prisma, Kafka)
├── mobile/
│   ├── apps/
│   │   ├── dealer/   # Expo SDK 54 — dealer storefront & catalogue
│   │   ├── driver/   # Expo SDK 54 — dispatcher/driver delivery app
│   │   └── garage/   # Expo SDK 54 — garage/mechanic shop app
│   └── packages/
│       └── shared/   # Shared components, hooks, constants
├── web/              # Next.js — web dashboard (dealer, garage, assessor, insurer portals)
├── docker-compose.yml
├── velopx-product-architecture.md   # Full product spec (always read before building)
└── spare-parts-hub.md               # Original RFP context
```

---

## Tech Stack

| Layer           | Technology                                                         |
| --------------- | ------------------------------------------------------------------ |
| Mobile          | Expo SDK 54, React Native 0.81.5, Expo Router v3, TypeScript       |
| Web             | Next.js 15 (App Router), Tailwind CSS, TypeScript                  |
| Backend         | Node.js, TypeScript, Express, Prisma (PostgreSQL 16)               |
| Auth            | Clerk (clerk-expo + @clerk/nextjs + @clerk/express)                |
| Messaging       | Kafka (Confluent 7.6 via Docker)                                   |
| Cache           | Redis 7 (via Docker — provisioned, not yet used by business logic) |
| Package manager | pnpm 9.12.0 (workspaces monorepo)                                  |

---

## Quick Start

### Prerequisites

- Node.js 20 (`nvm use 20` — Node 24 crashes kafkajs)
- pnpm 9.12.0 (`npm i -g pnpm@9.12.0`)
- Docker Desktop

### 1. Start infrastructure

```bash
docker-compose up -d
```

Services: PostgreSQL `:5432`, Redis `:6379`, Kafka `:9092`, Kafka UI `:8080`

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in CLERK keys + DATABASE_URL + FLUTTERWAVE_SECRET_KEY
PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" npx esbuild src/index.ts \
  --bundle --platform=node --target=node20 --outfile=dist/index.js \
  --external:@prisma/client --external:@clerk/express --external:dotenv --format=cjs
PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" node dist/index.js
# Starts on :3000
```

Schema changes (never `migrate dev`):
```bash
cd backend && npx prisma db push
```

### 3. Web dashboard

```bash
cd web
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL + CLERK keys
pnpm dev   # :3001
```

### 4. Mobile apps

Each app needs `.env`:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://<your-mac-ip>:3000
```

**iOS Simulator (iPhone 17, UUID `77951E55-C7B0-43E9-A699-561BF99DB787`):**
```bash
kill $(lsof -ti :8081) 2>/dev/null   # kill any Metro
cd mobile/apps/dealer   # or driver / garage
pnpm expo run:ios
```

**Real device:**
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<mac-ip> EXPO_NO_TELEMETRY=1 \
  node_modules/.bin/expo run:ios --device <udid>
```

---

## Workspace Scripts

| Script             | What it does                   |
| ------------------ | ------------------------------ |
| `pnpm dev:backend` | Backend only                   |
| `pnpm dev:web`     | Web only                       |
| `pnpm db:push`     | Prisma db push (schema → DB)   |
| `pnpm db:generate` | Regenerate Prisma client       |

---

## API Overview

Base URL: `http://localhost:3000` — All authenticated routes require `Authorization: Bearer <clerk-jwt>`.

| Route | Access | Description |
|---|---|---|
| `GET /v1/parts` | Public | Search parts catalogue |
| `POST /v1/parts` | dealer | Create part listing |
| `PATCH /v1/parts/:id` | dealer (own) | Update listing |
| `DELETE /v1/parts/:id` | dealer_owner | Remove listing |
| `GET /v1/quotes` | Auth | List own RFQs |
| `GET /v1/quotes/for-dealer` | dealer | Quotes for dealer's parts |
| `POST /v1/quotes` | Auth | Create RFQ |
| `PATCH /v1/quotes/:id/status` | Auth | Accept / decline (creates Order on accept) |
| `PATCH /v1/quotes/:id/respond` | dealer | Dealer responds with pricing |
| `GET /v1/orders` | Auth | List orders (buyer or seller view) |
| `POST /v1/orders` | Auth | Create order |
| `PATCH /v1/orders/:id/status` | Auth | Update order status |
| `PATCH /v1/orders/:id/delivery-location` | buyer | Override delivery destination |
| `GET /v1/deliveries` | Auth (role-scoped) | List deliveries |
| `POST /v1/deliveries` | dealer | Create delivery |
| `PATCH /v1/deliveries/:id/status` | Auth | Advance delivery state machine |
| `PATCH /v1/deliveries/:id/location` | driver | Update GPS coordinates |
| `GET /v1/users/me` | Auth | Get own profile |
| `PATCH /v1/users/me` | Auth | Update name, address, lat/lng |
| `GET/POST/DELETE /v1/users/team/drivers` | dealer_owner | Manage driver team |
| `GET/POST/DELETE /v1/users/team/staff` | garage_owner | Manage workshop staff |
| `GET /v1/vehicles/decode?vin=` | Auth | NHTSA VIN decode |
| `GET /v1/claims` | Auth | List insurance claims |
| `POST /v1/claims` | assessor | Create claim |
| `PATCH /v1/claims/:id` | assessor | Update claim assessment |
| `GET /v1/analytics/dealer` | dealer | Dealer KPI stats |
| `GET /v1/analytics/garage` | garage | Garage KPI stats |
| `GET /v1/analytics/insurer` | insurer | Insurer claims analytics |
| `GET /v1/job-cards` | garage | List job cards |
| `POST /v1/job-cards` | garage | Create job card |
| `GET /health` | Public | Deep health check (DB + Redis + Kafka) |
| `POST /v1/webhooks/clerk` | Svix-signed | Sync Clerk user events → DB |

---

## App Identifiers

| App    | Bundle ID         | URL Scheme    |
| ------ | ----------------- | ------------- |
| Dealer | com.velopx.dealer | velopx-dealer |
| Driver | com.velopx.driver | velopx-driver |
| Garage | com.velopx.garage | velopx-garage |

---

## Data Model (summary)

```
Organisation → User (many)
User (dealer) → Part (many)
User → Quote → QuoteItem → Part
Quote (accepted) → Order → OrderItem → Part
Order → Delivery (1:1)
User (driver) → Delivery (assigned)
Delivery → Claim → ClaimLineItem
JobCard → JobCardPart → Part
User → AuditEvent (append-only, via Kafka)
```

See `backend/prisma/schema.prisma` for the full schema.

---

## Sprint Status

### Sprint 3 — Complete (May 5, 2026) · commit `f4f5ebb`

| Feature | Status |
|---|---|
| Dealer mobile: profile tab + sign-out | ✅ |
| Garage mobile: inbound deliveries list tab | ✅ |
| Insurer web settings: wired to real API | ✅ |
| Backend: NHTSA VIN decode `/v1/vehicles/decode` | ✅ |
| Garage mobile: VIN lookup in search screen | ✅ |
| Dealer mobile: catalogue image URL inputs | ✅ |
| PDF audit export: assess/reports + insight/reports | ✅ |
| Garage web settings: workshop staff management | ✅ |
| Backend: `/v1/users/team/staff` CRUD endpoints | ✅ |
| Push notifications foundation | ⏳ Deferred (requires expo-notifications install) |

### Sprint 4 — Backlog (not started)

**[BLOCKER]**
- B1: `GET /v1/vehicles/cascade` — make/model/year dropdown for search without VIN
- B2: Flutterwave webhook secret validation (security — accepts all traffic without it)
- B3: Goods receipt condition photo capture in `garage/inbound/[id].tsx`

**[HIGH]**
- H1/H2: KYC fields on User model + `POST /v1/users/onboarding`
- H3/H4: Dealer + Garage mobile onboarding screens
- H5: Dealer dispatch live map (replace static form)
- H6: Garage orders dispute raise flow (photo evidence)
- H7: Driver exception reporting (not available / refused / wrong address)
- H8: `GET /v1/analytics/insurer` server-side scoped endpoint
- H9: Assessor delivery tracking view `/assess/deliveries`
- H10: Insurer reports page (real export, not stub)

---

## Development Workflow

Three-agent model (see `.github/copilot-instructions.md`):

- **Frontend Agent** — mobile + web screens, Expo builds, native pipeline
- **Backend Agent** — Express routes, Prisma, Kafka, auth middleware
- **QA Agent** — spec compliance, API contract verification, TypeScript errors

**Nothing ships without `[QA PASS]`.**

### Commit convention
```
feat(scope): description
fix(scope): description
```
Scopes: `dealer`, `garage`, `driver`, `backend`, `shared`, `web`

---

## Known Technical Notes

- **Node version**: MUST use Node 20 — kafkajs crashes on Node 24
- **Prisma**: use `prisma db push` only (never `migrate dev` in this repo)
- **Metro**: port 8081, one app at a time — `kill $(lsof -ti :8081) 2>/dev/null` before switching
- **Clerk errors (mobile)**: check `err.errors[0].message`, not `err instanceof Error`
- **`publishEvent` signature**: `(topic: string, key: string | null, payload: EventPayload)` — 3 args
- **Web client components**: `'use client'` + `useAuth` → `getToken()` → `Authorization: Bearer`
- **Web server components**: use `apiFetch` from `@/lib/api`
- **`OrderItem` field**: `price` (NOT `unitPrice`)
- **`User` model fields**: `id`, `clerkId`, `email`, `name`, `role`, `organisationId`, `lat`, `lng`, `address`


```
velopx/
├── backend/          # Node.js/TypeScript API (Express, Prisma, Kafka)
├── mobile/
│   ├── apps/
│   │   ├── dealer/   # Expo SDK 54 — dealer storefront & catalogue
│   │   ├── driver/   # Expo SDK 54 — dispatcher/driver delivery app
│   │   └── garage/   # Expo SDK 54 — garage/mechanic shop app
│   └── packages/
│       └── shared/   # Shared components, hooks, constants
├── web/              # Next.js — web dashboard (dealer, garage, assessor, insurer portals)
├── status/           # Next.js — status page app
├── docker-compose.yml
├── velopx-product-architecture.md   # Full product spec (always read before building)
└── spare-parts-hub.md               # Original RFP context
```

---
