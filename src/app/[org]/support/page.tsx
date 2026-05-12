import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Eyebrow } from "@/components/ui/primitives";
import { MessageSquare, BookOpen, GitBranch, AlertCircle, CheckCircle2 } from "lucide-react";

const SETUP_CHECKLIST = [
  { done: false, label: "Connect Intercom workspace" },
  { done: false, label: "Enable Fin in Intercom settings" },
  { done: false, label: "Add at least 5 knowledge base articles" },
  { done: false, label: "Set Fin confidence threshold (recommend 0.7)" },
  { done: false, label: "Test with 10 sample questions before going live" },
];

const TICKET_CATEGORIES = [
  { category: "Login / access",       count: 14, pct: 28 },
  { category: "Billing questions",    count: 11, pct: 22 },
  { category: "Import failures",      count: 9,  pct: 18 },
  { category: "Core workflow errors", count: 8,  pct: 16 },
  { category: "Permission issues",    count: 6,  pct: 12 },
  { category: "Cancellations",        count: 2,  pct: 4  },
];

export default async function SupportPage({
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
          <PageTitle>Customer Support</PageTitle>
          <Hint>
            Fin by Intercom + your knowledge base. Automate 60–80% of tickets
            before a human touches them.
          </Hint>
        </header>

        {/* Fin status card */}
        <div className="rounded-xl border border-line/70 bg-paper p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-canvas border border-line/70 flex items-center justify-center shrink-0">
                <MessageSquare className="size-5 text-ink-muted" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">Fin by Intercom</div>
                <div className="text-xs text-ink-muted mt-0.5">
                  AI agent trained on your knowledge base. Deployed to your
                  customer-facing messenger.
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-mustard-ink bg-mustard/10 border border-mustard/30 rounded-full px-3 py-1 shrink-0">
              <AlertCircle className="size-3" /> Not connected
            </div>
          </div>

          <div className="border-t border-line/40 pt-4 space-y-2">
            <div className="text-xs font-medium text-ink">Setup checklist</div>
            <ul className="space-y-1.5">
              {SETUP_CHECKLIST.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-xs text-ink-muted">
                  {item.done ? (
                    <CheckCircle2 className="size-3.5 text-sage-ink shrink-0" />
                  ) : (
                    <div className="size-3.5 rounded-full border border-line shrink-0" />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
            >
              Connect Intercom
            </button>
          </div>
        </div>

        {/* Sub-section nav */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/${org}/support/knowledge-base`}
            className="group rounded-xl border border-line/70 bg-paper p-4 hover:border-line-strong transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-canvas border border-line/70 flex items-center justify-center">
                <BookOpen className="size-4 text-ink-muted" />
              </div>
              <span className="text-xs text-ink-soft group-hover:text-ink transition-colors">→</span>
            </div>
            <div>
              <div className="text-sm font-medium text-ink">Knowledge Base</div>
              <div className="text-xs text-ink-muted mt-0.5">6 articles · 0 published to Fin</div>
            </div>
          </Link>
          <Link
            href={`/${org}/support/decision-trees`}
            className="group rounded-xl border border-line/70 bg-paper p-4 hover:border-line-strong transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-canvas border border-line/70 flex items-center justify-center">
                <GitBranch className="size-4 text-ink-muted" />
              </div>
              <span className="text-xs text-ink-soft group-hover:text-ink transition-colors">→</span>
            </div>
            <div>
              <div className="text-sm font-medium text-ink">Decision Trees</div>
              <div className="text-xs text-ink-muted mt-0.5">2 trees · login + billing flows</div>
            </div>
          </Link>
        </div>

        {/* Ticket breakdown */}
        <div className="space-y-2">
          <Eyebrow>Ticket categories — last 30 days</Eyebrow>
          <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
            {TICKET_CATEGORIES.map((row, i) => (
              <div
                key={row.category}
                className={`flex items-center gap-3 px-4 py-3 ${i < TICKET_CATEGORIES.length - 1 ? "border-b border-line/40" : ""}`}
              >
                <span className="flex-1 text-xs text-ink">{row.category}</span>
                <div className="w-32 h-1.5 rounded-full bg-canvas overflow-hidden">
                  <div
                    className="h-full rounded-full bg-ink/20"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="text-xs text-ink-muted w-16 text-right">
                  {row.count} tickets
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
