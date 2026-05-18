import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BudgetPolicySummary,
  CostByAgentModel,
  FinanceEvent,
  QuotaWindow,
} from "@paperclipai/shared";
import { budgetsApi } from "../../api/budgets";
import { costsApi } from "../../api/costs";
import { useBreadcrumbs } from "../../context/BreadcrumbContext";
import { useCompany } from "../../context/CompanyContext";
import { PRESET_KEYS, PRESET_LABELS, useDateRange } from "../../hooks/useDateRange";
import { queryKeys } from "../../lib/queryKeys";
import { currentWeekRange } from "./costsModel";
import { buildBillerTabItems, buildDeficitNotches, buildProviderTabItems, groupBy, sumByKey } from "./costsDerived";
import { useTodayDateString } from "./useTodayDateString";

const NO_COMPANY = "__none__";

export type CostsMainTab = "overview" | "budgets" | "providers" | "billers" | "finance";

export function useCostsPageData() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<CostsMainTab>("overview");
  const [activeProvider, setActiveProvider] = useState("all");
  const [activeBiller, setActiveBiller] = useState("all");
  const dateRange = useDateRange();
  const { preset, from, to, customReady } = dateRange;

  useEffect(() => {
    setBreadcrumbs([{ label: "Runtime usage" }]);
  }, [setBreadcrumbs]);

  const today = useTodayDateString();
  const weekRange = useMemo(() => currentWeekRange(), [today]);
  const companyId = selectedCompanyId ?? NO_COMPANY;

  const budgetQuery = useQuery({
    queryKey: queryKeys.budgets.overview(companyId),
    queryFn: () => budgetsApi.overview(companyId),
    enabled: !!selectedCompanyId && customReady,
    refetchInterval: 30_000,
    staleTime: 5_000,
  });

  const invalidateBudgetViews = () => {
    if (!selectedCompanyId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets.overview(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(selectedCompanyId) });
  };

  const policyMutation = useMutation({
    mutationFn: (input: {
      scopeType: BudgetPolicySummary["scopeType"];
      scopeId: string;
      amount: number;
      windowKind: BudgetPolicySummary["windowKind"];
    }) =>
      budgetsApi.upsertPolicy(companyId, {
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        amount: input.amount,
        windowKind: input.windowKind,
      }),
    onSuccess: invalidateBudgetViews,
  });

  const incidentMutation = useMutation({
    mutationFn: (input: { incidentId: string; action: "keep_paused" | "raise_budget_and_resume"; amount?: number }) =>
      budgetsApi.resolveIncident(companyId, input.incidentId, input),
    onSuccess: invalidateBudgetViews,
  });

  const spendQuery = useQuery({
    queryKey: queryKeys.costs(companyId, from || undefined, to || undefined),
    queryFn: async () => {
      const [summary, byAgent, byProject, byAgentModel] = await Promise.all([
        costsApi.summary(companyId, from || undefined, to || undefined),
        costsApi.byAgent(companyId, from || undefined, to || undefined),
        costsApi.byProject(companyId, from || undefined, to || undefined),
        costsApi.byAgentModel(companyId, from || undefined, to || undefined),
      ]);
      return { summary, byAgent, byProject, byAgentModel };
    },
    enabled: !!selectedCompanyId && customReady,
  });

  const financeQuery = useQuery({
    queryKey: [
      queryKeys.financeSummary(companyId, from || undefined, to || undefined),
      queryKeys.financeByBiller(companyId, from || undefined, to || undefined),
      queryKeys.financeByKind(companyId, from || undefined, to || undefined),
      queryKeys.financeEvents(companyId, from || undefined, to || undefined, 18),
    ],
    queryFn: async () => {
      const [summary, byBiller, byKind, events] = await Promise.all([
        costsApi.financeSummary(companyId, from || undefined, to || undefined),
        costsApi.financeByBiller(companyId, from || undefined, to || undefined),
        costsApi.financeByKind(companyId, from || undefined, to || undefined),
        costsApi.financeEvents(companyId, from || undefined, to || undefined, 18),
      ]);
      return { summary, byBiller, byKind, events };
    },
    enabled: !!selectedCompanyId && customReady,
  });

  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  useEffect(() => {
    setExpandedAgents(new Set());
  }, [companyId, from, to]);

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const agentModelRows = useMemo(() => {
    const map = new Map<string, CostByAgentModel[]>();
    for (const row of spendQuery.data?.byAgentModel ?? []) {
      const rows = map.get(row.agentId) ?? [];
      rows.push(row);
      map.set(row.agentId, rows);
    }
    for (const [agentId, rows] of map) map.set(agentId, rows.slice().sort((a, b) => b.costCents - a.costCents));
    return map;
  }, [spendQuery.data?.byAgentModel]);

  const providerQuery = useQuery({
    queryKey: queryKeys.usageByProvider(companyId, from || undefined, to || undefined),
    queryFn: () => costsApi.byProvider(companyId, from || undefined, to || undefined),
    enabled: !!selectedCompanyId && customReady && (mainTab === "providers" || mainTab === "billers"),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const billerQuery = useQuery({
    queryKey: queryKeys.usageByBiller(companyId, from || undefined, to || undefined),
    queryFn: () => costsApi.byBiller(companyId, from || undefined, to || undefined),
    enabled: !!selectedCompanyId && customReady && mainTab === "billers",
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const weekProviderQuery = useQuery({
    queryKey: queryKeys.usageByProvider(companyId, weekRange.from, weekRange.to),
    queryFn: () => costsApi.byProvider(companyId, weekRange.from, weekRange.to),
    enabled: !!selectedCompanyId && (mainTab === "providers" || mainTab === "billers"),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const weekBillerQuery = useQuery({
    queryKey: queryKeys.usageByBiller(companyId, weekRange.from, weekRange.to),
    queryFn: () => costsApi.byBiller(companyId, weekRange.from, weekRange.to),
    enabled: !!selectedCompanyId && mainTab === "billers",
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const windowQuery = useQuery({
    queryKey: queryKeys.usageWindowSpend(companyId),
    queryFn: () => costsApi.windowSpend(companyId),
    enabled: !!selectedCompanyId && mainTab === "providers",
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const quotaQuery = useQuery({
    queryKey: queryKeys.usageQuotaWindows(companyId),
    queryFn: () => costsApi.quotaWindows(companyId),
    enabled: !!selectedCompanyId && mainTab === "providers",
    refetchInterval: 300_000,
    staleTime: 60_000,
  });

  const byProvider = useMemo(() => groupBy(providerQuery.data ?? [], (row) => row.provider), [providerQuery.data]);
  const byBiller = useMemo(() => groupBy(billerQuery.data ?? [], (row) => row.biller), [billerQuery.data]);
  const weekSpendByProvider = useMemo(() => sumByKey(weekProviderQuery.data ?? [], (row) => row.provider), [weekProviderQuery.data]);
  const weekSpendByBiller = useMemo(() => sumByKey(weekBillerQuery.data ?? [], (row) => row.biller), [weekBillerQuery.data]);
  const windowSpendByProvider = useMemo(() => groupBy(windowQuery.data ?? [], (row) => row.provider), [windowQuery.data]);

  const quotaWindowsByProvider = useMemo(() => {
    const map = new Map<string, QuotaWindow[]>();
    for (const result of quotaQuery.data ?? []) {
      if (result.ok && result.windows.length > 0) map.set(result.provider, result.windows);
    }
    return map;
  }, [quotaQuery.data]);

  const quotaErrorsByProvider = useMemo(() => {
    const map = new Map<string, string>();
    for (const result of quotaQuery.data ?? []) {
      if (!result.ok && result.error) map.set(result.provider, result.error);
    }
    return map;
  }, [quotaQuery.data]);

  const quotaSourcesByProvider = useMemo(() => {
    const map = new Map<string, string>();
    for (const result of quotaQuery.data ?? []) {
      if (typeof result.source === "string" && result.source.length > 0) map.set(result.provider, result.source);
    }
    return map;
  }, [quotaQuery.data]);

  const deficitNotchByProvider = useMemo(() => buildDeficitNotches({
    isMonthToDate: preset === "mtd",
    budgetCents: spendQuery.data?.summary.budgetCents ?? 0,
    totalSpendCents: spendQuery.data?.summary.spendCents ?? 0,
    byProvider,
  }), [preset, spendQuery.data, byProvider]);

  const providers = useMemo(() => Array.from(byProvider.keys()), [byProvider]);
  const billers = useMemo(() => Array.from(byBiller.keys()), [byBiller]);
  const effectiveProvider = activeProvider === "all" || providers.includes(activeProvider) ? activeProvider : "all";
  const effectiveBiller = activeBiller === "all" || billers.includes(activeBiller) ? activeBiller : "all";

  useEffect(() => {
    if (effectiveProvider !== activeProvider) setActiveProvider("all");
  }, [effectiveProvider, activeProvider]);
  useEffect(() => {
    if (effectiveBiller !== activeBiller) setActiveBiller("all");
  }, [effectiveBiller, activeBiller]);

  const providerTabItems = useMemo(() => buildProviderTabItems(byProvider), [byProvider]);
  const billerTabItems = useMemo(() => buildBillerTabItems(byBiller), [byBiller]);
  const inferenceTokenTotal = (spendQuery.data?.byAgent ?? []).reduce(
    (sum, row) => sum + row.inputTokens + row.cachedInputTokens + row.outputTokens,
    0,
  );
  const budgetPolicies = budgetQuery.data?.policies ?? [];
  const activeBudgetIncidents = budgetQuery.data?.activeIncidents ?? [];
  const budgetPoliciesByScope = useMemo(() => ({
    company: budgetPolicies.filter((policy) => policy.scopeType === "company"),
    agent: budgetPolicies.filter((policy) => policy.scopeType === "agent"),
    project: budgetPolicies.filter((policy) => policy.scopeType === "project"),
  }), [budgetPolicies]);

  return {
    PRESET_KEYS,
    PRESET_LABELS,
    activeBudgetIncidents,
    agentModelRows,
    billerTabItems,
    billers,
    budgetData: budgetQuery.data,
    budgetError: budgetQuery.error,
    budgetLoading: budgetQuery.isLoading,
    budgetPolicies,
    budgetPoliciesByScope,
    byBiller,
    byProvider,
    dateRange,
    deficitNotchByProvider,
    effectiveBiller,
    effectiveProvider,
    expandedAgents,
    financeData: financeQuery.data,
    financeError: financeQuery.error,
    financeLoading: financeQuery.isLoading,
    incidentMutation,
    inferenceTokenTotal,
    mainTab,
    policyMutation,
    providerData: providerQuery.data,
    providers,
    providerTabItems,
    quotaErrorsByProvider,
    quotaLoading: quotaQuery.isLoading,
    quotaSourcesByProvider,
    quotaWindowsByProvider,
    selectedCompanyId,
    setActiveBiller,
    setActiveProvider,
    setMainTab,
    showCustomPrompt: preset === "custom" && !customReady,
    spendData: spendQuery.data,
    spendError: spendQuery.error,
    spendLoading: spendQuery.isLoading,
    toggleAgent,
    topFinanceEvents: (financeQuery.data?.events ?? []) as FinanceEvent[],
    weekSpendByBiller,
    weekSpendByProvider,
    windowSpendByProvider,
  };
}

export type CostsPageData = ReturnType<typeof useCostsPageData>;
