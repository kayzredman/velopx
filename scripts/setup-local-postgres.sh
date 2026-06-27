#!/usr/bin/env bash
# Local Postgres via Homebrew when Docker storage is broken/unavailable.
# Creates DB matching .env.example, runs schema push + demo seed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${VELOPX_DB_NAME:-velopx}"
DB_USER="${VELOPX_DB_USER:-$(whoami)}"
DB_PORT="${VELOPX_DB_PORT:-5432}"

echo "==> Local Postgres setup (Homebrew)"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew required: https://brew.sh"
  exit 1
fi

install_pg() {
  if brew list postgresql@16 >/dev/null 2>&1; then
    echo "postgresql@16 already installed"
  elif brew list postgresql >/dev/null 2>&1; then
    echo "postgresql already installed"
  else
    echo "Installing postgresql@16…"
    brew install postgresql@16
  fi
}

pg_bin() {
  if [ -d "$(brew --prefix postgresql@16 2>/dev/null)/bin" ]; then
    echo "$(brew --prefix postgresql@16)/bin"
  else
    echo "$(brew --prefix postgresql)/bin"
  fi
}

install_pg
BIN="$(pg_bin)"
export PATH="$BIN:$PATH"

if ! brew services list 2>/dev/null | grep -E 'postgresql(@16)?' | grep -q started; then
  echo "Starting Postgres service…"
  brew services start postgresql@16 2>/dev/null || brew services start postgresql
  sleep 3
fi

echo "Creating database '$DB_NAME' if needed…"
createdb "$DB_NAME" 2>/dev/null || true

export DATABASE_URL="postgresql://${DB_USER}@localhost:${DB_PORT}/${DB_NAME}"
echo "DATABASE_URL → postgresql://${DB_USER}@localhost:${DB_PORT}/${DB_NAME}"

cd "$ROOT"
pnpm --filter backend db:push
pnpm seed

echo ""
echo "Local DB ready. For pnpm dev, set in .env:"
echo "  DATABASE_URL=\"$DATABASE_URL\""
echo ""
echo "Note: backend still expects Kafka for full startup — fix Docker for the complete stack,"
echo "      or use this DB after Docker is repaired."
