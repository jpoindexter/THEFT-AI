# Agentic Workflow — THEFT AI

> How an AI runs a company end-to-end. Synthesized from research across CrewAI, AutoGPT, LangChain, Dify, Activepieces, and 6 awesome-lists (140+ frameworks surveyed). All file refs point to `_reference/`.

## The Loop (start to finish)

1. **Idea capture.** User types one sentence describing the business they want to build.
2. **Shape via dialogue.** CEO agent asks 3–5 clarifying questions (market, customer, business model, constraints). Stores answers in company memory.
3. **Roadmap generation.** CEO agent produces a tech-tree-shaped roadmap of capabilities the company needs (brand identity, MVP, first customer, $10K MRR, etc.) — eras = stages, dependencies = prereqs, departments = categories.
4. **User approves roadmap.** One-time gate. After approval, agents start working.
5. **CEO assigns nodes.** Each available node gets routed to the right department agent.
6. **Department executes.** Dept agent runs autonomously — reads context, calls tools, produces artifacts. Streams sub-steps to the chat panel.
7. **Approval gates fire** for risky actions (spend > threshold, send external email, deploy code, sign contract, hire). User approves/rejects in inbox.
8. **Output lands.** Artifact written to Library. Roadmap node flips to `complete`. New nodes unlock.
9. **Loop continues.** User watches, redirects, or steps away. The company keeps running.

This is the same shape as paperclip and cofounder. THEFT differs in **who owns the orchestration** (CEO agent, not user) and **how state surfaces** (roadmap-as-home, not org-chart-as-home).

---

## Primitives

CrewAI-shaped, AutoGPT-augmented. Three things, no more:

```ts
type Agent = {
  id: string;
  role: "CEO" | "Engineering" | "Design" | "Marketing" | "Sales" | "Operations" | "Finance" | "Legal" | "Support";
  goal: string;          // "Build and ship the MVP"
  backstory: string;     // Personality + constraints, injected into system prompt
  tools: Tool[];         // What this agent can actually do (shell, web, email, etc.)
  memory: Memory;        // Per-agent episodic + shared company access
};

type Task = {
  id: string;
  title: string;
  description: string;
  assignee: Agent["id"];
  context: Task["id"][];     // Prior tasks whose outputs feed this one
  expected_output: string;   // What "done" looks like
  async: boolean;            // Can run parallel with sibling tasks
  status: "pending" | "running" | "blocked" | "complete" | "failed";
  approval_required: ApprovalTrigger[];  // ["spend", "send_email", ...]
};

type Crew = {
  ceo: Agent;
  departments: Agent[];      // 8 of them
  shared_memory: Memory;     // Company-level facts, read by all
  process: "sequential" | "hierarchical";  // hierarchical for THEFT
};
```

**Why this shape:** Role-based agents (not generic), task-driven execution, hierarchical with shared memory. Validated as the dominant pattern across the 140+ frameworks in `_reference/awesome-2026-caramaschi/`.

**Code reference:** `_reference/crewai/lib/crewai/src/crewai/crew.py` (Crew class), `_reference/crewai/lib/crewai/src/crewai/task.py` (Task with context chains).

---

## Hierarchy

```
                          User
                            │
                            ▼
                       CEO Agent
                     (orchestrates,
                      does NOT execute)
                            │
       ┌────────┬───────────┼───────────┬─────────┐
       ▼        ▼           ▼           ▼         ▼
  Engineering Design   Marketing    Sales    [+ Ops, Finance, Legal, Support]
   (executes (executes (executes  (executes
    autonom-  autonom-  autonom-  autonom-
    ously)    ously)    ously)    ously)
```

- **CEO routes, does not do.** No code, no emails sent from CEO directly. CEO's job: decompose, assign, summarize.
- **Departments are autonomous within their domain.** Engineering writes code. Marketing drafts copy. They don't call each other directly — they request context via tool calls or wait for upstream tasks to complete.
- **Process: hierarchical, not peer-network.** Peer networks deadlock at scale. Hierarchical-with-shared-memory is what CrewAI's enterprise users (Fortune 500) chose.

