import { Settings } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { EnvironmentForm } from "./EnvironmentForm";
import { EnvironmentList } from "./EnvironmentList";
import { EnvironmentSupportMatrix } from "./EnvironmentSupportMatrix";
import type { useCompanyEnvironmentsModel } from "./useCompanyEnvironmentsModel";

type CompanyEnvironmentsModel = ReturnType<typeof useCompanyEnvironmentsModel>;

export function CompanyEnvironmentsContent(model: CompanyEnvironmentsModel) {
  if (!model.selectedCompanyId) {
    return <div className="text-sm text-muted-foreground">Select a company to manage environments.</div>;
  }

  if (!model.environmentsEnabled) {
    return (
      <div className="max-w-3xl space-y-4">
        <CompanyEnvironmentsHeader />
        <Card>
          <CardContent className="px-4 py-4 text-sm text-muted-foreground">
            Enable Environments in instance experimental settings to manage company execution targets.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6" data-testid="company-settings-environments-section">
      <CompanyEnvironmentsHeader />
      <EnvironmentSupportMatrix
        environmentCapabilities={model.environmentCapabilities}
        sandboxSupportVisible={model.sandboxCreationEnabled}
        sandboxProviders={model.discoveredPluginSandboxProviders}
      />
      <EnvironmentList
        environments={model.environments}
        environmentCapabilities={model.environmentCapabilities}
        editingEnvironmentId={model.editingEnvironmentId}
        probeResults={model.probeResults}
        testEnvironmentPending={model.testEnvironmentPending}
        onEdit={model.handleEditEnvironment}
        onTest={model.testEnvironment}
      />
      <EnvironmentForm
        editingEnvironmentId={model.editingEnvironmentId}
        environmentForm={model.environmentForm}
        environmentFormValid={model.environmentFormValid}
        environmentMutation={model.environmentMutation}
        draftEnvironmentProbeMutation={model.draftEnvironmentProbeMutation}
        pluginSandboxProviders={model.pluginSandboxProviders}
        sandboxCreationEnabled={model.sandboxCreationEnabled}
        sandboxConfigErrors={model.sandboxConfigErrors}
        secrets={model.secrets}
        selectedSandboxProvider={model.selectedSandboxProvider}
        selectedSandboxSchema={model.selectedSandboxSchema}
        setEnvironmentForm={model.setEnvironmentForm}
        onCancel={model.handleCancelEnvironmentEdit}
      />
    </div>
  );
}

function CompanyEnvironmentsHeader() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Company Environments</h1>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Define reusable execution targets for projects, issue workspaces, and remote-capable adapters.
      </p>
    </div>
  );
}
