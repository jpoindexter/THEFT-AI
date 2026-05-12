// LLM backends.
//   1. LLM_BACKEND=ollama (default) → local Ollama at OLLAMA_URL
//   2. LLM_BACKEND=anthropic OR ANTHROPIC_API_KEY set → official Anthropic SDK
//   3. LLM_BACKEND=claude-cli → spawn `claude -p` (OAuth session)

import Anthropic from "@anthropic-ai/sdk";
import { spawn } from "node:child_process";

export type ChatMsg = { role: "user" | "assistant"; text: string };

export async function generate(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const backend = (process.env.LLM_BACKEND ?? (process.env.ANTHROPIC_API_KEY ? "anthropic" : "ollama")).toLowerCase();

  if (backend === "ollama") return runOllama(opts);
  if (backend === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("LLM_BACKEND=anthropic but ANTHROPIC_API_KEY is unset");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const reply = await anthropic.messages.create({
      model: opts.model ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.text })),
    });
    return reply.content[0]?.type === "text" ? reply.content[0].text : "";
  }
  return runClaudeCli({ system: opts.system, messages: opts.messages });
}

async function runOllama(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const baseUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = opts.model ?? process.env.OLLAMA_MODEL ?? "qwen2.5:7b";
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

// OAuth-backed subprocess. NO --bare — that flag forces API-key auth.
export function runClaudeCli(opts: {
  system: string;
  messages: ChatMsg[];
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
