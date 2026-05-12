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
  const routines = await db.listRoutines(o.id);
  return NextResponse.json({ routines });
}

const Body = z.object({
  name: z.string().min(1).max(120),
  description: z.string().nullable().optional(),
  agent: z.string().min(1),
  cron: z.string().min(1),
  enabled: z.boolean().default(true),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = Body.parse(await req.json());
  const routine = await db.createRoutine({ ...body, description: body.description ?? null, organization_id: o.id });
  return NextResponse.json({ routine }, { status: 201 });
}
