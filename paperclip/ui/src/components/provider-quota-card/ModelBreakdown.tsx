import type { CostByProviderModel } from "@paperclipai/shared";
import { billingTypeDisplayName, formatCents, formatTokens, providerDisplayName } from "@/lib/utils";
import { MeterFill } from "./ProviderQuotaParts";

interface ModelBreakdownProps {
  rows: CostByProviderModel[];
  totalTokens: number;
  totalCostCents: number;
}

export function ModelBreakdown({
  rows,
  totalTokens,
  totalCostCents,
}: ModelBreakdownProps) {
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const rowTokens = row.inputTokens + row.outputTokens;
        const tokenPct = totalTokens > 0 ? (rowTokens / totalTokens) * 100 : 0;
        const costPct = totalCostCents > 0 ? (row.costCents / totalCostCents) * 100 : 0;

        return (
          <div key={`${row.provider}:${row.model}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground truncate font-mono block">
                  {row.model}
                </span>
                <span className="text-micro text-muted-foreground truncate block">
                  {providerDisplayName(row.biller)} · {billingTypeDisplayName(row.billingType)}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 tabular-nums text-xs">
                <span className="text-muted-foreground">
                  {formatTokens(rowTokens)} tok
                </span>
                <span className="font-medium">{formatCents(row.costCents)}</span>
              </div>
            </div>

            <div className="relative h-2 w-full border border-border overflow-hidden">
              <MeterFill
                percent={tokenPct}
                className="absolute inset-y-0 left-0 bg-primary/60"
                title={`${Math.round(tokenPct)}% of provider tokens`}
              />
              <MeterFill
                percent={costPct}
                className="absolute inset-y-0 left-0 bg-primary/85"
                title={`${Math.round(costPct)}% of provider cost`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
