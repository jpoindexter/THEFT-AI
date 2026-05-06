import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import RightPanel from "@/components/right-panel";
import LayoutHeader from "@/components/layout-header";
import LayoutCanvas from "@/components/layout-canvas";

export default async function OrgLayout({
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
    Object.keys(organization.business_plan as Record<string, unknown>).length >
      0;

  return (
    <div className="min-h-screen flex flex-col bg-[#ececec] text-stone-900">
      <LayoutHeader
        orgName={organization.name}
        orgSlug={organization.slug}
        founderInitial={"J"}
        hasPlan={hasPlan}
      />
      <div className="flex-1 grid grid-cols-[1fr_360px] gap-2 px-2 pb-2">
        <LayoutCanvas hasPlan={hasPlan}>{children}</LayoutCanvas>
        <RightPanel
          organization={{
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
          }}
          hasPlan={hasPlan}
          founderName={"jpoindexter"}
        />
      </div>
    </div>
  );
}
