import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import TaskContextBar from "@/components/task/task-context-bar";
import { PreviewScene } from "@/components/org-chart-preview";

const VALID_SCENES = new Set([
  "engineering","design","marketing","sales","operations","finance","legal","support",
]);

export default async function AgentPage({
  params,
}: {
  params: Promise<{ org: string; department: string; agent: string }>;
}) {
  const { org: orgSlug, department: deptSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const department = await db.getDepartment(organization.id, deptSlug);
  if (!department) notFound();

  const agents = await db.listAgents(organization.id);
  const deptAgent = agents.find((a) => a.department_id === department.id) ?? null;
  const agentName =
    deptAgent?.name ??
    `${deptSlug.charAt(0).toUpperCase()}${deptSlug.slice(1)} Agent`;

  const scene = VALID_SCENES.has(deptSlug)
    ? (deptSlug as Parameters<typeof PreviewScene>[0]["scene"])
    : "engineering";

  return (
    <>
      <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
        <TaskContextBar
          organization={{ id: organization.id, slug: organization.slug }}
          agentName={agentName}
          deptSlug={deptSlug}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative rounded-2xl overflow-hidden w-72 aspect-[4/3] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] bg-canvas">
          <PreviewScene scene={scene} />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-center bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-lg font-semibold tracking-tight drop-shadow">
              No tasks yet
            </p>
            <p className="text-white/70 text-xs mt-1 drop-shadow">
              {agentName} is ready for new tasks
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
