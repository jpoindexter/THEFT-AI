import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
  ButtonGhost,
} from "@/components/ui/primitives";
import { ArrowLeft, Check } from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    cadence: "free",
    blurb: "$15 in monthly credit. One workspace.",
    features: [
      "Cofounder + all default agents",
      "Managed Vercel + Supabase",
      "1 founder seat",
      "Public preview deployments",
    ],
    cta: "Current plan",
    highlight: false,
  },
  {
    id: "team",
    name: "Team",
    price: "$60",
    cadence: "/seat / mo",
    blurb: "More credit, more seats, custom domains.",
    features: [
      "$200 monthly credit per workspace",
      "Up to 10 seats",
      "Custom domains + Postmark inbound",
      "Routines + scheduled agents",
      "Approvals + audit log retention 90d",
    ],
    cta: "Upgrade to Team",
    highlight: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$1,200",
    cadence: "/mo flat",
    blurb: "Multi-workspace, your own infra, white-glove onboarding.",
    features: [
      "Multi-workspace (unlimited)",
      "Bring-your-own GitHub + Supabase",
      "SSO + SCIM",
      "Audit log retention 365d",
      "Priority response from Cofounder support",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

export default async function UpgradePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <Link
          href={`/${org}/settings/billing`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to billing
        </Link>

        <header className="text-center max-w-2xl mx-auto space-y-1">
          <Eyebrow>Plans</Eyebrow>
          <PageTitle className="!text-2xl">
            Pick the plan that fits the company
          </PageTitle>
          <Hint>
            Workspaces stay portable. You can downgrade at any month boundary.
          </Hint>
        </header>

        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>

        <p className="text-center text-xs text-ink-soft">
          Prices in USD. Custom pricing available for &gt;25 seats.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
}: {
  plan: (typeof PLANS)[number];
}) {
  return (
    <Card
      className={
        plan.highlight
          ? "border-mustard/50 bg-mustard/10 ring-1 ring-mustard/30"
          : ""
      }
    >
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-md font-medium tracking-tight">
              {plan.name}
            </div>
            <div className="text-xs text-ink-muted">{plan.blurb}</div>
          </div>
          {plan.highlight && <Pill tone="mustard">Most popular</Pill>}
        </div>

        <div>
          <span className="text-2xl tracking-tight font-medium">
            {plan.price}
          </span>{" "}
          <span className="text-xs text-ink-muted">{plan.cadence}</span>
        </div>

        <ul className="space-y-1.5 text-xs">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="size-3 text-sage-ink shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {plan.highlight ? (
          <ButtonPrimary className="w-full">{plan.cta}</ButtonPrimary>
        ) : (
          <ButtonGhost className="w-full">{plan.cta}</ButtonGhost>
        )}
      </CardBody>
    </Card>
  );
}
