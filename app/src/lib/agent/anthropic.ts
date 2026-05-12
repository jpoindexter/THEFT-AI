// LLM backends.
//   1. codex-cli -> local Codex OAuth/session auth, Paperclip-style
//   2. opencode-cli -> OpenCode provider/model registry and local credentials
//   3. claude-cli -> local Claude Code OAuth/session auth
//   4. ollama/lmstudio/openai-compatible/anthropic -> direct provider calls
//   5. offline fallback -> deterministic local output so setup/onboarding works

import Anthropic from "@anthropic-ai/sdk";
import { spawn } from "node:child_process";
import { splitProviderModel } from "@/lib/agent/models";

export type ChatMsg = { role: "user" | "assistant"; text: string };

export async function generate(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
  maxTokens?: number;
  backend?: string | null;
  baseUrl?: string | null;
}): Promise<string> {
  const backend = resolveBackend(opts.backend, opts.model);

  try {
    if (backend === "ollama") return await runOllama(opts);
    if (backend === "lmstudio" || backend === "openai-compatible") return await runOpenAICompatible(opts, backend);
    if (backend === "codex-cli") return await runCodexCli(opts);
    if (backend === "opencode-cli") return await runOpenCodeCli(opts);
    if (backend === "anthropic") {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("LLM_BACKEND=anthropic but ANTHROPIC_API_KEY is unset");
      }
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const reply = await anthropic.messages.create({
        model: normalizeModelForBackend(opts.model, "anthropic") ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        max_tokens: opts.maxTokens ?? 1024,
        system: opts.system,
        messages: opts.messages.map((m) => ({ role: m.role, content: m.text })),
      });
      return reply.content[0]?.type === "text" ? reply.content[0].text : "";
    }
    if (backend === "claude-cli") return await runClaudeCli(opts);
    return runOffline(opts);
  } catch (e) {
    if (process.env.LLM_ALLOW_OFFLINE_FALLBACK === "false") throw e;
    return runOffline(opts, e instanceof Error ? e.message : String(e));
  }
}

type Backend = "anthropic" | "ollama" | "lmstudio" | "openai-compatible" | "codex-cli" | "opencode-cli" | "claude-cli" | "offline";

function resolveBackend(requested?: string | null, model?: string): Backend {
  const configured = (requested ?? process.env.LLM_BACKEND)?.toLowerCase();
  if (
    configured === "anthropic" ||
    configured === "ollama" ||
    configured === "lmstudio" ||
    configured === "openai-compatible" ||
    configured === "codex-cli" ||
    configured === "opencode-cli" ||
    configured === "claude-cli" ||
    configured === "offline"
  ) {
    return configured;
  }
  const provider = splitProviderModel(model)?.provider;
  if (provider === "ollama") return "ollama";
  if (provider === "lmstudio") return "lmstudio";
  if (provider === "openai-compatible") return "openai-compatible";
  if (provider === "opencode") return "opencode-cli";
  if (provider === "codex") return "codex-cli";
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "codex-cli";
}

function normalizeModelForBackend(model: string | undefined, backend: Backend): string | undefined {
  const parsed = splitProviderModel(model);
  if (!parsed) return undefined;
  if (!parsed.provider) return parsed.model;
  if (backend === "opencode-cli") return model;
  if (backend === "codex-cli" && parsed.provider === "codex") return parsed.model;
  if (backend === "ollama" && parsed.provider === "ollama") return parsed.model;
  if (backend === "lmstudio" && parsed.provider === "lmstudio") return parsed.model;
  if (backend === "openai-compatible" && parsed.provider === "openai-compatible") return parsed.model;
  if (backend === "anthropic" && parsed.provider === "anthropic") return parsed.model;
  if (backend === "claude-cli" && parsed.provider === "anthropic") return parsed.model;
  return model;
}

async function runOllama(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
  maxTokens?: number;
  baseUrl?: string | null;
}): Promise<string> {
  const baseUrl = opts.baseUrl ?? process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = normalizeModelForBackend(opts.model, "ollama") ?? process.env.OLLAMA_MODEL ?? "qwen2.5:7b";
  const wantsJson = /JSON|json/.test(opts.system);
  const numCtx = Number(process.env.OLLAMA_NUM_CTX ?? "16384");

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        ...opts.messages.map((m) => ({ role: m.role, content: m.text })),
      ],
      stream: false,
      ...(wantsJson ? { format: "json" } : {}),
      options: {
        num_ctx: numCtx,
        num_predict: opts.maxTokens ?? 1024,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Ollama request failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content?.trim() ?? "";
}

