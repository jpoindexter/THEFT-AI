import Link from "next/link";
import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { CreditCard, Sparkles, ArrowRight } from "lucide-react";

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

export default async function PaymentsSettings({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <>
      <SectionHeader
        title="Payments"
        description="Connect Stripe and kick off implementation work with the Engineer."
      />

      <SettingsCard>
        <div className="rounded-md border border-line/70 px-3 py-2 flex items-center justify-between text-base">
          <div>
            <div className="font-medium inline-flex items-center gap-2">
              <CreditCard className="size-3.5 text-ink-muted" />
              Stripe
            </div>
            <div className="text-xs text-ink-muted">
              Add Stripe test or live keys to connect.
            </div>
          </div>
          <Link
            href={`/${org}/settings/stripe`}
            className="text-xs rounded-md border border-line px-2 py-1 hover:border-line-strong inline-flex items-center gap-1"
          >
            Configure <ArrowRight className="size-3" />
          </Link>
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
