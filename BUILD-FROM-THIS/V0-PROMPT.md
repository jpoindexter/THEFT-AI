# V0 / Lovable / Claude — Screen Generation Prompt for THEFT AI

> Copy everything between the `---PROMPT START---` and `---PROMPT END---` markers into v0.dev, Lovable, or Claude with image generation. The prompt is self-contained — no external context needed.

---PROMPT START---

You are designing UI screens for **THEFT AI**, a desktop web app where a solo founder tells an AI their business idea and a team of AI agents (CEO + 8 department heads) shape the idea, set up the business, and run it end-to-end. Real work: writing code, drafting contracts, sending email, managing leads, paying invoices.

## Who uses this

Solo founder. Building a startup. Has an idea, doesn't have time or money to hire a team. Wants AI agents that actually DO the work — not chatbots that draft and hand back. Watches progress, redirects when needed, approves risky actions.

## Tone and visual direction

- **Utilitarian over flashy.** Function visible at all times. No marketing-y hero treatments, no purple gradients, no AI-cliché iconography (no glowing brains, no neural net abstractions, no robot avatars).
- **Reference apps:** paperclip.so (working dashboard, lists + detail), twin.so (chat-driven streaming workspace), cofounder.co (departments + roadmap as the heart of the product).
- **Aesthetic:** warm paper-ink palette. Cream and paper backgrounds, near-black ink text, mustard yellow as the single accent for "active" and "important," sage green for "complete," brick red for "blocked" or "destructive." Hand-drawn-feeling rounded corners (8–12px). Sans-serif body (Inter or similar), one distinctive font for display headings if you must.
- **No 4X game skin.** The roadmap concept is borrowed from 4X strategy tech trees (Civilization, Humankind, Stellaris) — a graph of capabilities with prereqs and stages. The CONCEPT is the reference, not the visual. Do NOT generate fantasy backgrounds, illustrated era art, ornate gold borders, or game-UI chrome.

## Color tokens (use these exact OKLCH values)

Light mode (default):
- `--canvas: oklch(0.985 0.005 90)` — app background
- `--paper: oklch(1 0 0)` — card / surface
- `--cream: oklch(0.965 0.012 85)` — subtle elevated surface
- `--ink: oklch(0.22 0.012 85)` — primary text
- `--ink-muted: oklch(0.45 0.012 85)` — secondary text
- `--ink-soft: oklch(0.65 0.012 85)` — tertiary text
- `--line: oklch(0.92 0.005 85)` — borders, dividers
- `--mustard: oklch(0.85 0.12 90)` — accent (active, in-progress, primary CTA)
- `--sage: oklch(0.82 0.08 145)` — success (complete)
- `--brick: oklch(0.62 0.18 25)` — destructive, error, blocked

## Typography

- Body: Inter or system sans, weights 400/500/600
- Display: optional — pick something distinctive but legible (e.g., Söhne, Tiempos, or a clean grotesque). NOT a serif unless it earns it.
- Sizes: 11px (micro labels, ALL-CAPS tracking), 13px (body small), 15px (body), 18px (subheading), 24px (heading), 32px (page title)

## Information architecture

The app is **one persistent layout** with a left sidebar nav, a center content area, and a right panel (chat workspace). The right panel is collapsible but visible by default — agents are always one click from running.

```
┌─────────────────────────────────────────────────────────┐
│ [Top bar: org switcher · breadcrumb · user menu]        │
├──────────┬────────────────────────────────────┬─────────┤
│          │                                    │         │
│  Sidebar │      Center content                │  Chat   │
│   nav    │      (the current page)            │  panel  │
│          │                                    │         │
│ - Home   │                                    │  agent  │
│ - Depts  │                                    │  stream │
│ - Tasks  │                                    │         │
│ - Approv │                                    │         │
│ - Library│                                    │         │
│          │                                    │         │
│ [user]   │                                    │ [input] │
└──────────┴────────────────────────────────────┴─────────┘
```

Sidebar: ~220px. Right chat panel: ~360px. Center: flexes.

## Screens to generate

Generate 6 screens, each as a separate composition. Each screen shows the full app shell (sidebar + center + right panel) — not just the center content.

### Screen 1: Home — Roadmap

**Purpose:** The user lands here. Sees the company's tech tree of capabilities. Knows what's done, what's in progress, what's available to start, what's locked.

**Center content:**
- Horizontal scroll layout, 8 vertical columns (one per "stage": Idea, Initial, Identity, Build, GTM, Launch, Scale, Mature).
- Each column header: stage name in 11px ALL-CAPS tracking, with a `done/total` count next to it (e.g., "BUILD STAGE  2/7").
- Each column contains 2–8 small cards stacked vertically. Each card represents one capability to build (e.g., "Brand identity", "Landing page live", "First customer signed", "$10K MRR").
- Card states (visible via subtle styling):
  - **Locked:** 40% opacity, no accent color, "Needs earlier steps" subtitle
  - **Available:** full opacity, white card with line border, small mustard "Available" pill
  - **In progress:** mustard border, mustard dot indicator
  - **Complete:** sage dot indicator, "Complete" subtitle
