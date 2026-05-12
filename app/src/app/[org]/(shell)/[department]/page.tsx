import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import DepartmentHero from "@/components/department-hero";
import TaskContextBar from "@/components/task/task-context-bar";

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
      <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
        <TaskContextBar
          organization={{ id: organization.id, slug: organization.slug }}
          agentName={deptAgent?.name ?? null}
          deptSlug={department.slug}
        />
      </div>

      <DepartmentHero
        orgName={organization.name}
        orgSlug={organization.slug}
        department={{ slug: department.slug, name: department.name }}
        hasActiveTasks={hasActiveTasks}
      />
    </>
  );
}
