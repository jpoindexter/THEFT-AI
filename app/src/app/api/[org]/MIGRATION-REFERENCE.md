# Migration Reference: Legacy JSON Runtime Routes

`app/` is no longer the active product host. The active THEFT runtime is
`paperclip/`, backed by Paperclip companies, agents, issues, goals, documents,
approvals, and runtime adapters.

The routes in this folder are legacy prototype routes over
`app/src/lib/db/store.ts` and `.theft-data/*.json`. Do not extend them for the
Paperclip-host product path. Archive or delete them once any remaining reference
value has been ported.

## Duplicated Paperclip Runtime Surface

These route groups duplicate active Paperclip host concepts and are the primary
T070 archive candidates:

- `agent/run`, `operator`, `operator/messages`, `departments/[slug]/run`
- `agents`, `agents/[id]`, `skills`
- `tasks`, `tasks/[task]`, `tasks/[task]/run`, `tasks/[task]/handoff`
- `artifacts`, `memory`, `memory/[id]`
- `roadmap`, `roadmap/[node]`
- `approvals`, `approvals/[approval]`, `approvals/rules`,
  `approvals/rules/[id]`
- `routines`, `routines/[id]`
- `company`, `departments`, `team`, `team/[id]`, `export`

## Prototype-Only / Future Managed-Service Stubs

These should not be considered active v0 product APIs unless they are rebuilt
against Paperclip services or a real managed-service integration:

- `api-keys`, `api-keys/[id]`
- `brand-kit`
- `brief`, `brief/generate`, `onboarding/complete`
- `costs/export`, `invoices/[invoice]`
- `deployments`, `evals`, `search`
- `webhooks`, `webhooks/[id]`, `webhooks/[id]/ping`

