import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/store";
import OrgOnboardingFlow from "@/components/org-onboarding-flow";
import { hasLocalSession } from "@/lib/auth/session";

export default async function OrgOnboardingPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const authed = await hasLocalSession();
  if (!authed) redirect("/signin");
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
