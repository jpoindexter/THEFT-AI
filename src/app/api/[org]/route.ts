import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  goal: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = PatchBody.parse(await req.json());
  await db.updateOrg(o.id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (typeof db.deleteOrg !== "function") {
    return NextResponse.json(
      { error: "delete not implemented" },
      { status: 500 },
    );
  }
  await db.deleteOrg(o.id);
  return NextResponse.json({ ok: true });
}
