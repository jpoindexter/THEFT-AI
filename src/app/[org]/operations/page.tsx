import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow, StatCard } from "@/components/ui/primitives";
import { GitMerge, RefreshCcw, FileOutput } from "lucide-react";

const DAILY_BRIEF = [
  { priority: 1, action: "8 receipts unmatched in Stripe vs. spreadsheet — reconciliation queue needs review" },
  { priority: 2, action: "April finance handoff pack is not started — billing summary + export due in 4 days" },
  { priority: 3, action: "CRM has 3 stale accounts (no activity >30d, no owner) — assign or archive" },
  { priority: 4, action: "2 export jobs failed overnight — CSV for bookkeeper missing from last week" },
  { priority: 5, action: "Cross-system mismatch: 1 customer in Attio marked 'churned', still active in Stripe" },
];

const NAV_SECTIONS = [
  {
    href: "operations/reconciliation",
    label: "Reconciliation",
    description: "Match receipts, exports, and records across Stripe, spreadsheets, and CRM.",
    icon: RefreshCcw,
    stat: "8 unmatched",
    tone: "mustard",
  },
  {
    href: "operations/handoff",
    label: "Finance Handoff",
    description: "Prepare the weekly / month-end operating pack for finance and leadership.",
    icon: FileOutput,
    stat: "4d remaining",
    tone: "neutral",
  },
];

const SYSTEM_HEALTH = [
  { system: "Stripe ↔ Spreadsheet",     status: "warn",   detail: "8 unmatched receipts"          },
  { system: "Attio CRM ↔ Stripe",        status: "warn",   detail: "1 subscription status mismatch" },
  { system: "Google Sheets exports",     status: "fail",   detail: "2 failed jobs last 7d"          },
  { system: "Notion SOPs",               status: "ok",     detail: "Last updated 3d ago"            },
  { system: "Gmail finance inbox",       status: "ok",     detail: "0 unread billing threads"       },
];

type HealthStatus = "ok" | "warn" | "fail";
const STATUS_CLS: Record<HealthStatus, string> = {
  ok:   "bg-sage-ink",
  warn: "bg-mustard-ink",
  fail: "bg-brick-ink",
};
const STATUS_LABEL_CLS: Record<HealthStatus, string> = {
  ok:   "text-sage-ink",
  warn: "text-mustard-ink",
  fail: "text-brick-ink",
};

export default async function OperationsPage({
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
          <PageTitle>Operations</PageTitle>
          <Hint>
            Cross-system cleanup, reconciliation, and finance handoff prep. The
            Ops Agent handles recurring operational reporting and process gaps.
          </Hint>
        </header>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Unmatched receipts" value="8" tone="mustard" />
          <StatCard label="Stale CRM records" value="3" tone="mustard" />
          <StatCard label="Export failures" value="2" tone="brick" />
          <StatCard label="Open process gaps" value="1" />
        </div>

        {/* Daily brief */}
        <div className="space-y-2">
          <Eyebrow>Daily brief — Ops Agent</Eyebrow>
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

        {/* Nav sections */}
        <div className="grid grid-cols-2 gap-3">
          {NAV_SECTIONS.map((s) => {
            const Icon = s.icon;
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
                  <span
                    className={`text-2xs px-2 py-0.5 rounded-full border font-medium ${
                      s.tone === "mustard"
                        ? "bg-mustard/10 border-mustard/30 text-mustard-ink"
                        : "bg-canvas border-line/70 text-ink-muted"
                    }`}
                  >
                    {s.stat}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                  <div className="text-xs text-ink-muted mt-0.5 leading-snug">
                    {s.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* System health */}
        <div className="space-y-2">
          <Eyebrow>System sync health</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {SYSTEM_HEALTH.map((row, i) => (
              <div
                key={row.system}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < SYSTEM_HEALTH.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <div className={`size-1.5 rounded-full shrink-0 ${STATUS_CLS[row.status as HealthStatus]}`} />
                <span className="flex-1 text-xs text-ink">{row.system}</span>
                <span className={`text-xs ${STATUS_LABEL_CLS[row.status as HealthStatus]}`}>
                  {row.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
