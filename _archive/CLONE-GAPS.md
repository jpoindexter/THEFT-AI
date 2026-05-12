# Clone Gaps — What I Need to Finish

This document tracks every place where the current THEFT AI implementation diverges from the
reference screenshots, and **exactly what you need to give me** to close each gap. Organized by
confidence: things I'm certain about first, speculation flagged clearly.

---

## 1. Screen Recording (BLOCKED)

**File:** `screenshots/misc/Screen Recording 2026-05-06 at 1.25.17 PM.mov`

I cannot read video files. This recording likely captures interactions that screenshots don't show:
hover states, transitions, panel open/close animations, real-time agent typing, drag behavior, etc.

**Give me one of:**
- Exported keyframes (one PNG per second, or at key state changes)
- A written description of what the recording shows, beat by beat
- Screenshots at start / midpoint / end of each visible interaction

---

## 2. Task Detail Page — Canvas Layout

**Current:** `/[org]/tasks/[task]` renders an admin-style page: back link, title, 3 stat cards
(Agent / Mode / Priority), plan steps, `AgentRunConsole`, `SubtaskTree`, workflow section,
timestamps.

**Screenshots show (06-agent-tasks/03, 09):** A completely different layout:
- A centered card on the canvas with task title + agent breadcrumb + status badge ("Queued 1h",
  "Running 4m 25s")
- An empty workflow card inside the task card: checkmark icon, "No workflow items", subtitle
- The right panel is NOT the standard tab nav — it shows task-specific agent chat

**What I need:**
- Confirm the route: is this `/[org]/tasks/[task]`, `/[org]/[dept]/[agent]/[task]`, or something
  else? The URL bar in screenshots shows `app.cofounder.co/org/[slug]/ca...` (truncated).
- Screenshot of the task card when workflow items EXIST (not the empty state)
- Screenshot of a task in "running" vs "queued" vs "complete" state
- Does the right panel switch to task-agent chat automatically when on a task page, or is it user-toggled?

---

## 3. Floating Agent Context Bar (Canvas) ✓ RESOLVED

**Implemented:** `components/task/task-context-bar.tsx` — dark pill with agent dot + name + task title + `+ New Task` button. Used in `tasks/[task]/page.tsx`, `[department]/page.tsx`, and `design/page.tsx` via `absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none`.

**Was:** Not implemented. `layout-canvas.tsx` has a bottom bell + center `+` button but no
top bar.

**Screenshots show (06-agent-tasks/03, 09, 10, 13, 15, 16):** A dark pill/bar near the top-center
of the canvas showing:
- Agent avatar dot + agent name (e.g. "◆ Engineer")
- Separator "|"
- Current task title (truncated)
- Close / stop button on the left (×)
- "+ New Task" button on the right

**Confirmed:** This bar appears consistently across screenshots 03, 09, 13 which are all task
contexts. It likely lives inside `tasks/[task]/page.tsx` or is injected by a wrapper.

**What I need:**
- Does this bar appear on department pages too (e.g. `/[org]/design`) when no task is active?
  Screenshot 08 (design agent empty) does NOT show it, suggesting it only appears when a task is
  active.
- What does the × button do — stop the task? Navigate back to dept? Close the bar?
- Does clicking the agent name navigate to `/agents/[agent]`?

**I can implement this now** for the task detail page specifically — I just need the above
questions answered to get behavior right.

---

## 4. Right Panel — Task-Context Agent Chat

**Current:** Right panel always shows the same 5 tabs (Home / Cofounder / Company / Tasks /
Library). The Tasks tab shows a task list + popup.

**Screenshot 03 shows:** When on a task page, the right panel appears to show task-specific agent
chat directly — no tab nav visible, or Tasks tab is active and shows a thread specific to that
task:
- Task title as header
- Agent messages in a thread
- "Message this task and @ departments for context" input at bottom

**What I need:**
- Is the right panel tab nav still visible when on a task page? Or does it collapse to just the
  task chat?
- Is this the same `AgentChat` component reused with a `taskId` prop, or a separate component?
- Does the right panel auto-switch to Tasks tab when you navigate to a task URL?
- Screenshot of the right panel on a task page when the agent has produced output (not empty)

---

## 5. Design Agent Workspace (Department Canvas) ✓ RESOLVED

**Implemented:** `/[org]/design` shows centered card with `PreviewScene scene="design"` SVG landscape illustration (sky, clouds, hills, cypress trees, small figure) + "No tasks yet" overlay + "Design Agent is ready for new tasks" subtitle. Each department gets its own `PreviewScene` via `SceneKey`. The SVG landscape in `org-chart-preview.tsx` now matches the reference spirit (nature/landscape painting aesthetic).

---

## 6. Task Status / Elapsed Time Data Model ✓ RESOLVED

`started_at: string | null` added to `Task` type in `store.ts`. Set by the run route when
transitioning to `in_progress`. `computeStatusText()` in `tasks/[task]/page.tsx` uses
`started_at` for running tasks and falls back to `created_at` for queued tasks.
Status display: "Queued Xh", "Running Xm Xs", "Finished turn", "Blocked", "In review".

---

## 7. Right Panel — Agent-Specific "Suggested Next" on Home Tab ✓ RESOLVED

