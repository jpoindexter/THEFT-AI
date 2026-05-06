import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { RefreshCw } from "lucide-react";

export default function StripeSettings() {
  return (
    <>
      <SectionHeader
        title="Stripe"
        description="Configure Stripe and manage how your app accepts payments."
      />
      <SettingsCard>
        <div className="rounded-md border border-stone-200/80 px-3 py-2 flex items-center justify-between text-[13px]">
          <div>
            <div className="font-medium">Stripe connection</div>
            <div className="text-[11px] text-stone-500">
              Add Stripe test or live keys below to connect for payments.
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">App: theft-app</div>
          </div>
          <button className="inline-flex items-center gap-1 text-[12px] rounded-md border border-stone-200 px-2 py-1 hover:border-stone-400">
            <RefreshCw className="size-3" /> Recheck
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Stripe keys" description="Test keys for you to test payments without real charges. Live keys process real payments in production.">
        <KeyBlock label="Test" tone="amber" />
        <KeyBlock label="Live" tone="emerald" />
      </SettingsCard>
    </>
  );
}

function KeyBlock({
  label,
  tone,
}: {
  label: string;
  tone: "amber" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : "border-emerald-200 bg-emerald-50";
  return (
    <div className={`rounded-md border ${toneClass} p-3 space-y-2 text-[12px]`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-[10px] uppercase text-stone-500">Not Configured</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] text-stone-500">
        <div>
          <div>SECRET</div>
          <div>Missing</div>
        </div>
        <div>
          <div>ENV</div>
          <div>Missing</div>
        </div>
        <div>
          <div>WEBHOOK</div>
          <div>Missing</div>
        </div>
      </div>
      <button className="text-[11px] rounded-md border border-stone-200 px-2 py-0.5 hover:border-stone-400 bg-white">
        Add {label.toLowerCase()} keys
      </button>
    </div>
  );
}
