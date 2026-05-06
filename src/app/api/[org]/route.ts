import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

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
