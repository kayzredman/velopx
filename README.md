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
├── status/           # Next.js — status page app
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

- Node.js 20+
- pnpm 9.12.0 (`npm i -g pnpm@9.12.0`)
- Docker Desktop

### 1. Start infrastructure

```bash
docker-compose up -d
```

Services: PostgreSQL `:5432`, Redis `:6379`, Kafka `:9092`, Kafka UI `:8080`

### 2. Backend setup

```bash
cd backend
cp .env.example .env   # fill in CLERK keys + DATABASE_URL
pnpm install
pnpm db:migrate        # run Prisma migrations
pnpm dev               # starts on :3000
```

### 3. Web dashboard

```bash
cd web
cp .env.local.example .env.local   # fill in CLERK keys + NEXT_PUBLIC_API_URL
pnpm install
pnpm dev               # starts on :3001
```

### 4. Mobile apps

Each app needs a `.env` with:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://<your-mac-ip>:3000
```

**iOS Simulator:**

```bash
cd mobile/apps/dealer   # or driver / garage
pnpm expo run:ios
```

**Real device:**

```bash
# Kill any running Metro first
kill $(lsof -ti :8081) 2>/dev/null

cd mobile/apps/dealer
REACT_NATIVE_PACKAGER_HOSTNAME=<your-mac-ip> EXPO_NO_TELEMETRY=1 \
  node_modules/.bin/expo run:ios --device <udid>
```

---

## Workspace Scripts (root)

| Script             | What it does                              |
| ------------------ | ----------------------------------------- |
| `pnpm dev`         | Start backend + web + status concurrently |
| `pnpm dev:backend` | Backend only                              |
| `pnpm dev:web`     | Web only                                  |
| `pnpm db:migrate`  | Run Prisma migrations                     |
| `pnpm db:seed`     | Seed database                             |
| `pnpm db:generate` | Regenerate Prisma client                  |
| `pnpm build`       | Production build (backend + web + status) |

---

## API Overview

Base URL: `http://localhost:3000`

All authenticated routes require `Authorization: Bearer <clerk-jwt>`.

| Route                               | Access                     | Description                            |
| ----------------------------------- | -------------------------- | -------------------------------------- |
| `GET /v1/parts`                     | Public                     | Search parts catalogue                 |
| `POST /v1/parts`                    | dealer_owner, dealer_staff | Create part listing                    |
| `PATCH /v1/parts/:id`               | dealer (own parts)         | Update listing                         |
| `DELETE /v1/parts/:id`              | dealer_owner               | Remove listing                         |
| `GET /v1/quotes`                    | Auth (requester)           | List own quote requests                |
| `GET /v1/quotes/for-dealer`         | Auth (dealer)              | Quotes referencing dealer's parts      |
| `POST /v1/quotes`                   | Auth                       | Create RFQ                             |
| `PATCH /v1/quotes/:id/status`       | Auth                       | Accept / decline / mark responded      |
| `GET /v1/orders`                    | Auth (buyer)               | List orders                            |
| `POST /v1/orders`                   | Auth                       | Create order                           |
| `PATCH /v1/orders/:id/status`       | Auth                       | Update order status                    |
| `GET /v1/deliveries`                | Auth (role-scoped)         | List deliveries                        |
| `POST /v1/deliveries`               | dealer_owner, dealer_staff | Create delivery for confirmed order    |
| `PATCH /v1/deliveries/:id/status`   | Auth                       | Advance delivery state machine         |
| `PATCH /v1/deliveries/:id/location` | Auth (driver)              | Update GPS coordinates                 |
| `GET /health`                       | Public                     | Deep health check (DB + Redis + Kafka) |
| `POST /v1/webhooks/clerk`           | Svix-signed                | Sync Clerk user events → DB            |

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
User (requester) → Quote → QuoteItem → Part
User (buyer) → Order → OrderItem → Part
Order → Delivery (1:1)
User (driver) → Delivery (assigned)
* → AuditEvent (append-only)
```

See `backend/prisma/schema.prisma` for the full schema.

---

## Known Gaps / In Progress

See **Section 18** of `velopx-product-architecture.md` for the full implementation status and gap list.

Top 3 critical gaps:

1. **Role not set on sign-up** — new users default to `driver` role, blocking dealer/garage API access
2. **Dealer quote respond** — no backend endpoint for dealer to mark a quote as responded
3. **Garage RFQ creation** — parts search has no "Request Quote" flow on mobile

---

## Development Workflow

Three-agent model (see `.github/copilot-instructions.md`):

- **Frontend Agent** — mobile + web screens, Expo builds, native pipeline
- **Backend Agent** — Express routes, Prisma, Kafka, auth middleware
- **QA Agent** — spec compliance, API contract verification, TypeScript errors

Nothing ships until QA clears it.
