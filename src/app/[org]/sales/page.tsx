import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import { TrendingUp, Users, Mail, Target, type LucideIcon } from "lucide-react";

const DAILY_BRIEF = [
  { priority: 1, action: "Blueridge Capital is at verbal commit stage but has no follow-up scheduled — deal has been stale for 4 days." },
  { priority: 2, action: "3 Tier 1 leads from the ICP list have not been contacted — outreach cadence not started." },
  { priority: 3, action: "Consult call with Meridian Health is tomorrow at 2pm — notes from the last call have not been prepared." },
  { priority: 4, action: "Forge Logistics deck was sent 5 days ago with no response — needs a follow-up email." },
  { priority: 5, action: "Lead list has 8 Tier 2 contacts with no trigger events identified." },
];

type NavTone = "mustard" | "sage" | "brick" | "neutral";

const NAV_SECTIONS: { href: string; label: string; description: string; Icon: LucideIcon; stat: string; tone: NavTone }[] = [
  {
    href: "sales/pipeline",
    label: "Pipeline",
    description: "Track deals from first contact to close. 8-stage funnel with conversion analytics.",
    Icon: TrendingUp,
    stat: "7 active",
    tone: "mustard" as const,
  },
  {
    href: "sales/leads",
    label: "Lead List",
    description: "ICP-qualified accounts scored by tier and trigger event.",
    Icon: Users,
    stat: "24 leads",
    tone: "neutral" as const,
  },
  {
    href: "sales/outreach",
    label: "Outreach",
    description: "7-day multi-touch cadence builder with active sequences and template library.",
    Icon: Mail,
    stat: "3 active",
    tone: "sage" as const,
  },
  {
    href: "sales/competitors",
    label: "Competitors",
    description: "Research competitor positioning, pricing, and gaps to find your opening.",
    Icon: Target,
    stat: "4 tracked",
    tone: "neutral" as const,
  },
];

type Tone = "ok" | "warn" | "fail";

const SYSTEM_HEALTH: { system: string; status: Tone; detail: string }[] = [
  { system: "CRM / Attio",            status: "warn", detail: "3 stale accounts >30d"        },
  { system: "Outreach sequences",     status: "ok",   detail: "3 active · 0 bounced"         },
  { system: "Lead enrichment",        status: "ok",   detail: "Last run 2h ago"               },
  { system: "Pipeline (Stripe sync)", status: "warn", detail: "1 won deal not confirmed"      },
  { system: "Consult calendar",       status: "ok",   detail: "2 upcoming this week"          },
];

const STATUS_DOT: Record<Tone, string> = {
  ok:   "bg-sage-ink",
  warn: "bg-mustard-ink",
  fail: "bg-brick-ink",
};
const STATUS_TEXT: Record<Tone, string> = {
  ok:   "text-sage-ink",
  warn: "text-mustard-ink",
  fail: "text-brick-ink",
};

export default async function SalesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header>
          <PageTitle>Sales</PageTitle>
          <Hint>
            Pipeline, leads, outreach, and competitive intelligence. The Sales
            Agent manages deal progression, contact cadences, and keeps revenue
            moving.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Active deals"    value="7"    tone="mustard" />
          <StatCard label="Leads this week" value="24"                  />
          <StatCard label="Pipeline value"  value="$82k"                />
          <StatCard label="Won this month"  value="$18k" tone="sage"    />
        </div>

        <div className="space-y-2">
          <Eyebrow>Daily brief — Sales Agent</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {DAILY_BRIEF.map((item, i) => (
              <div
                key={item.priority}
                className={`flex items-start gap-3 px-4 py-3 ${i < DAILY_BRIEF.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <span className="size-5 rounded-full bg-canvas border border-line/70 text-2xs text-ink-soft flex items-center justify-center shrink-0 mt-0.5">
                  {item.priority}
                </span>
                <span className="text-xs text-ink leading-snug">{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {NAV_SECTIONS.map((s) => {
            const Icon = s.Icon;
            const toneClass =
              s.tone === "mustard"
                ? "bg-mustard/10 border-mustard/30 text-mustard-ink"
                : s.tone === "sage"
                  ? "bg-sage/10 border-sage/30 text-sage-ink"
                  : s.tone === "brick"
                    ? "bg-brick/10 border-brick/30 text-brick-ink"
                    : "bg-canvas border-line/70 text-ink-muted";
            return (
              <Link
                key={s.href}
                href={`/${org}/${s.href}`}
                className="group rounded-xl border border-line/70 bg-paper p-4 hover:border-line-strong transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-lg bg-canvas border border-line/70 flex items-center justify-center">
                    <Icon className="size-4 text-ink-muted" />
                  </div>
                  <span className={`text-2xs px-2 py-0.5 rounded-full border font-medium ${toneClass}`}>
                    {s.stat}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                  <div className="text-xs text-ink-muted mt-0.5 leading-snug">{s.description}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="space-y-2">
          <Eyebrow>System health</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {SYSTEM_HEALTH.map((row, i) => (
              <div
                key={row.system}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < SYSTEM_HEALTH.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <div className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT[row.status]}`} />
                <span className="flex-1 text-xs text-ink">{row.system}</span>
                <span className={`text-xs ${STATUS_TEXT[row.status]}`}>{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
