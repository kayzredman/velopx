#!/usr/bin/env bash
set -euo pipefail

WEB="${WEB_URL:-http://localhost:3101}"
API="${API_URL:-http://localhost:3100}"

echo "==> Smoke test: Web at $WEB"

check() {
  local name="$1"
  local url="$2"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "200" ]; then
    echo "  OK  $name ($code)"
  else
    echo "  FAIL $name (got $code) — $url"
    exit 1
  fi
}

# API first
bash "$(dirname "$0")/smoke-api.sh"

# Public web pages
check "landing" "$WEB/"
check "catalogue" "$WEB/catalogue"
check "sign-in" "$WEB/sign-in"

echo ""
echo "All web smoke checks passed."
echo "Note: dealer/assess routes require Clerk auth — sign in manually to test those flows."
