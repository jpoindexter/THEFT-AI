import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidInput } from "@/lib/api/responses";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tasks = await db.listTasks(o.id, { activeOnly: true });
  return NextResponse.json({ tasks });
}

const Body = z.object({
  description: z.string().min(1),
  agentId: z.string().uuid().nullable().optional(),
  mode: z.enum(["plan", "execute"]).default("execute"),
  departmentId: z.string().uuid().nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);
  const body = parsed.data;

  let agentId = body.agentId ?? null;
  let departmentId = body.departmentId ?? null;
  if (!agentId) {
    const agents = await db.listAgents(o.id);
    const fallback = agents[0];
    agentId = fallback?.id ?? null;
    departmentId = fallback?.department_id ?? null;
  } else {
    const agent = (await db.listAgents(o.id)).find((a) => a.id === agentId);
    departmentId = agent?.department_id ?? null;
  }

  const title = body.description.split("\n")[0].slice(0, 80);
  const task = await db.createTask({
    organization_id: o.id,
    department_id: departmentId,
    agent_id: agentId,
    parent_task_id: null,
    title,
    description: body.description,
    status: "todo",
    priority: "normal",
    mode: body.mode,
    due_at: null,
    started_at: null,
    result: null,
  });
  return NextResponse.json({ task });
}
