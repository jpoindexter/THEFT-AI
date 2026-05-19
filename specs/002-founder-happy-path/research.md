# Research: Founder Happy Path

## Decision: Build on the existing Paperclip/THEFT Mission Control shell

**Rationale**: Paperclip already owns companies, tasks, comments, documents, agents, and Library output. The product problem is not missing engine capability; it is that founders do not see a coherent path from onboarding to first work output.

**Alternatives considered**:

- Build a separate Cofounder-like onboarding shell: rejected because it would duplicate engine state and slow the MVP.
- Continue refactoring large files first: rejected because it does not improve the founder demo path.

## Decision: Treat Cofounder frames as flow references, not UI references

**Rationale**: The captured frames show a useful sequence: idea input, guided clarification, plan artifact, activation, roadmap, artifact review. THEFT should implement the same clarity while preserving its own Mission Control visual direction.

**Alternatives considered**:

- Pixel-copy Cofounder: rejected because it creates product/design dependency and ignores THEFT's existing shell.
- Ignore Cofounder entirely: rejected because the user already validated that its flow explains the product better.

## Decision: First slice focuses on guidance and artifact state clarity

**Rationale**: The most damaging experience is landing in Mission Control with empty departments and unclear task output. A guided next-step panel and explicit Library artifact path can make the prototype feel understandable without changing the runtime engine.

**Alternatives considered**:

- Full AI assistant implementation: deferred because local helper/guidance can unblock flow before API/adapter work.
- Department runtime expansion: deferred until founders can understand how to review output.

## Decision: Use a small Agency-style role stack, not a large persona import

**Rationale**: Spec Kit already provides product/spec/plan/task gates. Existing repo skills cover THEFT design and debugging. Importing a large persona library now would add process overhead during an urgent MVP slice.

**Alternatives considered**:

- Install every Agency Agents persona: rejected as too much noise for this repo today.
- Do no role separation: rejected because this project already suffered from unfocused refactor work.
