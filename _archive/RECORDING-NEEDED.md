# Recording Needed — What to Capture

Gaps found from scanning all 3119 video frames vs current THEFT AI implementation.
Each item lists the exact screen to navigate to and what states/interactions to capture.

**Already implemented from existing frames:** Integrations page, MCP page, Linear detail (Triggers+Actions), Billing page layout, AskUserQuestion back nav, Decide all button.

---

## 1. Right Panel Task Focus — Header Area

**Why:** When a task is focused in the right panel, the header shows `< Task Title  ?  ...` with
back arrow + help + overflow icons. Unclear if we have these or they're missing.

**Navigate to:** Canvas → click any active task in the Tasks tab right panel

**Capture:**

- The exact header of the task focused view — left arrow, task title (truncated?), ? icon, ... icon
- What the `?` icon does (tooltip? modal?)
- What the `...` icon does (dropdown menu — capture that menu open)
- Click `<` back — confirm it returns to the tasks list

---

## 3. "N Agent Updates" Notification Bar — Canvas bottom-left

**Why:** Bottom-left shows "● 1 agent update" pill with red dot + agent icon + text. Our canvas
has a bell icon but not this specific format.

**Navigate to:** Canvas with at least one active/recently-run task

**Capture:**

- The notification bar when showing "1 agent update" (or any N > 0)
- Click it — what expands? A list of updates? A panel?
- The state when there are 0 updates (does it hide, show "0 updates", or show blank bell?)
- The state when there are 2+ updates

---

## 4. Tasks Tab — Suggested Next — Source of Items

**Why:** Home tab "Suggested Next" shows items like "Connect Postiz", "Run paid acquisition",
"Launch website". Unclear if these come from roadmap nodes filtered as `available`, or a separate
curated list that the agent writes. Currently we render roadmap `available` nodes here.

**Navigate to:** Canvas → right panel → Home tab

**Capture:**

- The "Suggested Next" section with items visible
- The refresh/reload icon next to "SUGGESTED NEXT" label — click it and capture behavior
- If clicking an item triggers something (new task dialog? route change?) capture that

---

## 5. Agent Output Rendering — Right Panel Task Thread

**Why:** Right panel task thread shows rich markdown output — bold, numbered lists, `###` headers,
inline code. Need to verify our `AgentChat` component renders this correctly.

**Navigate to:** Canvas → click an active task → right panel task thread

**Capture:**

- A long agent message with mixed formatting (bold + numbered list)
- Scroll to see the full thread
- The message area footer: agent name chip + "Message this task and @ departments for context..."
  input + send button (arrow vs square ■)

---

## Probably NOT Needed (skip these)

These are production-app-only features visible in frames that are NOT in our scope:

- Agent Workspace "Studio" card with artifact roadmap steps (frames 2800-2870) — advanced feature
- Content Calendar card in Marketing Department — Postiz integration, not in scope
- Library "Chat with file" hover overlay — newer production feature
- Dark-theme department canvases — production app's `/canvas` route, different arch
- Inbox panel "All caught up!" — separate inbox system, not in scope
