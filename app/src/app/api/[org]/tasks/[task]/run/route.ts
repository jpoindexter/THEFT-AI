import { db } from "@/lib/db/store";
import { loadTaskState, saveTaskState } from "@/lib/db/task-state";
import { runAgent, type AgentTurn } from "@/lib/agent/run";
import { composeAgentPromptForDept, composeAgentPrompt } from "@/lib/agent/compose-prompt";
import { err, invalidInput, ok, notFound } from "@/lib/api/responses";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const Body = z.object({
  kind: z.literal("tool_result"),
  tool_use_id: z.string(),
  answer: z.object({
    key: z.string().optional(),
    label: z.string().optional(),
    custom: z.string().optional(),
  }),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org: orgSlug, task: taskId } = await params;
  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");
  const tasks = await db.listTasks(org.id);
  if (!tasks.find((t) => t.id === taskId)) return notFound("task");
  const state = await loadTaskState(taskId);
  return ok({ turns: state.turns, paused: state.paused });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org: orgSlug, task: taskId } = await params;
  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");
  const tasks = await db.listTasks(org.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return notFound("task");

  const state = await loadTaskState(taskId);
  const rawBody = await req.text();
  let parsedBody: ReturnType<typeof Body.safeParse> | null = null;
  if (rawBody.trim().length > 0) {
    try {
      parsedBody = Body.safeParse(JSON.parse(rawBody));
    } catch {
      return err(400, "invalid_json", "request body is not valid JSON");
    }
  }

  if (parsedBody && !parsedBody.success) return invalidInput(parsedBody.error);

  if (parsedBody?.success) {
    const body = parsedBody.data;
    if (!state.paused || state.paused.tool_use_id !== body.tool_use_id) {
      return err(400, "no_paused_tool", "no matching paused task question");
    }

    const toolResult: Anthropic.Messages.ToolResultBlockParam = {
      type: "tool_result",
      tool_use_id: body.tool_use_id,
      content: JSON.stringify(body.answer),
    };
    state.history = [
      ...state.history,
      { role: "user", content: [toolResult] },
    ];
    state.turns.push({
      kind: "tool_answer",
      tool_use_id: body.tool_use_id,
      answer: body.answer,
    });
    state.paused = null;
  } else if (state.paused) {
    return err(409, "task_waiting_for_user", "answer the pending task question before running again");
  }

  const now = new Date().toISOString();
  await db.updateTask(taskId, { status: "in_progress", started_at: task.started_at ?? now });

  // Compose system prompt through the dept agent that owns this task.
  // Falls back to the task-agent record if no dept resolved.
  const planJson = org.business_plan
    ? JSON.stringify(org.business_plan, null, 2)
    : "(not yet defined)";
  const taskDirective = `## Task
Title: ${task.title}
${task.description ? `Description: ${task.description}` : ""}

## Business context
${planJson}

## Instructions
1. Reason through what needs to be done for this task.
2. Use write_artifact to save deliverables (markdown, json, code) to the Library.
3. Use ask_user_question if you need a decision from the founder.
4. When done, summarize what was accomplished in your final message.
Keep responses concise and action-oriented.`;

  let systemPrompt: string;
  let composed = task.department_id
    ? await composeAgentPromptForDept(
        org.id,
        (await db.listDepartments(org.id)).find((d) => d.id === task.department_id)?.slug ?? "",
        taskDirective,
      )
    : null;

  if (!composed && task.agent_id) {
    const agents = await db.listAgents(org.id);
    const agent = agents.find((a) => a.id === task.agent_id);
    if (agent) composed = await composeAgentPrompt(agent, taskDirective);
  }

  if (composed) {
    systemPrompt = composed.system;
  } else {
    // No dept or agent — emit a minimal fallback so the task still runs.
    systemPrompt = `You are a specialist agent working on a task for ${org.name}.\n\n${taskDirective}`;
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (turn: AgentTurn) => {
        controller.enqueue(enc.encode(JSON.stringify(turn) + "\n"));
      };
      try {
        const result = await runAgent({
          org,
          systemPrompt,
          history: state.history,
          userMessage: state.history.length === 0
            ? (task.description ?? task.title)
            : undefined,
          model: composed?.agent.model,
          backend: org.llm_backend,
          baseUrl: org.llm_base_url,
          onTurn: emit,
        });
        state.history = result.history;
        state.turns.push(...result.turns);
        const isDone = result.turns.some((t) => t.kind === "done");
        if (isDone) await db.updateTask(taskId, { status: "done" });
        const paused = result.turns.findLast?.((t) => t.kind === "pause") ?? null;
        state.paused = paused
          ? {
              tool_use_id: (paused as Extract<AgentTurn, { kind: "pause" }>)
                .tool_use_id,
              tool: "ask_user_question",
              input: (paused as Extract<AgentTurn, { kind: "pause" }>).input,
            }
          : null;
        if (state.paused) await db.updateTask(taskId, { status: "blocked" });
        await saveTaskState(state);
      } catch (err) {
        const errTurn: AgentTurn = {
          kind: "text",
          text: `Agent error: ${String(err)}`,
        };
        emit(errTurn);
        await db.updateTask(taskId, { status: "blocked" });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
