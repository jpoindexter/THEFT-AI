import type { ComponentType } from "react";
import type { CompanySecret, EnvBinding, Environment } from "@paperclipai/shared";
import type { AdapterConfigFieldsProps } from "../../adapters/types";
import type { AdapterModel } from "../../api/agents";
import { cn } from "../../lib/utils";
import { ClaudeLocalAdvancedFields } from "../../adapters/claude-local/config-fields";
import { MarkdownEditor } from "../MarkdownEditor";
import { EnvVarEditor } from "../EnvVarEditor";
import { DraftInput, DraftNumberInput, Field, help } from "../agent-config-primitives";
import { CheapModelSection, ModelDropdown, ThinkingEffortDropdown } from "./model-dropdown";
import { EMPTY_ENV, formatArgList, parseCommaArgs } from "./constants";

export function AdapterConfigurationSection({
  adapterCommandField,
  adapterDefaultModel,
  adapterFieldProps,
  agentId,
  availableSecrets,
  cards,
  cheapModelOpen,
  codexSearchEnabled,
  ConfigFields,
  currentCheapEnabled,
  currentCheapModel,
  currentDefaultEnvironment,
  currentModelId,
  currentThinkingEffort,
  detectedModel,
  fetchedModelsError,
  inputClass,
  modelOpen,
  models,
  onCheapEnabledChange,
  onCheapModelChange,
  onCheapModelOpenChange,
  onCreateSecret,
  onDetectModel,
  onModelOpenChange,
  onRefreshModels,
  onThinkingEffortOpenChange,
  refreshModelsError,
  refreshingModels,
  showThinkingEffort,
  supportsModelProfiles,
  thinkingEffortKey,
  thinkingEffortOpen,
  thinkingEffortOptions,
  uploadImage,
}: {
  adapterCommandField: string;
  adapterDefaultModel: string;
  adapterFieldProps: AdapterConfigFieldsProps;
  agentId: string | null;
  availableSecrets: CompanySecret[];
  cards: boolean;
  cheapModelOpen: boolean;
  codexSearchEnabled: boolean;
  ConfigFields: ComponentType<AdapterConfigFieldsProps>;
  currentCheapEnabled: boolean;
  currentCheapModel: string;
  currentDefaultEnvironment: Environment | null | undefined;
  currentModelId: string;
  currentThinkingEffort: string;
  detectedModel: string | null;
  fetchedModelsError: unknown;
  inputClass: string;
  modelOpen: boolean;
  models: AdapterModel[];
  onCheapEnabledChange: (enabled: boolean) => void;
  onCheapModelChange: (model: string) => void;
  onCheapModelOpenChange: (open: boolean) => void;
  onCreateSecret: (name: string, value: string) => Promise<CompanySecret>;
  onDetectModel?: () => Promise<string | null>;
  onModelOpenChange: (open: boolean) => void;
  onRefreshModels?: () => Promise<void>;
  onThinkingEffortOpenChange: (open: boolean) => void;
  refreshModelsError: string | null;
  refreshingModels: boolean;
  showThinkingEffort: boolean;
  supportsModelProfiles: boolean;
  thinkingEffortKey: string;
  thinkingEffortOpen: boolean;
  thinkingEffortOptions: ReadonlyArray<{ id: string; label: string }>;
  uploadImage: (file: File, namespace: string) => Promise<string>;
}) {
  const { adapterType, config, eff, isCreate, mark, set, values } = adapterFieldProps;

  return (
    <div className={cn(!cards && "border-b border-border")}>
      {cards ? (
        <h3 className="mb-3 text-sm font-medium">Permissions &amp; Configuration</h3>
      ) : (
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground">Permissions &amp; Configuration</div>
      )}
      <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
        <Field label="Command" hint={help.localCommand}>
          <DraftInput
            value={
              isCreate
                ? values!.command
                : eff(
                    "adapterConfig",
                    adapterCommandField,
                    String(
                      (adapterType === "hermes_local"
                        ? config.hermesCommand ?? config.command
                        : config.command) ?? "",
                    ),
                  )
            }
            onCommit={(nextValue) =>
              isCreate
                ? set!({ command: nextValue })
                : mark("adapterConfig", adapterCommandField, nextValue || null)
            }
            immediate
            className={inputClass}
            placeholder={commandPlaceholder(adapterType)}
          />
        </Field>

        {supportsModelProfiles && (
          <div className="text-micro uppercase tracking-wide text-muted-foreground">Primary model</div>
        )}
        <ModelDropdown
          models={models}
          value={currentModelId}
          onChange={(nextValue) =>
            isCreate
              ? set!({ model: nextValue })
              : mark("adapterConfig", "model", nextValue || undefined)
          }
          open={modelOpen}
          onOpenChange={onModelOpenChange}
          allowDefault={adapterType !== "opencode_local"}
          required={adapterType === "opencode_local"}
          groupByProvider={adapterType === "opencode_local"}
          creatable
          detectedModel={detectedModel}
          detectedModelCandidates={[]}
          onDetectModel={onDetectModel}
          onRefreshModels={onRefreshModels}
          refreshingModels={refreshingModels}
          detectModelLabel="Detect model"
          emptyDetectHint="No model detected. Select or enter one manually."
        />
        {Boolean(refreshModelsError || fetchedModelsError) && (
          <p className="text-xs text-destructive">
            {refreshModelsError
              ?? (fetchedModelsError instanceof Error
                ? fetchedModelsError.message
                : "Failed to load adapter models.")}
          </p>
        )}
        {adapterType === "opencode_local"
          && currentDefaultEnvironment
          && currentDefaultEnvironment.driver !== "local" && (
          <p className="text-xs text-muted-foreground">
            Live OpenCode model discovery only runs for Local environments. Using the curated list and manual entry for {currentDefaultEnvironment.name}.
          </p>
        )}

        {supportsModelProfiles && (
          <CheapModelSection
            enabled={currentCheapEnabled}
            model={currentCheapModel}
            models={models}
            adapterType={adapterType}
            adapterDefaultModel={adapterDefaultModel}
            onEnabledChange={onCheapEnabledChange}
            onModelChange={onCheapModelChange}
            open={cheapModelOpen}
            onOpenChange={onCheapModelOpenChange}
          />
        )}

        {showThinkingEffort && (
          <>
            <ThinkingEffortDropdown
              value={currentThinkingEffort}
              options={thinkingEffortOptions}
              onChange={(nextValue) =>
                isCreate
                  ? set!({ thinkingEffort: nextValue })
                  : mark("adapterConfig", thinkingEffortKey, nextValue || undefined)
              }
              open={thinkingEffortOpen}
              onOpenChange={onThinkingEffortOpenChange}
            />
            {adapterType === "codex_local" &&
              codexSearchEnabled &&
              currentThinkingEffort === "minimal" && (
                <p className="text-xs text-amber-400">
                  Codex may reject `minimal` thinking when search is enabled.
                </p>
              )}
          </>
        )}
        {!isCreate && typeof config.bootstrapPromptTemplate === "string" && config.bootstrapPromptTemplate && (
          <>
            <Field label="Bootstrap prompt (legacy)" hint={help.bootstrapPrompt}>
              <MarkdownEditor
                value={eff(
                  "adapterConfig",
                  "bootstrapPromptTemplate",
                  String(config.bootstrapPromptTemplate ?? ""),
                )}
                onChange={(nextValue) =>
                  mark("adapterConfig", "bootstrapPromptTemplate", nextValue || undefined)
                }
                placeholder="Optional initial setup prompt for the first run"
                contentClassName="min-h-11 text-sm font-mono"
                imageUploadHandler={(file) => uploadImage(file, `agents/${agentId}/bootstrap-prompt`)}
              />
            </Field>
            <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Bootstrap prompt is legacy and will be removed in a future release. Consider moving this content into the agent&apos;s prompt template or instructions file instead.
            </div>
          </>
        )}
        {adapterType === "claude_local" && <ClaudeLocalAdvancedFields {...adapterFieldProps} />}
        <ConfigFields {...adapterFieldProps} />

        <Field label="Extra args (comma-separated)" hint={help.extraArgs}>
          <DraftInput
            value={
              isCreate ? values!.extraArgs : eff("adapterConfig", "extraArgs", formatArgList(config.extraArgs))
            }
            onCommit={(nextValue) =>
              isCreate
                ? set!({ extraArgs: nextValue })
                : mark("adapterConfig", "extraArgs", nextValue?.trim() ? parseCommaArgs(nextValue) : null)
            }
            immediate
            className={inputClass}
            placeholder="e.g. --verbose, --foo=bar"
          />
        </Field>

        <Field label="Environment variables" hint={help.envVars}>
          <EnvVarEditor
            value={
              isCreate
                ? ((values!.envBindings ?? EMPTY_ENV) as Record<string, EnvBinding>)
                : (eff(
                    "adapterConfig",
                    "env",
                    (config.env ?? EMPTY_ENV) as Record<string, EnvBinding>,
                  ))
            }
            secrets={availableSecrets}
            onCreateSecret={onCreateSecret}
            onChange={(env) =>
              isCreate
                ? set!({ envBindings: env ?? {}, envVars: "" })
                : mark("adapterConfig", "env", env)
            }
          />
        </Field>

        {!isCreate && (
          <>
            <Field label="Timeout (sec)" hint={help.timeoutSec}>
              <DraftNumberInput
                value={eff("adapterConfig", "timeoutSec", Number(config.timeoutSec ?? 0))}
                onCommit={(nextValue) => mark("adapterConfig", "timeoutSec", nextValue)}
                immediate
                className={inputClass}
              />
            </Field>
            <Field label="Interrupt grace period (sec)" hint={help.graceSec}>
              <DraftNumberInput
                value={eff("adapterConfig", "graceSec", Number(config.graceSec ?? 15))}
                onCommit={(nextValue) => mark("adapterConfig", "graceSec", nextValue)}
                immediate
                className={inputClass}
              />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

function commandPlaceholder(adapterType: string) {
  return ({
    claude_local: "claude",
    codex_local: "codex",
    gemini_local: "gemini",
    pi_local: "pi",
    cursor: "agent",
    opencode_local: "opencode",
  } as Record<string, string>)[adapterType] ?? adapterType.replace(/_local$/, "");
}
