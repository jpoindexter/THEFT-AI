import { useMemo } from "react";
import type { CostByProviderModel, CostWindowSpendRow, QuotaWindow } from "@paperclipai/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QuotaBar } from "./QuotaBar";
import { ClaudeSubscriptionPanel } from "./ClaudeSubscriptionPanel";
import { CodexSubscriptionPanel } from "./CodexSubscriptionPanel";
import { ModelBreakdown } from "./provider-quota-card/ModelBreakdown";
import { MeterBar, QuotaPanelSkeleton } from "./provider-quota-card/ProviderQuotaParts";
import { RollingWindows } from "./provider-quota-card/RollingWindows";
import {
  formatCents,
  formatTokens,
  providerDisplayName,
  quotaSourceDisplayName,
} from "@/lib/utils";

interface ProviderQuotaCardProps {
  provider: string;
  rows: CostByProviderModel[];
  /** company monthly budget in cents (0 means unlimited) */
  budgetMonthlyCents: number;
  /** total company spend in this period in cents, all providers */
  totalCompanySpendCents: number;
  /** spend in the current calendar week in cents, this provider only */
  weekSpendCents: number;
  /** rolling window rows for this provider: 5h, 24h, 7d */
  windowRows: CostWindowSpendRow[];
  showDeficitNotch: boolean;
  /** live subscription quota windows from the provider's own api */
  quotaWindows?: QuotaWindow[];
  quotaError?: string | null;
  quotaSource?: string | null;
  quotaLoading?: boolean;
}

