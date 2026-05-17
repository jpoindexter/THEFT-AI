import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import { ChevronDown, Settings2 } from "lucide-react";
import { DEFAULT_CURSOR_LOCAL_MODEL } from "@paperclipai/adapter-cursor-local";
import { DEFAULT_GEMINI_LOCAL_MODEL } from "@paperclipai/adapter-gemini-local";
import { DEFAULT_CODEX_LOCAL_MODEL } from "@paperclipai/adapter-codex-local";
import { DEFAULT_OPENCODE_LOCAL_MODEL } from "@paperclipai/adapter-opencode-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AdapterEnvironmentPanel } from "./AdapterEnvironmentPanel";
import { AdapterModelSelector } from "./AdapterModelSelector";
import type { AdapterChoice, AdapterModelEntry, AdapterModelGroup } from "./types";

export function AssemblyRuntimeSettings({
  adapterType,
  setAdapterType,
  adapterLabel,
  model,
  setModel,
  url,
  setUrl,
  modelOpen,
  setModelOpen,
  modelSearch,
  setModelSearch,
  selectedModel,
  groupedModels,
  filteredModels,
  recommendedAdapters,
  moreAdapters,
  showAdvancedRuntime,
  setShowAdvancedRuntime,
  showMoreAdapters,
  setShowMoreAdapters,
  isLocalAdapter,
  adapterEnvLoading,
  adapterEnvError,
  adapterEnvResult,
  shouldSuggestUnsetAnthropicApiKey,
  unsetAnthropicLoading,
  effectiveAdapterCommand,
  onTestEnvironment,
  onUnsetAnthropicApiKey,
}: {
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
    <div className="theft-surface-plain p-3">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-between gap-3 p-0 text-left"
        onClick={() => setShowAdvancedRuntime((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block text-xs font-medium">Advanced runtime</span>
            <span className="block truncate text-micro text-muted-foreground">
              Using {adapterLabel}
              {model ? ` / ${model}` : ""}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            showAdvancedRuntime ? "rotate-0" : "-rotate-90",
          )}
        />
      </Button>

      {showAdvancedRuntime && (
        <div className="mt-4 space-y-4">
          <AdapterTypeGrid
            label="Adapter type"
            adapters={recommendedAdapters}
            adapterType={adapterType}
            onSelect={(nextType) =>
              selectAdapterType({ nextType, setAdapterType, model, setModel })
            }
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex h-auto items-center gap-1.5 p-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setShowMoreAdapters((value) => !value)}
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                showMoreAdapters ? "rotate-0" : "-rotate-90",
              )}
            />
            More Agent Adapter Types
          </Button>

          {showMoreAdapters && (
            <AdapterTypeGrid
              adapters={moreAdapters}
              adapterType={adapterType}
              onSelect={(nextType) =>
                selectAdapterType({ nextType, setAdapterType, model, setModel })
              }
            />
          )}

          {isLocalAdapter && (
            <>
              <AdapterModelSelector
                adapterType={adapterType}
                model={model}
                setModel={setModel}
                modelOpen={modelOpen}
                setModelOpen={setModelOpen}
                modelSearch={modelSearch}
                setModelSearch={setModelSearch}
                selectedModel={selectedModel}
                groupedModels={groupedModels}
                filteredModels={filteredModels}
              />
              <AdapterEnvironmentPanel
                adapterType={adapterType}
                adapterEnvLoading={adapterEnvLoading}
                adapterEnvError={adapterEnvError}
                adapterEnvResult={adapterEnvResult}
                shouldSuggestUnsetAnthropicApiKey={shouldSuggestUnsetAnthropicApiKey}
                unsetAnthropicLoading={unsetAnthropicLoading}
                effectiveAdapterCommand={effectiveAdapterCommand}
                onTestEnvironment={onTestEnvironment}
                onUnsetAnthropicApiKey={onUnsetAnthropicApiKey}
              />
            </>
          )}

          {(adapterType === "http" || adapterType === "openclaw_gateway") && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                {adapterType === "openclaw_gateway" ? "Gateway URL" : "Webhook URL"}
              </label>
              <Input
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
                placeholder={
                  adapterType === "openclaw_gateway"
                    ? "ws://127.0.0.1:18789"
                    : "https://..."
                }
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdapterTypeGrid({
  label,
  adapters,
  adapterType,
  onSelect,
}: {
  label?: string;
  adapters: AdapterChoice[];
  adapterType: string;
  onSelect: (adapterType: string) => void;
}) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-xs text-muted-foreground">{label}</label>
      )}
      <div className="grid grid-cols-2 gap-2">
        {adapters.map((option) => (
          <Button
            key={option.type}
            type="button"
            disabled={Boolean(option.comingSoon)}
            variant="ghost"
            className={cn(
              "relative flex h-auto flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors",
              option.comingSoon
                ? "cursor-not-allowed border-border opacity-40"
                : adapterType === option.type
                  ? "border-foreground bg-accent"
                  : "border-border hover:bg-accent/50",
            )}
            onClick={() => {
              if (!option.comingSoon) onSelect(option.type);
            }}
          >
            {option.recommended && (
              <span className="absolute -top-1.5 right-1.5 rounded-full bg-signal px-1.5 py-0.5 text-badge font-semibold leading-none text-background">
                Recommended
              </span>
            )}
            <option.icon className="h-4 w-4" />
            <span className="font-medium">{option.label}</span>
            <span className="text-nano text-muted-foreground">
              {option.comingSoon
                ? option.disabledLabel ?? "Coming soon"
                : option.description}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function selectAdapterType({
  nextType,
  setAdapterType,
  model,
  setModel,
}: {
  nextType: string;
  setAdapterType: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
}) {
  setAdapterType(nextType);
  if (nextType === "codex_local") {
    if (!model) setModel(DEFAULT_CODEX_LOCAL_MODEL);
    return;
  }
  if (nextType === "gemini_local" && !model) {
    setModel(DEFAULT_GEMINI_LOCAL_MODEL);
    return;
  }
  if (nextType === "cursor" && !model) {
    setModel(DEFAULT_CURSOR_LOCAL_MODEL);
    return;
  }
  if (nextType === "opencode_local") {
    setModel(DEFAULT_OPENCODE_LOCAL_MODEL);
    return;
  }
  setModel("");
}
