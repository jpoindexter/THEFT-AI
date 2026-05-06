import Link from "next/link";
import { SectionHeader, SettingsCard } from "@/components/settings/section";

export default function Billing() {
  return (
    <>
      <SectionHeader
        title="Billing"
        description="Open the billing dashboard to view usage, costs, and plan details."
      />
      <SettingsCard>
        <div className="space-y-2 text-[13px]">
          <div className="flex items-baseline justify-between">
            <span>Available balance</span>
            <span className="text-2xl font-semibold tracking-tight">$14.53</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span>Subscription</span>
            <span className="text-ink-muted">Trial</span>
          </div>
          <Link
            href="/billing"
            className="inline-flex w-fit text-[12px] rounded-md bg-ink text-paper px-3 py-1.5 mt-3"
          >
            View Billing & Usage
          </Link>
        </div>
      </SettingsCard>
    </>
  );
}
