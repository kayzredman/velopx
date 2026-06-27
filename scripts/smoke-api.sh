#!/usr/bin/env bash
set -euo pipefail

API="${API_URL:-http://localhost:3100}"

echo "==> Smoke test: API at $API"

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-200}"
  code=$(curl -s -o /tmp/velopx-smoke.json -w "%{http_code}" "$url")
  if [ "$code" = "$expect" ]; then
    echo "  OK  $name ($code)"
  else
    echo "  FAIL $name (expected $expect, got $code)"
    cat /tmp/velopx-smoke.json 2>/dev/null || true
    exit 1
  fi
}

check "health" "$API/health"
check "parts search" "$API/v1/parts?limit=1"
check "benchmark" "$API/v1/parts/benchmark?oem=53711-42200&condition=oem&country=GH"

echo ""
echo "All API smoke checks passed."
