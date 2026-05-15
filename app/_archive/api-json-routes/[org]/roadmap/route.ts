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
      position: n.position,
      status: statusMap.get(n.id) ?? "locked",
      stage: n.stage ?? null,
      department: n.department ?? null,
      description: n.description ?? null,
      what_becomes_true: n.what_becomes_true ?? null,
      how_to_move_forward: n.how_to_move_forward ?? null,
      checklist_item: n.checklist_item ?? null,
      agent_can_do_this: n.agent_can_do_this,
      external_cta: n.external_cta ?? null,
      dependencies: n.dependencies,
    })),
  });
}
