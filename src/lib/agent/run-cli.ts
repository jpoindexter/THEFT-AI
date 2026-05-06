// Tool-use emulation over the OAuth `claude` CLI. We can't use the SDK's
// proper tool-use without an API key, so we ask the model to output a JSON
// envelope describing what it wants to do (text / ask / set_business_plan /
// delegate / done), parse it, dispatch, and loop.

import { runClaudeCli } from "./anthropic";
import { db, type Org } from "@/lib/db/store";
import type {
  AgentTurn,
  AgentMessage,
} from "./run";
import type {
  AskUserQuestionInput,
  SetBusinessPlanInput,
  DelegateInput,
  WriteArtifactInput,
} from "./tools";
import type Anthropic from "@anthropic-ai/sdk";

type Action =
  | { type: "text"; content: string }
  | ({ type: "ask_user_question" } & AskUserQuestionInput)
  | ({ type: "set_business_plan" } & SetBusinessPlanInput)
  | ({ type: "delegate_to_department" } & DelegateInput)
  | ({ type: "write_artifact" } & WriteArtifactInput)
  | {
      type: "set_tech_tree_node_status";
      node_slug: string;
      status: "available" | "in_progress" | "complete";
    }
  | { type: "complete_onboarding" }
  | { type: "done" };

const SCHEMA_PROMPT = `You are Cofounder. You communicate by emitting a JSON array of actions.

Each turn, output ONLY a single JSON array — no prose, no code fences, no commentary.

Available actions (each is an object with a "type"):

- {"type":"text","content":"<message to the founder>"}
- {"type":"ask_user_question","question":"<one question>","options":[{"key":"<kebab>","label":"<label>","description":"<one sentence>","recommended":<bool>}],"allow_custom":<bool>}
  (3-5 options, exactly one recommended:true. Pause for user.)
- {"type":"set_business_plan","product":"...","icp":"...","business_model":"...","mission":"...","differentiator":"...","go_to_market":"..."}
- {"type":"delegate_to_department","department_slug":"engineering|design|marketing|sales|operations|finance|legal|support","title":"...","description":"..."}
- {"type":"write_artifact","name":"...","kind":"markdown|json|business_plan|brand_kit|other","content":"...","department_slug":"..."}
- {"type":"set_tech_tree_node_status","node_slug":"...","status":"available|in_progress|complete"}
- {"type":"complete_onboarding"}
- {"type":"done"}  // emit when done with this turn and waiting for user

Rules:
- ask_user_question PAUSES the loop until the user answers; emit it last in the array if used.
- Emit text first, then any tools, then ask_user_question OR done.
- Tailor every option to the founder's specific business — no generic placeholders.
- When you have enough info for a brief, emit set_business_plan + complete_onboarding + done.

Output ONLY the JSON array. Nothing else.`;

const MAX_LOOPS = 6;

