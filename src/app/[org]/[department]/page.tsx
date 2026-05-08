import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import DepartmentHero from "@/components/department-hero";
import TaskContextBar from "@/components/task/task-context-bar";
import { PreviewScene } from "@/components/org-chart-preview";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ org: string; department: string }>;
}) {
  const { org: orgSlug, department: deptSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const department = await db.getDepartment(organization.id, deptSlug);
  if (!department) notFound();

  const [tasks, agents] = await Promise.all([
    db.listTasks(organization.id, { departmentId: department.id, activeOnly: true }),
    db.listAgents(organization.id),
  ]);

  const deptAgent = agents.find((a) => a.department_id === department.id) ?? null;
  const hasActiveTasks = tasks.length > 0;

  return (
    <>
      {/* Floating context bar */}
      <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
        <TaskContextBar
          organization={{ id: organization.id, slug: organization.slug }}
          agentName={deptAgent?.name ?? null}
          deptSlug={department.slug}
        />
      </div>

      {hasActiveTasks ? (
        <DepartmentHero
          orgName={organization.name}
          department={{ slug: department.slug, name: department.name }}
          hasActiveTasks
        />
      ) : (
        <DeptEmptyCanvas deptSlug={department.slug} agentName={deptAgent?.name ?? null} />
      )}
    </>
  );
}

function DeptEmptyCanvas({
  deptSlug,
  agentName,
}: {
  deptSlug: string;
  agentName: string | null;
}) {
  const label = agentName ?? `${deptSlug.charAt(0).toUpperCase()}${deptSlug.slice(1)} Agent`;
  const validScenes = new Set(["engineering","design","marketing","sales","operations","finance","legal","support"]);
  const scene = validScenes.has(deptSlug) ? deptSlug as Parameters<typeof PreviewScene>[0]["scene"] : "engineering";

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative rounded-2xl overflow-hidden w-72 aspect-[4/3] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] bg-canvas">
        <PreviewScene scene={scene} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-center bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-lg font-semibold tracking-tight drop-shadow">
            No tasks yet
          </p>
          <p className="text-white/70 text-xs mt-1 drop-shadow">
            {label} is ready for new tasks
          </p>
        </div>
      </div>
    </div>
  );
}
