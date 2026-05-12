import { z } from "zod";
import { db } from "@/lib/db/store";
import {
  loadAgentState,
  saveAgentState,
  type PauseState,
} from "@/lib/db/agent-state";
import { runAgent } from "@/lib/agent/run";
import { composeAgentPromptForDept } from "@/lib/agent/compose-prompt";
import { err, invalidInput, notFound, ok } from "@/lib/api/responses";
import type Anthropic from "@anthropic-ai/sdk";

async function buildOperatorPrompt(orgId: string, orgName: string, businessPlan: unknown): Promise<{ system: string; model: string } | null> {
  const planJson = businessPlan
    ? `\nCurrent business plan:\n${JSON.stringify(businessPlan, null, 2)}`
    : `\nNo business plan yet. Help the founder shape one through guided questions.`;

  const directive = `Speak as "Operator" — the meta-agent that helps the founder run "${orgName}" with a team of AI agents.

You operate by reasoning out loud, asking the user pointed multiple-choice questions, and producing concrete deliverables — never vague advice.

## Your loop
1. Read the conversation context.
2. Decide if you need a decision from the user. If yes, call ask_user_question with 3-5 well-named options and ONE recommended.
3. If you have enough to proceed, call set_business_plan with structured fields, then complete_onboarding.
4. After onboarding, you can delegate_to_department for ongoing work.

## Voice
- Address the founder by name when known. Be warm but tight. No hand-waving.
- Keep prose to <=4 short paragraphs at a time. Bold structural labels only when listing fields.
- Treat each tool call as a real action — no dry-run, no fake placeholders.
${planJson}`;

  const composed = await composeAgentPromptForDept(orgId, "sales", directive);
  if (!composed) return null;
  return { system: composed.system, model: composed.agent.model };
}

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
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);
  const body = parsed.data;

  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");

  const composed = await buildOperatorPrompt(org.id, org.name, org.business_plan);
  if (!composed) return err(500, "agent_unavailable", "Operator agent not configured");
  const { system: sys, model } = composed;

  const state = await loadAgentState(org.id);

  if (body.kind === "user_message") {
    state.paused = null;
    const r = await runAgent({
      org,
      systemPrompt: sys,
      history: state.history,
      userMessage: body.text,
      model,
    });
    state.history = r.history;
    state.turns.push({ kind: "user_message", text: body.text });
    state.turns.push(...r.turns);
    state.paused = pauseFromTurns(r.turns);
    await saveAgentState(state);
    return ok({ turns: r.turns, paused: state.paused });
  }

  if (body.kind === "tool_result") {
    if (!state.paused || state.paused.tool_use_id !== body.tool_use_id) {
      return err(400, "no_paused_tool", "no matching paused tool");
    }
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
    const r = await runAgent({ org, systemPrompt: sys, history: updated, model });
    state.history = r.history;
    state.turns.push({
      kind: "tool_answer",
      tool_use_id: body.tool_use_id,
      answer: body.answer,
    });
    state.turns.push(...r.turns);
    state.paused = pauseFromTurns(r.turns);
    await saveAgentState(state);
    return ok({ turns: r.turns, paused: state.paused });
  }

  // kick
  const r = await runAgent({ org, systemPrompt: sys, history: state.history, model });
  state.history = r.history;
  state.turns.push(...r.turns);
  state.paused = pauseFromTurns(r.turns);
  await saveAgentState(state);
  return ok({ turns: r.turns, paused: state.paused });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");
  const state = await loadAgentState(org.id);
  return ok({ turns: state.turns, paused: state.paused });
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
