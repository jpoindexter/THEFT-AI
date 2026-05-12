import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const agents = await db.listAgents(o.id);
  return NextResponse.json({ agents });
}

const Body = z.object({
  name: z.string().min(1).max(80),
  role: z.string().min(1).max(80),
  department: z.string(),
  model: z.enum(["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"]).default("claude-sonnet-4-6"),
  instructions: z.string().nullable().optional(),
  attached_skills: z.array(z.string()).default([]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = Body.parse(await req.json());
  const dept = await db.getDepartment(o.id, body.department);
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [agent] = await db.insertAgents([{
    organization_id: o.id,
    department_id: dept?.id ?? null,
    slug,
    name: body.name,
    role: body.role,
    title: null,
    capabilities: null,
    status: "idle",
    attached_skills: body.attached_skills,
    instructions: body.instructions ?? null,
    model: body.model,
  }]);
  return NextResponse.json({ agent }, { status: 201 });
}