- Thin amber dashed lines connect prerequisite cards across columns. Lines are decorative — they tell the user "this depends on that." When the user hovers a card, lines connected to it become solid and brighter; others fade.
- A small department icon in the corner of each card (Engineering = laptop, Design = pen, Marketing = megaphone, Sales = handshake, Operations = gear, Finance = dollar, Legal = scale, Support = headset). Icons are 14px, monochrome.
- Click a card → opens a detail drawer (slides in from the right within the center area, NOT in the chat panel).

**Right panel:** Cofounder chat. Empty state with "Ask Cofounder anything about your company..." input. Show one example response if the layout permits.

**Top bar:** Org name + workspace switcher chevron. Breadcrumb: just "Roadmap".

### Screen 2: Roadmap node detail (drawer open)

Same as Screen 1, but with a card clicked and a 320px-wide drawer slid in from the right side of the center area (between center and chat panel).

**Drawer contents:**
- Stage label (11px ALL-CAPS, ink-muted)
- Department icon in mustard rounded square (32px)
- Capability title as h2 (e.g., "Brand identity locked in")
- Two pills: capability name + agent status ("Agent can do this" mustard pill OR "Needs your input" ink-soft pill)
- Section "How to move this forward" — paragraph of plain text
- Section "To complete" — checklist item with a checkbox + small status pill (Done / Waiting / Launch)
- Section "Required first" — list of prerequisite capabilities with green dots for complete ones, ink-muted for incomplete
- Section "Completing this unlocks" — list of downstream capabilities
- Sticky footer: big mustard "Launch Agent" button (full width) + optional secondary "View external link" outline button

### Screen 3: Chat workspace (right panel, expanded view)

The right panel as it looks when an agent is actively working on a task. This is the "twin-style" streaming workspace.

**Right panel contents (top to bottom):**
- Header: agent role + name (e.g., "Sales Agent · Define positioning"), plus a back chevron to return to the previous task
- Conversation thread:
  - User message bubbles (right-aligned, no avatar, cream background)
  - Agent message bubbles (left-aligned, paper background, small agent icon as avatar)
  - Inline tool/integration badges within agent messages (e.g., a small "Reddit" pill, a small "GitHub" pill, a small "file:positioning.md" code-style pill)
- "Building [task name]" card: a contained box with the task title bolded at top, then a vertical list of sub-step rows
- Each sub-step row:
  - A circle icon on the left (outline = pending, mustard half-fill spinning = running, sage check = complete)
  - Sub-step name in 13px ink (e.g., "Reading department library file", "Searching general library for business context", "Thought through the next step")
  - A small integration/skill icon on the right if relevant
- Below the building card: a mustard "Stop" button outline (small, rounded), with credits used counter on the right ("18 / 4,982")
- Sticky bottom: chat input with placeholder "Send live feedback to adjust the build..." and a paperclip icon (attach) + send arrow

### Screen 4: Department drill-in

**Purpose:** Click a department in the sidebar or from a roadmap node → see that department's view.

**Center content:**
- Page title: "Engineering Department" (or whichever)
- Subtitle: short description of what this department does ("Builds, deploys, and maintains the product.")
- Section "Your projects" — 2–4 horizontal cards in a row. Each project card has a title, a status pill (LIVE in mustard, PENDING in ink-soft, NOT READY in ink-soft outline), and a Preview / Deploy action button.
- Section "Roadmap" — horizontal scroll of just THIS department's roadmap nodes, same card style as Home but filtered to one department.
- Section "Recent artifacts" — a 3-column grid of small thumbnail cards (each thumbnail is a generic document/screenshot preview with a filename caption underneath).

**Right panel:** Chat panel scoped to this department's agent. Empty state: "Ask Engineering Agent anything about your product..."

### Screen 5: Approvals inbox

**Purpose:** The user reviews things agents want to do but need permission for.

**Center content:**
- Page title: "Approvals"
- Subtitle: "Agents are waiting for your decision on the following actions."
- A vertical list of approval cards. Each card:
  - Left edge: a vertical accent bar in mustard (pending), sage (recently approved), or brick (rejected)
  - Top row: approval type pill (SPEND / SEND EMAIL / DEPLOY / SIGN / HIRE / PUBLISH), the requesting agent's name + icon, and a relative timestamp (e.g., "2 min ago")
  - Title (bold, 15px): human-readable action description, e.g., "Send launch email to 2,400 subscribers"
  - Body (13px, ink-muted): 1–2 lines of context with the agent's stated reason for needing approval
  - Linked task chip: small pill with task title (clickable, opens task in chat panel)
  - Footer row: "Reject" outline button, "Approve" mustard button, "Discuss" link button
- Filters at top: All / Pending / Approved / Rejected (segmented pills)