**Implemented:** `components/department-panel.tsx` — when URL is a dept slug, Home tab renders `DepartmentPanel` instead of `HomeTab`. Agent header shows `DEPT_DISPLAY_NAME[slug]` + "default" badge + "+ New task". `SUGGESTED` record has 8 dept entries (engineering, design, marketing, sales, operations, finance, legal, support) with 4 items each. Items are rendered as bordered cards with title + description, clicking opens `NewTaskDialog`.

---

## 8. Routing Clarification — 3-4 Level Breadcrumbs

**Screenshots show breadcrumbs like:**
- `THEFT > Engineering > Engineer > Build product MVP` (screenshot 03)
- `THEFT > Design > Design Agent > Design: Create branded pitch...` (screenshot 09)

**Current:** `layout-header.tsx` only builds 2-level breadcrumbs (`[OrgName] > [SubLabel]`).

**What I need:**
- Are these deeper routes (`/[org]/engineering/[agent]/[task]`), or is the breadcrumb built
  client-side from multiple context signals (URL + selected task + selected agent)?
- If it's a route structure, does the `[department]` route have its own sub-routes `[agent]` and
  `[task]`?

---

## 9. Agent Run Console — Live Streaming UI

**Current:** `agent-run-console.tsx` polls for NDJSON runs and renders them. The UI is a
monospace log stream.

**Screenshots show:** The task canvas shows a card with "No workflow items" (a polished empty
state with a checkmark circle icon). There's no visible console/log stream in screenshots — it
might only appear when there's actual output.

**What I need:**
- Screenshot of the console/workflow view when an agent is actively running and producing output
- Screenshot of the workflow view when there are completed artifact items (e.g. a generated PNG,
  a document)
- Are "workflow items" the same as `artifacts`, or are they a separate concept (approvals,
  code diffs, etc.)?

---

## 10. Gaps I Can Confirm Are Implemented Correctly

For reference, these are **confirmed** against screenshots and no changes are needed:

| Feature | File | Status |
|---|---|---|
| Onboarding flow | `onboarding/flow.tsx` | ✓ |
| Company creation | `onboarding/` | ✓ |
| Business brief cofounder chat | `components/agent-chat.tsx` | ✓ |
| Roadmap board (kanban) | `components/tech-tree-board.tsx` | ✓ |
| Department hero (empty) | `components/department-hero.tsx` | ✓ |
| Right panel tabs | `components/right-panel.tsx` | ✓ |
| Tasks tab + popup | `components/tasks-tab.tsx` | ✓ |
| Tasks tab — done task checkmark | `components/tasks-tab.tsx` | ✓ |
| Tasks tab — task focus view (right panel) | `components/tasks-tab.tsx` | ✓ |
| Right panel auto-switch on task URL | `components/right-panel.tsx` | ✓ |
| Home tab + popup | `components/right-panel.tsx` | ✓ |
| Library tab (gallery + files) | `components/library-tab.tsx` | ✓ |
| Company tab | `components/company-tab.tsx` | ✓ |
| New task dialog (3 dropdowns) | `components/new-task-dialog.tsx` | ✓ |
| Department panel (right panel) | `components/department-panel.tsx` | ✓ |
| Department panel agent display names | `components/department-panel.tsx` | ✓ |
| Task detail — 4-level breadcrumb | `components/layout-header.tsx` | ✓ |
| Task detail — status badge with ✕ stop | `app/[org]/tasks/[task]/page.tsx` | ✓ |
| Task detail — PATCH API for stop | `app/api/[org]/tasks/[task]/route.ts` | ✓ |
| Task composer — ■ send button | `components/tasks-tab.tsx` | ✓ |
| Design dept empty state (DeptEmptyCanvas) | `app/[org]/design/page.tsx` | ✓ |
| Brand kit flow | `components/brand-kit-flow.tsx` | ✓ |
| Database table editor | `app/[org]/database/page.tsx` | ✓ |
| Migrations list | `app/[org]/database/migrations/page.tsx` | ✓ |
| Auth settings (toggles + URLs) | `app/[org]/database/auth/page.tsx` | ✓ |
| Users list + create dialog | `app/[org]/database/users/page.tsx` | ✓ |
| Secrets / API keys | `app/[org]/database/secrets/page.tsx` | ✓ |
| Storage empty state | `app/[org]/database/storage/page.tsx` | ✓ |
| Logs dropdown (interactive) | `app/[org]/database/logs/page.tsx` | ✓ |
| Advisors page | `app/[org]/database/suggestions/page.tsx` | ✓ |
| All 10 settings pages | `app/[org]/settings/*/page.tsx` | ✓ |
| Preferences + delete dialog | `settings/preferences/` | ✓ |
| Task `started_at` elapsed time | `lib/db/store.ts` + `tasks/[task]/page.tsx` | ✓ |

---

## Priority Order for Next Session

1. **Screen recording** — likely unblocks #9 (workflow items visual)
2. **Design Agent workspace illustration** (#5) — needs painting/illustration assets for `PreviewScene`; current SVG placeholder is in place
3. **Breadcrumb routing** (#8) — ✓ already implemented (4-level crumbs working)
4. **Task status elapsed time** (#6) — `started_at` timestamp on tasks would enable "Running 4m 25s" style badges
5. **Agent-specific Suggested Next on Home tab** (#7) — currently shows roadmap `available` nodes; reference shows dept-specific template suggestions
6. **Breadcrumb routing** (#8) — structural change, needs route map
