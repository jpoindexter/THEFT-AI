# DESIGN SYSTEM MIGRATION MAP

> Worker C document. Created 2026-05-17. This is the implementation map for moving THEFT/Paperclip to one design system without editing product code in this pass.

## Goal

THEFT should have one design system, not one visual system per route. The product should use a single token contract, a single shadcn/ui primitive layer, shared Atomic Design modules, and route templates that own layout and scroll behavior.

This is not a redesign brief. It is a migration map for converting the current app to the design system already defined in `BUILD-FROM-THIS/DESIGN-SYSTEM.md`.

## Source Of Truth

Canonical product contract:

- `BUILD-FROM-THIS/DESIGN-SYSTEM.md`

Canonical implementation:

- `paperclip/ui/src/index.css`

Canonical public component interface:

- shadcn/ui primitives in `paperclip/ui/src/components/ui/*`

Derived views only:

- Tailwind v4 `@theme inline`
- CSS variable inspection pages
- generated token JSON, if added later
- design guide or docs pages

Rule: if `DESIGN.md`, Tailwind variables, CSS variables, or generated design-token views disagree, the source-of-truth pair is `BUILD-FROM-THIS/DESIGN-SYSTEM.md` plus the `:root` token implementation in `paperclip/ui/src/index.css`. Do not create a second theme root, second palette file, route-local radius scale, or page-owned visual language.

## Current Audit Summary

Baseline command:

```bash
node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs paperclip/ui/src
```

Current result from the shared dirty workspace on 2026-05-17:

| Measure | Count |
|---|---:|
| Files scanned | 539 |
| Total findings | 1,365 |
| High severity findings | 1,254 |
| Medium severity findings | 111 |
| Arbitrary Tailwind values | 934 |
| Hardcoded hex colors | 153 |
| Inline React style objects | 101 |
| Raw color functions | 75 |
| Radius overrides | 66 |
| `!important` CSS overrides | 33 |
| Theme root declarations | 3 |

Findings by Atomic Design layer:

| Layer | Count |
|---|---:|
| Molecules / organisms | 671 |
| Pages | 511 |
| Atoms | 153 |
| Support | 30 |

Largest modules blocking maintainability:

| Module | Lines | Layer |
|---|---:|---|
| `paperclip/ui/src/components/IssueChatThread.tsx` | 4,288 | organism |
| `paperclip/ui/src/pages/AgentDetail.tsx` | 4,239 | page |
| `paperclip/ui/src/pages/IssueDetail.tsx` | 4,213 | page |
| `paperclip/ui/src/pages/Inbox.tsx` | 2,776 | page |
| `paperclip/ui/src/components/OnboardingWizard.tsx` | 2,233 | organism/template mix |
| `paperclip/ui/src/components/NewIssueDialog.tsx` | 2,006 | organism |
| `paperclip/ui/src/components/AgentConfigForm.tsx` | 1,840 | organism |
| `paperclip/ui/src/components/IssuesList.tsx` | 1,798 | organism |
| `paperclip/ui/src/components/IssueProperties.tsx` | 1,612 | organism |
| `paperclip/ui/src/index.css` | 1,558 | atoms/tokens/utilities |

Interpretation:

- The token foundation exists, but the design system is not launched.
- Most drift sits in molecules, organisms, and pages, not only tokens.
- The active product routes have improved THEFT utilities, but still contain route-local arbitrary values and some old Paperclip radius/color patterns.
- Runtime/admin pages are much noisier than the founder happy path. They should be isolated under settings/system and paid down after active routes pass the gate.

## Active Route Inventory

The active product route tree lives in `paperclip/ui/src/App.tsx`.

### Founder Happy Path

| Route | Current page/module | Target template | Priority |
|---|---|---|---|
| `/` | `MissionLauncher` in `App.tsx` | `LauncherTemplate` | P0 |
| `/onboarding` | `OnboardingRoutePage` / `OnboardingWizard` | `SplitCanvasFormTemplate` | P0 |
| `/:companyPrefix/dashboard` | `Dashboard` | `WorkbenchTemplate` | P0 |
| `/:companyPrefix/departments/:departmentKey` | `DepartmentWorkspace` | `DepartmentWorkspaceTemplate` | P0 |
| `/:companyPrefix/issues` | `Issues` | `TaskQueueTemplate` | P0 |
| `/:companyPrefix/issues/:issueId` | `IssueDetail` | `TaskReviewTemplate` | P0 |
| `/:companyPrefix/library` | `Library` | `LibraryWorkspaceTemplate` | P0 |
| `/:companyPrefix/goals` | `Goals` | `TechTreeTemplate` | P0 |

### Secondary Product Routes