export function ProviderQuotaCard({
  provider,
  rows,
  budgetMonthlyCents,
  totalCompanySpendCents,
  weekSpendCents,
  windowRows,
  showDeficitNotch,
  quotaWindows = [],
  quotaError = null,
  quotaSource = null,
  quotaLoading = false,
}: ProviderQuotaCardProps) {
  // single-pass aggregation over rows — memoized so the 8 derived values are not
  // recomputed on every parent render tick (providers tab polls every 30s, and each
  // card is mounted twice: once in the "all" tab grid and once in its per-provider tab).
  const totals = useMemo(() => {
    let inputTokens = 0, outputTokens = 0, costCents = 0;
    let apiRunCount = 0, subRunCount = 0, subInputTokens = 0, subOutputTokens = 0;
    for (const r of rows) {
      inputTokens += r.inputTokens;
      outputTokens += r.outputTokens;
      costCents += r.costCents;
      apiRunCount += r.apiRunCount;
      subRunCount += r.subscriptionRunCount;
      subInputTokens += r.subscriptionInputTokens;
      subOutputTokens += r.subscriptionOutputTokens;
    }
    const totalTokens = inputTokens + outputTokens;
    const subTokens = subInputTokens + subOutputTokens;
    // denominator: api-billed tokens (from cost_events) + subscription tokens (from heartbeat_runs)
    const allTokens = totalTokens + subTokens;
    return {
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      totalTokens,
      totalCostCents: costCents,
      totalApiRuns: apiRunCount,
      totalSubRuns: subRunCount,
      totalSubInputTokens: subInputTokens,
      totalSubOutputTokens: subOutputTokens,
      totalSubTokens: subTokens,
      subSharePct: allTokens > 0 ? (subTokens / allTokens) * 100 : 0,
    };
  }, [rows]);

  const {
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCostCents,
    totalApiRuns,
    totalSubRuns,
    totalSubInputTokens,
    totalSubOutputTokens,
    totalSubTokens,
    subSharePct,
  } = totals;

  // budget bars: use this provider's own spend vs its pro-rata share of budget
  // pro-rata: if a provider is 40% of total spend, it gets 40% of the budget allocated.
  // falls back to raw provider spend vs total budget when totalCompanySpend is 0.
  const providerBudgetShare =
    budgetMonthlyCents > 0 && totalCompanySpendCents > 0
      ? (totalCostCents / totalCompanySpendCents) * budgetMonthlyCents
      : budgetMonthlyCents;

  const budgetPct =
    providerBudgetShare > 0
      ? Math.min(100, (totalCostCents / providerBudgetShare) * 100)
      : 0;

  // 4.33 = average weeks per calendar month (52 / 12)
  const weeklyBudgetShare = providerBudgetShare > 0 ? providerBudgetShare / 4.33 : 0;
  const weekPct =
    weeklyBudgetShare > 0 ? Math.min(100, (weekSpendCents / weeklyBudgetShare) * 100) : 0;

  const hasBudget = budgetMonthlyCents > 0;

  const isClaudeQuotaPanel = provider === "anthropic";
  const isCodexQuotaPanel = provider === "openai" && quotaSource?.startsWith("codex-");
  const supportsSubscriptionQuota = provider === "anthropic" || provider === "openai";
  const showSubscriptionQuotaSection =
    supportsSubscriptionQuota && (quotaLoading || quotaWindows.length > 0 || quotaError != null);

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-0 gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold">
              {providerDisplayName(provider)}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              <span className="font-mono">{formatTokens(totalInputTokens)}</span> in
              {" · "}
              <span className="font-mono">{formatTokens(totalOutputTokens)}</span> out
              {(totalApiRuns > 0 || totalSubRuns > 0) && (
                <span className="ml-1.5">
                  ·{" "}
                  {totalApiRuns > 0 && `~${totalApiRuns} api`}
                  {totalApiRuns > 0 && totalSubRuns > 0 && " / "}
                  {totalSubRuns > 0 && `~${totalSubRuns} sub`}
                  {" runs"}
                </span>
              )}
            </CardDescription>
          </div>
          <span className="text-xl font-bold tabular-nums shrink-0">
            {formatCents(totalCostCents)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-3 space-y-4">
        {hasBudget && (
          <div className="space-y-3">
            <QuotaBar
              label="Period spend"
              percentUsed={budgetPct}
              leftLabel={formatCents(totalCostCents)}
              rightLabel={`${Math.round(budgetPct)}% of allocation`}
              showDeficitNotch={showDeficitNotch}
            />
            <QuotaBar
              label="This week"
              percentUsed={weekPct}
              leftLabel={formatCents(weekSpendCents)}
              rightLabel={`~${formatCents(Math.round(weeklyBudgetShare))} / wk`}
              showDeficitNotch={weekPct >= 100}
            />
          </div>
        )}

        {/* rolling window consumption — always shown when data is available */}
        {windowRows.length > 0 && (
          <>
            <div className="border-t border-border" />
            <RollingWindows rows={windowRows} />
          </>
        )}

        {/* subscription usage — shown when any subscription-billed runs exist */}
        {totalSubRuns > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Subscription
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{totalSubRuns}</span> runs
                {" · "}
                {totalSubTokens > 0 && (
                  <>
                    <span className="font-mono text-foreground">{formatTokens(totalSubTokens)}</span> total
                    {" · "}
                  </>
                )}
                <span className="font-mono text-foreground">{formatTokens(totalSubInputTokens)}</span> in
                {" · "}
                <span className="font-mono text-foreground">{formatTokens(totalSubOutputTokens)}</span> out
              </p>
              {subSharePct > 0 && (
                <>
                  <MeterBar percent={subSharePct} heightClassName="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(subSharePct)}% of token usage via subscription
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {/* model breakdown — always shown, with token-share bars */}
        {rows.length > 0 && (
          <>
            <div className="border-t border-border" />
            <ModelBreakdown
              rows={rows}
              totalTokens={totalTokens}
              totalCostCents={totalCostCents}
            />
          </>
        )}

        {/* subscription quota windows from provider api — shown when data is available */}
        {showSubscriptionQuotaSection && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Subscription quota
                </p>
                {quotaSource && !isClaudeQuotaPanel && !isCodexQuotaPanel ? (
                  <span className="text-nano uppercase tracking-wide text-muted-foreground">
                    {quotaSourceDisplayName(quotaSource)}
                  </span>
                ) : null}
              </div>
              {quotaLoading ? (
                <QuotaPanelSkeleton />
              ) : isClaudeQuotaPanel ? (
                <ClaudeSubscriptionPanel windows={quotaWindows} source={quotaSource} error={quotaError} />
              ) : isCodexQuotaPanel ? (
                <CodexSubscriptionPanel windows={quotaWindows} source={quotaSource} error={quotaError} />
              ) : (
                <>
                  {quotaError ? (
                    <p className="text-xs text-destructive">
                      {quotaError}
                    </p>
                  ) : null}
                  <div className="space-y-2.5">
                    {quotaWindows.map((qw) => {
                      const fillColor =
                        qw.usedPercent == null
                          ? null
                          : qw.usedPercent >= 90
                            ? "bg-red-400"
                            : qw.usedPercent >= 70
                              ? "bg-yellow-400"
                              : "bg-green-400";
                      return (
                        <div key={qw.label} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono text-muted-foreground shrink-0">{qw.label}</span>
                            <span className="flex-1" />
                            {qw.valueLabel != null ? (
                              <span className="font-medium tabular-nums">{qw.valueLabel}</span>
                            ) : qw.usedPercent != null ? (
                              <span className="font-medium tabular-nums">{qw.usedPercent}% used</span>
                            ) : null}
                          </div>
                          {qw.usedPercent != null && fillColor != null && (
                            <MeterBar percent={qw.usedPercent} fillClassName={fillColor} />
                          )}
                          {qw.detail ? (
                            <p className="text-xs text-muted-foreground">
                              {qw.detail}
                            </p>
                          ) : qw.resetsAt ? (
                            <p className="text-xs text-muted-foreground">
                              resets {new Date(qw.resetsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
