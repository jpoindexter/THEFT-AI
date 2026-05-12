import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const Patch = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().nullable().optional(),
  agent: z.string().optional(),
  cron: z.string().optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = Patch.parse(await req.json());
  await db.updateRoutine(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.deleteRoutine(id);
  return NextResponse.json({ ok: true });
}