async function runOpenAICompatible(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
  maxTokens?: number;
  baseUrl?: string | null;
}, backend: "lmstudio" | "openai-compatible"): Promise<string> {
  const baseUrl = opts.baseUrl ??
    (backend === "lmstudio" ? process.env.LMSTUDIO_URL : process.env.OPENAI_COMPAT_BASE_URL) ??
    (backend === "lmstudio" ? "http://localhost:1234/v1" : "http://localhost:1234/v1");
  const model =
    normalizeModelForBackend(opts.model, backend) ??
    process.env.OPENAI_COMPAT_MODEL ??
    "local-model";
  const apiKey = process.env.OPENAI_COMPAT_API_KEY ?? "not-needed";

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        ...opts.messages.map((m) => ({ role: m.role, content: m.text })),
      ],
      max_tokens: opts.maxTokens ?? 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`${backend} request failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

function runOffline(opts: {
  system: string;
  messages: ChatMsg[];
}, cause?: string): string {
  if (/4-question multiple-choice survey/i.test(opts.system)) {
    return JSON.stringify(buildOfflineQuestions(extractIdea(opts.system), cause), null, 2);
  }
  if (/structured business plan JSON object/i.test(opts.system)) {
    return JSON.stringify(buildOfflineBusinessPlan(opts.system, cause), null, 2);
  }

  const lastUser = opts.messages.at(-1)?.text ?? "";
  return [
    "Offline mode is active.",
    cause ? `Backend note: ${cause}` : null,
    lastUser ? `Input received: ${lastUser.slice(0, 500)}` : null,
  ].filter(Boolean).join("\n\n");
}

function extractIdea(system: string): string {
  const match = system.match(/Founder's idea:\s*"([^"]+)"/i);
  return (match?.[1] ?? "an AI-assisted company").trim();
}

function buildOfflineQuestions(idea: string, cause?: string) {
  const shortIdea = idea.replace(/\s+/g, " ").slice(0, 160);
  return {
    analysis: cause
      ? `Offline mode generated this brief because the configured LLM backend was unavailable. The core idea is ${shortIdea}; the next step is to define the company memory, operating loop, routine cadence, and approval boundary.`
      : `The core idea is ${shortIdea}. The useful next step is to define the company memory, operating loop, routine cadence, and approval boundary before departments start work.`,
    questions: [
      {
        id: "icp",
        prompt: "What should become the first queryable company memory layer?",
        options: [
          { key: "decisions-and-feedback", label: "Decisions + feedback", description: "Capture founder decisions, team feedback, strategy calls, and durable working assumptions.", recommended: true },
          { key: "content-and-performance", label: "Content + performance", description: "Store transcripts, assets, channel metrics, hooks, and what worked." },
          { key: "customers-and-pipeline", label: "Customers + pipeline", description: "Store leads, replies, objections, sales notes, renewals, and support signals." },
          { key: "operations-and-kpis", label: "Operations + KPIs", description: "Store recurring priorities, ownership, deadlines, dashboard metrics, and blockers." },
        ],
      },
      {
        id: "offer",
        prompt: "Which closed loop should the company automate first?",
        options: [
          { key: "research-to-brief", label: "Research to brief", description: "Agents monitor sources, decide what matters, and create briefs or tasks automatically.", recommended: true },
          { key: "asset-production", label: "Asset production", description: "Agents turn source material into reviewable creative, docs, pages, or campaigns." },
          { key: "dashboard-to-action", label: "Dashboard to action", description: "Metrics trigger specific priorities, owner nudges, or follow-up work." },
          { key: "inbox-to-resolution", label: "Inbox to resolution", description: "Emails, tickets, or replies become routed tasks with drafted responses." },
        ],
      },
      {
        id: "pricing",
        prompt: "What cadence should the first scheduled agents run on?",
        options: [
          { key: "daily-monitor", label: "Daily monitor", description: "Agents scan key signals every day and surface what needs action.", recommended: true },
          { key: "weekly-review", label: "Weekly review", description: "Agents summarize performance, missed targets, and next-week priorities." },
          { key: "event-triggered", label: "Event triggered", description: "Agents run when a metric changes, a file appears, or a message arrives." },
          { key: "manual-launch", label: "Manual launch", description: "The founder starts routines by hand until the workflow is proven." },
        ],
      },
      {
        id: "differentiator",
        prompt: "Where should humans stay in the loop at the start?",
        options: [
          { key: "external-send", label: "External sends", description: "Humans approve anything emailed, posted, purchased, deployed, or sent to customers.", recommended: true },
          { key: "strategy-decisions", label: "Strategy decisions", description: "Humans approve positioning, pricing, hiring, and roadmap tradeoffs." },
          { key: "brand-voice", label: "Brand voice", description: "Humans approve first versions until the voice and anti-AI rules are learned." },
          { key: "fully-autonomous", label: "Fully autonomous", description: "Agents can complete low-risk internal loops without review." },
        ],
      },
    ],
  };
}

function buildOfflineBusinessPlan(system: string, cause?: string) {
  const idea = system.match(/Founder idea:\s*(.+)/i)?.[1]?.trim() ?? "AI agent company";
  const answers = system.match(/Brief answers:\n([\s\S]+?)\n\nOutput schema:/i)?.[1]?.trim() ?? "";
  return {
    product_or_service: idea,
    icp: "Founders and lean teams that want company work to move through a structured AI operating system instead of one-off chat threads.",
    mission: "Turn company data, decisions, routines, and department work into closed loops that agents can execute and improve.",
    key_features: [
      "Queryable company memory for decisions, transcripts, metrics, files, and working assumptions",
      "Layered agent instructions that combine company context with department-specific playbooks",
      "Scheduled routines for research, reporting, monitoring, and follow-up work",
      "Dashboard-triggered priorities that convert metrics into tasks",
      "Human approval boundaries before risky external actions",
    ],
    pricing_thesis: "Start with a monthly workspace subscription that includes offline/local mode, then add usage-based credits for high-volume agent execution.",
    go_to_market_thesis: "Lead with one self-running department workflow, prove the time saved, then expand into memory, routines, dashboards, and cross-department execution.",
    onboarding_answers: answers,
    mode: "offline",
    backend_note: cause ?? null,
  };
}

// OAuth-backed subprocess. NO --bare — that flag forces API-key auth.
export function runClaudeCli(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const transcript = opts.messages
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${m.text.trim()}`,
      )
      .join("\n\n");

    const args = [
      "-p",
      "--append-system-prompt",
      opts.system,
      "--allow-dangerously-skip-permissions",
      "--disable-slash-commands",
    ];
    const model = normalizeModelForBackend(opts.model, "claude-cli") ?? process.env.CLAUDE_MODEL;
    if (model) args.push("--model", model);

    const child = spawn("claude", args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d: Buffer) => {
      out += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      err += d.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      if (code === 0) {
        const trimmed = out.trim();
        // claude -p outputs JSON by default: {"type":"result","result":"..."}
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed?.result === "string") {
            resolve(parsed.result.trim());
            return;
          }
        } catch {
          // not a JSON wrapper — fall through to plain text
        }
        resolve(trimmed);
      } else {
        reject(
          new Error(
            `claude exited ${code}: ${err.trim() || out.trim() || "(no output)"}`,
          ),
        );
      }
    });

    child.stdin.write(transcript);
    child.stdin.end();
  });
}