---

## Memory Architecture

**Do NOT use one shared pool.** Layered memory beats unified memory for any system that runs longer than a single session. Pattern stolen from AutoGPT's Graphiti (`_reference/autogpt/autogpt_platform/backend/backend/copilot/graphiti/memory_model.py`):

| Layer | Contents | Who writes | Who reads | Lifetime |
|---|---|---|---|---|
| **Company** | Brand color, mission, pricing, customer segments, business model | CEO (with user approval for changes) | All agents | Versioned, immutable history |
| **Department** | Eng's tech decisions, Sales' customer notes, Marketing's brand voice | Dept head | Dept head + CEO | Append-only, scoped queries |
| **Agent episodic** | Task logs, tool call results, intermediate reasoning | The agent itself | The agent + CEO debug | Pruned after N days |
| **CEO synthesis** | Weekly summaries, trend recognition, conflict detection | Not stored — computed on demand | User | Generated, not persisted |

**Metadata on every memory:**
- `source_kind`: user_asserted | agent_derived | tool_observed
- `memory_kind`: fact | preference | rule | procedure | event
- `confidence`: 0.0–1.0
- `status`: active | tentative | superseded
- `provenance`: agent_id + timestamp + originating task_id

This separates "user said the brand color is blue" (fact, user_asserted, 1.0) from "agent inferred this from one customer email" (event, agent_derived, 0.3).

---

## Communication

Three channels, used for different things:

1. **Shared memory** — for business state that everyone reads (brand, mission, pricing). CrewAI pattern.
2. **Tool calling between agents** — when Sales needs Legal to review a contract, Sales calls a `request_legal_review` tool. Returns a task ID + status. Async by default.
3. **Event bus** — for broadcast changes ("Funding secured!", "First customer!"). All agents subscribe; they re-plan when relevant events fire.

No direct agent-to-agent messaging. No chat between agents. State changes flow through memory + events; work flows through tasks.

---

## Approval Pattern

Paperclip already has the right shape (`paperclip/ui/src/pages/Approvals.tsx` + server handlers). Adopt it. Augment with two additions:

**Trigger categorically, not by confidence alone.** Approvals fire when an agent attempts:
- `spend` where amount > org-configured threshold (default $0 in v0 — every spend approved)
- `send_external_email`
- `deploy_to_production`
- `sign_contract`
- `hire_agent` (new agent into the crew)
- `publish_public` (anything user-facing)

**Checkpoint timing:** *after* the LLM decides, *before* the tool commits. The agent calls `createApproval(type, payload)` which returns immediately with `pending`. The agent run halts. On user decision, a `heartbeatService.wakeup()` resumes with the approval result in context.

**Payload shape:**
```ts
{
  type: "spend" | "send_email" | "deploy" | "sign" | "hire" | "publish",
  description: string,         // Human-readable: "Send launch email to 2,400 subscribers"
  payload: Record<string, unknown>,  // Typed per `type`
  confidence: number,          // 0.0–1.0, agent's self-assessment
  reason: string,              // Why approval is needed (budget threshold, novel action, etc.)
  linked_task_id: string,
  linked_artifact_ids: string[],
}
```

**UI:**
- Inbox queue at `/[org]/approvals` (paperclip pattern)
- Inline "Agent paused, awaiting approval #xyz" in the chat panel
- Async delivery (Slack/email/SMS) for urgent items — Dify's `HumanInputForm` pattern (`_reference/dify/api/core/app/workflow/`)
- 48-hour timeout → auto-reject + escalate to CEO summary

---

## File Store Assessment

**Current state:** File-backed JSON at `app/.theft-data/`. One file per table. No locking, no versioning, no vector index.

**Verdict: adequate for v0 if we patch three things, will break by month 2.**

