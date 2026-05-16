# DESIGN SYSTEM AUDIT — Atomic Baseline

> Baseline created 2026-05-17 with `.agents/skills/atomic-design-system/scripts/audit-design-system.mjs`.

## Decision

THEFT should have one design system, not several route-local style systems.

Canonical contract:

- `BUILD-FROM-THIS/DESIGN-SYSTEM.md`

Canonical implementation:

- `paperclip/ui/src/index.css`

Primary component interface:

- shadcn/ui primitives in `paperclip/ui/src/components/ui/*`
- Tailwind v4 `@theme inline` values mapped to THEFT CSS variables

## Audit Command

```bash
node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs paperclip/ui/src
```

## Baseline Result

- Files scanned: 539
- Total findings: 1,387
- High severity: 1,276
- Medium severity: 111

Findings by check:

- Arbitrary Tailwind values: 956
- Hardcoded hex colors: 153
- Inline React style objects: 101
- Raw color functions: 75
- Radius overrides: 66
- `!important` CSS overrides: 33
- Theme root declarations: 3

Findings by atomic layer:

- Molecules/organisms: 671
- Pages: 533
- Atoms: 153
- Support: 30

## Largest Modules Blocking Maintainability

- `paperclip/ui/src/components/IssueChatThread.tsx` — 4,289 lines
- `paperclip/ui/src/pages/AgentDetail.tsx` — 4,240 lines
- `paperclip/ui/src/pages/IssueDetail.tsx` — 4,214 lines
- `paperclip/ui/src/pages/Inbox.tsx` — 2,777 lines
- `paperclip/ui/src/components/OnboardingWizard.tsx` — 2,234 lines
- `paperclip/ui/src/components/NewIssueDialog.tsx` — 2,007 lines
- `paperclip/ui/src/components/AgentConfigForm.tsx` — 1,841 lines
- `paperclip/ui/src/components/IssuesList.tsx` — 1,799 lines

## Atomic Inventory Target

Atoms:

- `index.css` tokens and `@theme inline`
- shadcn primitives: Button, Card, Input, Textarea, Badge, Tabs, Select, Dialog, Sheet, Tooltip, ScrollArea

Molecules:

- metadata label
- stat tile
- action chip
- evidence chip
- issue/task row
- search/filter row
- empty/loading/error row

Organisms:

- narrow app rail
- top header/breadcrumb
- Operator dock/drawer
- Mission Control workspace section
- Task review queue
- Library inspector
- Department work panel
- Tech Tree inspector

Templates:

- local launcher
- onboarding split canvas/form
- workbench
- task detail/review
- library/detail
- settings/admin

Pages:

- active product routes should only compose templates/organisms
- runtime/admin routes can be paid down after active product routes stop drifting

## Migration Order

1. Lock tokens and shadcn primitive variants.
2. Replace active product page arbitrary values with semantic utilities.
3. Extract repeated molecules and organisms.
4. Move route scroll/layout contracts into templates.
5. Split oversized modules according to the 300 / 150 / 50 guardrail.
6. Add a failing CI/local gate for active-route drift.
7. Pay down runtime/admin/lab pages after the founder happy path is consistent.

## Launch Gate

The design system is not launched until:

- active MVP routes have no arbitrary radius or route-local shadow/color systems;
- active MVP routes use shadcn primitives for standard controls;
- CSS variable and Tailwind token views agree;
- scanner output has an accepted baseline and a no-new-drift gate;
- desktop and mobile route smoke screenshots pass without overflow.
