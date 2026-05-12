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
        <div className="rounded-md border border-line/70 px-3 py-2 flex items-center justify-between text-base">
          <div>
            <div className="font-medium">Stripe connection</div>
            <div className="text-xs text-ink-muted">
              Add Stripe test or live keys below to connect for payments.
            </div>
            <div className="text-2xs text-ink-soft mt-0.5">App: theft-app</div>
          </div>
          <button className="inline-flex items-center gap-1 text-sm rounded-md border border-line px-2 py-1 hover:border-line-strong">
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
      ? "border-mustard/40 bg-mustard/15"
      : "border-sage/40 bg-sage/15";
  return (
    <div className={`rounded-md border ${toneClass} p-3 space-y-2 text-sm`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-2xs uppercase text-ink-muted">Not Configured</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-2xs text-ink-muted">
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
      <button className="text-xs rounded-md border border-line px-2 py-0.5 hover:border-line-strong bg-paper">
        Add {label.toLowerCase()} keys
      </button>
    </div>
  );
}