| Route | Current page/module | Target template | Priority |
|---|---|---|---|
| `/:companyPrefix/search` | `Search` | `SearchTemplate` | P1 |
| `/:companyPrefix/approvals/*` | `Approvals`, `ApprovalDetail` | `ReviewQueueTemplate` | P1 |
| `/:companyPrefix/inbox/*` | `Inbox` | `InboxTemplate` | P1 |
| `/:companyPrefix/agents/:agentId` | `AgentDetail` | `SystemDetailTemplate` behind settings/admin IA | P1 |
| `/:companyPrefix/skills/*` | `CompanySkills` | `SettingsListDetailTemplate` | P1 |

### Runtime / Admin / System

| Route group | Current modules | Target treatment | Priority |
|---|---|---|---|
| `/:companyPrefix/company/settings/*` | company settings pages | Settings template, hidden behind settings affordance | P2 |
| `/instance/settings/*` | instance settings pages | Settings template | P2 |
| `/:companyPrefix/projects/*` | project/workspace pages | Runtime template or hidden unless needed | P2 |
| `/:companyPrefix/routines/*` | routine pages | Runtime template or hidden unless needed | P2 |
| `/:companyPrefix/execution-workspaces/*` | execution workspace pages | Runtime template | P2 |
| `/:companyPrefix/costs`, `/activity`, `/org`, `/agents/*` | runtime/admin pages | System template, not primary IA | P2 |
| `tests/perf/*`, `*UxLab`, `design-guide` | labs/reference | Exempt from active gate; must not leak into active UI | P3 |

## Atomic Design Inventory

### Atoms

Own all raw visual primitives.

- Tokens: color, typography, spacing, radius, shadow, z-index, layout widths.
- shadcn primitives: `Button`, `Card`, `Input`, `Textarea`, `Badge`, `Tabs`, `Select`, `Dialog`, `Sheet`, `Tooltip`, `DropdownMenu`, `ScrollArea`, `Separator`, `Skeleton`, `Avatar`, `Checkbox`.
- THEFT primitives: `Label`, `Metric`, `IconButton`, `StatusDot`, `Pill`, `KeyboardKey`, `ProgressBar`.

Required migration:

- Every shadcn primitive uses shadcn token names and THEFT token values.
- No product TSX owns hex colors, raw `rgba()`, arbitrary radius, or custom button/card/input styling.
- `index.css` is split or sectioned into tokens, base, primitives, layout templates, and legacy adapters once product drift is controlled.

### Molecules

Small reusable compositions that remove route-local repeated class strings.

- `StatTile`
- `MetadataRow`
- `TaskRow`
- `DepartmentCard`
- `ActionChip`
- `EvidenceChip`
- `EmptyStateBlock`
- `SearchFilterRow`
- `DecisionOption`
- `LibraryItemRow`
- `ProgressSummary`

Required migration:

- Promote repeated card/header/stat/input arrangements from `Dashboard`, `DepartmentWorkspace`, `Issues`, `Library`, `Goals`, and `IssueDetail`.
- Molecules may accept data and state, but not route-level layout decisions.
- Molecules should trend under 150 lines and expose a narrow interface.

### Organisms

Reusable product regions with behavior and data binding.

- `AppRail`
- `TopBar`
- `OperatorDock`
- `OperatorDrawer`
- `MissionBriefPanel`
- `DepartmentGrid`
- `TaskReviewPanel`
- `AttentionQueue`
- `LibraryInspector`
- `TechTreeCanvas`
- `SettingsSection`
- `RuntimeHealthPanel`

Required migration:

- Move repeated Mission Control, department, task, Library, and Tech Tree regions out of pages.
- Keep runtime/admin organisms behind settings/system affordances.
- Organisms may own localized state. They should not own page shell, scroll shell, or global route chrome.

### Templates

Route-level layout contracts. Templates own scroll, rail/header placement, viewport sizing, content width, and mobile behavior.

- `LauncherTemplate`
- `SplitCanvasFormTemplate`
- `WorkbenchTemplate`
- `DepartmentWorkspaceTemplate`
- `TaskQueueTemplate`
- `TaskReviewTemplate`
- `LibraryWorkspaceTemplate`
- `TechTreeTemplate`
- `SettingsTemplate`
- `SystemDetailTemplate`

Required migration:

- Active pages must compose templates and organisms only.
- Page files should contain data loading, route params, and composition glue.
- Scroll contracts live in templates, not each page.
- Templates must pass short-viewport scroll probes on desktop and mobile.

### Pages

Pages are populated templates. They should not define a new style system.

Required migration:

- Page files trend under 300 lines.
- Page files contain route composition, loaders/hooks, and edge states.
- No page-local hardcoded visual language unless documented as temporary legacy isolation.

