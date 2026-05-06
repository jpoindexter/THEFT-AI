// One agent turn. Takes the conversation state, calls Anthropic with tools,
// executes any server-side tools, and returns the new state plus any pending
// client-pause tool (ask_user_question).

import Anthropic from "@anthropic-ai/sdk";
import { db, type Org } from "@/lib/db/store";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  COFOUNDER_TOOLS,
  type AskUserQuestionInput,
  type SetBusinessPlanInput,
  type DelegateInput,
  type SetTechTreeStatusInput,
  type WriteArtifactInput,
} from "./tools";

export type AgentTurn =
  | { kind: "user_message"; text: string }
  | { kind: "text"; text: string }
  | {
      kind: "tool_call";
      tool_use_id: string;
      name: string;
      input: unknown;
    }
  | {
      kind: "tool_result";
      tool_use_id: string;
      name: string;
      output: unknown;
    }
  | {
      kind: "tool_answer";
      tool_use_id: string;
      answer: { key?: string; label?: string; custom?: string };
    }
  | {
      kind: "pause";
      tool_use_id: string;
      tool: "ask_user_question";
      input: AskUserQuestionInput;
    }
  | { kind: "done" };

export type AgentMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: Anthropic.Messages.ContentBlock[] }
  | {
      role: "user";
      content: Anthropic.Messages.ToolResultBlockParam[];
      isToolResult: true;
    };

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_LOOPS = 8;

export async function runAgent(opts: {
  org: Org;
  systemPrompt: string;
  history: Anthropic.Messages.MessageParam[];
  userMessage?: string;
  onTurn?: (turn: AgentTurn) => void;
}): Promise<{ history: Anthropic.Messages.MessageParam[]; turns: AgentTurn[] }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // OAuth fallback: tool-use emulation through claude CLI
    const { runAgentCli } = await import("./run-cli");
    return runAgentCli({
      org: opts.org,
      systemPrompt: opts.systemPrompt,
      history: opts.history,
      userMessage: opts.userMessage,
    });
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages: Anthropic.Messages.MessageParam[] = [...opts.history];
  if (opts.userMessage) {
    messages.push({ role: "user", content: opts.userMessage });
  }

  const turns: AgentTurn[] = [];

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    const reply = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: opts.systemPrompt,
      tools: COFOUNDER_TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: reply.content });

    let pauseFor: AgentTurn | null = null;
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const block of reply.content) {
      if (block.type === "text") {
        const t: AgentTurn = { kind: "text", text: block.text };
        turns.push(t);
        opts.onTurn?.(t);
      } else if (block.type === "tool_use") {
        const t: AgentTurn = {
          kind: "tool_call",
          tool_use_id: block.id,
          name: block.name,
          input: block.input,
        };
        turns.push(t);
        opts.onTurn?.(t);

        if (block.name === "ask_user_question") {
          // pause until the user answers
          pauseFor = {
            kind: "pause",
            tool_use_id: block.id,
            tool: "ask_user_question",
            input: block.input as AskUserQuestionInput,
          };
          break;
        }

        // server-side tools: execute now, capture result
        const result = await executeTool({
          org: opts.org,
          name: block.name,
          input: block.input,
        });
        const r: AgentTurn = {
          kind: "tool_result",
          tool_use_id: block.id,
          name: block.name,
          output: result,
        };
        turns.push(r);
        opts.onTurn?.(r);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      }
    }

    if (pauseFor) {
      turns.push(pauseFor);
      opts.onTurn?.(pauseFor);
      return { history: messages, turns };
    }

    // If the model didn't call any tool this turn, it's a final response
    if (reply.stop_reason !== "tool_use") {
      const done: AgentTurn = { kind: "done" };
      turns.push(done);
      opts.onTurn?.(done);
      return { history: messages, turns };
    }

    // Feed tool results back to the model and loop
    if (toolResults.length > 0) {
      messages.push({ role: "user", content: toolResults });
    }
  }

  return { history: messages, turns };
}

