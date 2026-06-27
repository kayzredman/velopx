# VelopX — Platform Memo

Quick reference for local dev, roles, URLs, and ops. See [README.md](README.md) for full setup.

---

## Resume after restart (2026-06-27)

**Status (post-reboot):** Docker recovered. `pnpm demo:up` succeeded — 19 parts seeded, API/web healthy on 3100/3101, Clerk users synced.

**Quick start:**

```bash
cd ~/Desktop/Builds/velopX
open -a Docker                    # if daemon not running
pnpm demo:up                      # full stack + seed + verify
# or incremental:
pnpm docker:db && pnpm seed && pnpm docker:up
```

**Clerk demo users.** Password: `VelopXDemo2026!` — re-sync demo: `pnpm seed:clerk` · team: `pnpm seed:team`

| Email | Role | Start here |
|-------|------|------------|
| `kayzredman@gmail.com` | dealer_owner | `/dealer` |
| `rowland.kay.jones@gmail.com` | assessor + insurer_admin | `/insight` or `/assess` (sidebar switcher) |
| `dealer@velopx.dev` | dealer_owner | `/dealer` |
| `dealer2@velopx.dev`, `dealer3@velopx.dev` | dealer_owner | marketplace / directory |
| `garage@velopx.dev`, `garage2@velopx.dev`, `garage3@velopx.dev` | garage_owner | `/garage`, mobile garage app |
| `assessor@velopx.dev` | assessor | `/assess/catalogue`, `/assess/garages` |
| `insurer@velopx.dev` | insurer_admin | `/insight/catalogue` |
| `driver@velopx.dev` | driver | mobile driver app |

**Git:** `main` is **1 commit ahead** of origin (`39abeb8` README/MEMO only). Large uncommitted revamp — **not committed yet**.

**Next tasks:**
- [x] Run `pnpm demo:up` — stack up, 19 parts, smoke passed
- [ ] Manual UI: sign in as `dealer@velopx.dev` — dashboard RFQs, orders, dispatch
- [ ] Manual UI: sign in as `assessor@velopx.dev` — marketplace, garages, dealers
- [ ] Manual UI: audit export on `/assess` with claim ref `CLM-2026-001`
- [ ] Commit remaining work when ready

**If Docker breaks again:** `pnpm local:db` (Homebrew Postgres, no Docker)

---

## Default ports (Docker)

| Service | URL |
|---------|-----|
| Web app | http://localhost:3101 |
| API | http://localhost:3100 |
| Postgres | localhost:5432 (`velopx` / `velopx_secret`) |
| Redis | localhost:6379 |
| Kafka | localhost:9092 |
| Kafka UI | http://localhost:8080 |

Local `pnpm dev` uses **3000** (API) and **3001** (web) unless ports are taken.

## Role → home URL (web)

Role in Clerk **public metadata**: `{ "role": "dealer_owner" }`.  
Auto-provisioned via `pnpm seed:clerk` or JIT on first API call (`backend/src/lib/resolveUser.ts`).

| Clerk `role` | Web path | Notes |
|--------------|----------|-------|
| `dealer_owner`, `dealer_staff` | `/dealer` | Own catalogue only (`/v1/parts/mine`) |
| `garage_owner`, `garage_staff` | `/garage` | Search, quotes, orders |
| `assessor` | `/assess` | Tools + **marketplace** + directories |
| `insurer_admin`, `insurer_staff` | `/insight` | Same marketplace views under `/insight/*` |
| `driver` | mobile driver app | Deliveries |

### Assessor / insurer one-stop views (live)

| Page | API |
|------|-----|
| `/assess/catalogue` | `GET /v1/parts/marketplace` (all dealers) |
| `/assess/garages` | `GET /v1/directory/garages` |
| `/assess/dealers` | `GET /v1/directory/dealers` |
| `/insight/catalogue` etc. | Same components, insurer nav |

Dealers still see **only their own** parts at `/dealer/parts`.

## Demo seed data

Run: `pnpm seed` (DB) + `pnpm seed:clerk` (Clerk users).

| Entity | Count |
|--------|-------|
| Dealers | 3 (+ 1 staff) |
| Garages | 3 (+ 1 staff) |
| Parts | 19 across dealers |
| Quotes | 4 (pending, responded, accepted) |
| Orders | 4 (pending → completed) |
| Deliveries | 3 |
| Claim refs | `CLM-2026-001` … `CLM-2026-005` |
| Benchmark OEM | `53711-42200` (listed by all 3 dealers) |

