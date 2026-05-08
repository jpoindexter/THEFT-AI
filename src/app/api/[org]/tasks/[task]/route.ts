import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org, task: taskId } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [tasks, agents, departments] = await Promise.all([
    db.listTasks(o.id),
    db.listAgents(o.id),
    db.listDepartments(o.id),
  ]);

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const agent = task.agent_id ? agents.find((a) => a.id === task.agent_id) : null;
  const dept = task.department_id ? departments.find((d) => d.id === task.department_id) : null;

  return NextResponse.json({
    task: { id: task.id, title: task.title, status: task.status },
    agentName: agent?.name ?? null,
    deptName: dept?.name ?? null,
    deptSlug: dept?.slug ?? null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org, task: taskId } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });

  const VALID_STATUSES = ["backlog", "todo", "in_progress", "in_review", "blocked", "done", "cancelled"] as const;
  type TaskStatus = typeof VALID_STATUSES[number];

  const body = await req.json() as { status?: string };
  if (!body.status || !(VALID_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  await db.updateTask(taskId, { status: body.status as TaskStatus });
  return NextResponse.json({ ok: true });
}