async function executeTool(opts: {
  org: Org;
  name: string;
  input: unknown;
}): Promise<unknown> {
  const { org, name, input } = opts;
  switch (name) {
    case "set_business_plan": {
      const i = input as SetBusinessPlanInput;
      await db.updateOrg(org.id, { business_plan: i });
      await db.createArtifact({
        organization_id: org.id,
        department_id: null,
        task_id: null,
        name: "Business Plan",
        kind: "business_plan",
        content: JSON.stringify(i, null, 2),
        metadata: null,
        pinned: true,
      });
      return { ok: true };
    }
    case "delegate_to_department": {
      const i = input as DelegateInput;
      const dept = await db.getDepartment(org.id, i.department_slug);
      if (!dept) return { ok: false, error: "department not found" };
      const agents = await db.listAgents(org.id, dept.id);
      const task = await db.createTask({
        organization_id: org.id,
        department_id: dept.id,
        agent_id: agents[0]?.id ?? null,
        parent_task_id: null,
        title: i.title.slice(0, 80),
        description: i.description ?? null,
        status: "todo",
        priority: "normal",
        mode: "execute",
        result: null,
      });
      return { ok: true, task_id: task.id };
    }
    case "set_tech_tree_node_status": {
      // We use an ephemeral status table; for v0 just acknowledge.
      const i = input as SetTechTreeStatusInput;
      return { ok: true, node_slug: i.node_slug, status: i.status };
    }
    case "write_artifact": {
      const i = input as WriteArtifactInput;
      const dept = i.department_slug
        ? await db.getDepartment(org.id, i.department_slug)
        : null;
      const a = await db.createArtifact({
        organization_id: org.id,
        department_id: dept?.id ?? null,
        task_id: null,
        name: i.name,
        kind: i.kind as "markdown" | "json" | "code" | "business_plan" | "brand_kit" | "other",
        content: i.content,
        metadata: null,
        pinned: false,
      });
      return { ok: true, artifact_id: a.id };
    }
    case "complete_onboarding": {
      return { ok: true };
    }
    default:
      return { ok: false, error: `unknown tool: ${name}` };
  }
}

// Cofounder system prompt — read available skills from /skills/ and embed
// short descriptions so the agent knows what's available.
let cachedSystemPrompt: string | null = null;
export async function buildCofounderSystemPrompt(orgName: string): Promise<string> {
  if (cachedSystemPrompt) return cachedSystemPrompt.replace(/__ORG_NAME__/g, orgName);
  const skillsDir = path.join(process.cwd(), "..", "skills");
  let skillSummary = "";
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const lines: string[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      try {
        const raw = await fs.readFile(
          path.join(skillsDir, e.name, "SKILL.md"),
          "utf8",
        );
        const m = raw.match(/^---\n([\s\S]+?)\n---/);
        if (!m) continue;
        const desc = m[1].match(/description:\s*"?([^\n"]+)/)?.[1] ?? "";
        lines.push(`- ${e.name}: ${desc.slice(0, 160)}`);
      } catch {
        /* skip */
      }
    }
    skillSummary = lines.join("\n");
  } catch {
    /* skills folder optional */
  }

  cachedSystemPrompt = [
    'You are Cofounder, an AI cofounder helping the founder run "__ORG_NAME__".',
    "You operate by reasoning out loud, asking the user pointed multiple-choice questions, and producing concrete deliverables — never vague advice.",
    "",
    "## Your loop",
    "1. Read the conversation context.",
    "2. Decide if you need a decision from the user. If yes, call ask_user_question with 3-5 well-named options and ONE recommended.",
    "3. If you have enough to proceed, call set_business_plan with structured fields, then complete_onboarding.",
    "4. After onboarding, you can delegate_to_department for ongoing work.",
    "",
    "## Voice",
    "- Address the founder by name when known. Be warm but tight. No hand-waving.",
    "- Keep prose to <=4 short paragraphs at a time. Bold structural labels only when listing fields.",
    "- Treat each tool call as a real action — no dry-run, no fake placeholders.",
    "",
    "## Available skills (read full SKILL.md when relevant)",
    skillSummary || "(no skills found in /skills/)",
  ].join("\n");
  return cachedSystemPrompt.replace(/__ORG_NAME__/g, orgName);
}
