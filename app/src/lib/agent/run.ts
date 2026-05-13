// One agent turn. Takes the conversation state, calls Anthropic with tools,
// executes any server-side tools, and returns the new state plus any pending
// client-pause tool (ask_user_question).

import Anthropic from "@anthropic-ai/sdk";
import { db, type Org } from "@/lib/db/store";
import { executeEngineTool, listEngineTools } from "@/lib/engine/tool-dispatcher";
import { type AskUserQuestionInput } from "./tools";

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
  backend?: string | null;
  baseUrl?: string | null;
  onTurn?: (turn: AgentTurn) => void;
}): Promise<{ history: Anthropic.Messages.MessageParam[]; turns: AgentTurn[] }> {
  const requestedBackend = opts.backend ?? process.env.LLM_BACKEND ?? null;
  const shouldUseAnthropicToolApi =
    (!requestedBackend || requestedBackend === "anthropic") &&
    Boolean(process.env.ANTHROPIC_API_KEY);

  if (!shouldUseAnthropicToolApi) {
    // Local/provider harness fallback: tool-use emulation over Codex, OpenCode,
    // Claude CLI, local OpenAI-compatible servers, or deterministic offline mode.
    const { runAgentCli } = await import("./run-cli");
    return runAgentCli({
      org: opts.org,
      systemPrompt: opts.systemPrompt,
      history: opts.history,
      userMessage: opts.userMessage,
      model: opts.model,
      backend: opts.backend,
      baseUrl: opts.baseUrl,
      onTurn: opts.onTurn,
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
      tools: listEngineTools(),
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
        const result = await executeEngineTool({
          org: opts.org,
          name: block.name,
          input: block.input,
          source: "anthropic",
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
      agent_name: "Operator",
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
