import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import { Database, Box, GitBranch, ShieldCheck, KeyRound, Webhook, Stethoscope } from "lucide-react";

const DAILY_BRIEF = [
  { priority: 1, action: "Missing index on subscriptions.user_id — sequential scans at 220ms p95. Advisor recommends adding index." },
  { priority: 2, action: "Staging branch is 3 commits behind prod. Preview deployment for feat/subscriptions-table is stale." },
  { priority: 3, action: "2 webhooks failed in the last 24h — Stripe billing.subscription.updated not delivered." },
  { priority: 4, action: "Auth email template for password reset hasn't been customised — using Supabase default." },
  { priority: 5, action: "API key 'ci-runner-prod' was last rotated 94 days ago. Rotation recommended every 90 days." },
];

const NAV_SECTIONS = [
  {
    href: "database",
    label: "Database",
    description: "Tables, migrations, auth, storage, secrets, and schema advisors for the managed Supabase project.",
    Icon: Database,
    stat: "3 advisors",
    tone: "mustard" as const,
  },
  {
    href: "sandbox",
    label: "Sandbox",
    description: "Local Supabase and dev server. Run smoke tests against a clean DB before opening a PR.",
    Icon: Box,
    stat: "running",
    tone: "sage" as const,
  },
  {
    href: "preview/feat-subscriptions-table",
    label: "Preview",
    description: "Branch deployments and PR previews. Review changes before they reach production.",
    Icon: GitBranch,
    stat: "2 open",
    tone: "neutral" as const,
  },
  {
    href: "managed-services",
    label: "Managed Services",
    description: "Vercel and Supabase project health, deployment status, and infrastructure configuration.",
    Icon: ShieldCheck,
    stat: "all green",
    tone: "sage" as const,
  },
  {
    href: "api-keys",
    label: "API Keys",
    description: "Workspace API keys for external callers. Create, rotate, and revoke access.",
    Icon: KeyRound,
    stat: "1 aging",
    tone: "mustard" as const,
  },
  {
    href: "webhooks",
    label: "Webhooks",
    description: "Inbound and outbound webhook endpoints. Monitor delivery, retry failed events.",
    Icon: Webhook,
    stat: "2 failed",
    tone: "brick" as const,
  },
  {
    href: "diagnostics",
    label: "Diagnostics",
    description: "Health checks, latency, error rates, and system status across the stack.",
    Icon: Stethoscope,
    stat: "healthy",
    tone: "neutral" as const,
  },
];

type Tone = "ok" | "warn" | "fail";

const SYSTEM_HEALTH: { system: string; status: Tone; detail: string }[] = [
  { system: "Supabase (prod)",          status: "ok",   detail: "All services up"                        },
  { system: "Vercel (app)",             status: "ok",   detail: "Last deploy 2h ago · p95 142ms"         },
  { system: "Vercel (marketing site)",  status: "warn", detail: "3 commits behind — publish pending"     },
  { system: "Stripe webhooks",          status: "fail", detail: "2 failed deliveries in last 24h"        },
  { system: "CI / GitHub Actions",      status: "ok",   detail: "142 tests passing · 0 failing"          },
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

export default async function EngineeringPage({
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
          <PageTitle>Engineering</PageTitle>
          <Hint>
            Database, deployments, infrastructure, and developer tooling. The
            Engineer Agent manages builds, migrations, and keeps the stack healthy.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="DB advisors"      value="3"  tone="mustard" />
          <StatCard label="Open previews"    value="2"                 />
          <StatCard label="Webhook failures" value="2"  tone="brick"  />
          <StatCard label="Aging API keys"   value="1"  tone="mustard" />
        </div>

        <div className="space-y-2">
          <Eyebrow>Daily brief — Engineer Agent</Eyebrow>
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
