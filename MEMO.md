# VelopX — Platform Memo

Quick reference for local dev, roles, URLs, and ops. See [README.md](README.md) for full setup.

## Default ports (Docker)

| Service | URL |
|---------|-----|
| Web app | http://localhost:3101 |
| API | http://localhost:3100 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |
| Kafka | localhost:9092 |
| Kafka UI | http://localhost:8080 |

Local `pnpm dev` uses **3000** (API) and **3001** (web) unless ports are taken.

## Role → home URL (web)

Set role in Clerk **public metadata** on the user, e.g. `{ "role": "dealer_owner" }`.

| Clerk `role` | Web path | Notes |
|--------------|----------|-------|
| `dealer_owner`, `dealer_staff` | `/dealer` | Catalogue, orders, RFQs, dispatch |
| `garage_owner`, `garage_staff` | `/garage` | Search, quotes, orders |
| `assessor` | `/assess` | Benchmark + audit export (live) |
| `insurer_admin`, `insurer_staff` | `/insight` | Insurer dashboard — **Phase 2 stub** |
| `driver` | `/dealer` (default fallback) | Use mobile driver app for deliveries |

**Insurance companies today:** use `/assess` for claims tools until `/insight` ships.

## Docs & health

| URL | Purpose |
|-----|---------|
| http://localhost:3101/docs | Hybrid UI (health + routes + API table) |
| http://localhost:3100/docs | Standalone HTML (auto-refresh 30s) |
| http://localhost:3100/docs.json | JSON catalogue for tooling |
| http://localhost:3100/health | DB / Kafka / Clerk checks |

## Common commands

```bash
pnpm docker:infra          # postgres, redis, kafka only
pnpm docker:up             # full stack (3100/3101)
pnpm smoke:all             # API + web + mobile contract smoke
bash scripts/seed-demo.sh  # demo dealer + 3 parts
pnpm dev                   # local API + web (3000/3001)
```

## Clerk

- Keys in root `.env` and `web/.env.local`
- Webhook: `POST /v1/webhooks/clerk` (needs `CLERK_WEBHOOK_SECRET`)
- Without webhook, users are **JIT-provisioned** on first authenticated API call
- Duplicate email / race: handled in `backend/src/lib/resolveUser.ts`

## Mobile

```bash
pnpm dev:mobile:dealer
pnpm dev:mobile:garage
pnpm dev:mobile:driver
```

Set `EXPO_PUBLIC_API_URL=http://localhost:3100` (Docker) or `3000` (local dev).

## Phase 1 vs 2

| Live (Phase 1) | Phase 2 |
|----------------|---------|
| Dealer / garage / driver flows | `/insight` insurer dashboard |
| Assessor benchmark + audit export | Payments, KYC |
| Public catalogue | Full OpenAPI / Swagger UI |
| Docker + smoke scripts | API key portal |

## Agent note

Mobile changes: read [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) per [AGENTS.md](AGENTS.md).
