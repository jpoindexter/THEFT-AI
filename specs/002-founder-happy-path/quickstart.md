# Quickstart: Founder Happy Path

1. Start the local Paperclip/THEFT host.

```bash
pnpm dev:host
```

2. Open the app.

```text
http://127.0.0.1:3100/
```

3. Complete onboarding with a rough business idea, then accept the plan.

Expected result: Mission Control explains the current objective, the next action, and the Operator/departments/Library workflow.

4. Open an existing task with no Library output.

Expected result: task review says output is missing and offers an Operator action to publish or explain it.

5. Open an existing task with Library output.

Expected result: task review shows artifact titles, lets the founder open Library, approve output, or ask for revision.

6. Run verification.

```bash
pnpm -C paperclip --filter @paperclipai/ui typecheck
pnpm design:gate
THEFT_CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --short --company-prefix THFT
git diff --check
```
