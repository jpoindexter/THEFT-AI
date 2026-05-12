import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import RoadmapView from "@/components/roadmap-view";

export default async function OrgHome({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();

  await db.seedTechTreeStatus(organization.id);

  const [rawNodes, statuses] = await Promise.all([
    db.listTechTreeNodes(),
    db.listTechTreeStatus(organization.id),
  ]);

  const statusMap = new Map(statuses.map((s) => [s.node_id, s.status]));

  const nodes = rawNodes.map((n) => ({
    id: n.id,
    slug: n.slug,
    stage: n.stage,
    title: n.title,
    description: n.description,
    how_to_move_forward: n.how_to_move_forward,
    dependencies: n.dependencies,
    department: n.department,
    status: (statusMap.get(n.id) ?? "locked") as
      | "locked"
      | "available"
      | "in_progress"
      | "complete",
    agent_can_do_this: n.agent_can_do_this,
  }));

  return (
    <RoadmapView
      nodes={nodes}
      orgName={organization.name}
      orgSlug={orgSlug}
    />
  );
}
