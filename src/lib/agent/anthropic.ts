// LLM backends.
//   1. ANTHROPIC_API_KEY set → official Anthropic SDK
//   2. otherwise → spawn `claude -p` and use the user's Claude OAuth session.

import Anthropic from "@anthropic-ai/sdk";
import { spawn } from "node:child_process";

export type ChatMsg = { role: "user" | "assistant"; text: string };

export async function generate(opts: {
  system: string;
  messages: ChatMsg[];
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
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
      if (code === 0) resolve(out.trim());
      else
        reject(
          new Error(
            `claude exited ${code}: ${err.trim() || out.trim() || "(no output)"}`,
          ),
        );
    });

    child.stdin.write(transcript);
    child.stdin.end();
  });
}
