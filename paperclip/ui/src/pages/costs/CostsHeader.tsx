import { ArrowUpRight, Coins, DollarSign, ReceiptText } from "lucide-react";
import { formatCents, formatTokens } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CostsPageData } from "./useCostsPageData";
import { MetricTile } from "./costsModel";

export function CostsHeader({ state }: { state: CostsPageData }) {
  const { dateRange, PRESET_KEYS, PRESET_LABELS, activeBudgetIncidents, budgetData, financeData, inferenceTokenTotal, spendData } = state;
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo } = dateRange;

  return (
    <div className="theft-panel space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="theft-label-compact text-muted-foreground">System diagnostics</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Runtime usage</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Local runtime tokens, provider spend, quota windows, and budget stops. This is operational context, not the main work surface.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_KEYS.map((key) => (
            <Button
              key={key}
              variant={preset === key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreset(key)}
            >
              {PRESET_LABELS[key]}
            </Button>
          ))}
        </div>
      </div>

      {preset === "custom" ? (
        <div className="flex flex-wrap items-center gap-2 border border-border p-3">
          <Input
            type="date"
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
            className="h-9 w-auto"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
            className="h-9 w-auto"
          />
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-4">
        <MetricTile
          label="Inference spend"
          value={formatCents(spendData?.summary.spendCents ?? 0)}
          subtitle={`${formatTokens(inferenceTokenTotal)} tokens across request-scoped events`}
          icon={DollarSign}
        />
        <MetricTile
          label="Budget"
          value={activeBudgetIncidents.length > 0 ? String(activeBudgetIncidents.length) : (
            spendData?.summary.budgetCents && spendData.summary.budgetCents > 0
              ? `${spendData.summary.utilizationPercent}%`
              : "Open"
          )}
          subtitle={
            activeBudgetIncidents.length > 0
              ? `${budgetData?.pausedAgentCount ?? 0} agents paused · ${budgetData?.pausedProjectCount ?? 0} projects paused`
              : spendData?.summary.budgetCents && spendData.summary.budgetCents > 0
                ? `${formatCents(spendData.summary.spendCents)} of ${formatCents(spendData.summary.budgetCents)}`
                : "No monthly cap configured"
          }
          icon={Coins}
        />
        <MetricTile
          label="Finance net"
          value={formatCents(financeData?.summary.netCents ?? 0)}
          subtitle={`${formatCents(financeData?.summary.debitCents ?? 0)} debits · ${formatCents(financeData?.summary.creditCents ?? 0)} credits`}
          icon={ReceiptText}
        />
        <MetricTile
          label="Finance events"
          value={String(financeData?.summary.eventCount ?? 0)}
          subtitle={`${formatCents(financeData?.summary.estimatedDebitCents ?? 0)} estimated in range`}
          icon={ArrowUpRight}
        />
      </div>
    </div>
  );
}
