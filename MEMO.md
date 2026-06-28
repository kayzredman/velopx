# VelopX — Platform Memo

Quick reference for local dev, roles, URLs, and ops. See [README.md](README.md) for full setup.

---

## Resume here (2026-06-28 — theme + dashboard checkpoint)

**Status:** Docker stack on **3100/3101**. Schema synced via `pnpm db:sync`. Web has light/dark theme + navy sidebar + deeper main canvas. Mobile has theme on all three profile screens. **Large uncommitted diff — not committed yet.**

### Quick start (after reboot or fresh clone)

```bash
cd ~/Desktop/Builds/velopX
open -a Docker                    # if daemon not running

# Recommended — full stack + schema from repo + seed + verify
pnpm demo:up

# If stack is already up but dashboard shows API 500 / schema errors:
pnpm db:sync
docker compose restart backend web

# Web only (skip failing migrate hook):
docker compose --profile app up -d web backend --no-deps

# Local dev (no Docker for API/web):
pnpm dev                          # API :3000, web :3001
```

### Run commands cheat sheet

| Goal | Command |
|------|---------|
| Full demo environment | `pnpm demo:up` |
| Fix DB schema drift (always use after pulling schema changes) | `pnpm db:sync` |
| Docker stack (no auto-fix) | `pnpm docker:up` or `docker compose --profile app up -d` |
| Restart API + web after code/DB changes | `docker compose restart backend web` |
| Rebuild web image (theme/UI changes in Docker) | `docker compose --profile app build web && docker compose --profile app up -d web --no-deps` |
| Reseed demo data only | `pnpm db:seed` |
| Clerk demo users | `pnpm seed:clerk` |
| Verify seed + API | `pnpm seed:verify` |
| Mobile dealer | `pnpm dev:mobile:dealer` |
| Mobile garage | `pnpm dev:mobile:garage` |
| Mobile driver | `pnpm dev:mobile:driver` |

**Mobile env:** `EXPO_PUBLIC_API_URL=http://localhost:3100` (Docker API). Reload simulator with **R** after theme changes.

**Demo login:** `kayzredman@gmail.com` / `VelopXDemo2026!` → `/dealer`  
**Seed counts (dealer account):** ~7 listings, 4 orders, 4 RFQs after `pnpm db:sync`.

### Theme (web + mobile)

| Platform | Where to toggle | Notes |
|----------|-----------------|-------|
| **Web** | Sidebar → **Appearance** (Auto / Light / Dark) | Navy gradient sidebar + orange accent stripe; main canvas dimmer; cards use semantic tokens |
| **Web mobile** | Top of page (ThemeBar, `md:hidden`) | Desktop uses sidebar only |
| **Mobile** | Profile tab → **Appearance** | All 3 apps (dealer, garage, driver); persisted in SecureStore |

Key paths: `web/app/globals.css`, `web/components/layout/AppSidebar.tsx`, `web/components/ui/theme-toggle.tsx`, `mobile/packages/shared/src/theme/*`.

### Dashboard / API gotcha

If dealer dashboard shows **API 500** or `User.lat does not exist`:

1. Run `pnpm db:sync` (pushes Prisma schema from **repo**, not stale Docker migrate image)
2. `docker compose restart backend`
3. Hard-refresh web (`Cmd+Shift+R`)

Docker `migrate` service can exit non-zero; `demo-up.sh` now runs `scripts/db-sync.sh` from the host. Manual fallback: `pnpm db:sync`.

### Done this session (pick up later)

- [x] Light/dark theme web + mobile infrastructure
- [x] Dealer dashboard error UX, empty states, partial API failure handling
- [x] Sidebar color + deeper main background
- [x] `scripts/db-sync.sh` + `pnpm db:sync`
- [ ] **Commit** theme + dashboard + sidebar work
- [ ] Page-level hex cleanup (`bg-[#0C1526]` etc.) for full light mode on all tables
- [ ] Fix migrate service reliability in Docker Compose
- [ ] Mobile spot-check light mode on key screens

**Git:** still on `dev` with uncommitted changes from this session.

---

## Resume after restart (2026-06-27)

**Status (post-reboot):** Docker recovered. `pnpm demo:up` succeeded — 19 parts seeded, API/web healthy on 3100/3101, Clerk users synced.

**Quick start:**

```bash
cd ~/Desktop/Builds/velopX
open -a Docker                    # if daemon not running
pnpm demo:up                      # full stack + seed + verify (now runs db-sync — see 2026-06-28 section)
# or incremental:
pnpm docker:db && pnpm db:sync && pnpm docker:up
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
| Parts | 26 across dealers (~7 for `kayzredman@gmail.com`) |
| Quotes | 4 (pending, responded, accepted) |
| Orders | 4 (pending → completed) |
| Deliveries | 3 |
| Claim refs | `CLM-2026-001` … `CLM-2026-005` |
| Benchmark OEM | `53711-42200` (listed by all 3 dealers) |

Docker `migrate` service runs **`prisma db push && db:seed`** on container start — can drift from repo schema. **Prefer `pnpm db:sync`** after pulls (uses host repo schema). `demo-up.sh` calls `db-sync.sh` automatically.

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
pnpm docker:up           # full stack + migrate/seed (may fail migrate — use db:sync)
pnpm db:sync             # prisma db push + seed from repo (fix schema drift)
pnpm demo:up             # stack + db-sync + verify + clerk + smoke
pnpm seed                # DB seed only
pnpm seed:clerk          # Clerk users only
pnpm seed:verify         # post-seed checks
pnpm local:db            # Homebrew Postgres fallback (no Docker)
pnpm smoke:all           # API + web + mobile contract smoke
pnpm dev                 # local API + web (3000/3001)
pnpm dev:web             # web only
pnpm dev:backend         # API only
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

**Theme:** Profile → Appearance (Auto / Light / Dark). Shared: `mobile/packages/shared/src/theme/`.

## Key backend files (recent work)

| Area | Path |
|------|------|
| DB schema sync script | `scripts/db-sync.sh` |
| Demo up (includes db-sync) | `scripts/demo-up.sh` |
| Web theme tokens | `web/app/globals.css` |
| Web sidebar + theme | `web/components/layout/AppSidebar.tsx` |
| Dealer dashboard | `web/app/(clerk-shell)/(dashboard)/dealer/page.tsx` |
| Mobile theme | `mobile/packages/shared/src/theme/` |
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
