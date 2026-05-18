import type { DashboardSummary } from "@paperclipai/shared";
import { Link } from "../../lib/router";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function InboxAlertsSection({
  dashboard,
  showAggregateAgentError,
  showBudgetAlert,
  showSeparator,
  onDismissAlert,
}: {
  dashboard: DashboardSummary | undefined;
  showAggregateAgentError: boolean;
  showBudgetAlert: boolean;
  showSeparator: boolean;
  onDismissAlert: (key: string) => void;
}) {
  if (!showAggregateAgentError && !showBudgetAlert) return null;

  return (
    <>
      {showSeparator ? <Separator /> : null}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Alerts
        </h3>
        <div className="divide-y divide-border border border-border">
          {showAggregateAgentError && dashboard ? (
            <div className="group/alert relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
              <Link to="/agents" className="flex flex-1 cursor-pointer items-center gap-3 no-underline text-inherit">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="text-sm">
                  <span className="font-medium">{dashboard.agents.error}</span>{" "}
                  {dashboard.agents.error === 1 ? "agent has" : "agents have"} errors
                </span>
              </Link>
              <DismissButton onClick={() => onDismissAlert("alert:agent-errors")} />
            </div>
          ) : null}
          {showBudgetAlert && dashboard ? (
            <div className="group/alert relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
              <Link to="/costs" className="flex flex-1 cursor-pointer items-center gap-3 no-underline text-inherit">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
                <span className="text-sm">
                  Budget at{" "}
                  <span className="font-medium">{dashboard.costs.monthUtilizationPercent}%</span>{" "}
                  utilization this month
                </span>
              </Link>
              <DismissButton onClick={() => onDismissAlert("alert:budget")} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      className="h-6 w-6 text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover/alert:opacity-100"
      aria-label="Dismiss"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}
