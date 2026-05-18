import { FinanceBillerCard } from "../../components/FinanceBillerCard";
import { FinanceKindCard } from "../../components/FinanceKindCard";
import { FinanceTimelineCard } from "../../components/FinanceTimelineCard";
import { PageSkeleton } from "../../components/PageSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostsPageData } from "./useCostsPageData";
import { FinanceSummaryCard } from "./costsModel";

export function CostsFinanceTab({ state }: { state: CostsPageData }) {
  if (state.showCustomPrompt) return <p className="text-sm text-muted-foreground">Select a start and end date to load data.</p>;
  if (state.financeLoading) return <PageSkeleton variant="costs" />;
  if (state.financeError) return <p className="text-sm text-destructive">{(state.financeError as Error).message}</p>;

  return (
    <>
      <FinanceSummaryCard
        debitCents={state.financeData?.summary.debitCents ?? 0}
        creditCents={state.financeData?.summary.creditCents ?? 0}
        netCents={state.financeData?.summary.netCents ?? 0}
        estimatedDebitCents={state.financeData?.summary.estimatedDebitCents ?? 0}
        eventCount={state.financeData?.summary.eventCount ?? 0}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-base">By biller</CardTitle>
              <CardDescription>Account-level financial events grouped by who charged or credited them.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-5 pb-5 pt-2 md:grid-cols-2">
              {(state.financeData?.byBiller.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No finance events yet.</p>
              ) : (
                state.financeData?.byBiller.map((row) => <FinanceBillerCard key={row.biller} row={row} />)
              )}
            </CardContent>
          </Card>
          <FinanceTimelineCard rows={state.topFinanceEvents} />
        </div>

        <FinanceKindCard rows={state.financeData?.byKind ?? []} />
      </div>
    </>
  );
}
