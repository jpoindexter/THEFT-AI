import { useMemo } from "react";
import type { CostWindowSpendRow } from "@paperclipai/shared";
import { formatCents, formatTokens } from "@/lib/utils";
import { MeterBar } from "./ProviderQuotaParts";

// Ordered display labels for rolling-window rows.
const ROLLING_WINDOWS = ["5h", "24h", "7d"] as const;

interface RollingWindowsProps {
  rows: CostWindowSpendRow[];
}

export function RollingWindows({ rows }: RollingWindowsProps) {
  const windowMap = useMemo(
    () => new Map(rows.map((row) => [row.window, row])),
    [rows],
  );
  const maxWindowCents = useMemo(
    () => Math.max(...rows.map((row) => row.costCents), 0),
    [rows],
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Rolling windows
      </p>
      <div className="space-y-2.5">
        {ROLLING_WINDOWS.map((windowName) => {
          const row = windowMap.get(windowName);
          if (!row) return null;

          const cents = row.costCents;
          const tokens = row.inputTokens + row.outputTokens;
          const barPct = maxWindowCents > 0 ? (cents / maxWindowCents) * 100 : 0;

          return (
            <div key={windowName} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-muted-foreground w-6 shrink-0">
                  {windowName}
                </span>
                <span className="text-muted-foreground font-mono flex-1">
                  {formatTokens(tokens)} tok
                </span>
                <span className="font-medium tabular-nums">{formatCents(cents)}</span>
              </div>
              <MeterBar percent={barPct} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
