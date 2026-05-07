import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.seedTechTreeStatus(o.id);
  const nodes = await db.listTechTreeNodes();
  const status = await db.listTechTreeStatus(o.id);
  const statusMap = new Map(status.map((s) => [s.node_id, s.status]));

  return NextResponse.json({
    nodes: nodes.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      status: statusMap.get(n.id) ?? "locked",
    })),
  });
}
