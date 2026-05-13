# Implementation Plan: Paperclip-First Engine Adoption

**Branch**: `codex-current-design-migration` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-paperclip-engine-adoption/spec.md`

## Summary

Adopt Paperclip as the first-running local engine while keeping THEFT AI as the company-building product layer. The implementation now starts by running Paperclip unchanged, proving its company/goal/agent/issue lifecycle, then wiring THEFT onboarding and department surfaces to Paperclip APIs instead of rebuilding orchestration inside THEFT.

## Baseline Verified

- `pnpm -C paperclip dev` starts Paperclip at `http://127.0.0.1:3100`.
- `/api/health` returns `status: ok`, `deploymentMode: local_trusted`, `companyDeletionEnabled: true`.
- Created dogfood Paperclip company `THEFT Paperclip Dogfood 20260513151558`.
- Created company goal, Operator agent using `process` adapter, and assigned issue `THE-1`.
- Paperclip heartbeat claimed the assigned issue before manual checkout, proving engine-owned issue lifecycle is active.
- Marked `THE-1` done using Paperclip's issue PATCH path with the heartbeat run UUID.
- THEFT onboarding smoke created Paperclip company `d003bf60-6908-4694-82b0-2b7b741ddd58`, one company goal, Operator, 8 department agents, and 3 starter issues.

## Technical Context

**Language/Version**: TypeScript on Next.js 16.2.4

**Primary Dependencies**: Next.js App Router, Paperclip local server/API, local CLI adapters through Paperclip, Zod, file-backed JSON store as temporary product cache

**Storage**: Paperclip embedded Postgres for executable company/agent/issue state; existing `app/.theft-data/*.json` only as temporary THEFT product cache during migration

**Testing**: Paperclip API smoke checks, Vitest via `pnpm -C app test`, production build via `pnpm -C app build`, localhost onboarding and route smoke checks

**Target Platform**: Local macOS development first, deployable Next.js app later

**Project Type**: Web application with server-side local agent runtime

**Performance Goals**: Local onboarding-to-task-run smoke path completes in under 60 seconds; deterministic offline path completes in seconds

**Constraints**: Run but do not modify `paperclip/`; no fake billing or credits UX in the local-first build; routes must keep working while engine source of truth moves to Paperclip; read local Next.js 16 docs before changing Next APIs

**Scale/Scope**: One local founder workspace, Paperclip companies and agents, THEFT onboarding/roadmap/department UI, local skills directory, local CLI adapter selection

## Constitution Check

- Source of Truth First: Pass. Paperclip becomes executable source of truth for companies, agents, and issues.
- Engine Before Surface Area: Pass. Work starts with running Paperclip and API integration, not more custom UI.
- Local-First Runtime: Pass. Uses Paperclip embedded Postgres and local adapters.
- Skills Are Execution Context: Pass. Paperclip agents must reference repo skills or instruction bundles.
- Verification Is Part Of The Work: Pass. Requires tests, build, and smoke runs.

## Project Structure

### Documentation

```text
specs/001-paperclip-engine-adoption/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code

```text
app/src/lib/engine/
├── company-package.ts
└── tool-dispatcher.ts

app/src/lib/paperclip-engine/
├── client.ts
├── mapper.ts
└── health.ts

app/src/lib/agent/
├── run.ts
├── run-cli.ts
└── tools.ts

app/src/lib/db/
└── store.test.ts
```

**Structure Decision**: Keep the first internal engine slice as a temporary compatibility boundary, but add `app/src/lib/paperclip-engine/` as the integration seam. New onboarding/task work should prefer Paperclip API calls over extending THEFT's internal harness.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Running Paperclip beside THEFT | Needed to use the proven orchestration engine before deeper UI adaptation | Rebuilding the engine inside THEFT already produced stuck post-onboarding flows |
| Temporary THEFT cache plus Paperclip state | Needed for incremental migration without breaking current routes | Big-bang replacement would hide which happy path broke |