## Module Extraction Plan

### P0 Extraction Targets

| Current module | Problem | Extraction target | Exit condition |
|---|---|---|---|
| `App.tsx` launcher section | launcher shell is embedded in app root | `LauncherTemplate`, `RecentCompanyList`, `RuntimeStatusStrip` | launcher route uses template and shadcn primitives |
| `OnboardingWizard.tsx` | 2,233-line mixed state machine, canvas, forms, assembly review | `SplitCanvasFormTemplate`, `OnboardingCanvas`, `OnboardingStepPanel`, `AssemblyPreview` | no module over 300 lines for the active onboarding surface |
| `Dashboard.tsx` | route owns many Mission Control sections and operator dock styling | `WorkbenchTemplate`, `MissionBriefPanel`, `OperatorDock`, `DepartmentGrid`, `NextMovePanel` | dashboard page is composition-only |
| `DepartmentWorkspace.tsx` | department surface uses route-local cards/summary sections | `DepartmentWorkspaceTemplate`, `DepartmentRunPanel`, `DepartmentTaskList` | department pages share the same shell and cards |
| `Issues.tsx` | queue layout and task rows mix route and molecule concerns | `TaskQueueTemplate`, `TaskRow`, `TaskQueueSummary` | issue list uses shared rows and stat tiles |
| `IssueDetail.tsx` | 4,213-line task review/runtime/detail mega page | `TaskReviewTemplate`, `TaskReviewHeader`, `RunStatePanel`, `LibraryOutputPanel`, `IssueCommentThreadAdapter` | first viewport task review is template-driven |
| `Library.tsx` | Library workbench shell and item inspector should be reusable | `LibraryWorkspaceTemplate`, `LibraryItemRow`, `LibraryInspector` | Library page owns data only |
| `Goals.tsx` | Tech Tree owns route-local canvas/inspector/filter layout | `TechTreeTemplate`, `TechTreeCanvas`, `TechTreeInspector` | Tech Tree shell reused by roadmap surfaces |

### P1 Extraction Targets

| Current module | Extraction target |
|---|---|
| `Search.tsx` | `SearchTemplate`, `SearchResultRow` |
| `Approvals.tsx`, `ApprovalDetail.tsx` | `ReviewQueueTemplate`, `ApprovalCard`, `ApprovalInspector` |
| `Inbox.tsx` | `InboxTemplate`, `InboxThreadRow`, `InboxInspector` |
| `AgentDetail.tsx` | `SystemDetailTemplate`, runtime/admin panels behind settings |
| `CompanySkills.tsx` | `SettingsListDetailTemplate`, `SkillCard`, `SkillEditorPanel` |

### P2 Extraction Targets

Runtime/admin pages should not block founder happy-path launch. Move them after P0/P1 unless they leak into active IA.

- `Costs.tsx`
- `Activity.tsx`
- `AdapterManager.tsx`
- `PluginManager.tsx`
- `PluginSettings.tsx`
- `ProjectDetail.tsx`
- `ExecutionWorkspaceDetail.tsx`
- `RoutineDetail.tsx`
- company and instance settings pages

## Launch Gates

### Gate 1 — Token And Primitive Gate

Pass criteria:

- One `:root` token implementation in `paperclip/ui/src/index.css`.
- `.dark` does not define an alternate product theme; it maps to the same clean THEFT values unless a real dark mode is reintroduced intentionally.
- shadcn token names map to THEFT values.
- shadcn primitives are the default for standard controls/surfaces.
- No new raw hex, `rgba()`, arbitrary radius, or handmade button/card/input styling in active product TSX.

Suggested command:

```bash
node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs paperclip/ui/src
```

### Gate 2 — Active Route No-New-Drift Gate

Pass criteria:

- P0 active routes have no `rounded-[...]`, `rounded-none`, route-local shadow systems, or hardcoded visual colors.
- P0 active routes compose templates/organisms instead of route-local shells.
- P0 active route pages trend under 300 lines.
- Any scanner findings in active routes are either removed or documented as temporary exemptions.

Suggested active route scope:

```text
paperclip/ui/src/App.tsx
paperclip/ui/src/components/OnboardingWizard.tsx
paperclip/ui/src/components/Layout.tsx
paperclip/ui/src/pages/Dashboard.tsx
paperclip/ui/src/pages/DepartmentWorkspace.tsx
paperclip/ui/src/pages/Issues.tsx
paperclip/ui/src/pages/IssueDetail.tsx
paperclip/ui/src/pages/Library.tsx
paperclip/ui/src/pages/Goals.tsx
```

### Gate 3 — Template Scroll And Responsive Gate

Pass criteria:

