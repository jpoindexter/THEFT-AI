import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const Body = z.object({
  toAgentId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org, task: taskId } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });

  const tasks = await db.listTasks(o.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = Body.parse(await req.json());
  const agents = await db.listAgents(o.id);
  const target = agents.find((a) => a.id === body.toAgentId);
  if (!target)
    return NextResponse.json({ error: "agent not found" }, { status: 404 });

  await db.updateTask(taskId, {
    agent_id: target.id,
    department_id: target.department_id,
    status: "todo",
  });

  await db.appendMessage({
    organization_id: o.id,
    role: "system",
    text: `Task "${task.title}" handed off to ${target.name} — ${body.reason}`,
  });

  return NextResponse.json({ ok: true });
}