function runCodexCli(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
}): Promise<string> {
  const prompt = buildCliPrompt(opts);
  const args = [
    "exec",
    "--json",
    "--skip-git-repo-check",
    "-C",
    process.cwd(),
  ];
  const model = normalizeModelForBackend(opts.model, "codex-cli") ?? process.env.CODEX_MODEL;
  if (model) args.push("-m", model);
  args.push("-");
  return runJsonlCli("codex", args, prompt, "codex");
}

function runOpenCodeCli(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
}): Promise<string> {
  const prompt = buildCliPrompt(opts);
  const args = [
    "run",
    "--format",
    "json",
    "--dir",
    process.cwd(),
    "--dangerously-skip-permissions",
  ];
  const model = normalizeModelForBackend(opts.model, "opencode-cli") ?? process.env.OPENCODE_MODEL;
  if (model) args.push("--model", model);
  args.push(prompt);
  return runJsonlCli("opencode", args, "", "opencode");
}

function buildCliPrompt(opts: { system: string; messages: ChatMsg[] }) {
  const transcript = opts.messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text.trim()}`)
    .join("\n\n");
  return `${opts.system.trim()}\n\n---\n\n${transcript}`.trim();
}

function runJsonlCli(command: string, args: string[], stdin: string, label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d: Buffer) => {
      out += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      err += d.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      const parsed = extractCliText(out);
      if (code === 0 && parsed) {
        resolve(parsed);
        return;
      }
      if (code === 0 && out.trim()) {
        resolve(out.trim());
        return;
      }
      reject(new Error(`${label} exited ${code}: ${err.trim() || out.trim() || "(no output)"}`));
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

function extractCliText(raw: string): string {
  const chunks: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const event = JSON.parse(trimmed) as Record<string, unknown>;
      const item = event.item as Record<string, unknown> | undefined;
      if (event.type === "item.completed" && item?.type === "agent_message") {
        const text = readText(item);
        if (text) chunks.push(text);
      }
      if (event.type === "message" || event.type === "assistant" || event.type === "assistant_message") {
        const text = readText(event);
        if (text) chunks.push(text);
      }
      if (typeof event.text === "string") chunks.push(event.text);
    } catch {
      // Ignore non-event logging mixed into stdout.
    }
  }
  return chunks.at(-1)?.trim() ?? "";
}

function readText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text;
  if (typeof obj.content === "string") return obj.content;
  if (typeof obj.message === "string") return obj.message;
  if (Array.isArray(obj.content)) {
    return obj.content
      .map((part) => readText(part))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}
