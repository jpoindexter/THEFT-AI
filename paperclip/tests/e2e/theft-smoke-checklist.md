# THEFT/Paperclip Smoke Checklist

Use this checklist for the local v0 path until the THEFT onboarding and
8-department runtime flow are fully covered by Playwright.

## Host

- `pnpm -C paperclip build` passes.
- `pnpm -C paperclip dev:once` starts the Paperclip host.
- `node paperclip/scripts/smoke/theft-local-health.mjs` passes against `http://127.0.0.1:3100`.
- `curl -fsS http://127.0.0.1:3100/api/health` returns JSON with `"status":"ok"`.
- `curl -fsS http://127.0.0.1:3100/ >/dev/null && echo root-ok` prints `root-ok`.

## Onboarding Coverage Gap

The existing `paperclip/tests/e2e/onboarding.spec.ts` covers the older
Paperclip wizard shape: create company, create CEO agent, create one issue,
and verify no heartbeat runs when `PAPERCLIP_E2E_SKIP_LLM` is active.

It does not yet prove the THEFT product path:

- company stage is selected and persisted;
- setup statuses and notes are persisted;
- Operator/root agent language is used;
- 8 department agents are seeded;
- one starter issue exists for each department;
- local onboarding does not show fake credits or billing;
- launch lands on the future THEFT company canvas.

## Future 8-Department Runtime Smoke

Run one deterministic local-adapter task per department and verify that every
task produces a saved Paperclip document, attachment, or work product visible
through the Library surface.

| Department | Smoke Task | Expected Saved Output |
|---|---|---|
| Engineering | Inspect repo and propose a smallest shippable implementation slice | Markdown implementation note or patch plan |
| Design | Draft first-product UI/brand direction | Markdown design brief or visual artifact |
| Marketing | Write positioning and one channel test | Markdown positioning/channel plan |
| Sales | Draft ICP and first outreach script | Markdown ICP/outreach artifact |
| Operations | Define weekly operating checklist | Markdown process/checklist artifact |
| Finance | Build simple cost and pricing assumptions | Markdown or spreadsheet-like finance note |
| Legal | Draft legal-risk checklist for current stage | Markdown legal checklist |
| Support | Create first FAQ/support response set | Markdown support knowledge artifact |

Each smoke task should verify:

- issue status transitions are visible;
- run failure gives an actionable adapter error;
- approvals/review pauses are visible in the attention queue when applicable;
- output survives refresh/restart;
- no path writes to the legacy THEFT JSON runtime.
