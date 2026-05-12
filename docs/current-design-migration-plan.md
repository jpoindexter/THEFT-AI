# Current Design Migration Plan

Date: 2026-05-12

## Goal

Move every active onboarding, workspace, and first-run screen onto the current THEFT workspace design language and remove old user-facing "Cofounder" product language, old circle/sunflower visuals, and mixed onboarding flows.

The intended product language is:

- **Operator** for the company-level assistant/tray.
- **Department agents** for Engineering, Design, Marketing, Sales, Operations, Finance, Legal, and Support.
- **Workspace setup** for onboarding.
- **Company brief** and **roadmap** for the durable setup outputs.

Internal API names may remain temporarily if changing them would create unnecessary risk, but visible copy should stop saying "Cofounder" unless it is inside historical docs or archived reference material.

## Current Findings

There are two active onboarding-era systems in the app:

- `app/src/app/onboarding/flow.tsx` creates a workspace and still references a "Cofounder interview."
- `app/src/components/org-onboarding-flow.tsx`, `org-onboarding-chat.tsx`, and `org-onboarding-plan.tsx` drive the newer organization onboarding screen.

Legacy Cofounder-era UI and language still exists in active or semi-active paths:

- `app/src/components/cofounder-chat.tsx`
- `app/src/components/right-panel.tsx`
- `app/src/components/sunflower.tsx`
- `app/src/app/onboarding/done/page.tsx`
- `app/src/components/onboarding-tour.tsx`
- `app/src/components/agent-chat.tsx`
- `app/src/components/tasks-tab.tsx`
- `app/src/components/agent-panel.tsx`
- `app/src/components/org-chat-panel.tsx`
- Settings/support copy under `app/src/app/[org]/(shell)/settings/`

The visible problem reported during reset onboarding:

- The app briefly showed an old circular/sunflower-style Cofounder visual.
- It then shifted into the newer design screen.
- This creates a jarring mixed-brand first-run experience.

## Migration Strategy

1. **Make one canonical onboarding path.**
   Route `/onboarding` and `/:org/onboarding` through a single current-design experience. The entry screen should create or resume a workspace without flashing the old flow.

2. **Remove old first-run visuals from active routes.**
   Replace circle/sunflower loading and old Cofounder panels with current workspace surfaces: top-bar framing, document/brief panels, roadmap panels, restrained borders, and icon-only window controls.

3. **Rename visible product language.**
   Replace user-facing "Cofounder" copy with "Operator" or "workspace setup" depending on context.

4. **Keep backend risk low.**
   Leave API route names such as `/api/[org]/cofounder` in place during this pass if they are still wired into agent execution. Treat visible UI language as the first migration boundary.

5. **Use the new tray model consistently.**
   The company-level chat should use the right-side slide tray and top-bar panel icon. No bottom-right floating chat widget and no persistent third layout column.

6. **Verify by resetting local data.**
   Reset `.theft-data`, visit `/onboarding`, create a workspace, complete setup, and confirm no old visual/copy appears.

## Tasklist

### Checkpoint 1: Save Plan

- [x] Create this plan document.
- [x] Add ignore rules for local app data backups.
- [ ] Commit and push the plan checkpoint.

### Checkpoint 2: Canonical Onboarding Entry

- [ ] Replace `/onboarding` old name-first screen with current-design workspace setup entry.
- [ ] Remove "Cofounder interview" copy from the entry flow.
- [ ] Ensure `/onboarding` does not briefly render legacy visuals before redirect/resume.
- [ ] Preserve workspace creation and redirect to `/:org/onboarding`.

### Checkpoint 3: Current-Design Org Onboarding

- [ ] Remove `Sunflower` usage from active org onboarding.
- [ ] Replace "Cofounder" label in org onboarding with "Operator" or "Setup agent."
- [ ] Replace old circular loading art with current document/roadmap loading states.
- [ ] Make setup phases visually match the current app shell.

### Checkpoint 4: App-Wide Visible Copy Sweep

- [ ] Replace visible "Cofounder" in chat components with "Operator."
- [ ] Replace visible "Cofounder" in task/agent panels.
- [ ] Replace visible "Cofounder" in settings/support/onboarding-tour copy.
- [ ] Keep historical/archive/reference text untouched unless it renders in the active app.

### Checkpoint 5: Retire or Quarantine Legacy Components

- [ ] Confirm `cofounder-chat.tsx`, `right-panel.tsx`, and `sunflower.tsx` are no longer imported by active routes.
- [ ] Move unused legacy components to `_archive` or leave with a clear deprecation comment if risky to delete.
- [ ] Ensure no active route imports the old right-panel design.

### Checkpoint 6: Verification

- [ ] Reset local app data.
- [ ] Run through onboarding from `/onboarding`.
- [ ] Confirm no old circle/sunflower visual appears.
- [ ] Confirm no visible "Cofounder" language appears in onboarding.
- [ ] Confirm right chat tray still opens and closes after onboarding.
- [ ] Run focused lint on changed files.
- [ ] Run `pnpm -C app test`.
- [ ] Run `pnpm -C app build`.
- [ ] Commit and push the implementation checkpoint.

## Push Discipline

- Commit and push after the plan checkpoint.
- Commit and push after the canonical onboarding migration.
- Commit and push after the copy/legacy cleanup.
- Do not commit local `.theft-data` or backup app data.
- If GitHub auth blocks push, leave the branch and commits ready and report the exact auth blocker.
