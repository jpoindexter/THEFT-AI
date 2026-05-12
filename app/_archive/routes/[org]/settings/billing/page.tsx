import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";

export default async function Billing({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <>
      <SectionHeader
        title="Billing"
        description="Open the billing dashboard to view usage, costs, and plan details."
      />
      <SettingsCard
        title="Billing & Usage"
        description="View your detailed usage metrics, costs, and billing configurations."
      >
        <Link
          href={`/${org}/settings/billing/usage`}
          className="inline-flex items-center gap-1.5 text-sm rounded-md border border-line px-3 py-1.5 hover:border-line-strong"
        >
          <LayoutGrid className="size-3.5 text-ink-muted" />
          View Billing &amp; Usage
        </Link>
      </SettingsCard>
    </>
  );
}