**Right panel:** Default empty chat state, OR if an approval is selected, the chat panel shows the agent's prior conversation that led to this approval request.

### Screen 6: Onboarding — Idea capture

**Purpose:** First-run experience. New user opens the app, has no company yet, sees this.

**Center content:** Full-bleed centered single-column form.
- Large heading (32px): "What are you building?"
- Subtext (15px ink-muted, 60ch max width): "Describe your business idea in one or two sentences. The Cofounder agent will ask clarifying questions, then generate a roadmap of capabilities to build."
- Textarea (auto-resize, generous padding, paper background, line border): placeholder text "A subscription service for designers who need ongoing brand work. Customers pay monthly, we deliver one design request at a time."
- Below textarea, three small example chips users can click to populate the textarea: "AI marketing agency", "Subscription design service", "B2B SaaS for accountants"
- Below chips, primary mustard button "Continue" (right-aligned), and a small "Skip — I'll fill this in later" link (left-aligned, ink-soft)

**Right panel:** Hidden on this screen. Full-bleed center experience.

**Top bar:** No org switcher (no org yet). Just "THEFT" logo word-mark, left-aligned.

## Components to render at least once across the 6 screens

- **Node card** (4 states: locked / available / in_progress / complete) — Home + Department screens
- **Department badge** (8 variants: Engineering / Design / Marketing / Sales / Ops / Finance / Legal / Support) — Home + Department + Approvals
- **Chat message bubble** (user + agent variants, with inline tool badges) — Chat workspace
- **Sub-step row** (pending / running / complete) — Chat workspace
- **Approval card** (pending / approved / rejected) — Approvals inbox
- **Activity log row** with expand/collapse (used by agents to show "Ran 7 actions") — Chat workspace
- **Empty state** — used in Department for "No artifacts yet" and Chat for empty conversation
- **Status pill** (LIVE / PENDING / NOT READY / BLOCKED / DRAFT) — Department screen
- **Stage column header** — Home screen

## What NOT to do

- **No purple-blue gradients.** Especially not on hero sections.
- **No glassmorphism, no neumorphism, no aggressive shadows.** Subtle 1px borders + at most a soft 4–8px shadow on elevated cards.
- **No generated illustrations of "AI" or "robots" or "brains".** Department icons should be functional (laptop for Engineering, scale for Legal, etc.).
- **No 4X game UI.** No fantasy art, no era backgrounds, no ornate borders, no science-currency icons, no "research point" counters.
- **No tabs at the top of the page** — navigation lives in the left sidebar.
- **No top-mounted progress bars or banners** — keep the top bar minimal.
- **No emoji in UI labels.** Lucide icons or equivalent line-icon set only.
- **No "drag to scroll" hints or animated wizards.** The first-run experience is one screen with one input.

## Reference visual context

- For chat panel pattern: look at twin.so's workspace view (sidebar + chat with streaming sub-steps + Stop button + live feedback input)
- For roadmap card grid: look at cofounder.co's department canvas (cards in columns, dashed connector lines, status dots) — but DO NOT copy the org-chart circle layout; the roadmap is the centerpiece, not a circle of departments
- For approval inbox: look at paperclip.so's approvals page (list of cards with type pills, action buttons, agent attribution)

Deliver each of the 6 screens as a high-fidelity static composition. Annotate any interactions you assume (e.g., "hover state shown for connected lines" or "drawer slides in from right").

---PROMPT END---

## How to use this prompt

1. **For v0.dev:** Paste the prompt content (between markers) directly. v0 will generate React + Tailwind components. Iterate one screen at a time if context is tight — say "Generate Screen 1 only" then "Generate Screen 2 only", etc.
2. **For Lovable:** Paste the prompt as the initial project description. Lovable will scaffold a full app — you'll get the IA shell plus all 6 screens.
3. **For Claude with image generation:** Paste the prompt and ask "Generate a high-fidelity mockup of Screen 1." Repeat per screen. Claude will produce annotated PNG mockups.
4. **For Figma Make / Galileo / Magic Patterns:** Same approach — paste, then ask for screens individually.

## What to do with the output

- Generated screens are **mockups, not implementation**. Use them to validate the IA and visual direction before writing app code.
- If a generated screen looks wrong, the fix usually goes in the prompt (add a constraint, name a thing it should NOT do), not in the screen itself.
- Save the best generated screens as PNGs to `frames3/` (or similar) for future reference alongside `frames/`, `frames2/`, `twinframes/`.

## What this prompt deliberately omits

- **Marketing pages** (landing, pricing, about) — generate separately if needed.
- **Settings sub-pages** — out of scope for v0.
- **Library / artifact viewer** — generate after core 6 are validated.
- **Mobile views** — desktop-first; mobile is a separate prompt.
- **Dark mode** — same palette in dark just inverts: `--ink` becomes near-white, `--paper` becomes near-black, accents stay similar. Generate dark mode as a follow-up if needed.
