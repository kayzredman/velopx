#!/usr/bin/env bash
# Seed DB + Clerk test users for E2E and dashboard UI checks
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DATABASE_URL="${DATABASE_URL:-postgresql://velopx:velopx_secret@localhost:5432/velopx}"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

echo "==> VelopX demo seed"
echo "    DATABASE_URL → $(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/')"

run_db_seed() {
  cd "$ROOT/backend"
  pnpm db:seed
}

db_ok=0
host_from_url="$(echo "$DATABASE_URL" | sed -E 's|^postgresql://[^@]+@([^:/]+).*|\1|')"
port_from_url="$(echo "$DATABASE_URL" | sed -E 's|^postgresql://[^@]+@[^:/]+:([0-9]+).*|\1|')"
db_host="${host_from_url:-localhost}"
db_port="${port_from_url:-5432}"

if [ "$db_host" = "localhost" ] || [ "$db_host" = "127.0.0.1" ]; then
  if (echo >/dev/tcp/"$db_host"/"$db_port") 2>/dev/null; then
    run_db_seed && db_ok=1
  elif command -v docker >/dev/null 2>&1; then
    echo "Postgres not on $db_host:$db_port — trying Docker network…"
    if cd "$ROOT" && docker compose run --rm --no-deps \
      -e DATABASE_URL=postgresql://velopx:velopx_secret@postgres:5432/velopx \
      migrate sh -c "pnpm db:seed"; then
      db_ok=1
    fi
  fi
else
  run_db_seed && db_ok=1
fi

if [ "$db_ok" -eq 0 ]; then
  echo ""
  echo "WARN Database seed skipped — start Postgres (pnpm docker:infra) and re-run pnpm seed"
fi

echo ""
echo "==> Clerk test users"
cd "$ROOT/backend"
pnpm seed:clerk || echo "WARN Clerk seed skipped (check CLERK_SECRET_KEY in .env)"

if [ "$db_ok" -eq 0 ]; then
  exit 1
fi
