#!/usr/bin/env bash
# Mobile smoke: verify workspace + API contracts used by dealer/garage/driver apps
set -euo pipefail

API="${API_URL:-http://localhost:3100}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Smoke test: Mobile workspace + API contracts at $API"

check_api() {
  local name="$1"
  local url="$2"
  local expect="${3:-200}"
  code=$(curl -s -o /tmp/velopx-mobile-smoke.json -w "%{http_code}" "$url")
  if [ "$code" = "$expect" ]; then
    echo "  OK  $name ($code)"
  else
    echo "  FAIL $name (expected $expect, got $code)"
    cat /tmp/velopx-mobile-smoke.json 2>/dev/null || true
    exit 1
  fi
}

echo "==> Checking mobile packages install..."
cd "$ROOT/mobile"
pnpm install 2>&1 | tail -5
echo "  OK  mobile dependencies"

echo ""
echo "==> Public API endpoints (no auth)"
check_api "health" "$API/health"
check_api "parts search (garage)" "$API/v1/parts?limit=1"
check_api "benchmark (assessor)" "$API/v1/parts/benchmark?oem=53711-42200&condition=oem&country=GH"

echo ""
echo "==> Protected endpoints return 401 without token (expected)"
check_api "parts/mine (dealer)" "$API/v1/parts/mine" "401"
check_api "orders/for-dealer" "$API/v1/orders/for-dealer" "401"
check_api "quotes/for-dealer" "$API/v1/quotes/for-dealer" "401"
check_api "deliveries (driver)" "$API/v1/deliveries" "401"

echo ""
echo "All mobile smoke checks passed."
echo "Run apps: pnpm dev:mobile:dealer | dev:mobile:garage | dev:mobile:driver"
echo "Auth flows require real Clerk keys in .env and per-app EXPO_PUBLIC_* vars."
