import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const Patch = z.object({
  topic: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(8000).optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = Patch.parse(await req.json());
  const existing = (await db.listMemory(o.id)).find((m) => m.id === id);
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  const item = await db.upsertMemory({
    ...existing,
    ...patch,
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { id } = await params;
  await db.deleteMemory(id);
  return NextResponse.json({ ok: true });
}
