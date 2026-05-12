// One agent turn. Takes the conversation state, calls Anthropic with tools,
// executes any server-side tools, and returns the new state plus any pending
// client-pause tool (ask_user_question).

import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "node:fs";
import path from "node:path";
import { db, type Org } from "@/lib/db/store";
import { burstSkillCache } from "@/lib/agent/compose-prompt";
import {
  COFOUNDER_TOOLS,
  type AskUserQuestionInput,
  type SetBusinessPlanInput,
  type DelegateInput,
  type SetTechTreeStatusInput,
  type WriteArtifactInput,
  type WebSearchInput,
  type WebFetchInput,
  type ReadFileInput,
  type ListFilesInput,
  type WriteSkillInput,
} from "./tools";

const SKILLS_ROOT = path.join(process.cwd(), "..", "skills");

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

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_LOOPS = 8;

export async function runAgent(opts: {
  org: Org;
  systemPrompt: string;
  history: Anthropic.Messages.MessageParam[];
  userMessage?: string;
  model?: string;
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
  const model = opts.model ?? DEFAULT_MODEL;

  const messages: Anthropic.Messages.MessageParam[] = [...opts.history];
  if (opts.userMessage) {
    messages.push({ role: "user", content: opts.userMessage });
  }

  const turns: AgentTurn[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    const reply = await client.messages.create({
      model,
      max_tokens: 2000,
      system: opts.systemPrompt,
      tools: COFOUNDER_TOOLS,
      messages,
    });

    totalInputTokens += reply.usage.input_tokens;
    totalOutputTokens += reply.usage.output_tokens;
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
      void recordUsage(opts.org.id, model, totalInputTokens, totalOutputTokens);
      return { history: messages, turns };
    }

    // Feed tool results back to the model and loop
    if (toolResults.length > 0) {
      messages.push({ role: "user", content: toolResults });
    }
  }

  void recordUsage(opts.org.id, model, totalInputTokens, totalOutputTokens);
  return { history: messages, turns };
}

const MODEL_COST: Record<string, { input: number; output: number }> = {
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 0.25, output: 1.25 },
};

async function recordUsage(orgId: string, model: string, inputTokens: number, outputTokens: number) {
  const rates = MODEL_COST[model] ?? MODEL_COST["claude-sonnet-4-6"];
  const cost = (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
  try {
    await db.recordUsage({
      organization_id: orgId,
      agent_id: null,
      agent_name: "Cofounder",
      task_id: null,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
    });
  } catch {
    // non-critical — don't fail the agent turn on a logging error
  }
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
        due_at: null,
        started_at: null,
        result: null,
      });
      return { ok: true, task_id: task.id };
    }
    case "set_tech_tree_node_status": {
      const i = input as SetTechTreeStatusInput;
      await db.upsertTechTreeNodeStatus(org.id, i.node_slug, i.status);
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
      // Mark foundational nodes complete — these are answered by the business plan
      const completedAtOnboarding = ["initial-idea", "pick-company-name"];
      for (const slug of completedAtOnboarding) {
        await db.upsertTechTreeNodeStatus(org.id, slug, "complete");
      }
      // Unlock nodes whose dependencies are now all satisfied
      const allNodes = await db.listTechTreeNodes();
      const statusRows = await db.listTechTreeStatus(org.id);
      const statusMap = new Map(statusRows.map((s) => [s.node_id, s.status]));
      // Treat newly-completed nodes as complete in the map
      const completedIds = new Set(
        allNodes.filter((n) => completedAtOnboarding.includes(n.slug)).map((n) => n.id),
      );
      for (const n of allNodes) {
        if (completedAtOnboarding.includes(n.slug)) continue;
        if ((statusMap.get(n.id) ?? "locked") !== "locked") continue;
        const allDepsDone = n.dependencies.every(
          (depId) => completedIds.has(depId) || statusMap.get(depId) === "complete",
        );
        if (allDepsDone && n.dependencies.length > 0) {
          await db.upsertTechTreeNodeStatus(org.id, n.slug, "available");
        }
      }
      return { ok: true };
    }
    case "web_search": {
      const i = input as WebSearchInput;
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return { ok: false, error: "TAVILY_API_KEY not set — add it to .env.local to enable web search." };
      }
      const numResults = Math.min(i.max_results ?? 3, 5);
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // search_depth "basic" = 1 credit; "advanced" = 2 — always basic to protect free quota
        body: JSON.stringify({ api_key: apiKey, query: i.query, num_results: numResults, search_depth: "basic" }),
      });
      if (!res.ok) return { ok: false, error: `Tavily error ${res.status}` };
      const data = await res.json() as { results?: { title: string; url: string; content: string }[] };
      return { ok: true, results: (data.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.content })) };
    }
    case "web_fetch": {
      const i = input as WebFetchInput;
      const maxChars = i.max_chars ?? 8000;
      const res = await fetch(i.url, {
        headers: { "User-Agent": "TheftAI/1.0 (agent; +https://theft.studio)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status} for ${i.url}` };
      let text = await res.text();
      // strip HTML tags
      text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                 .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                 .replace(/<[^>]+>/g, " ")
                 .replace(/\s{2,}/g, " ")
                 .trim();
      return { ok: true, url: i.url, content: text.slice(0, maxChars) };
    }
    case "read_file": {
      const i = input as ReadFileInput;
      const artifacts = await db.listArtifacts(org.id);
      const lower = i.name.toLowerCase();
      const match = artifacts.find(
        (a) => a.name.toLowerCase() === lower || a.name.toLowerCase().includes(lower),
      );
      if (!match) return { ok: false, error: `No artifact matching "${i.name}"` };
      return { ok: true, name: match.name, kind: match.kind, content: match.content };
    }
    case "list_files": {
      const i = input as ListFilesInput;
      const dept = i.department_slug ? await db.getDepartment(org.id, i.department_slug) : null;
      const artifacts = await db.listArtifacts(org.id, dept?.id);
      return {
        ok: true,
        files: artifacts.map((a) => ({ name: a.name, kind: a.kind, created_at: a.created_at })),
      };
    }
    case "write_skill": {
      const i = input as WriteSkillInput;
      const safeSlug = org.slug.replace(/[^a-z0-9-]/g, "-");
      const safeName = i.name.replace(/[^a-z0-9-]/g, "-");
      const skillId = `${safeSlug}/${safeName}`;
      const skillDir = path.join(SKILLS_ROOT, safeSlug, safeName);
      await fs.mkdir(skillDir, { recursive: true });
      const content = `---\ntitle: ${i.title}\norgSlug: ${safeSlug}\n---\n\n${i.body}\n`;
      await fs.writeFile(path.join(skillDir, "SKILL.md"), content, "utf8");
      burstSkillCache(skillId);
      return { ok: true, skillId };
    }
    default:
      return { ok: false, error: `unknown tool: ${name}` };
  }
}