| Risk | When it bites | Fix for v0 |
|---|---|---|
| Concurrent writes from multiple agents | First time 2 agents finish a task simultaneously | Add `.lock` file pattern in `lib/db/store.ts` |
| No scope / provenance on memories | When agents start writing findings instead of just tasks | Add `scope`, `provenance`, `confidence`, `kind` fields to memory rows |
| No semantic recall | When agents need to recall "did we ever talk to a customer like this before?" | Park until month 2; manual filter by tag for now |
| Memory bloat | Around 1k facts/findings | Migrate to Postgres + pgvector in month 2 |
| No audit trail | When debugging "why did the agent spend $200?" | Add `audit_log.json` table — append-only, every mutation |

**Migration target (month 2):** Supabase (Postgres + pgvector + auth). Swap `lib/db/store.ts` adapter. App code doesn't change.

---

## What this Workflow Buys Us

- **Roadmap-as-home makes sense** — the tech tree IS the work queue. Available nodes = available tasks. In-progress = agents running.
- **Approvals are visible** — the inbox makes "where is the agent stuck" obvious.
- **State survives a tab close** — memory is on disk, agent loop is interruptible.
- **CEO synthesis is cheap** — on-demand, not stored. Always fresh.
- **Departments can run in parallel** — Eng builds while Marketing plans while Legal drafts. The roadmap shows everything in flight.

---

## What this Workflow Does NOT Solve (and where we'll add it later)

- **Inter-agent negotiation** — if Sales wants Legal to expedite a contract, there's no "argue" mechanism. v1.
- **Budget arbitration** — Finance can't tell Marketing to stop spending in real-time. v1.
- **External integrations** — real Stripe / SendGrid / Vercel / GitHub. v1 (mocks for v0).
- **Multi-tenant isolation** — one org per JSON store. v1 when we migrate to Postgres.

---

## Code References (`_reference/`)

| Pattern | File | Use |
|---|---|---|
| Crew + Agent + Task primitives | `crewai/lib/crewai/src/crewai/crew.py`, `task.py`, `agent.py` | Direct shape stealing |
| Graph-based task decomposition | `autogpt/autogpt_platform/backend/backend/data/graph.py` | If we ever need DAG-conditional execution |
| Memory with provenance | `autogpt/.../graphiti/memory_model.py` | Memory metadata shape |
| Durable workflow state | `dify/api/core/app/workflow/layers/persistence.py` | Pause/resume pattern |
| Human input form delivery | `dify/api/core/.../human_input.py` | Async approval via email/Slack |
| Long-running job queue | `activepieces/.../flow-worker.ts` | If we need durable agent runs across restarts |
| Approval queue UI | `paperclip/ui/src/pages/Approvals.tsx` | Reference for our approval inbox |

---

## Decisions This Locks In

(To be promoted to `DECISIONS.md` once we start building.)

1. **Hierarchical with shared memory** for multi-agent process. Not peer-network.
2. **CEO routes, departments execute.** CEO has no tools that produce artifacts.
3. **Layered memory** (Company / Department / Agent episodic / CEO synthesis). Not unified.
4. **Approvals trigger categorically**, not by confidence alone.
5. **Checkpoint timing**: after LLM, before tool commit. Same as paperclip.
6. **JSON store survives v0** with locking + scope + provenance patches. Postgres in month 2.
7. **Roadmap is the home.** Tech-tree concept (4X-inspired), not 4X visual skin.

---

## Open Questions

- What is the v0 budget threshold for the `spend` approval trigger? Suggested: $0 (every spend approved) until we know what agents actually try to spend.
- Should the CEO agent itself require approval for its own decisions (e.g., "hire a new Marketing agent")? Yes — every CEO action that mutates the crew goes through the same approval gate.
- Are there department-specific approval triggers we're missing? E.g., should Engineering's "merge to main" require approval? Probably yes. Define per-dept overrides in v1.
