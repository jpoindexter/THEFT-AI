import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ONBOARDING_STAGE_LABELS, type OnboardingStage } from "@/lib/onboarding-context";
import { DEPARTMENT_SEED_SPECS } from "@/lib/onboarding-seed";
import { AssemblyRuntimeSettings } from "./AssemblyRuntimeSettings";
import type { AdapterChoice, AdapterModelEntry, AdapterModelGroup } from "./types";

export function AssemblyStepForm(props: {
  agentName: string;
  setAgentName: (value: string) => void;
  companyStage: OnboardingStage;
  adapterType: string;
  setAdapterType: (value: string) => void;
  adapterLabel: string;
  model: string;
  setModel: (value: string) => void;
  url: string;
  setUrl: (value: string) => void;
  modelOpen: boolean;
  setModelOpen: (value: boolean) => void;
  modelSearch: string;
  setModelSearch: (value: string) => void;
  selectedModel?: AdapterModelEntry;
  groupedModels: AdapterModelGroup[];
  filteredModels: AdapterModelEntry[];
  recommendedAdapters: AdapterChoice[];
  moreAdapters: AdapterChoice[];
  showAdvancedRuntime: boolean;
  setShowAdvancedRuntime: (value: boolean | ((value: boolean) => boolean)) => void;
  showMoreAdapters: boolean;
  setShowMoreAdapters: (value: boolean | ((value: boolean) => boolean)) => void;
  isLocalAdapter: boolean;
  adapterEnvLoading: boolean;
  adapterEnvError: string | null;
  adapterEnvResult: AdapterEnvironmentTestResult | null;
  shouldSuggestUnsetAnthropicApiKey: boolean;
  unsetAnthropicLoading: boolean;
  effectiveAdapterCommand: string;
  onTestEnvironment: () => void;
  onUnsetAnthropicApiKey: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-3">
        <div className="bg-muted/50 p-2">
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">Assemble your company</h3>
          <p className="text-xs text-muted-foreground">
            THEFT will create an Operator, departments, starter work, and
            Library-ready outputs.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Operator name
        </label>
        <Input
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
          placeholder="Operator"
          value={props.agentName}
          onChange={(e) => props.setAgentName(e.target.value)}
          autoFocus
        />
      </div>

      <AssemblyPreview
        agentName={props.agentName}
        companyStage={props.companyStage}
      />

      <AssemblyRuntimeSettings {...props} />
    </div>
  );
}

function AssemblyPreview({
  agentName,
  companyStage,
}: {
  agentName: string;
  companyStage: OnboardingStage;
}) {
  return (
    <div className="theft-surface-muted p-3" aria-label="Company assembly preview">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Company assembly preview</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Launch creates one company workspace with Operator-led departments
            and starter tasks.
          </p>
        </div>
        <span className="theft-chip px-2 py-1 text-micro text-muted-foreground">
          {ONBOARDING_STAGE_LABELS[companyStage]}
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="theft-inset-surface flex items-center gap-2 px-2.5 py-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{agentName || "Operator"}</p>
            <p className="text-micro text-muted-foreground">
              Routes work, keeps the founder oriented, and owns the first task.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium">Departments</p>
            <p className="text-micro text-muted-foreground">
              {DEPARTMENT_SEED_SPECS.length} business lanes
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEPARTMENT_SEED_SPECS.map((department) => (
              <div
                key={department.key}
                className="theft-inset-surface px-2 py-1.5"
              >
                <p className="truncate text-micro font-medium">
                  {department.title}
                </p>
                <p className="truncate text-nano text-muted-foreground">
                  {department.taskTitleByStage[companyStage]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