Docker `migrate` service runs **`db:push && db:seed`** automatically on `pnpm docker:up`.

## Docs & health

| URL | Purpose |
|-----|---------|
| http://localhost:3101/docs | Hybrid UI (health + routes + API table) |
| http://localhost:3100/docs | Standalone HTML (auto-refresh 30s) |
| http://localhost:3100/docs.json | JSON catalogue |
| http://localhost:3100/health | DB / Kafka / Clerk checks |

## Common commands

```bash
pnpm docker:db           # postgres only (minimal for seed)
pnpm docker:infra        # postgres, redis, kafka, kafka-ui
pnpm docker:up           # full stack + auto migrate/seed
pnpm demo:up             # stack + verify + clerk + smoke
pnpm seed                # DB seed + Clerk
pnpm seed:clerk          # Clerk users only
pnpm seed:verify         # post-seed checks
pnpm local:db            # Homebrew Postgres fallback (no Docker)
pnpm smoke:all           # API + web + mobile contract smoke
pnpm dev                 # local API + web (3000/3001)
```

## Clerk

- Keys in root `.env` and `web/.env.local`
- Webhook: `POST /v1/webhooks/clerk` (needs `CLERK_WEBHOOK_SECRET`)
- Without webhook: **JIT provisioning** on first authenticated API call
- Demo password (seeded users): `VelopXDemo2026!`
- Middleware: use `auth().protect()` not `auth.protect()` (Clerk v5.7)

## Mobile

```bash
pnpm dev:mobile:dealer
pnpm dev:mobile:garage
pnpm dev:mobile:driver
```

Set `EXPO_PUBLIC_API_URL=http://localhost:3100` (Docker) or `3000` (local dev).  
Expo SDK **56** — read [docs](https://docs.expo.dev/versions/v56.0.0/) per [AGENTS.md](AGENTS.md).

## Key backend files (recent work)

| Area | Path |
|------|------|
| Demo seed | `backend/prisma/seed.ts`, `seed-accounts.ts` |
| Clerk seed | `backend/scripts/seed-clerk-users.ts` |
| Assessor marketplace API | `backend/src/routes/v1/parts.ts` (`/marketplace`) |
| Directories | `backend/src/routes/v1/directory.ts` |
| Role helpers | `backend/src/lib/roles.ts` |
| User JIT | `backend/src/lib/resolveUser.ts` |
| API catalogue | `backend/src/lib/apiCatalog.ts` |

## Web implementation roadmap

### ✅ Shipped (catalogue & CRUD)
- `/catalogue/[id]` — public part detail (view-only, market draw)
- `/dealer/parts/[id]` + `/edit` — owner view + full CRUD
- Hybrid images: URL paste + file upload (`POST /api/uploads/part-image`)
- Grid cards with thumbnails → detail (public, marketplace, landing)
- Garage web: mobile-first browse + orders (RFQ stays in mobile app)
- Seed listings include stock photos (Unsplash)

### Phase A — Operations depth (next)
- Order / quote / RFQ detail drill-down pages
- Delivery proof upload UI
- Catalogue filters (condition, country, dealer)
- Migrate uploads to Cloudinary/S3 for production persistence

### Phase B — Analytics & reporting (key)
Fast decision-making dashboards — two tiers:

| Dashboard | Audience | Examples |
|-----------|----------|----------|
| **Platform ops** | Admin / insurer leadership | GMV, claim cost trends, dealer SLA, delivery KPIs, fraud flags |
| **Role workspaces** | Dealer, assessor, garage, insurer staff | Dealer: RFQ conversion, margin; Assessor: claim variance; Insurer: portfolio loss ratio |

Tech: Kafka → analytics store (MongoDB lake per architecture), `/v1/analytics/*` APIs, `/insight` + role-specific `/dealer/analytics`, `/assess/reports`.

### Phase C — Last: Payments service (isolated)
Separate **`payments` service** (not in monolith API):
- MoMo, card, bank transfer, PO settlement
- Webhooks, ledger, reconciliation
- Checkout only after catalogue + analytics are stable

## Phase summary

| Live now | Planned |
|----------|---------|
| Part detail + CRUD + hybrid images | Order/RFQ detail pages |
| Marketplace + directories | Role + platform analytics |
| Assessor benchmark + audit export | Advanced search / fitment |
| Docker + seed + smoke | **Payments service (last)** |

## Agent note

Mobile changes: read [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) per [AGENTS.md](AGENTS.md).
