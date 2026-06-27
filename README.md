# VelopX

Auto parts intelligence platform for motor claims — dealers, garages, assessors, and insurers on a single auditable marketplace.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, Prisma, PostgreSQL, Kafka, Clerk |
| Web | Next.js 15, Tailwind, shadcn-style Radix UI |
| Mobile | Expo SDK 56, React Native 0.85, Clerk Expo |

## Quick start

### 1. Environment

```bash
cp .env.example .env
# Fill in Clerk keys from https://dashboard.clerk.com
```

### 2. Infrastructure

```bash
docker compose up -d
```

### 3. Install & migrate

```bash
pnpm install
cd mobile && pnpm install && cd ..
pnpm db:generate
pnpm db:migrate
```

### 4. Run

```bash
pnpm dev          # backend :3000 + web :3001
```

Mobile apps (from `mobile/`):

```bash
pnpm dealer       # dealer app
pnpm garage       # garage app
pnpm driver       # driver app
```

Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_API_URL` in each mobile app `.env`.

## Key routes

### Platform docs (health + API reference)

| URL | Description |
|-----|-------------|
| http://localhost:3101/docs | Web hybrid docs (live health + routes) |
| http://localhost:3100/docs | API HTML docs (auto-refresh) |
| http://localhost:3100/docs.json | Machine-readable catalogue |
| http://localhost:3100/health | Dependency health JSON |

### Web (by role)

| Route | Role | Status |
|-------|------|--------|
| `/` | public | Live |
| `/catalogue` | public | Live |
| `/docs` | public | Live — health + API reference |
| `/dealer/*` | dealer_owner, dealer_staff | Live |
| `/garage` | garage_owner, garage_staff | Live |
| `/assess` | assessor, insurer_* | Live — benchmark & audit export |
| `/insight` | insurer_admin, insurer_staff | Phase 2 stub |

### API (`/v1`)

| Endpoint | Purpose |
|----------|---------|
| `GET /parts/mine` | Dealer-scoped catalogue |
| `GET /orders/for-dealer` | Seller orders |
| `GET /parts/benchmark` | Assessor price benchmark |
| `GET /audit/export` | Per-claim audit export |

## Docs

- [Platform memo](MEMO.md) — ports, roles, URLs, ops cheat sheet
- [Product architecture](velopx-product-architecture.md)
- [UI design tokens](web/DESIGN.md)
- [UI mockups](velopx-mockups.html)
- Mobile: read [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/) before mobile changes ([AGENTS.md](AGENTS.md))

## Docker (full stack)

Infra only (Postgres, Redis, Kafka, Kafka UI):

```bash
pnpm docker:infra
```

Full app (migrate + API + web). Default host ports **3100** (API) and **3101** (web) to avoid clashing with other local dev servers on 3000/3001:

```bash
pnpm docker:up      # build & start everything
pnpm docker:logs    # tail logs
pnpm docker:down    # stop app profile
pnpm docker:reset   # down + delete volumes
```

Optional demo seed (after infra is up):

```bash
bash scripts/seed-demo.sh
```

Smoke tests (API + web + mobile API contracts):

```bash
pnpm smoke:all
# or override ports: API_URL=http://localhost:3100 WEB_URL=http://localhost:3101 pnpm smoke:web
```

Set real Clerk keys in `.env` for authenticated dealer/garage/assess flows. Placeholder keys run public pages and API smoke only.

## Phase 1 status

- Dealer/garage/driver core flows wired
- Assessor benchmark + audit export wedge
- Payments, KYC, Insight dashboard → Phase 2
