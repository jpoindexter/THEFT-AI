# UX POLISH DECISIONS - PHASE 3

> Created 2026-05-15. This records the accepted screen-generation and critique outcomes for `UX070`-`UX078`.

## Accepted Direction

The Phase 3 prompts converge on one product pattern:

- THEFT is a warm-white company creation workspace, not a dark agent console.
- The first viewport must show the company state, the current bottleneck, department workstreams, and the next action.
- The Operator is a routing surface that turns founder intent into department-owned tasks.
- Departments are business functions with missions, work queues, blockers, review-ready output, and Library provenance.
- Library is durable company memory and should show pinned/important artifacts, department folders, provenance, and preview/edit actions.
- Tech Tree is the roadmap surface: nodes need owner, dependency, evidence, and next-action language.
- Runtime details stay secondary under Admin, Advanced, or Diagnostics.

## Prompt Outcomes

| Prompt | Verdict | Accepted Delta |
|---|---|---|
| Prompt 2 - First-run onboarding | Keep | Existing flow already has company name, stage, setup items, bottleneck, assembly preview, and Advanced runtime. Polish later with better launch progress and mobile density. |
| Prompt 3 - Company Assembly Preview | Keep | Existing assembly preview is structurally correct. Later delta: make department expected outputs more visual. |
| Prompt 4 - Command Center | Revise | Make the page feel more like a canvas: warm surface, compact stats, stronger department cards, clearer next task and Library output panels. |
| Prompt 5 - Department Workspace | Revise | Add business-function framing: mission panel, work lanes, blockers/review/output, related Library files, and admin diagnostics as secondary. |
| Prompt 6 - Task Detail / Review | Keep | Task Review summary exists. Polish cards so output/decision/review state reads before diagnostics. |
| Prompt 7 - Library | Revise | Keep split layout, but strengthen artifact shelf feel with warm shell, pinned memory, department folders, provenance, and document preview controls. |
| Prompt 8 - Tech Tree | Keep | Current Tech Tree already follows evidence/owner/dependency/next-action direction. Later delta: visual connectors and unlock affordance. |
| Prompt 9 - Anti-clone critique | Pass with notes | Active happy path no longer leads with agent roster, cost, model config, invocations, tools, or raw skills. Remaining Paperclip/runtime surfaces are secondary/admin. |
| Prompt 10 - Implementation translation | Accepted | Implement visual polish only in `paperclip/`, backed by existing companies, agents, issues, goals, runs, and Library data. |

## Immediate Implementation Deltas

1. Warm Command Center shell and canvas cards with thin borders and restrained lime/green live accents.
2. Make department cards read as parallel work lanes with next output, review count, and latest task preview.
3. Make Department Workspace feel less like an agent profile by adding a mission/operating brief treatment and keeping diagnostics link secondary.
4. Make Library feel like an artifact shelf with a warm header, pinned memory rail, department folder groups, and provenance-first preview.
5. Keep deeper Paperclip package/API naming migration out of this pass.

