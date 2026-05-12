import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/store";
import OrgShell from "@/components/org-shell";

export default async function ShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();

  const hasPlan =
    !!organization.business_plan &&
    Object.keys(organization.business_plan).length > 0;
  if (!hasPlan) redirect(`/${orgSlug}/onboarding`);

  const allOrgs = await db.listOrgs();

  return (
    <OrgShell
      organization={{
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
      }}
      orgName={organization.name}
      founderInitial={"J"}
      hasPlan={hasPlan}
      orgs={allOrgs.map((o) => ({ slug: o.slug, name: o.name }))}
    >
      {children}
    </OrgShell>
  );
}
