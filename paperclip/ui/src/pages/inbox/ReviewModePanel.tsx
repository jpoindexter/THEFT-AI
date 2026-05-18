import type { Issue } from "@paperclipai/shared";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import type { InboxWorkItem } from "@/lib/inbox";

type ReviewModePanelProps = {
  items: InboxWorkItem[];
  agentById: Map<string, string>;
  issueById: Map<string, Issue>;
  getCategory: (item: InboxWorkItem) => string;
  getDetail: (item: InboxWorkItem, agentById: Map<string, string>, issueById: Map<string, Issue>) => string;
  getHref: (item: InboxWorkItem) => string;
  getTitle: (item: InboxWorkItem, agentById: Map<string, string>, issueById: Map<string, Issue>) => string;
};

export function ReviewModePanel({
  items,
  agentById,
  issueById,
  getCategory,
  getDetail,
  getHref,
  getTitle,
}: ReviewModePanelProps) {
  const selectedItem = items[0] ?? null;
  const stats = [
    { label: "Approvals", value: items.filter((item) => item.kind === "approval").length, icon: ShieldCheck },
    { label: "Clarifications", value: items.filter((item) => item.kind === "join_request" || getCategory(item) === "Clarification").length, icon: MessageSquare },
    { label: "Ready outputs", value: items.filter((item) => getCategory(item) === "Ready output").length, icon: FileText },
    { label: "Failed runs", value: items.filter((item) => item.kind === "failed_run").length, icon: AlertTriangle },
    { label: "Blocked", value: items.filter((item) => getCategory(item) === "Blocked dependency").length, icon: Clock3 },
  ];

  return (
    <section className="theft-panel overflow-hidden p-0">
      <div className="lg:flex">
        <aside className="border-b border-border bg-card/70 p-4 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review queue</p>
          <div className="mt-3 grid gap-2">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{label}</span>
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Decision cockpit</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Review mode</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Process approvals, clarifications, ready outputs, failed runs, and blocked dependencies without hunting through tasks.
              </p>
            </div>
            <div className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
              {items.length > 0 ? `1 of ${items.length} review items` : "0 review items"}
            </div>
          </div>

          <div className="mt-5 border border-border bg-background p-4">
            {selectedItem ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
                    {getCategory(selectedItem)}
                  </span>
                  <span className="text-xs text-muted-foreground">{getDetail(selectedItem, agentById, issueById)}</span>
                </div>
                <h2 className="mt-3 break-words text-lg font-semibold leading-7 text-foreground">
                  {getTitle(selectedItem, agentById, issueById)}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ReviewEvidence label="Task context" value={selectedItem.kind === "issue" ? selectedItem.issue.identifier ?? "Task" : getCategory(selectedItem)} />
                  <ReviewEvidence label="Artifact preview" value={selectedItem.kind === "issue" ? selectedItem.issue.status.replace(/_/g, " ") : "Open detail"} />
                  <ReviewEvidence label="Decision needed" value={selectedItem.kind === "failed_run" ? "Retry or reroute" : "Approve or respond"} />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="h-4 w-4" />
                Nothing needs review right now.
              </div>
            )}
          </div>
        </div>

        <aside className="border-t border-border bg-muted/20 p-5 lg:w-72 lg:shrink-0 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Recommendation</h2>
              <p className="text-xs text-muted-foreground">Choose the next decision.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {selectedItem
              ? "Open the selected item, inspect the evidence, then approve, revise, ask Operator, snooze, or mark done."
              : "No active queue pressure. Return to Mission Control for the next move."}
          </p>
          <div className="mt-4 grid gap-2">
            {selectedItem ? (
              <Button asChild>
                <Link to={getHref(selectedItem)}>
                  Open selected
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" className="justify-start">
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" className="justify-start">
              <RotateCcw className="h-4 w-4" />
              Request revision
            </Button>
            <Button variant="outline" className="justify-start">
              <MessageSquare className="h-4 w-4" />
              Ask Operator
            </Button>
            <Button variant="ghost" className="justify-start">
              <CircleDot className="h-4 w-4" />
              Snooze / Mark done
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ReviewEvidence({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted/25 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
