// Tool-use emulation over the selected local/provider harness. We can't rely on
// every adapter exposing Anthropic tool-use, so we ask the model to output a
// JSON envelope describing what it wants to do, parse it, dispatch, and loop.

import { generate } from "./anthropic";
import { type Org } from "@/lib/db/store";
import { executeEngineTool } from "@/lib/engine/tool-dispatcher";
import type {
  AgentTurn,
  AgentMessage,
} from "./run";
import type {
  AskUserQuestionInput,
  SetBusinessPlanInput,
  DelegateInput,
  ListFilesInput,
  ReadFileInput,
  WebFetchInput,
  WebSearchInput,
  WriteArtifactInput,
  WriteSkillInput,
} from "./tools";
import type Anthropic from "@anthropic-ai/sdk";

type Action =
  | { type: "text"; content: string }
  | ({ type: "ask_user_question" } & AskUserQuestionInput)
  | ({ type: "set_business_plan" } & SetBusinessPlanInput)
  | ({ type: "delegate_to_department" } & DelegateInput)
  | ({ type: "write_artifact" } & WriteArtifactInput)
  | ({ type: "web_search" } & WebSearchInput)
  | ({ type: "web_fetch" } & WebFetchInput)
  | ({ type: "read_file" } & ReadFileInput)
  | ({ type: "list_files" } & ListFilesInput)
  | ({ type: "write_skill" } & WriteSkillInput)
  | {
      type: "set_tech_tree_node_status";
      node_slug: string;
      status: "available" | "in_progress" | "complete";
    }
  | { type: "complete_onboarding" }
  | { type: "done" };

const SCHEMA_PROMPT = `You are Operator. You communicate by emitting a JSON array of actions.

Each turn, output ONLY a single JSON array — no prose, no code fences, no commentary.

Available actions (each is an object with a "type"):

- {"type":"text","content":"<message to the founder>"}
- {"type":"ask_user_question","question":"<one question>","options":[{"key":"<kebab>","label":"<label>","description":"<one sentence>","recommended":<bool>}],"allow_custom":<bool>}
  (3-5 options, exactly one recommended:true. Pause for user.)
- {"type":"set_business_plan","product":"...","icp":"...","business_model":"...","mission":"...","differentiator":"...","go_to_market":"..."}
- {"type":"delegate_to_department","department_slug":"engineering|design|marketing|sales|operations|finance|legal|support","title":"...","description":"..."}
- {"type":"write_artifact","name":"...","kind":"markdown|json|business_plan|brand_kit|other","content":"...","department_slug":"..."}
- {"type":"list_files","department_slug":"engineering|design|marketing|sales|operations|finance|legal|support"}
- {"type":"read_file","name":"<artifact name or partial name>"}
- {"type":"web_search","query":"...","max_results":3}
- {"type":"web_fetch","url":"https://...","max_chars":8000}
- {"type":"write_skill","name":"<kebab-case>","title":"...","body":"<markdown procedure>"}
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
const SERVER_TOOL_ACTIONS = new Set<Action["type"]>([
  "set_business_plan",
  "delegate_to_department",
  "write_artifact",
  "web_search",
  "web_fetch",
  "read_file",
  "list_files",
  "write_skill",
  "set_tech_tree_node_status",
  "complete_onboarding",
]);

type ServerToolAction = Exclude<
  Action,
  { type: "text" } | ({ type: "ask_user_question" } & AskUserQuestionInput) | { type: "done" }
>;

export async function runAgentCli(opts: {
  org: Org;
  systemPrompt: string;
  history: Anthropic.Messages.MessageParam[];
  userMessage?: string;
  model?: string;
  backend?: string | null;
  baseUrl?: string | null;
  onTurn?: (turn: AgentTurn) => void;
}): Promise<{
  history: Anthropic.Messages.MessageParam[];
  turns: AgentTurn[];
}> {
  const history = [...opts.history];
  if (opts.userMessage) {
    history.push({ role: "user", content: opts.userMessage });
  }

  const turns: AgentTurn[] = [];
  const emit = (turn: AgentTurn) => {
    turns.push(turn);
    opts.onTurn?.(turn);
  };

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    const transcript = renderTranscript(history);
    const out = await generate({
      system: `${opts.systemPrompt}\n\n${SCHEMA_PROMPT}`,
      messages: [
        {
          role: "user",
          text: `Conversation so far:\n\n${transcript}\n\nEmit the JSON array of actions for this turn.`,
        },
      ],
      model: opts.model,
      backend: opts.backend,
      baseUrl: opts.baseUrl,
    });

    const actions = parseActions(out);
    if (!actions || actions.length === 0) {
      emit({
        kind: "text",
        text: "(Operator produced no parseable output)",
      });
      return { history, turns };
    }

    let pause: AgentTurn | null = null;
    let done = false;
    const assistantNoteParts: string[] = [];

    for (const a of actions) {
      if (a.type === "text") {
        emit({ kind: "text", text: a.content });
        assistantNoteParts.push(a.content);
        continue;
      }
      if (a.type === "ask_user_question") {
        const id = `ask_${loop}_${Math.random().toString(36).slice(2, 8)}`;
        emit({
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
      if (isServerToolAction(a)) {
        const id = `${a.type}_${loop}_${Math.random().toString(36).slice(2, 8)}`;
        emit({ kind: "tool_call", tool_use_id: id, name: a.type, input: a });
        const output = await executeEngineTool({
          org: opts.org,
          name: a.type,
          input: a,
          source: opts.backend === "offline" ? "offline" : "local-harness",
        });
        emit({ kind: "tool_result", tool_use_id: id, name: a.type, output });
        assistantNoteParts.push(`[tool:${a.type}:${JSON.stringify(output)}]`);
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
      emit(pause);
      return { history, turns };
    }
    if (done) {
      emit({ kind: "done" });
      return { history, turns };
    }

    // No pause, no done — push a synthetic user prompt to keep the agent moving
    history.push({
      role: "user",
      content: "Continue. Emit the next action array.",
    });
  }

  emit({ kind: "done" });
  return { history, turns };
}

function isServerToolAction(action: Action): action is ServerToolAction {
  return SERVER_TOOL_ACTIONS.has(action.type);
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
