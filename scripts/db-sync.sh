#!/usr/bin/env bash
# Push latest Prisma schema to Postgres and seed demo data.
# Uses repo schema (not a stale Docker image) so dashboard APIs stay in sync.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DATABASE_URL="${DATABASE_URL:-postgresql://velopx:velopx_secret@localhost:5432/velopx}"
export DATABASE_URL

echo "==> Pushing Prisma schema to database…"
pnpm --filter backend exec prisma db push

echo "==> Seeding demo data…"
pnpm --filter backend db:seed

echo "==> Schema sync complete."
