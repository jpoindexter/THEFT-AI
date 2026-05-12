import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import OrgChart from "@/components/org-chart";
import Canvas from "@/components/canvas";
import OnboardingTour from "@/components/onboarding-tour";

export default async function OrgHome({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const departments = await db.listDepartments(organization.id);
  return (
    <Canvas className="absolute inset-0">
      <OrgChart
        orgSlug={orgSlug}
        orgName={organization.name}
        departments={departments}
      />
      <OnboardingTour org={orgSlug} />
    </Canvas>
  );
}
