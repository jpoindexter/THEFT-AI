import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill } from "@/components/ui/primitives";
import { BarChart2 } from "lucide-react";

const KEY_EVENTS = [
  { name: "signed_up",             on: true,  count: 248 },
  { name: "onboarding_completed",  on: true,  count: 189 },
  { name: "core_action_completed", on: true,  count: 142 },
  { name: "trial_started",         on: true,  count: 98  },
  { name: "checkout_completed",    on: true,  count: 67  },
  { name: "subscription_upgraded", on: true,  count: 28  },
  { name: "teammate_invited",      on: false, count: 0   },
  { name: "support_ticket_opened", on: false, count: 0   },
];

const FUNNEL = [
  { event: "signed_up",            users: 248, dropPct: null },
  { event: "onboarding_completed", users: 189, dropPct: 24   },
  { event: "core_action_completed",users: 142, dropPct: 25   },
  { event: "trial_started",        users: 98,  dropPct: 31   },
  { event: "checkout_completed",   users: 67,  dropPct: 32   },
];

const RETENTION_ROWS = [
  [100, 62, 48, 41, 38, 36, 35],
  [100, 65, 51, 44, 40, 38, null],
  [100, 68, 53, 47, 43, null, null],
  [100, 71, 56, 50, null, null, null],
  [100, 73, 58, null, null, null, null],
  [100, 75, null, null, null, null, null],
];

const WEEKS = ["W0", "W1", "W2", "W3", "W4", "W5", "W6"];
const COHORT_MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

function retentionBg(v: number): string {
  const alpha = v / 100;
  return `rgba(74, 147, 90, ${alpha})`;
}

export default async function AnalyticsPage({
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
        <header className="flex items-start justify-between">
          <div>
            <PageTitle>Product Analytics</PageTitle>
            <Hint>PostHog — event tracking, activation funnel, and retention.</Hint>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/${org}/analytics/marketing`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Marketing
            </Link>
            <button
              type="button"
              className="text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
            >
              Open PostHog ↗
            </button>
          </div>
        </header>

        {/* Connection */}
        <div className="rounded-xl border border-line/70 bg-paper p-4 flex items-center gap-4">
          <div className="size-9 rounded-lg bg-sage/15 border border-sage/30 flex items-center justify-center shrink-0">
            <BarChart2 className="size-4 text-sage-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink">PostHog connected</div>
            <div className="text-xs text-ink-muted">
              Project: theft-ai-prod · Region: US · SDK: posthog-js 1.96
            </div>
          </div>
          <Pill tone="sage">Live</Pill>
        </div>

        {/* Key events */}
        <div className="space-y-2">
          <Eyebrow>Key events</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {KEY_EVENTS.map((e, i) => (
              <div
                key={e.name}
                className={`flex items-center gap-4 px-4 py-2.5 ${i < KEY_EVENTS.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <div className={`size-1.5 rounded-full shrink-0 ${e.on ? "bg-sage-ink" : "bg-line"}`} />
                <span className="flex-1 text-xs font-mono text-ink">{e.name}</span>
                <span className="text-xs text-ink-muted">
                  {e.on ? `${e.count} events` : "not tracking"}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    e.on
                      ? "border-sage/30 text-sage-ink bg-sage/10"
                      : "border-line/70 text-ink-soft"
                  }`}
                >
                  {e.on ? "on" : "off"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="space-y-2">
          <Eyebrow>Activation funnel — last 30 days</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
            {FUNNEL.map((step, i) => (
              <div key={step.event} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-ink">{step.event}</span>
                  <div className="flex items-center gap-3">
                    {step.dropPct !== null && (
                      <span className="text-ink-muted">↓ {step.dropPct}% drop</span>
                    )}
                    <span className="font-medium text-ink">{step.users}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-canvas overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-ink" : "bg-sage/60"}`}
                    style={{ width: `${(step.users / FUNNEL[0].users) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention heatmap */}
        <div className="space-y-2">
          <Eyebrow>Weekly retention — by signup cohort</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper p-4 overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="text-left pr-4 pb-2 text-ink-soft font-normal w-12">Cohort</th>
                  {WEEKS.map((w) => (
                    <th key={w} className="px-1 pb-2 text-ink-soft font-normal text-center">{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RETENTION_ROWS.map((row, ci) => (
                  <tr key={ci}>
                    <td className="pr-4 py-1 text-ink-muted">{COHORT_MONTHS[ci]}</td>
                    {row.map((v, wi) => (
                      <td key={wi} className="px-1 py-1">
                        {v === null ? (
                          <div className="size-8 rounded" />
                        ) : (
                          <div
                            className="size-8 rounded flex items-center justify-center font-medium text-2xs"
                            style={{
                              background: retentionBg(v),
                              color: v > 50 ? "white" : "var(--color-ink)",
                            }}
                          >
                            {v}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
