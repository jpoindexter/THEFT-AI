import type Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "node:fs";
import path from "node:path";
import { burstSkillCache } from "@/lib/agent/compose-prompt";
import {
  OPERATOR_TOOLS,
  type DelegateInput,
  type ListFilesInput,
  type ReadFileInput,
  type SetBusinessPlanInput,
  type SetTechTreeStatusInput,
  type WebFetchInput,
  type WebSearchInput,
  type WriteArtifactInput,
  type WriteSkillInput,
} from "@/lib/agent/tools";
import { db, type Org } from "@/lib/db/store";

const SKILLS_ROOT = path.join(process.cwd(), "..", "skills");

export type EngineRunContext = {
  org: Org;
  agentId?: string | null;
  taskId?: string | null;
  departmentSlug?: string | null;
  source?: "anthropic" | "local-harness" | "offline" | string;
};

export type EngineToolHandler = (
  input: unknown,
  context: EngineRunContext,
) => Promise<unknown>;

export type EngineToolRegistration = {
  descriptor: Anthropic.Tool;
  handler: EngineToolHandler;
};

export class EngineToolDispatcher {
  private readonly tools = new Map<string, EngineToolRegistration>();

  register(registration: EngineToolRegistration): void {
    this.tools.set(registration.descriptor.name, registration);
  }

  listToolsForAgent(): Anthropic.Tool[] {
    return [...this.tools.values()].map((t) => t.descriptor);
  }

  async execute(name: string, input: unknown, context: EngineRunContext): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    return tool.handler(input, context);
  }
}

function asToolInput<T extends object>(input: unknown): T {
  if (!input || typeof input !== "object") return {} as T;
  const { type: _type, ...rest } = input as Record<string, unknown>;
  return rest as T;
}

function createDefaultDispatcher(): EngineToolDispatcher {
  const dispatcher = new EngineToolDispatcher();
  const descriptorByName = new Map(OPERATOR_TOOLS.map((tool) => [tool.name, tool]));

  const register = (name: string, handler: EngineToolHandler) => {
    const descriptor = descriptorByName.get(name);
    if (!descriptor) throw new Error(`Missing descriptor for engine tool ${name}`);
    dispatcher.register({ descriptor, handler });
  };

  register("set_business_plan", async (input, { org }) => {
    const i = asToolInput<SetBusinessPlanInput>(input);
    await db.updateOrg(org.id, { business_plan: i });
    await db.completeOnboardingRoadmap(org.id);
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
  });

  register("delegate_to_department", async (input, { org }) => {
    const i = asToolInput<DelegateInput>(input);
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
  });

  register("set_tech_tree_node_status", async (input, { org }) => {
    const i = asToolInput<SetTechTreeStatusInput>(input);
    await db.upsertTechTreeNodeStatus(org.id, i.node_slug, i.status);
    return { ok: true, node_slug: i.node_slug, status: i.status };
  });

  register("write_artifact", async (input, { org, taskId }) => {
    const i = asToolInput<WriteArtifactInput>(input);
    const dept = i.department_slug
      ? await db.getDepartment(org.id, i.department_slug)
      : null;
    const artifact = await db.createArtifact({
      organization_id: org.id,
      department_id: dept?.id ?? null,
      task_id: taskId ?? null,
      name: i.name,
      kind: i.kind as "markdown" | "json" | "code" | "business_plan" | "brand_kit" | "other",
      content: i.content,
      metadata: null,
      pinned: false,
    });
    return { ok: true, artifact_id: artifact.id };
  });

  register("complete_onboarding", async (_input, { org }) => {
    await db.completeOnboardingRoadmap(org.id);
    return { ok: true };
  });

  register("web_search", async (input) => {
    const i = asToolInput<WebSearchInput>(input);
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "TAVILY_API_KEY not set. Add it to .env.local to enable web search." };
    }
    const numResults = Math.min(i.max_results ?? 3, 5);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query: i.query, num_results: numResults, search_depth: "basic" }),
    });
    if (!res.ok) return { ok: false, error: `Tavily error ${res.status}` };
    const data = await res.json() as { results?: { title: string; url: string; content: string }[] };
    return { ok: true, results: (data.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.content })) };
  });

  register("web_fetch", async (input) => {
    const i = asToolInput<WebFetchInput>(input);
    const maxChars = i.max_chars ?? 8000;
    const res = await fetch(i.url, {
      headers: { "User-Agent": "TheftAI/1.0 (agent; +https://theft.studio)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status} for ${i.url}` };
    let text = await res.text();
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return { ok: true, url: i.url, content: text.slice(0, maxChars) };
  });

  register("read_file", async (input, { org }) => {
    const i = asToolInput<ReadFileInput>(input);
    const artifacts = await db.listArtifacts(org.id);
    const lower = i.name.toLowerCase();
    const match = artifacts.find(
      (a) => a.name.toLowerCase() === lower || a.name.toLowerCase().includes(lower),
    );
    if (!match) return { ok: false, error: `No artifact matching "${i.name}"` };
    return { ok: true, name: match.name, kind: match.kind, content: match.content };
  });

  register("list_files", async (input, { org }) => {
    const i = asToolInput<ListFilesInput>(input);
    const dept = i.department_slug ? await db.getDepartment(org.id, i.department_slug) : null;
    const artifacts = await db.listArtifacts(org.id, dept?.id);
    return {
      ok: true,
      files: artifacts.map((a) => ({ name: a.name, kind: a.kind, created_at: a.created_at })),
    };
  });

  register("write_skill", async (input, { org }) => {
    const i = asToolInput<WriteSkillInput>(input);
    const safeSlug = org.slug.replace(/[^a-z0-9-]/g, "-");
    const safeName = i.name.replace(/[^a-z0-9-]/g, "-");
    const skillId = `${safeSlug}/${safeName}`;
    const skillDir = path.join(SKILLS_ROOT, safeSlug, safeName);
    await fs.mkdir(skillDir, { recursive: true });
    const content = `---\ntitle: ${i.title}\norgSlug: ${safeSlug}\n---\n\n${i.body}\n`;
    await fs.writeFile(path.join(skillDir, "SKILL.md"), content, "utf8");
    burstSkillCache(skillId);
    return { ok: true, skillId };
  });

  return dispatcher;
}

const defaultDispatcher = createDefaultDispatcher();

export function listEngineTools(): Anthropic.Tool[] {
  return defaultDispatcher.listToolsForAgent();
}

export async function executeEngineTool(opts: {
  org: Org;
  name: string;
  input: unknown;
  agentId?: string | null;
  taskId?: string | null;
  departmentSlug?: string | null;
  source?: EngineRunContext["source"];
}): Promise<unknown> {
  return defaultDispatcher.execute(opts.name, opts.input, {
    org: opts.org,
    agentId: opts.agentId,
    taskId: opts.taskId,
    departmentSlug: opts.departmentSlug,
    source: opts.source,
  });
}
