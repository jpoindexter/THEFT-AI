import { z } from "zod";
import { db } from "@/lib/db/store";
import { invalidInput, notFound, ok } from "@/lib/api/responses";

const PatchBody = z.object({
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "blocked", "done", "cancelled"]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string; task: string }> },
) {
  const { org, task: taskId } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return notFound("organization");

  const [tasks, agents, departments] = await Promise.all([
    db.listTasks(o.id),
    db.listAgents(o.id),
    db.listDepartments(o.id),
  ]);

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return notFound("task");

  const agent = task.agent_id ? agents.find((a) => a.id === task.agent_id) : null;
  const dept = task.department_id ? departments.find((d) => d.id === task.department_id) : null;

  return ok({
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
  if (!o) return notFound("organization");

  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);

  await db.updateTask(taskId, { status: parsed.data.status });
  return ok({ ok: true });
}
