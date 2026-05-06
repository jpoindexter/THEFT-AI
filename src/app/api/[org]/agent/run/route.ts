import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import {
  loadAgentState,
  saveAgentState,
  type PauseState,
} from "@/lib/db/agent-state";
import { runAgent, buildCofounderSystemPrompt } from "@/lib/agent/run";
import type Anthropic from "@anthropic-ai/sdk";

const Body = z.union([
  z.object({ kind: z.literal("user_message"), text: z.string().min(1) }),
  z.object({
    kind: z.literal("tool_result"),
    tool_use_id: z.string(),
    answer: z.object({
      key: z.string().optional(),
      label: z.string().optional(),
      custom: z.string().optional(),
    }),
  }),
  z.object({ kind: z.literal("kick") }), // empty kick to start the agent
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const body = Body.parse(await req.json());

  const org = await db.getOrgBySlug(orgSlug);
  if (!org)
    return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const state = await loadAgentState(org.id);

  if (body.kind === "user_message") {
    const sys = await buildCofounderSystemPrompt(org.name);
    state.paused = null;
    const r = await runAgent({
      org,
      systemPrompt: sys,
      history: state.history,
      userMessage: body.text,
    });
    state.history = r.history;
    state.turns.push({ kind: "user_message", text: body.text });
    state.turns.push(...r.turns);
    state.paused = pauseFromTurns(r.turns);
    await saveAgentState(state);
    return NextResponse.json({ turns: r.turns, paused: state.paused });
  }

  if (body.kind === "tool_result") {
    if (!state.paused || state.paused.tool_use_id !== body.tool_use_id) {
      return NextResponse.json(
        { error: "no matching paused tool" },
        { status: 400 },
      );
    }
    // Push the tool result back to the model.
    const toolResult: Anthropic.Messages.ToolResultBlockParam = {
      type: "tool_result",
      tool_use_id: body.tool_use_id,
      content: JSON.stringify(body.answer),
    };
    const updated: Anthropic.Messages.MessageParam[] = [
      ...state.history,
      { role: "user", content: [toolResult] },
    ];
    state.paused = null;
    const sys = await buildCofounderSystemPrompt(org.name);
    const r = await runAgent({ org, systemPrompt: sys, history: updated });
    state.history = r.history;
    state.turns.push({
      kind: "tool_answer",
      tool_use_id: body.tool_use_id,
      answer: body.answer,
    });
    state.turns.push(...r.turns);
    state.paused = pauseFromTurns(r.turns);
    await saveAgentState(state);
    return NextResponse.json({ turns: r.turns, paused: state.paused });
  }

  // kick
  const sys = await buildCofounderSystemPrompt(org.name);
  const r = await runAgent({ org, systemPrompt: sys, history: state.history });
  state.history = r.history;
  state.turns.push(...r.turns);
  state.paused = pauseFromTurns(r.turns);
  await saveAgentState(state);
  return NextResponse.json({ turns: r.turns, paused: state.paused });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const org = await db.getOrgBySlug(orgSlug);
  if (!org)
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  const state = await loadAgentState(org.id);
  return NextResponse.json({
    turns: state.turns,
    paused: state.paused,
  });
}

function pauseFromTurns(
  turns: Awaited<ReturnType<typeof runAgent>>["turns"],
): PauseState | null {
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i];
    if (t.kind === "pause") {
      return {
        tool_use_id: t.tool_use_id,
        tool: t.tool,
        input: t.input,
      };
    }
  }
  return null;
}
