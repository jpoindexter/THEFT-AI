import { ArrowUpRight, Coins, DollarSign, ReceiptText } from "lucide-react";
import { BudgetIncidentCard } from "../../components/BudgetIncidentCard";
import { BudgetPolicyCard } from "../../components/BudgetPolicyCard";
import { PageSkeleton } from "../../components/PageSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostsPageData } from "./useCostsPageData";
import { MetricTile } from "./costsModel";

export function CostsBudgetsTab({ state }: { state: CostsPageData }) {
  const {
    activeBudgetIncidents,
    budgetData,
    budgetError,
    budgetLoading,
    budgetPolicies,
    budgetPoliciesByScope,
    incidentMutation,
    policyMutation,
  } = state;

  if (budgetLoading) return <PageSkeleton variant="costs" />;
  if (budgetError) return <p className="text-sm text-destructive">{(budgetError as Error).message}</p>;

  return (
    <>
      <Card>
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-base">Budget control plane</CardTitle>
          <CardDescription>
            Hard-stop spend limits for agents and projects. Provider subscription quota stays separate and appears under Providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pb-5 pt-0 md:grid-cols-4">
          <MetricTile label="Active incidents" value={String(activeBudgetIncidents.length)} subtitle="Open soft or hard threshold crossings" icon={ReceiptText} />
          <MetricTile label="Pending approvals" value={String(budgetData?.pendingApprovalCount ?? 0)} subtitle="Budget override approvals awaiting board action" icon={ArrowUpRight} />
          <MetricTile label="Paused agents" value={String(budgetData?.pausedAgentCount ?? 0)} subtitle="Agent heartbeats blocked by budget" icon={Coins} />
          <MetricTile label="Paused projects" value={String(budgetData?.pausedProjectCount ?? 0)} subtitle="Project execution blocked by budget" icon={DollarSign} />
        </CardContent>
      </Card>

      {activeBudgetIncidents.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Active incidents</h2>
            <p className="text-sm text-muted-foreground">Resolve hard stops here by raising the budget or explicitly keeping the scope paused.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {activeBudgetIncidents.map((incident) => (
              <BudgetIncidentCard
                key={incident.id}
                incident={incident}
                isMutating={incidentMutation.isPending}
                onKeepPaused={() => incidentMutation.mutate({ incidentId: incident.id, action: "keep_paused" })}
                onRaiseAndResume={(amount) => incidentMutation.mutate({ incidentId: incident.id, action: "raise_budget_and_resume", amount })}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-5">
        {(["company", "agent", "project"] as const).map((scopeType) => {
          const rows = budgetPoliciesByScope[scopeType];
          if (rows.length === 0) return null;
          return (
            <section key={scopeType} className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold capitalize">{scopeType} budgets</h2>
                <p className="text-sm text-muted-foreground">{scopeDescription(scopeType)}</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {rows.map((summary) => (
                  <BudgetPolicyCard
                    key={summary.policyId}
                    summary={summary}
                    isSaving={policyMutation.isPending}
                    onSave={(amount) =>
                      policyMutation.mutate({
                        scopeType: summary.scopeType,
                        scopeId: summary.scopeId,
                        amount,
                        windowKind: summary.windowKind,
                      })}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {budgetPolicies.length === 0 ? (
          <Card>
            <CardContent className="px-5 py-8 text-sm text-muted-foreground">
              No budget policies yet. Set agent and project budgets from their detail pages, or use the existing company monthly budget control.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}

function scopeDescription(scopeType: "company" | "agent" | "project") {
  if (scopeType === "company") return "Company-wide monthly policy.";
  if (scopeType === "agent") return "Recurring monthly spend policies for individual agents.";
  return "Lifetime spend policies for execution-bound projects.";
}
