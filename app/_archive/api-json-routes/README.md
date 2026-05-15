# Archived Legacy JSON Routes

These route files came from the old `app/src/app/api/[org]/...` prototype
runtime. They used `app/src/lib/db/store.ts` and `.theft-data/*.json`, which
duplicates the active Paperclip-backed THEFT runtime.

The active local product path is `paperclip/`. Do not add new product behavior
here. Keep this archive only as migration reference while remaining concepts are
ported to the Paperclip host or rebuilt against real managed services.

T070 archived route groups:

- `agent/run`, `operator`, `operator/messages`, `departments/[slug]/run`
- `agents`, `agents/[id]`, `skills`
- `tasks`, `tasks/[task]`, `tasks/[task]/run`, `tasks/[task]/handoff`
- `artifacts`, `memory`, `memory/[id]`
- `roadmap`, `roadmap/[node]`
- `approvals`, `approvals/[approval]`, `approvals/rules`,
  `approvals/rules/[id]`
- `routines`, `routines/[id]`
- `company`, `departments`, `team`, `team/[id]`, `export`
