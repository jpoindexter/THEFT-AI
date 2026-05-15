import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const Patch = z.object({
  role: z.enum(["viewer", "editor", "admin"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = Patch.parse(await req.json());
  await db.updateMember(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.removeMember(id);
  return NextResponse.json({ ok: true });
}
