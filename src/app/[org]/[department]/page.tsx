import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import DepartmentHero from "@/components/department-hero";

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

  const tasks = await db.listTasks(organization.id, {
    departmentId: department.id,
    activeOnly: true,
  });

  return (
    <DepartmentHero
      orgName={organization.name}
      department={{
        slug: department.slug,
        name: department.name,
      }}
      hasActiveTasks={tasks.length > 0}
    />
  );
}
