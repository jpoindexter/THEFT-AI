import { NextResponse } from "next/server";
import { db, type Org, type Task } from "@/lib/db/store";
import { loadTaskState, saveTaskState } from "@/lib/db/task-state";
import { runAgent, type AgentTurn } from "@/lib/agent/run";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org: orgSlug, task: taskId } = await params;
  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tasks = await db.listTasks(org.id);
  if (!tasks.find((t) => t.id === taskId))
    return NextResponse.json({ error: "not found" }, { status: 404 });
  const state = await loadTaskState(taskId);
  return NextResponse.json({ turns: state.turns, paused: state.paused });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org: orgSlug, task: taskId } = await params;
  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tasks = await db.listTasks(org.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const now = new Date().toISOString();
  await db.updateTask(taskId, { status: "in_progress", started_at: now });

  const state = await loadTaskState(taskId);
  const systemPrompt = buildTaskSystemPrompt(org, task);

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
        await saveTaskState(state);
      } catch (err) {
        const errTurn: AgentTurn = {
          kind: "text",
          text: `Agent error: ${String(err)}`,
        };
        emit(errTurn);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}

function buildTaskSystemPrompt(org: Org, task: Task): string {
  const plan = org.business_plan
    ? JSON.stringify(org.business_plan, null, 2)
    : "(not yet defined)";
  return [
    `You are a specialist agent working on a task for ${org.name}.`,
    "",
    "## Task",
    `Title: ${task.title}`,
    task.description ? `Description: ${task.description}` : "",
    "",
    "## Business context",
    plan,
    "",
    "## Instructions",
    "1. Reason through what needs to be done for this task.",
    "2. Use write_artifact to save deliverables (markdown, json, code) to the Library.",
    "3. Use ask_user_question if you need a decision from the founder.",
    "4. When done, summarize what was accomplished in your final message.",
    "Keep responses concise and action-oriented.",
  ]
    .filter(Boolean)
    .join("\n");
}
