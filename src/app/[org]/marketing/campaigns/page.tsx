import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill, StatCard } from "@/components/ui/primitives";
import { ArrowLeft, Plus } from "lucide-react";

type CampaignChannel = "email" | "paid" | "organic" | "linkedin" | "product_hunt";
type CampaignStatus  = "active" | "draft" | "paused" | "completed";

type Campaign = {
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number | null;
  spent: number;
  leads: number;
  conversions: number;
  startDate: string;
  owner: string;
};

const CAMPAIGNS: Campaign[] = [
  {
    name: "AI agents for ops teams",
    channel: "email",
    status: "active",
    budget: null,
    spent: 0,
    leads: 24,
    conversions: 4,
    startDate: "May 2026",
    owner: "Marketing Agent",
  },
  {
    name: "Google Search — THEFT AI",
    channel: "paid",
    status: "active",
    budget: 2000,
    spent: 840,
    leads: 31,
    conversions: 2,
    startDate: "May 2026",
    owner: "Marketing Agent",
  },
  {
    name: "Product Hunt launch",
    channel: "product_hunt",
    status: "draft",
    budget: null,
    spent: 0,
    leads: 0,
    conversions: 0,
    startDate: "Jun 2026",
    owner: "Marketing Agent",
  },
  {
    name: "LinkedIn thought leadership",
    channel: "linkedin",
    status: "active",
    budget: null,
    spent: 0,
    leads: 18,
    conversions: 3,
    startDate: "Apr 2026",
    owner: "Marketing Agent",
  },
  {
    name: "Cold email — Series A CTOs",
    channel: "email",
    status: "paused",
    budget: null,
    spent: 0,
    leads: 9,
    conversions: 1,
    startDate: "Mar 2026",
    owner: "Marketing Agent",
  },
  {
    name: "SEO blog series",
    channel: "organic",
    status: "completed",
    budget: null,
    spent: 0,
    leads: 42,
    conversions: 8,
    startDate: "Mar 2026",
    owner: "Marketing Agent",
  },
];

const STATUS_TONE: Record<CampaignStatus, "sage" | "mustard" | "neutral" | "brick"> = {
  active:    "sage",
  draft:     "neutral",
  paused:    "mustard",
  completed: "neutral",
};

const CHANNEL_LABEL: Record<CampaignChannel, string> = {
  email:        "Email",
  paid:         "Paid",
  organic:      "Organic",
  linkedin:     "LinkedIn",
  product_hunt: "Product Hunt",
};

function fmtUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const totalLeads       = CAMPAIGNS.reduce((s, c) => s + c.leads, 0);
  const totalConversions = CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const totalSpent       = CAMPAIGNS.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/marketing`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Marketing
            </Link>
            <PageTitle>Campaigns</PageTitle>
            <Hint>
              Active and scheduled campaigns. Track leads, conversions, and spend across all channels.
            </Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" /> New campaign
          </button>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total leads"   value={String(totalLeads)}       />
          <StatCard label="Conversions"   value={String(totalConversions)} tone="sage" />
          <StatCard label="Paid spent"    value={fmtUsd(totalSpent)}       tone="mustard" />
        </div>

        <div className="space-y-2">
          <Eyebrow>All campaigns</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_100px_60px_60px_100px_140px] gap-x-4 px-4 py-2 border-b border-line/40 bg-canvas/50">
              <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium">Name</span>
              <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium">Channel</span>
              <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium">Status</span>
              <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium text-right">Leads</span>
              <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium text-right">Conv.</span>
              <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium text-right">Budget</span>
              <span className="text-2xs uppercase tracking-wider text-ink-soft font-medium">Owner</span>
            </div>
            {CAMPAIGNS.map((c, i) => (
              <div
                key={c.name}
                className={`grid grid-cols-[1fr_120px_100px_60px_60px_100px_140px] gap-x-4 items-center px-4 py-3 ${
                  i < CAMPAIGNS.length - 1 ? "border-b border-line/40" : ""
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-ink leading-snug">{c.name}</div>
                  <div className="text-2xs text-ink-muted mt-0.5">{c.startDate}</div>
                </div>
                <div>
                  <Pill tone="neutral">{CHANNEL_LABEL[c.channel]}</Pill>
                </div>
                <div>
                  <Pill tone={STATUS_TONE[c.status]}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </Pill>
                </div>
                <div className="text-xs text-ink text-right font-medium">{c.leads}</div>
                <div className="text-xs text-ink text-right font-medium">{c.conversions}</div>
                <div className="text-xs text-ink text-right">
                  {c.budget !== null ? (
                    <span>
                      {fmtUsd(c.spent)}
                      <span className="text-ink-muted"> / {fmtUsd(c.budget)}</span>
                    </span>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )}
                </div>
                <div className="text-xs text-ink-muted truncate">{c.owner}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
