import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const organization = await db.getOrgBySlug(org);
  if (!organization) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const [departments, agents, tasks, artifacts, status] = await Promise.all([
    db.listDepartments(organization.id),
    db.listAgents(organization.id),
    db.listTasks(organization.id),
    db.listArtifacts(organization.id),
    db.listTechTreeStatus(organization.id),
  ]);
  const payload = {
    exported_at: new Date().toISOString(),
    organization,
    departments,
    agents,
    tasks,
    artifacts,
    tech_tree_status: status,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${organization.slug}-workspace.json"`,
    },
  });
}
