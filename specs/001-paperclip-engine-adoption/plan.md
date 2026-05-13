# Implementation Plan: Paperclip Engine Adoption

**Branch**: `codex-current-design-migration` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-paperclip-engine-adoption/spec.md`

## Summary

Adopt Paperclip as the engine blueprint while keeping THEFT AI as the local-first company-building product layer. The implementation starts by extracting task execution tools into a central dispatcher, adding a Paperclip-compatible company package builder, and routing both Anthropic and local harness execution through the same tool boundary.

## Technical Context

**Language/Version**: TypeScript on Next.js 16.2.4

**Primary Dependencies**: Next.js App Router, Anthropic SDK, local CLI adapters, Zod, file-backed JSON store

**Storage**: Existing `app/.theft-data/*.json` local store for v0

**Testing**: Vitest via `pnpm -C app test`, production build via `pnpm -C app build`, localhost smoke checks

**Target Platform**: Local macOS development first, deployable Next.js app later

**Project Type**: Web application with server-side local agent runtime

**Performance Goals**: Local onboarding-to-task-run smoke path completes in under 60 seconds; deterministic offline path completes in seconds

**Constraints**: Do not modify or run `paperclip/`; no production database for v0; no fake billing assumptions; routes must keep working while engine is replaced incrementally

**Scale/Scope**: One local founder workspace, 8 departments, 8 default agents, local skills directory, initial task-run engine boundary

## Constitution Check

- Source of Truth First: Pass. Paperclip is used as read-only architecture reference; THEFT source docs remain authoritative for product layer.
- Engine Before Surface Area: Pass. Work targets runtime execution, not new UI.
- Local-First Runtime: Pass. Keeps file-backed store and local/offline harness.
- Skills Are Execution Context: Pass. Company package and run context include attached skills.
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

app/src/lib/agent/
├── run.ts
├── run-cli.ts
└── tools.ts

app/src/lib/db/
└── store.test.ts
```

**Structure Decision**: Use `app/src/lib/engine/` for Paperclip-inspired runtime boundaries. Keep adapters in `app/src/lib/agent/` until a later slice ports them behind an explicit adapter registry.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| New engine module boundary | Needed to stop route-local and adapter-local tool execution drift | Keeping all logic in `run.ts` repeats the current problem and blocks Paperclip-style adoption |