export async function runAgentCli(opts: {
  org: Org;
  systemPrompt: string;
  history: Anthropic.Messages.MessageParam[];
  userMessage?: string;
}): Promise<{
  history: Anthropic.Messages.MessageParam[];
  turns: AgentTurn[];
}> {
  const history = [...opts.history];
  if (opts.userMessage) {
    history.push({ role: "user", content: opts.userMessage });
  }

  const turns: AgentTurn[] = [];

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    const transcript = renderTranscript(history);
    const out = await runClaudeCli({
      system: `${opts.systemPrompt}\n\n${SCHEMA_PROMPT}`,
      messages: [
        {
          role: "user",
          text: `Conversation so far:\n\n${transcript}\n\nEmit the JSON array of actions for this turn.`,
        },
      ],
    });

    const actions = parseActions(out);
    if (!actions || actions.length === 0) {
      turns.push({
        kind: "text",
        text: "(Cofounder produced no parseable output)",
      });
      return { history, turns };
    }

    let pause: AgentTurn | null = null;
    let done = false;
    const assistantNoteParts: string[] = [];

    for (const a of actions) {
      if (a.type === "text") {
        turns.push({ kind: "text", text: a.content });
        assistantNoteParts.push(a.content);
        continue;
      }
      if (a.type === "ask_user_question") {
        const id = `ask_${loop}_${Math.random().toString(36).slice(2, 8)}`;
        turns.push({
          kind: "tool_call",
          tool_use_id: id,
          name: "ask_user_question",
          input: a,
        });
        pause = {
          kind: "pause",
          tool_use_id: id,
          tool: "ask_user_question",
          input: a,
        };
        assistantNoteParts.push(
          `[asked: ${a.question}]`,
        );
        break;
      }
      if (a.type === "set_business_plan") {
        await db.updateOrg(opts.org.id, { business_plan: a });
        await db.createArtifact({
          organization_id: opts.org.id,
          department_id: null,
          task_id: null,
          name: "Business Plan",
          kind: "business_plan",
          content: JSON.stringify(a, null, 2),
          metadata: null,
          pinned: true,
        });
        const id = `bp_${loop}`;
        turns.push({
          kind: "tool_call",
          tool_use_id: id,
          name: "set_business_plan",
          input: a,
        });
        turns.push({
          kind: "tool_result",
          tool_use_id: id,
          name: "set_business_plan",
          output: { ok: true },
        });
        assistantNoteParts.push("[saved business plan]");
        continue;
      }
      if (a.type === "delegate_to_department") {
        const dept = await db.getDepartment(opts.org.id, a.department_slug);
        if (dept) {
          const agents = await db.listAgents(opts.org.id, dept.id);
          await db.createTask({
            organization_id: opts.org.id,
            department_id: dept.id,
            agent_id: agents[0]?.id ?? null,
            parent_task_id: null,
            title: a.title.slice(0, 80),
            description: a.description ?? null,
            status: "todo",
            priority: "normal",
            mode: "execute",
            result: null,
          });
        }
        const id = `dlg_${loop}_${a.department_slug}`;
        turns.push({
          kind: "tool_call",
          tool_use_id: id,
          name: "delegate_to_department",
          input: a,
        });
        turns.push({
          kind: "tool_result",
          tool_use_id: id,
          name: "delegate_to_department",
          output: { ok: true },
        });
        assistantNoteParts.push(`[delegated: ${a.title}]`);
        continue;
      }
      if (a.type === "write_artifact") {
        const dept = a.department_slug
          ? await db.getDepartment(opts.org.id, a.department_slug)
          : null;
        await db.createArtifact({
          organization_id: opts.org.id,
          department_id: dept?.id ?? null,
          task_id: null,
          name: a.name,
          kind: a.kind as
            | "markdown"
            | "json"
            | "code"
            | "business_plan"
            | "brand_kit"
            | "other",
          content: a.content,
          metadata: null,
          pinned: false,
        });
        const id = `wa_${loop}_${Date.now()}`;
        turns.push({
          kind: "tool_call",
          tool_use_id: id,
          name: "write_artifact",
          input: a,
        });
        turns.push({
          kind: "tool_result",
          tool_use_id: id,
          name: "write_artifact",
          output: { ok: true },
        });
        continue;
      }
      if (a.type === "set_tech_tree_node_status") {
        const id = `tt_${loop}_${a.node_slug}`;
        turns.push({
          kind: "tool_call",
          tool_use_id: id,
          name: "set_tech_tree_node_status",
          input: a,
        });
        turns.push({
          kind: "tool_result",
          tool_use_id: id,
          name: "set_tech_tree_node_status",
          output: { ok: true },
        });
        continue;
      }
      if (a.type === "complete_onboarding") {
        const id = `co_${loop}`;
        turns.push({
          kind: "tool_call",
          tool_use_id: id,
          name: "complete_onboarding",
          input: {},
        });
        turns.push({
          kind: "tool_result",
          tool_use_id: id,
          name: "complete_onboarding",
          output: { ok: true },
        });
        continue;
      }
      if (a.type === "done") {
        done = true;
        break;
      }
    }

    // record what the assistant did this loop into history
    if (assistantNoteParts.length > 0) {
      history.push({
        role: "assistant",
        content: assistantNoteParts.join("\n"),
      });
    }

    if (pause) {
      turns.push(pause);
      return { history, turns };
    }
    if (done) {
      turns.push({ kind: "done" });
      return { history, turns };
    }

    // No pause, no done — push a synthetic user prompt to keep the agent moving
    history.push({
      role: "user",
      content: "Continue. Emit the next action array.",
    });
  }

  turns.push({ kind: "done" });
  return { history, turns };
}

function renderTranscript(
  history: Anthropic.Messages.MessageParam[],
): string {
  return history
    .map((m) => {
      const role = m.role === "user" ? "User" : "Assistant";
      const content =
        typeof m.content === "string"
          ? m.content
          : m.content
              .map((b) => {
                if (b.type === "text") return b.text;
                if (b.type === "tool_use")
                  return `[tool_use:${b.name}:${JSON.stringify(b.input)}]`;
                if (b.type === "tool_result")
                  return `[tool_result:${typeof b.content === "string" ? b.content : JSON.stringify(b.content)}]`;
                return "";
              })
              .filter(Boolean)
              .join("\n");
      return `${role}: ${content}`;
    })
    .join("\n\n");
}

function parseActions(s: string): Action[] | null {
  const trimmed = s.trim();
  // strip code fences if present
  const fenced = trimmed.match(/```(?:json)?\n?([\s\S]+?)\n?```/);
  const inner = fenced ? fenced[1] : trimmed;
  // find first [ and last ]
  const first = inner.indexOf("[");
  const last = inner.lastIndexOf("]");
  if (first < 0 || last < first) return null;
  try {
    const arr = JSON.parse(inner.slice(first, last + 1));
    if (!Array.isArray(arr)) return null;
    return arr as Action[];
  } catch {
    return null;
  }
}

// Re-export AgentMessage so consumers can import from one place.
export type { AgentMessage };
