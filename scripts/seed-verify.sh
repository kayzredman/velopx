#!/usr/bin/env bash
# Verify demo seed counts — run after pnpm seed
set -euo pipefail

API="${API_URL:-http://localhost:3100}"
DB="${DATABASE_URL:-postgresql://velopx:velopx_secret@localhost:5432/velopx}"

echo "==> Verifying seed data"

fail() {
  echo "  FAIL $1"
  exit 1
}

pass() {
  echo "  OK   $1"
}

curl -sf "$API/health" >/dev/null || fail "API unreachable at $API"
pass "API health"

parts_json=$(curl -sf "$API/v1/parts?limit=1" || fail "parts search")
total=$(echo "$parts_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['meta']['total'])" 2>/dev/null || echo "0")
if [ "${total:-0}" -lt 15 ]; then
  fail "expected ≥15 public parts, got $total (run: pnpm seed)"
fi
pass "public parts catalogue ($total listings)"

curl -sf "$API/v1/parts/benchmark?oem=53711-42200&condition=oem&country=GH" >/dev/null || fail "benchmark"
pass "benchmark endpoint"

if command -v psql >/dev/null 2>&1; then
  dealers=$(psql "$DB" -t -A -c "SELECT count(*) FROM \"User\" WHERE role IN ('dealer_owner','dealer_staff');" 2>/dev/null | tr -d '[:space:]' || echo 0)
  garages=$(psql "$DB" -t -A -c "SELECT count(*) FROM \"User\" WHERE role IN ('garage_owner','garage_staff');" 2>/dev/null | tr -d '[:space:]' || echo 0)
  parts=$(psql "$DB" -t -A -c 'SELECT count(*) FROM "Part";' 2>/dev/null | tr -d '[:space:]' || echo 0)
  quotes=$(psql "$DB" -t -A -c 'SELECT count(*) FROM "Quote";' 2>/dev/null | tr -d '[:space:]' || echo 0)
  orders=$(psql "$DB" -t -A -c 'SELECT count(*) FROM "Order";' 2>/dev/null | tr -d '[:space:]' || echo 0)
  deliveries=$(psql "$DB" -t -A -c 'SELECT count(*) FROM "Delivery";' 2>/dev/null | tr -d '[:space:]' || echo 0)

  [ "${dealers:-0}" -ge 3 ] && pass "dealers in DB ($dealers)" || fail "expected ≥3 dealers, got ${dealers:-0}"
  [ "${garages:-0}" -ge 3 ] && pass "garages in DB ($garages)" || fail "expected ≥3 garages, got ${garages:-0}"
  [ "${parts:-0}" -ge 15 ] && pass "parts in DB ($parts)" || fail "expected ≥15 parts, got ${parts:-0}"
  [ "${quotes:-0}" -ge 3 ] && pass "quotes in DB ($quotes)" || fail "expected ≥3 quotes, got ${quotes:-0}"
  [ "${orders:-0}" -ge 3 ] && pass "orders in DB ($orders)" || fail "expected ≥3 orders, got ${orders:-0}"
  [ "${deliveries:-0}" -ge 2 ] && pass "deliveries in DB ($deliveries)" || fail "expected ≥2 deliveries, got ${deliveries:-0}"
else
  echo "  skip DB counts (psql not installed)"
fi

echo ""
echo "Seed verification passed."
