import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import TechTreeBoard from "@/components/tech-tree-board";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  await db.seedTechTreeStatus(organization.id);

  const nodes = await db.listTechTreeNodes();
  const status = await db.listTechTreeStatus(organization.id);
  const statusMap = new Map(status.map((s) => [s.node_id, s.status]));

  return (
    <TechTreeBoard
      orgName={organization.name}
      nodes={nodes.map((n) => ({
        id: n.id,
        slug: n.slug,
        stage: n.stage,
        title: n.title,
        description: n.description,
        what_becomes_true: n.what_becomes_true,
        how_to_move_forward: n.how_to_move_forward,
        position: n.position,
        agent_can_do_this: n.agent_can_do_this,
        status: statusMap.get(n.id) ?? "locked",
        dependencies: n.dependencies,
      }))}
    />
  );
}
