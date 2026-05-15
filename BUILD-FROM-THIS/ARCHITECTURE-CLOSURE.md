# ARCHITECTURE CLOSURE — THEFT

> Created 2026-05-15. This is the closure checklist for finishing architecture before more design work.

## Architecture Decision

THEFT ships as one local app backed by the tracked Paperclip host in `paperclip/`.

The old `app/` tree is an archived prototype. It is not a second runtime, not a bridge target, and not a place for new product work.

## Runtime Boundary

| Layer | Owns | User-Facing Name |
|---|---|---|
| Paperclip runtime | companies, agents, goals, issues, heartbeats, approvals, documents, adapters, embedded Postgres | implementation detail |
| THEFT product | Operator, departments, Command Center, Task Review, Company Memory, Tech Tree, Attention | product model |
| Root `skills/` | curated company-building skill packets imported into Paperclip company skills | Skill Library / department context |
| `app/` | old JSON prototype and visual migration reference | archived |

## Product Route Boundary

Primary THEFT surfaces:

- `/dashboard`
- `/departments/*`
- `/issues/*`
- `/library`
- `/goals/*`
- `/approvals/*`
- `/inbox/*`
- `/search`

Runtime/admin surfaces:

- `/agents/*`
- `/projects/*`
- `/workspaces/*`
- `/execution-workspaces/*`
- `/routines/*`
- `/costs`
- `/activity`
- `/company/*`
- `/skills/*`
- `/org`
- `/instance/*`

Runtime/admin routes can remain reachable for diagnostics, but they must not define the happy path or primary navigation.

## Data Boundary

Authoritative runtime data:

- Paperclip embedded Postgres
- Paperclip APIs
- Paperclip issue documents, attachments, and work products
- Paperclip company skills generated from root `skills/`

Non-authoritative data:

- `app/.theft-data/*.json`
- archived `app/src/app/api/[org]` routes
- any bridge state outside Paperclip

## Verification Boundary

Iteration checks:

```sh
git diff --check
pnpm -C paperclip --filter @paperclipai/ui typecheck
pnpm -C paperclip build
node paperclip/scripts/smoke/theft-local-health.mjs
node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs --adapter process --require-library-artifacts
```

Release checks:

- onboarding Playwright happy path;
- deterministic 8-department artifact smoke;
- one live LLM adapter smoke using the chosen release model;
- manual product walkthrough through Command Center, Departments, Task Review, Company Memory, Tech Tree, and Attention.

## Done Means

- The repo root README points to `paperclip/`, not `app/`.
- `app/README.md` explicitly marks the old app as archived.
- Code has an explicit product-vs-runtime route split.
- New product work can be scoped to THEFT surfaces without touching runtime/admin routes.
- Runtime/admin routes are still available for debugging, but no primary UX depends on them.

## Remaining Architecture Work

1. Add a small route-boundary test for every primary THEFT surface.
2. Continue moving direct links from `/agents/*` and `/projects/*` to product surfaces where possible.
3. Keep package/API renaming deferred until the product loop is stable; it is a high-risk mechanical migration.
4. Before release, decide whether runtime/admin surfaces should move under a visible `/system/*` namespace or remain hidden-but-reachable aliases.
