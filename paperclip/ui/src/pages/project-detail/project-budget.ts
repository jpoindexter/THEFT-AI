import type { BudgetPolicySummary } from "@paperclipai/shared";

import { projectsApi } from "@/api/projects";

export function buildBudgetSummary({
  matched,
  project,
  resolvedCompanyId,
  routeProjectRef,
}: {
  matched?: BudgetPolicySummary;
  project: Awaited<ReturnType<typeof projectsApi.get>> | undefined;
  resolvedCompanyId: string | null | undefined;
  routeProjectRef: string;
}): BudgetPolicySummary {
  if (matched) return matched;
  return {
    policyId: "",
    companyId: resolvedCompanyId ?? "",
    scopeType: "project",
    scopeId: project?.id ?? routeProjectRef,
    scopeName: project?.name ?? "Project",
    metric: "billed_cents",
    windowKind: "lifetime",
    amount: 0,
    observedAmount: 0,
    remainingAmount: 0,
    utilizationPercent: 0,
    warnPercent: 80,
    hardStopEnabled: true,
    notifyEnabled: true,
    isActive: false,
    status: "ok",
    paused: Boolean(project?.pausedAt),
    pauseReason: project?.pauseReason ?? null,
    windowStart: new Date(),
    windowEnd: new Date(),
  };
}
