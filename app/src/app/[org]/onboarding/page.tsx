import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/store";
import OrgOnboardingFlow from "@/components/org-onboarding-flow";

export default async function OrgOnboardingPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();

  const plan = organization.business_plan as Record<string, unknown> | null;
  const hasPlan = !!plan && Object.keys(plan).length > 0;
  if (hasPlan) redirect(`/${orgSlug}`);

  return (
    <OrgOnboardingFlow
      organization={{
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
      }}
    />
  );
}
