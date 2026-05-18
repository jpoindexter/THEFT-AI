import { DollarSign } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostsBudgetsTab } from "./costs/CostsBudgetsTab";
import { CostsFinanceTab } from "./costs/CostsFinanceTab";
import { CostsHeader } from "./costs/CostsHeader";
import { CostsOverviewTab } from "./costs/CostsOverviewTab";
import { CostsBillersTab, CostsProvidersTab } from "./costs/CostsProviderTabs";
import { useCostsPageData, type CostsMainTab } from "./costs/useCostsPageData";

export function Costs() {
  const state = useCostsPageData();

  if (!state.selectedCompanyId) {
    return <EmptyState icon={DollarSign} message="Select a company to view runtime usage." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <CostsHeader state={state} />

      <Tabs value={state.mainTab} onValueChange={(value) => state.setMainTab(value as CostsMainTab)}>
        <TabsList variant="line" className="justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="billers">Billers</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <CostsOverviewTab state={state} />
        </TabsContent>
        <TabsContent value="budgets" className="mt-4 space-y-4">
          <CostsBudgetsTab state={state} />
        </TabsContent>
        <TabsContent value="providers" className="mt-4 space-y-4">
          <CostsProvidersTab state={state} />
        </TabsContent>
        <TabsContent value="billers" className="mt-4 space-y-4">
          <CostsBillersTab state={state} />
        </TabsContent>
        <TabsContent value="finance" className="mt-4 space-y-4">
          <CostsFinanceTab state={state} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { Costs as RuntimeUsage };
