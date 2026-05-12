import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, Pill } from "@/components/ui/primitives";
import { BarChart2 } from "lucide-react";
import { EventToggleList } from "./event-toggle-list";

// Funnel: signed_up → onboarding_completed → core_action_completed → subscription_upgraded
const FUNNEL = [
  { event: "signed_up",             users: 1000, dropPct: null },
  { event: "onboarding_completed",  users: 420,  dropPct: 58   },
  { event: "core_action_completed", users: 180,  dropPct: 57   },
  { event: "subscription_upgraded", users: 45,   dropPct: 75   },
] as const;

// 4 cohort rows × 8 week columns
const RETENTION_ROWS: (number | null)[][] = [
  [100, 68, 54, 47, 43, 40, 38, 36],
  [100, 71, 57, 50, 46, 43, 41, null],
  [100, 74, 60, 53, 48, 45, null, null],
  [100, 77, 63, 56, 51, null, null, null],
];

const WEEKS = ["W0", "W1", "W2", "W3", "W4", "W5", "W6", "W7"] as const;
const COHORT_MONTHS = ["Nov", "Dec", "Jan", "Feb"] as const;

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
          </div>
        </header>

        {/* Connection status */}
        <div className="rounded-xl border border-line/70 bg-paper p-4 flex items-center gap-4">
          <div className="size-9 rounded-lg bg-cream border border-line/70 flex items-center justify-center shrink-0">
            <BarChart2 className="size-4 text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink">PostHog</div>
            <div className="text-xs text-ink-muted">
              Not connected — connect your PostHog project to start tracking events.
            </div>
          </div>
          <Pill tone="neutral">Not connected</Pill>
          <Link
            href="https://posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 whitespace-nowrap"
          >
            Connect PostHog
          </Link>
        </div>

        {/* Key events — client island for toggle state */}
        <div className="space-y-2">
          <Eyebrow>Key events</Eyebrow>
          <EventToggleList />
        </div>

        {/* Funnel */}
        <div className="space-y-2">
          <Eyebrow>Activation funnel — seeded data</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper p-4 space-y-3">
            {FUNNEL.map((step, i) => (
              <div key={step.event} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-ink">{step.event}</span>
                  <div className="flex items-center gap-3">
                    {step.dropPct !== null && (
                      <span className="text-ink-muted">↓ {step.dropPct}% drop</span>
                    )}
                    <span className="font-medium text-ink tabular-nums">
                      {step.users.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-canvas overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-ink" : "bg-mustard/60"}`}
                    style={{
                      width: `${(step.users / FUNNEL[0].users) * 100}%`,
                    }}
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
                  <th className="text-left pr-4 pb-2 text-ink-soft font-normal w-12">
                    Cohort
                  </th>
                  {WEEKS.map((w) => (
                    <th
                      key={w}
                      className="px-1 pb-2 text-ink-soft font-normal text-center"
                    >
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RETENTION_ROWS.map((row, ci) => (
                  <tr key={ci}>
                    <td className="pr-4 py-1 text-ink-muted">
                      {COHORT_MONTHS[ci]}
                    </td>
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
