#!/bin/zsh
set -euo pipefail

GATE_PORT="${GATE_PORT:-3100}"
BASE_URL="${BASE_URL:-http://localhost:${GATE_PORT}}"
ORG_SLUG="${ORG_SLUG:-subscription-design-service}"
IDEA_TEXT="${IDEA_TEXT:-Subscription design service for seed-stage founders}"

echo "[gate] running vitest"
pnpm test >/dev/null
echo "[gate] tests ok"

echo "[gate] running production build"
pnpm build >/dev/null
echo "[gate] build ok"

echo "[gate] starting production server on :${GATE_PORT}"
pnpm start --port "${GATE_PORT}" >/tmp/theft-gate-start.log 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "${SERVER_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT
for _ in {1..40}; do
  if curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
if ! curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
  echo "[gate] server failed to become ready on ${BASE_URL}"
  tail -n 80 /tmp/theft-gate-start.log || true
  exit 1
fi

echo "[gate] route smoke checks"
for p in \
  "/" \
  "/${ORG_SLUG}" \
  "/${ORG_SLUG}/onboarding" \
  "/${ORG_SLUG}/roadmap" \
  "/${ORG_SLUG}/tasks" \
  "/${ORG_SLUG}/agents" \
  "/${ORG_SLUG}/settings"
do
  curl -fsS "${BASE_URL}${p}" >/dev/null
  echo "  ok ${p}"
done

echo "[gate] onboarding brief generate + roadmap state checks"
curl -fsS -X POST "${BASE_URL}/api/${ORG_SLUG}/brief/generate" \
  -H "Content-Type: application/json" \
  -d "{\"idea\":\"${IDEA_TEXT}\"}" >/dev/null

roadmap_json="$(curl -fsS "${BASE_URL}/api/${ORG_SLUG}/roadmap")"

echo "${roadmap_json}" | rg -q '"slug":"initial-idea".*"status":"complete"'
echo "${roadmap_json}" | rg -q '"slug":"pick-company-name".*"status":"complete"'
echo "  ok initial onboarding nodes complete"

echo "[gate] PASS"
