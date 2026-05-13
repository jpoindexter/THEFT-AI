# Research: Paperclip Engine Adoption

## Decision: Port Paperclip Concepts, Not The Whole Runtime

**Rationale**: Paperclip's engine spans database models, plugin workers, environment leases, sandbox providers, adapters, approvals, and company import/export. THEFT AI is currently a local-first Next app with a file-backed store. A wholesale transplant would create a second application inside this one.

**Alternatives considered**:
- Vendor Paperclip packages directly: rejected for v0 because it brings unrelated server/runtime dependencies and storage assumptions.
- Keep THEFT's current run code: rejected because tool execution is duplicated and hard to extend.

## Decision: Start With Tool Dispatcher And Company Package Boundary

**Rationale**: Paperclip's two most useful immediate abstractions are a central tool dispatcher and markdown-native Agent Company package semantics. Those can be introduced without breaking onboarding or routes.

**Alternatives considered**:
- Start with UI parity: rejected because engine functionality is the current blocker.
- Start with sandbox providers: deferred until local task execution has one stable engine contract.

## Decision: Keep Local Harness While Normalizing Around Engine Actions

**Rationale**: The app already has Codex/Claude/Gemini/OpenCode/offline paths. The first adoption slice should make those paths execute tools through the same dispatcher before replacing adapter internals.

**Alternatives considered**:
- Replace adapters first: rejected because it would not fix tool duplication or company/skill packaging.

## Decision: Company Skills Resolve By Shortname

**Rationale**: Paperclip's company spec recommends skill shortnames that resolve to `skills/<shortname>/SKILL.md`. THEFT already has a `skills/` directory and attached skill ids on agents.

**Alternatives considered**:
- Store full absolute paths on agents: rejected because it is not portable and conflicts with Paperclip package semantics.