- Every P0 template owns its scroll container.
- Short viewport desktop and mobile probes can scroll all primary content.
- No horizontal overflow on launcher, onboarding, Mission Control, department workspace, task review, Library, or Tech Tree.
- App rail is slim and fixed; system/admin tools remain under settings/system affordances.

Suggested verification:

```bash
pnpm -C paperclip --filter @paperclipai/ui typecheck
node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --screenshot-dir /private/tmp/theft-design-system-desktop
node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --mobile --screenshot-dir /private/tmp/theft-design-system-mobile
git diff --check
```

### Gate 4 — Visual QA Gate

Pass criteria:

- Screens use the clean white/Sana-style direction, not dark command-center styling.
- Density feels compact without shrinking root font size.
- Radius is soft and consistent: `rounded-lg` for surfaces, `rounded-md` for controls, `rounded-sm` for small nested affordances, `rounded-full` only for avatars/status dots/badges/progress.
- First viewport answers: objective, constraints, options, decisions, execution, outcomes, next move.
- No visible admin dashboard taxonomy dominates the founder happy path.

## Three-Pass Migration Sequence

### Pass 1 — Lock The Contract

Owner type: token/primitive worker.

Work:

1. Freeze `DESIGN-SYSTEM.md` as the human contract.
2. Normalize `index.css` into named sections: tokens, shadcn mappings, base, atoms, templates, legacy adapters.
3. Ensure shadcn primitives use tokenized radius, color, border, focus, disabled, and density behavior.
4. Add scanner output baseline and fail-on-new-drift mode for active route scope.
5. Add a short design-system README inside the UI package only if it points back to `BUILD-FROM-THIS/DESIGN-SYSTEM.md`.

Done when:

- scanner has a stable baseline;
- active-route new drift can fail locally;
- no one needs to inspect four different token views to know the answer.

### Pass 2 — Convert The Founder Happy Path

Owner type: product UI worker.

Work:

1. Extract P0 templates.
2. Convert P0 pages to composition-only route files.
3. Promote repeated P0 molecules/organisms.
4. Replace route-local arbitrary values with tokens, semantic utilities, or shadcn variants.
5. Run desktop and mobile route smoke after each route family.

Order:

1. `LauncherTemplate`
2. `SplitCanvasFormTemplate`
3. `WorkbenchTemplate`
4. `DepartmentWorkspaceTemplate`
5. `TaskQueueTemplate`
6. `TaskReviewTemplate`
7. `LibraryWorkspaceTemplate`
8. `TechTreeTemplate`

Done when:

- P0 route files trend under 300 lines;
- P0 active routes have no undocumented scanner hits;
- browser screenshots match one design system.

### Pass 3 — Isolate And Pay Down Runtime/Admin

Owner type: runtime UI worker.

Work:

1. Move system/runtime/admin routes behind settings/system IA.
2. Give runtime/admin pages a single `SettingsTemplate` or `SystemDetailTemplate`.
3. Convert noisy admin controls to shadcn primitives when touched.
4. Leave labs/reference routes exempt but visibly isolated.
5. Remove dead theme roots and old visual systems once no active route imports them.

Done when:

- P1 routes follow the same primitives and templates;
- P2 routes are either converted or isolated as legacy system surfaces;
- the scanner trend line goes down without blocking product development.

## Parallel Worker Plan

Multiple workers can run safely if ownership is strict.

| Worker | Owns | Must not touch |
|---|---|---|
| A | tokens, shadcn primitives, scanner/no-new-drift gate | product route behavior |
| B | P0 templates and active product route composition | scanner internals unless needed |
| C | docs, migration map, task sequencing, launch gates | product code |
| D | runtime/admin isolation after P0 | founder happy-path templates |

Conflict rule: if a file is already dirty from another worker, read it before editing and avoid broad formatting. Product code workers should not edit `BUILD-FROM-THIS/` unless updating task status. Docs workers should not edit `paperclip/ui/src`.

## Acceptance Checklist

- [ ] `BUILD-FROM-THIS/DESIGN-SYSTEM.md` remains the human contract.
- [ ] `paperclip/ui/src/index.css` remains the implementation contract.
- [ ] Generated token views, Tailwind, and design-guide docs are derived views only.
- [ ] P0 pages compose templates and organisms.
- [ ] P0 route pages trend under 300 lines.
- [ ] P0 render modules trend under 150 lines.
- [ ] P0 functions/hooks trend under 50 lines.
- [ ] No active-route arbitrary radius drift.
- [ ] No active-route hardcoded visual colors in TSX.
- [ ] No active-route one-off scroll shells.
- [ ] Desktop and mobile route smoke pass.
- [ ] Runtime/admin routes are reachable but not the primary founder IA.
