import { ChevronDown, ChevronRight } from "lucide-react";
import { BudgetIncidentCard } from "../../components/BudgetIncidentCard";
import { FinanceTimelineCard } from "../../components/FinanceTimelineCard";
import { Identity } from "../../components/Identity";
import { PageSkeleton } from "../../components/PageSkeleton";
import { StatusBadge } from "../../components/StatusBadge";
import { QuotaProgressBar } from "../../components/quota/QuotaProgressBar";
import { billingTypeDisplayName, cn, formatCents, formatTokens, providerDisplayName } from "../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostsPageData } from "./useCostsPageData";
import { FinanceSummaryCard } from "./costsModel";

export function CostsOverviewTab({ state }: { state: CostsPageData }) {
  const {
    activeBudgetIncidents,
    agentModelRows,
    expandedAgents,
    financeData,
    financeError,
    financeLoading,
    incidentMutation,
    inferenceTokenTotal,
    showCustomPrompt,
    spendData,
    spendError,
    spendLoading,
    toggleAgent,
    topFinanceEvents,
  } = state;
  const showOverviewLoading = (spendLoading || financeLoading) && state.dateRange.customReady;
  const overviewError = spendError ?? financeError;

  if (showCustomPrompt) return <p className="text-sm text-muted-foreground">Select a start and end date to load data.</p>;
  if (showOverviewLoading) return <PageSkeleton variant="costs" />;
  if (overviewError) return <p className="text-sm text-destructive">{(overviewError as Error).message}</p>;

  return (
    <>
      {activeBudgetIncidents.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {activeBudgetIncidents.slice(0, 2).map((incident) => (
            <BudgetIncidentCard
              key={incident.id}
              incident={incident}
              isMutating={incidentMutation.isPending}
              onKeepPaused={() => incidentMutation.mutate({ incidentId: incident.id, action: "keep_paused" })}
              onRaiseAndResume={(amount) =>
                incidentMutation.mutate({ incidentId: incident.id, action: "raise_budget_and_resume", amount })}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <InferenceLedgerCard inferenceTokenTotal={inferenceTokenTotal} spendData={spendData} />
        <FinanceSummaryCard
          debitCents={financeData?.summary.debitCents ?? 0}
          creditCents={financeData?.summary.creditCents ?? 0}
          netCents={financeData?.summary.netCents ?? 0}
          estimatedDebitCents={financeData?.summary.estimatedDebitCents ?? 0}
          eventCount={financeData?.summary.eventCount ?? 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AgentSpendCard
          rows={spendData?.byAgent ?? []}
          agentModelRows={agentModelRows}
          expandedAgents={expandedAgents}
          onToggleAgent={toggleAgent}
        />
        <div className="space-y-4">
          <ProjectSpendCard rows={spendData?.byProject ?? []} />
          <FinanceTimelineCard rows={topFinanceEvents.slice(0, 6)} emptyMessage="No finance events yet. Add account-level charges once biller invoices or credits land." />
        </div>
      </div>
    </>
  );
}

function InferenceLedgerCard({ inferenceTokenTotal, spendData }: { inferenceTokenTotal: number; spendData: CostsPageData["spendData"] }) {
  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-2">
        <CardTitle className="text-base">Inference ledger</CardTitle>
        <CardDescription>Request-scoped inference spend for the selected period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 pt-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-semibold tabular-nums">{formatCents(spendData?.summary.spendCents ?? 0)}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {spendData?.summary.budgetCents && spendData.summary.budgetCents > 0
                ? `Budget ${formatCents(spendData.summary.budgetCents)}`
                : "Unlimited budget"}
            </div>
          </div>
          <div className="border border-border px-4 py-3 text-right">
            <div className="theft-label-nano text-muted-foreground">usage</div>
            <div className="mt-1 text-lg font-medium tabular-nums">{formatTokens(inferenceTokenTotal)}</div>
          </div>
        </div>
        {spendData?.summary.budgetCents && spendData.summary.budgetCents > 0 ? (
          <div className="space-y-2">
            <QuotaProgressBar usedPercent={spendData.summary.utilizationPercent} />
            <div className="text-xs text-muted-foreground">
              {spendData.summary.utilizationPercent}% of monthly budget consumed in this range.
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AgentSpendCard({
  rows,
  agentModelRows,
  expandedAgents,
  onToggleAgent,
}: {
  rows: NonNullable<CostsPageData["spendData"]>["byAgent"];
  agentModelRows: CostsPageData["agentModelRows"];
  expandedAgents: Set<string>;
  onToggleAgent: (agentId: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-2">
        <CardTitle className="text-base">By agent</CardTitle>
        <CardDescription>What each agent consumed in the selected period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-5 pt-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cost events yet.</p>
        ) : rows.map((row) => (
          <AgentSpendRow
            key={row.agentId}
            row={row}
            modelRows={agentModelRows.get(row.agentId) ?? []}
            isExpanded={expandedAgents.has(row.agentId)}
            onToggle={() => onToggleAgent(row.agentId)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function AgentSpendRow({ row, modelRows, isExpanded, onToggle }: {
  row: NonNullable<CostsPageData["spendData"]>["byAgent"][number];
  modelRows: NonNullable<CostsPageData["agentModelRows"]> extends Map<string, infer R> ? R : never;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasBreakdown = modelRows.length > 0;
  return (
    <div className="border border-border px-4 py-3">
      <div className={cn("flex items-start justify-between gap-3", hasBreakdown ? "cursor-pointer select-none" : "")} onClick={() => hasBreakdown && onToggle()}>
        <div className="flex min-w-0 items-center gap-2">
          {hasBreakdown ? (isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />) : <span className="h-3 w-3 shrink-0" />}
          <Identity name={row.agentName ?? row.agentId} size="sm" />
          {row.agentStatus === "terminated" ? <StatusBadge status="terminated" /> : null}
        </div>
        <div className="text-right text-sm tabular-nums">
          <div className="font-medium">{formatCents(row.costCents)}</div>
          <div className="text-xs text-muted-foreground">in {formatTokens(row.inputTokens + row.cachedInputTokens)} · out {formatTokens(row.outputTokens)}</div>
          {(row.apiRunCount > 0 || row.subscriptionRunCount > 0) ? (
            <div className="text-xs text-muted-foreground">{row.apiRunCount > 0 ? `${row.apiRunCount} api` : "0 api"} · {row.subscriptionRunCount > 0 ? `${row.subscriptionRunCount} subscription` : "0 subscription"}</div>
          ) : null}
        </div>
      </div>
      {isExpanded && modelRows.length > 0 ? <AgentModelBreakdown modelRows={modelRows} totalCostCents={row.costCents} /> : null}
    </div>
  );
}

function AgentModelBreakdown({ modelRows, totalCostCents }: { modelRows: CostsPageData["agentModelRows"] extends Map<string, infer R> ? R : never; totalCostCents: number }) {
  return (
    <div className="mt-3 space-y-2 border-l border-border pl-4">
      {modelRows.map((modelRow) => {
        const sharePct = totalCostCents > 0 ? Math.round((modelRow.costCents / totalCostCents) * 100) : 0;
        return (
          <div key={`${modelRow.provider}:${modelRow.model}:${modelRow.billingType}`} className="flex items-start justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{providerDisplayName(modelRow.provider)}<span className="mx-1 text-border">/</span><span className="font-mono">{modelRow.model}</span></div>
              <div className="truncate text-muted-foreground">{providerDisplayName(modelRow.biller)} · {billingTypeDisplayName(modelRow.billingType)}</div>
            </div>
            <div className="text-right tabular-nums">
              <div className="font-medium">{formatCents(modelRow.costCents)}<span className="ml-1 font-normal text-muted-foreground">({sharePct}%)</span></div>
              <div className="text-muted-foreground">{formatTokens(modelRow.inputTokens + modelRow.cachedInputTokens + modelRow.outputTokens)} tok</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectSpendCard({ rows }: { rows: NonNullable<CostsPageData["spendData"]>["byProject"] }) {
  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-2">
        <CardTitle className="text-base">By project</CardTitle>
        <CardDescription>Run costs attributed through project-linked issues.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-5 pt-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No project-attributed run costs yet.</p>
        ) : rows.map((row, index) => (
          <div key={row.projectId ?? `unattributed-${index}`} className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm">
            <span className="truncate">{row.projectName ?? row.projectId ?? "Unattributed"}</span>
            <span className="font-medium tabular-nums">{formatCents(row.costCents)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
