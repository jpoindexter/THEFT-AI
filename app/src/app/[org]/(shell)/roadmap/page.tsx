import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import RoadmapGraph from "@/components/roadmap-graph";
import type { RoadmapNode } from "@/components/how-to-build-detail";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();

  await db.seedTechTreeStatus(organization.id);
  const rawNodes = await db.listTechTreeNodes();
  const statusRows = await db.listTechTreeStatus(organization.id);
  const statusMap = new Map(statusRows.map((s) => [s.node_id, s.status]));

  const nodes: RoadmapNode[] = rawNodes.map((n) => ({
    id: n.id,
    slug: n.slug,
    stage: n.stage,
    title: n.title,
    position: n.position,
    description: n.description,
    what_becomes_true: n.what_becomes_true,
    how_to_move_forward: n.how_to_move_forward,
    checklist_item: n.checklist_item,
    agent_can_do_this: n.agent_can_do_this,
    external_cta: n.external_cta,
    dependencies: n.dependencies,
    status: (statusMap.get(n.id) ?? "locked") as RoadmapNode["status"],
  }));

  return (
    <RoadmapGraph
      orgName={organization.name}
      orgSlug={orgSlug}
      nodes={nodes}
    />
  );
}
