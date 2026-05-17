import type { Dispatch, SetStateAction } from "react";
import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import {
  DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX,
  DEFAULT_CODEX_LOCAL_MODEL,
} from "@paperclipai/adapter-codex-local";
import { DEFAULT_CURSOR_LOCAL_MODEL } from "@paperclipai/adapter-cursor-local";
import { DEFAULT_GEMINI_LOCAL_MODEL } from "@paperclipai/adapter-gemini-local";
import { DEFAULT_OPENCODE_LOCAL_MODEL } from "@paperclipai/adapter-opencode-local";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import type { AgentConfigOverlay } from "../../lib/agent-config-patch";
import { defaultCreateValues } from "../agent-config-defaults";
import { DraftInput, Field, help } from "../agent-config-primitives";
import { ChoosePathButton } from "../PathInstructionsModal";
import { AdapterEnvironmentResult } from "./adapter-environment-result";
import { AdapterTypeDropdown } from "./adapter-type-dropdown";

type EffectiveAdapterValue = <T>(group: "adapterConfig", field: string, original: T) => T;
type MarkAdapterValue = (group: "adapterConfig", field: string, value: unknown) => void;

export function AgentAdapterSection({
  adapterType,
  cards,
  config,
  disabledTypes,
  eff,
  isCreate,
  mark,
  onCreateChange,
  onTestEnvironment,
  setOverlay,
  showAdapterTypeField,
  showInlineTestButton,
  showInlineTestFeedback,
  showLegacyWorkingDirectoryField,
  testDisabled,
  testError,
  testPending,
  testResult,
  values,
}: {
  adapterType: string;
  cards: boolean;
  config: Record<string, unknown>;
  disabledTypes: Set<string>;
  eff: EffectiveAdapterValue;
  isCreate: boolean;
  mark: MarkAdapterValue;
  onCreateChange: ((patch: Partial<CreateConfigValues>) => void) | null;
  onTestEnvironment: () => void;
  setOverlay: Dispatch<SetStateAction<AgentConfigOverlay>>;
  showAdapterTypeField: boolean;
  showInlineTestButton: boolean;
  showInlineTestFeedback: boolean;
  showLegacyWorkingDirectoryField: boolean;
  testDisabled: boolean;
  testError: unknown;
  testPending: boolean;
  testResult: AdapterEnvironmentTestResult | null;
  values: CreateConfigValues | null;
}) {
  return (
    <div className={cn(!cards && (isCreate ? "border-t border-border" : "border-b border-border"))}>
      <div className={cn(cards ? "flex items-center justify-between mb-3" : "px-4 py-2 flex items-center justify-between gap-2")}>
        {cards
          ? <h3 className="text-sm font-medium">Adapter</h3>
          : <span className="text-xs font-medium text-muted-foreground">Adapter</span>
        }
        {showInlineTestButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={onTestEnvironment}
            disabled={testDisabled}
          >
            {testPending ? "Testing..." : "Test"}
          </Button>
        )}
      </div>
      <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
        {showAdapterTypeField && (
          <Field label="Adapter type" hint={help.adapterType}>
            <AdapterTypeDropdown
              value={adapterType}
              disabledTypes={disabledTypes}
              onChange={(nextType) =>
                handleAdapterTypeChange({
                  isCreate,
                  nextType,
                  onCreateChange,
                  setOverlay,
                })}
            />
          </Field>
        )}

        {showInlineTestFeedback && Boolean(testError) && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {testError instanceof Error ? testError.message : "Environment test failed"}
          </div>
        )}

        {showInlineTestFeedback && testResult && <AdapterEnvironmentResult result={testResult} />}

        {showLegacyWorkingDirectoryField && (
          <Field label="Working directory (deprecated)" hint={help.cwd}>
            <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <DraftInput
                value={isCreate ? values!.cwd : eff("adapterConfig", "cwd", String(config.cwd ?? ""))}
                onCommit={(nextValue) =>
                  isCreate
                    ? onCreateChange!({ cwd: nextValue })
                    : mark("adapterConfig", "cwd", nextValue || undefined)
                }
                immediate
                className="w-full bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40"
                placeholder="/path/to/project"
              />
              <ChoosePathButton />
            </div>
          </Field>
        )}
      </div>
    </div>
  );
}

function handleAdapterTypeChange({
  isCreate,
  nextType,
  onCreateChange,
  setOverlay,
}: {
  isCreate: boolean;
  nextType: string;
  onCreateChange: ((patch: Partial<CreateConfigValues>) => void) | null;
  setOverlay: Dispatch<SetStateAction<AgentConfigOverlay>>;
}) {
  if (isCreate) {
    const { adapterType: _adapterType, ...defaults } = defaultCreateValues;
    const nextValues: CreateConfigValues = { ...defaults, adapterType: nextType };
    nextValues.model = defaultModelForAdapter(nextType);
    if (nextType === "codex_local") {
      nextValues.dangerouslyBypassSandbox = DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX;
    }
    onCreateChange!(nextValues);
    return;
  }

  setOverlay((prev) => ({
    ...prev,
    adapterType: nextType,
    modelProfiles: { cheap: { cleared: true } },
    adapterConfig: {
      model: defaultModelForAdapter(nextType),
      effort: "",
      modelReasoningEffort: "",
      variant: "",
      mode: "",
      ...(nextType === "codex_local"
        ? { dangerouslyBypassApprovalsAndSandbox: DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX }
        : {}),
    },
  }));
}

function defaultModelForAdapter(adapterType: string) {
  if (adapterType === "codex_local") return DEFAULT_CODEX_LOCAL_MODEL;
  if (adapterType === "gemini_local") return DEFAULT_GEMINI_LOCAL_MODEL;
  if (adapterType === "opencode_local") return DEFAULT_OPENCODE_LOCAL_MODEL;
  if (adapterType === "cursor") return DEFAULT_CURSOR_LOCAL_MODEL;
  return "";
}
