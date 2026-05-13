import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { CreditCard, Sparkles } from "lucide-react";

const KICKOFFS = [
  {
    id: "checkout",
    label: "Implement Stripe Checkout",
    body: "One-off + subscription checkout with webhooks for fulfillment.",
  },
  {
    id: "subscriptions",
    label: "Add subscription tiers",
    body: "Pricing table, plan upgrade/downgrade, proration.",
  },
  {
    id: "metering",
    label: "Wire usage-based billing",
    body: "Stripe meter events for consumption-priced features.",
  },
];

export default async function PaymentsSettings() {
  return (
    <>
      <SectionHeader
        title="Payments"
        description="Plan monetization work without pretending local billing is already wired."
      />

      <SettingsCard>
        <div className="rounded-md border border-line/70 px-3 py-2 flex items-center justify-between text-base">
          <div>
            <div className="font-medium inline-flex items-center gap-2">
              <CreditCard className="size-3.5 text-ink-muted" />
              Stripe
            </div>
            <div className="text-xs text-ink-muted">
              Not connected in local mode. Use this page to create implementation work when payments become part of the product.
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Kick off with the Engineer"
        description="Pick a payments task. The Engineer drafts a plan, you approve, then it ships."
      >
        <ul className="space-y-2">
          {KICKOFFS.map((k) => (
            <li
              key={k.id}
              className="rounded-md border border-line/70 p-3 flex items-start justify-between gap-3"
            >
              <div>
                <div className="text-base font-medium tracking-tight">
                  {k.label}
                </div>
                <div className="text-sm text-ink-muted">{k.body}</div>
              </div>
              <button
                type="button"
                className="text-xs rounded-md bg-ink text-paper px-2 py-1 inline-flex items-center gap-1 shrink-0"
              >
                <Sparkles className="size-3" /> Kick off
              </button>
            </li>
          ))}
        </ul>
      </SettingsCard>
    </>
  );
}
