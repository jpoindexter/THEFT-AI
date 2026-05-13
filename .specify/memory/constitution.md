# THEFT AI Constitution

## Core Principles

### I. Source of Truth First
All product and implementation decisions start from `BUILD-FROM-THIS/`, then `cofounder-docs/`, then the read-only `paperclip/` reference. If a feature is not supported by those materials or by an explicit user instruction, it is not v0 scope.

### II. Engine Before Surface Area
The platform must prioritize working execution paths over decorative or speculative UI. Onboarding, tasks, agents, approvals, artifacts, skills, local runtime selection, and every happy path must be functional before adding new presentation polish.

### III. Local-First Runtime
The app must run locally without paid services, a database, or fake billing assumptions. File-backed JSON remains the v0 persistence layer. Agent execution must route through the local/provider harness where possible, including Codex CLI, Claude CLI, Gemini CLI, OpenCode, Ollama, LM Studio, OpenAI-compatible endpoints, or deterministic offline fallback.

### IV. Skills Are Execution Context
The repo's `skills/` directory is product data and must inform agent behavior. New agent or task flows should use attached skills as prompt/runtime context, and changes must preserve the ability to dogfood THEFT AI while building THEFT AI.

### V. Verification Is Part Of The Work
Meaningful changes require verification scaled to risk. For app code, run focused tests and type/build checks as appropriate. Happy-path route checks are required when onboarding, navigation, or agent execution changes.

## Project Constraints

- `app/` is the working Next.js 16 application; read relevant docs in `node_modules/next/dist/docs/` before using Next.js APIs.
- `paperclip/` is reference-only. Do not modify it and do not run it as part of THEFT AI development.
- `frames/`, `frames2/`, `twinframes/`, and `screenshots/` are visual references, not source and not pixel-perfect requirements.
- No production database is allowed for v0. Data writes to `app/.theft-data/*.json`, which is gitignored.
- Fake credits, fake billing, or paid-plan UI must not be presented as implemented local functionality.
- Keep edits scoped to active product paths unless a broader refactor is explicitly required.

## Development Workflow

1. Read the current source-of-truth docs before planning non-trivial changes.
2. Prefer existing repo patterns, stores, route handlers, components, and harness abstractions.
3. Keep happy paths complete: onboarding should produce a usable workspace, tasks should run or pause clearly, settings routes should render, and agent output should persist.
4. Use Spec Kit for substantial features: `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, and `$speckit-implement` when a change benefits from a durable spec trail.
5. Commit intentional checkpoints with passing verification and push the active branch when requested or when a milestone is complete.

## Governance

This constitution overrides generic scaffolding guidance where it conflicts with THEFT AI's repo rules. Amendments require a concrete reason, a version bump, and updates to dependent planning or agent guidance when behavior changes. `AGENTS.md`, `CLAUDE.md`, and `BUILD-FROM-THIS/` remain operational guidance; this file captures the Spec Kit governance baseline.

**Version**: 1.0.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-05-13
