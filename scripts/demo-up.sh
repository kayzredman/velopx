#!/usr/bin/env bash
# Full stack + demo data + smoke checks
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_URL="${API_URL:-http://localhost:3100}"
WEB_URL="${WEB_URL:-http://localhost:3101}"
export API_URL WEB_URL

echo "==> Starting Docker stack (migrate pushes schema + seeds demo data)…"
docker compose --profile app up -d --build

echo ""
echo "==> Waiting for API health…"
for i in $(seq 1 30); do
  if curl -sf "$API_URL/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

curl -sf "$API_URL/health" >/dev/null || {
  echo "API did not become healthy at $API_URL"
  docker compose --profile app logs backend --tail 40
  exit 1
}

echo ""
bash scripts/seed-verify.sh

echo ""
echo "==> Provisioning Clerk demo users (if keys configured)…"
pnpm seed:clerk || true

echo ""
echo "==> Web smoke checks…"
check() {
  code=$(curl -s -o /dev/null -w "%{http_code}" "$1")
  [ "$code" = "200" ] && echo "  OK  $2 ($code)" || { echo "  FAIL $2 ($code)"; exit 1; }
}
check "$WEB_URL/" "landing"
check "$WEB_URL/catalogue" "catalogue"
check "$WEB_URL/sign-in" "sign-in"

echo ""
echo "Demo environment ready."
echo "  Web:  $WEB_URL"
echo "  API:  $API_URL"
echo "  Docs: $WEB_URL/docs"
echo ""
echo "Sign in with seeded Clerk users (pnpm seed:clerk) — e.g. dealer@velopx.dev / assessor@velopx.dev"
