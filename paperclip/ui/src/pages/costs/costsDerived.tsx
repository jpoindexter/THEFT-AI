import type { CostByBiller, CostByProviderModel } from "@paperclipai/shared";
import { formatCents, formatTokens } from "../../lib/utils";
import { BillerTabLabel, ProviderTabLabel } from "./costsModel";

export function groupBy<T, K extends string>(rows: T[], keyOf: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const grouped = map.get(key) ?? [];
    grouped.push(row);
    map.set(key, grouped);
  }
  return map;
}

export function sumByKey<T extends { costCents: number }>(rows: T[], keyOf: (row: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) map.set(keyOf(row), (map.get(keyOf(row)) ?? 0) + row.costCents);
  return map;
}

export function buildProviderTabItems(byProvider: Map<string, CostByProviderModel[]>) {
  const providerKeys = Array.from(byProvider.keys());
  const allTokens = providerKeys.reduce(
    (sum, provider) => sum + (byProvider.get(provider)?.reduce((acc, row) => acc + row.inputTokens + row.cachedInputTokens + row.outputTokens, 0) ?? 0),
    0,
  );
  const allCents = providerKeys.reduce(
    (sum, provider) => sum + (byProvider.get(provider)?.reduce((acc, row) => acc + row.costCents, 0) ?? 0),
    0,
  );
  return [
    {
      value: "all",
      label: (
        <span className="flex items-center gap-1.5">
          <span>All providers</span>
          {providerKeys.length > 0 ? (
            <>
              <span className="font-mono text-xs text-muted-foreground">{formatTokens(allTokens)}</span>
              <span className="text-xs text-muted-foreground">{formatCents(allCents)}</span>
            </>
          ) : null}
        </span>
      ),
    },
    ...providerKeys.map((provider) => ({
      value: provider,
      label: <ProviderTabLabel provider={provider} rows={byProvider.get(provider) ?? []} />,
    })),
  ];
}

export function buildBillerTabItems(byBiller: Map<string, CostByBiller[]>) {
  const billerKeys = Array.from(byBiller.keys());
  const allTokens = billerKeys.reduce(
    (sum, biller) => sum + (byBiller.get(biller)?.reduce((acc, row) => acc + row.inputTokens + row.cachedInputTokens + row.outputTokens, 0) ?? 0),
    0,
  );
  const allCents = billerKeys.reduce(
    (sum, biller) => sum + (byBiller.get(biller)?.reduce((acc, row) => acc + row.costCents, 0) ?? 0),
    0,
  );
  return [
    {
      value: "all",
      label: (
        <span className="flex items-center gap-1.5">
          <span>All billers</span>
          {billerKeys.length > 0 ? (
            <>
              <span className="font-mono text-xs text-muted-foreground">{formatTokens(allTokens)}</span>
              <span className="text-xs text-muted-foreground">{formatCents(allCents)}</span>
            </>
          ) : null}
        </span>
      ),
    },
    ...billerKeys.map((biller) => ({
      value: biller,
      label: <BillerTabLabel biller={biller} rows={byBiller.get(biller) ?? []} />,
    })),
  ];
}

export function buildDeficitNotches({
  isMonthToDate,
  budgetCents,
  totalSpendCents,
  byProvider,
}: {
  isMonthToDate: boolean;
  budgetCents: number;
  totalSpendCents: number;
  byProvider: Map<string, CostByProviderModel[]>;
}) {
  const map = new Map<string, boolean>();
  if (!isMonthToDate || budgetCents <= 0) return map;
  const now = new Date();
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (const [providerKey, rows] of byProvider) {
    const providerCostCents = rows.reduce((sum, row) => sum + row.costCents, 0);
    const providerShare = totalSpendCents > 0 ? providerCostCents / totalSpendCents : 0;
    const providerBudget = budgetCents * providerShare;
    const burnRate = providerCostCents / Math.max(daysElapsed, 1);
    map.set(providerKey, providerBudget > 0 && providerCostCents + burnRate * (daysInMonth - daysElapsed) > providerBudget);
  }
  return map;
}
