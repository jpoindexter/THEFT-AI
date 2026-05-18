import { BillerSpendCard } from "../../components/BillerSpendCard";
import { PageTabBar } from "../../components/PageTabBar";
import { ProviderQuotaCard } from "../../components/ProviderQuotaCard";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { CostsPageData } from "./useCostsPageData";

export function CostsProvidersTab({ state }: { state: CostsPageData }) {
  if (state.showCustomPrompt) return <p className="text-sm text-muted-foreground">Select a start and end date to load data.</p>;

  return (
    <Tabs value={state.effectiveProvider} onValueChange={state.setActiveProvider}>
      <PageTabBar items={state.providerTabItems} value={state.effectiveProvider} />
      <TabsContent value="all" className="mt-4">
        {state.providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cost events in this period.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {state.providers.map((provider) => <ProviderCard key={provider} provider={provider} state={state} />)}
          </div>
        )}
      </TabsContent>
      {state.providers.map((provider) => (
        <TabsContent key={provider} value={provider} className="mt-4">
          <ProviderCard provider={provider} state={state} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function CostsBillersTab({ state }: { state: CostsPageData }) {
  if (state.showCustomPrompt) return <p className="text-sm text-muted-foreground">Select a start and end date to load data.</p>;

  return (
    <Tabs value={state.effectiveBiller} onValueChange={state.setActiveBiller}>
      <PageTabBar items={state.billerTabItems} value={state.effectiveBiller} />
      <TabsContent value="all" className="mt-4">
        {state.billers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No billable events in this period.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {state.billers.map((biller) => <BillerCard key={biller} biller={biller} state={state} />)}
          </div>
        )}
      </TabsContent>
      {state.billers.map((biller) => (
        <TabsContent key={biller} value={biller} className="mt-4">
          <BillerCard biller={biller} state={state} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ProviderCard({ provider, state }: { provider: string; state: CostsPageData }) {
  return (
    <ProviderQuotaCard
      provider={provider}
      rows={state.byProvider.get(provider) ?? []}
      budgetMonthlyCents={state.spendData?.summary.budgetCents ?? 0}
      totalCompanySpendCents={state.spendData?.summary.spendCents ?? 0}
      weekSpendCents={state.weekSpendByProvider.get(provider) ?? 0}
      windowRows={state.windowSpendByProvider.get(provider) ?? []}
      showDeficitNotch={state.deficitNotchByProvider.get(provider) ?? false}
      quotaWindows={state.quotaWindowsByProvider.get(provider) ?? []}
      quotaError={state.quotaErrorsByProvider.get(provider) ?? null}
      quotaSource={state.quotaSourcesByProvider.get(provider) ?? null}
      quotaLoading={state.quotaLoading}
    />
  );
}

function BillerCard({ biller, state }: { biller: string; state: CostsPageData }) {
  const row = (state.byBiller.get(biller) ?? [])[0];
  if (!row) return null;
  const providerRows = (state.providerData ?? []).filter((entry) => entry.biller === biller);
  return (
    <BillerSpendCard
      row={row}
      weekSpendCents={state.weekSpendByBiller.get(biller) ?? 0}
      budgetMonthlyCents={state.spendData?.summary.budgetCents ?? 0}
      totalCompanySpendCents={state.spendData?.summary.spendCents ?? 0}
      providerRows={providerRows}
    />
  );
}
