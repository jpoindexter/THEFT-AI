import { useEffect, useState } from "react";
import type { BudgetPolicySummary } from "@paperclipai/shared";
import { AlertTriangle, ShieldAlert, Wallet } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BudgetPolicyMetricGrid,
  BudgetPolicyPausedPane,
  BudgetPolicyProgress,
} from "./budget-policy-card/BudgetPolicySections";

function centsInputValue(value: number) {
  return (value / 100).toFixed(2);
}

function parseDollarInput(value: string) {
  const normalized = value.trim();
  if (normalized.length === 0) return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function windowLabel(windowKind: BudgetPolicySummary["windowKind"]) {
  return windowKind === "lifetime" ? "Lifetime budget" : "Monthly UTC budget";
}

function statusTone(status: BudgetPolicySummary["status"]) {
  if (status === "hard_stop") return "text-destructive border-destructive/30 bg-destructive/10";
  if (status === "warning") return "text-foreground border-border bg-muted";
  return "text-muted-foreground border-border bg-muted";
}

export function BudgetPolicyCard({
  summary,
  onSave,
  isSaving,
  compact = false,
  variant = "card",
}: {
  summary: BudgetPolicySummary;
  onSave?: (amountCents: number) => void;
  isSaving?: boolean;
  compact?: boolean;
  variant?: "card" | "plain";
}) {
  const [draftBudget, setDraftBudget] = useState(centsInputValue(summary.amount));

  useEffect(() => {
    setDraftBudget(centsInputValue(summary.amount));
  }, [summary.amount]);

  const parsedDraft = parseDollarInput(draftBudget);
  const canSave = typeof parsedDraft === "number" && parsedDraft !== summary.amount && Boolean(onSave);
  const StatusIcon = summary.status === "hard_stop" ? ShieldAlert : summary.status === "warning" ? AlertTriangle : Wallet;
  const isPlain = variant === "plain";

  const saveSection = onSave ? (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end", isPlain ? "" : "rounded-xl border border-border/70 bg-background/50 p-3")}>
      <div className="min-w-0 flex-1">
        <label className="theft-label-compact">
          Budget (USD)
        </label>
        <Input
          value={draftBudget}
          onChange={(event) => setDraftBudget(event.target.value)}
          className="mt-2"
          inputMode="decimal"
          placeholder="0.00"
        />
      </div>
      <Button
        onClick={() => {
          if (typeof parsedDraft === "number" && onSave) onSave(parsedDraft);
        }}
        disabled={!canSave || isSaving || parsedDraft === null}
      >
        {isSaving ? "Saving..." : summary.amount > 0 ? "Update budget" : "Set budget"}
      </Button>
    </div>
  ) : null;

  if (isPlain) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="theft-label-compact">
              {summary.scopeType}
            </div>
            <div className="mt-2 text-xl font-semibold">{summary.scopeName}</div>
            <div className="mt-2 text-sm text-muted-foreground">{windowLabel(summary.windowKind)}</div>
          </div>
          <div
            className={cn(
              "theft-label-compact inline-flex items-center gap-2",
              summary.status === "hard_stop"
                ? "text-destructive"
                : summary.status === "warning"
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {summary.paused ? "Paused" : summary.status === "warning" ? "Warning" : summary.status === "hard_stop" ? "Hard stop" : "Healthy"}
          </div>
        </div>

        <BudgetPolicyMetricGrid summary={summary} isPlain={isPlain} />
        <BudgetPolicyProgress summary={summary} isPlain={isPlain} />
        <BudgetPolicyPausedPane summary={summary} />
        {saveSection}
        {parsedDraft === null ? (
          <p className="text-xs text-destructive">Enter a valid non-negative dollar amount.</p>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 bg-card">
      <CardHeader className={cn("gap-3", compact ? "px-4 pb-2 pt-4" : "px-5 pb-3 pt-5")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="theft-label-compact">
              {summary.scopeType}
            </div>
            <CardTitle className="mt-1 text-base">{summary.scopeName}</CardTitle>
            <CardDescription className="mt-1">{windowLabel(summary.windowKind)}</CardDescription>
          </div>
          <div className={cn("theft-label-compact inline-flex items-center gap-2 rounded-full border px-3 py-1", statusTone(summary.status))}>
            <StatusIcon className="h-3.5 w-3.5" />
            {summary.paused ? "Paused" : summary.status === "warning" ? "Warning" : summary.status === "hard_stop" ? "Hard stop" : "Healthy"}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact ? "px-4 pb-4 pt-0" : "px-5 pb-5 pt-0")}>
        <BudgetPolicyMetricGrid summary={summary} isPlain={isPlain} />
        <BudgetPolicyProgress summary={summary} isPlain={isPlain} />
        <BudgetPolicyPausedPane summary={summary} />
        {saveSection}
        {parsedDraft === null ? (
          <p className="text-xs text-destructive">Enter a valid non-negative dollar amount.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
