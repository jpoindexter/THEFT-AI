#!/usr/bin/env bash
# Wipes all THEFT AI app state and restarts the dev server fresh.
# Run from the repo root: ./reset.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$ROOT/app"

echo "→ killing anything on port 3000"
lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null || true

echo "→ wiping app data ($APP/.theft-data)"
rm -rf "$APP/.theft-data"

echo "→ wiping next build cache ($APP/.next)"
rm -rf "$APP/.next"

echo "→ starting dev server"
cd "$APP"
exec pnpm dev
