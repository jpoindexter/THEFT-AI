import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { AdapterModel } from "../../api/agents";
import { extractModelName, extractProviderId } from "../../lib/model-utils";
import { cn } from "../../lib/utils";
import { Field, help } from "../agent-config-primitives";

export function ModelDropdown({
  models,
  value,
  onChange,
  open,
  onOpenChange,
  allowDefault,
  required,
  groupByProvider,
  creatable,
  detectedModel,
  detectedModelCandidates,
  onDetectModel,
  onRefreshModels,
  refreshingModels,
  detectModelLabel,
  emptyDetectHint,
  defaultLabel,
}: {
  models: AdapterModel[];
  value: string;
  onChange: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowDefault: boolean;
  required: boolean;
  groupByProvider: boolean;
  creatable?: boolean;
  detectedModel?: string | null;
  detectedModelCandidates?: string[];
  onDetectModel?: () => Promise<string | null>;
  onRefreshModels?: () => Promise<void>;
  refreshingModels?: boolean;
  detectModelLabel?: string;
  emptyDetectHint?: string;
  defaultLabel?: string;
}) {
  const [modelSearch, setModelSearch] = useState("");
  const [detectingModel, setDetectingModel] = useState(false);
  const selected = models.find((m) => m.id === value);
  const manualModel = modelSearch.trim();
  const canCreateManualModel = Boolean(
    creatable &&
      manualModel &&
      !models.some((m) => m.id.toLowerCase() === manualModel.toLowerCase()),
  );
  const promotedModelIds = useMemo(() => {
    const set = new Set<string>();
    if (detectedModel) set.add(detectedModel);
    for (const c of detectedModelCandidates ?? []) {
      if (c) set.add(c);
    }
    return set;
  }, [detectedModel, detectedModelCandidates]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (promotedModelIds.has(m.id)) return false;
      if (!modelSearch.trim()) return true;
      const q = modelSearch.toLowerCase();
      const provider = extractProviderId(m.id) ?? "";
      return (
        m.id.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q) ||
        provider.toLowerCase().includes(q)
      );
    });
  }, [models, modelSearch, promotedModelIds]);
  const groupedModels = useMemo(() => {
    if (!groupByProvider) {
      return [
        {
          provider: "models",
          entries: [...filteredModels].sort((a, b) => a.id.localeCompare(b.id)),
        },
      ];
    }
    const map = new Map<string, AdapterModel[]>();
    for (const model of filteredModels) {
      const provider = extractProviderId(model.id) ?? "other";
      const group = map.get(provider) ?? [];
      group.push(model);
      map.set(provider, group);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([provider, entries]) => ({
        provider,
        entries: [...entries].sort((a, b) => a.id.localeCompare(b.id)),
      }));
  }, [filteredModels, groupByProvider]);

  async function handleDetectModel() {
    if (!onDetectModel) return;
    setDetectingModel(true);
    try {
      const nextModel = await onDetectModel();
      if (nextModel) {
        onChange(nextModel);
        onOpenChange(false);
        setModelSearch("");
      }
    } finally {
      setDetectingModel(false);
    }
  }

  return (
    <Field label="Model" hint={help.model}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) setModelSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-auto w-full justify-between px-2.5 py-1.5 font-normal hover:bg-accent/50">
            <span className={cn(!value && "text-muted-foreground")}>
              {selected
                ? selected.label
                : value
                  || (allowDefault ? (defaultLabel ?? "Default") : required ? "Select model (required)" : "Select model")}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
          <div className="relative mb-1">
            <Input
              className="h-auto rounded-sm border-x-0 border-t-0 px-2 py-1.5 pr-6 text-xs shadow-none focus-visible:ring-0"
              placeholder={creatable ? "Search models... (type to create)" : "Search models..."}
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              autoFocus
            />
            {modelSearch && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setModelSearch("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {onDetectModel && !modelSearch.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-auto w-full justify-start px-2 py-1.5 text-muted-foreground hover:bg-accent/50"
              onClick={() => {
                void handleDetectModel();
              }}
              disabled={detectingModel}
            >
              <svg aria-hidden="true" focusable="false" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              {detectingModel ? "Detecting..." : detectedModel ? (detectModelLabel?.replace(/^Detect\b/, "Re-detect") ?? "Re-detect from config") : (detectModelLabel ?? "Detect from config")}
            </Button>
          )}
          {onRefreshModels && !modelSearch.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-auto w-full justify-start px-2 py-1.5 text-muted-foreground hover:bg-accent/50"
              onClick={() => {
                void onRefreshModels();
              }}
              disabled={refreshingModels}
            >
              <svg aria-hidden="true" focusable="false" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 15.28-6.36L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-15.28 6.36L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              {refreshingModels ? "Refreshing..." : "Refresh models"}
            </Button>
          )}
          {value && (!models.some((m) => m.id === value) || promotedModelIds.has(value)) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto w-full justify-start px-2 py-1.5 font-normal bg-accent/50",
              )}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              <span className="block w-full text-left truncate font-mono text-xs" title={value}>
                {models.find((m) => m.id === value)?.label ?? value}
              </span>
              <span className="shrink-0 ml-auto text-badge font-medium px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                current
              </span>
            </Button>
          )}
          {detectedModel && detectedModel !== value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50",
              )}
              onClick={() => {
                onChange(detectedModel);
                onOpenChange(false);
              }}
            >
              <span className="block w-full text-left truncate font-mono text-xs" title={detectedModel}>
                {models.find((m) => m.id === detectedModel)?.label ?? detectedModel}
              </span>
              <span className="shrink-0 ml-auto text-badge font-medium px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                detected
              </span>
            </Button>
          )}
          {detectedModelCandidates
            ?.filter((candidate) => candidate && candidate !== detectedModel && candidate !== value)
            .map((candidate) => {
              const entry = models.find((m) => m.id === candidate);
              return (
                <Button
                  key={`detected-${candidate}`}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50",
                  )}
                  onClick={() => {
                    onChange(candidate);
                    onOpenChange(false);
                  }}
                >
                  <span className="block w-full text-left truncate font-mono text-xs" title={candidate}>
                    {entry?.label ?? candidate}
                  </span>
                  <span className="shrink-0 ml-auto text-badge font-medium px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20">
                    config
                  </span>
                </Button>
              );
            })}
          <div className="max-h-60 overflow-y-auto">
            {allowDefault && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50",
                  !value && "bg-accent",
                )}
                onClick={() => {
                  onChange("");
                  onOpenChange(false);
                }}
              >
                Default
              </Button>
            )}
            {canCreateManualModel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-between px-2 py-1.5 font-normal hover:bg-accent/50"
                onClick={() => {
                  onChange(manualModel);
                  onOpenChange(false);
                  setModelSearch("");
                }}
              >
                <span>Use manual model</span>
                <span className="text-xs font-mono text-muted-foreground">{manualModel}</span>
              </Button>
            )}
            {groupedModels.map((group) => (
              <div key={group.provider} className="mb-1 last:mb-0">
                {groupByProvider && (
                  <div className="px-2 py-1 text-nano uppercase tracking-wide text-muted-foreground">
                    {group.provider} ({group.entries.length})
                  </div>
                )}
                {group.entries.map((m) => (
                  <Button
                    type="button"
                    key={m.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50",
                      m.id === value && "bg-accent",
                    )}
                    onClick={() => {
                      onChange(m.id);
                      onOpenChange(false);
                    }}
                  >
                    <span className="block w-full text-left truncate" title={m.id}>
                      {groupByProvider ? extractModelName(m.id) : m.label}
                    </span>
                  </Button>
                ))}
              </div>
            ))}
            {filteredModels.length === 0 && !canCreateManualModel && promotedModelIds.size === 0 && (
              <div className="px-2 py-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {onDetectModel
                    ? (emptyDetectHint ?? "No model detected yet. Enter a provider/model manually.")
                    : "No models found."}
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export function CheapModelSection({
  enabled,
  model,
  models,
  adapterType,
  adapterDefaultModel,
  onEnabledChange,
  onModelChange,
  open,
  onOpenChange,
}: {
  enabled: boolean;
  model: string;
  models: AdapterModel[];
  adapterType: string;
  adapterDefaultModel: string;
  onEnabledChange: (next: boolean) => void;
  onModelChange: (next: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const placeholderHint = adapterDefaultModel
    ? `Adapter default · ${adapterDefaultModel}`
    : "No adapter default — choose a cheaper model";
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-micro uppercase tracking-wide text-muted-foreground">Cheap model</div>
          <p className="text-xs text-muted-foreground">
            Used when a run requests the cheap profile (e.g. routine summaries). The primary model stays unchanged.
          </p>
        </div>
        <ToggleSwitch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      {enabled ? (
        <ModelDropdown
          models={models}
          value={model}
          onChange={onModelChange}
          open={open}
          onOpenChange={onOpenChange}
          allowDefault
          required={false}
          groupByProvider={adapterType === "opencode_local"}
          creatable
          detectedModel={null}
          detectedModelCandidates={[]}
          emptyDetectHint={placeholderHint}
          defaultLabel={placeholderHint}
        />
      ) : null}
      {enabled && !model && adapterDefaultModel ? (
        <p className="text-micro text-muted-foreground">
          No explicit cheap model selected — runtime falls back to <code>{adapterDefaultModel}</code>.
        </p>
      ) : null}
      {enabled && !model && !adapterDefaultModel ? (
        <p className="text-micro text-amber-500">
          No cheap model selected and the adapter has no default. Cheap-lane runs will continue on the primary model with a fallback note.
        </p>
      ) : null}
    </div>
  );
}

export function ThinkingEffortDropdown({
  value,
  options,
  onChange,
  open,
  onOpenChange,
}: {
  value: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  onChange: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = options.find((option) => option.id === value) ?? options[0];

  return (
    <Field label="Thinking effort" hint={help.thinkingEffort}>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-auto w-full justify-between px-2.5 py-1.5 font-normal hover:bg-accent/50">
            <span className={cn(!value && "text-muted-foreground")}>{selected?.label ?? "Auto"}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
          {options.map((option) => (
            <Button
              key={option.id || "auto"}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto w-full justify-between px-2 py-1.5 font-normal hover:bg-accent/50",
                option.id === value && "bg-accent",
              )}
              onClick={() => {
                onChange(option.id);
                onOpenChange(false);
              }}
            >
              <span>{option.label}</span>
              {option.id ? <span className="text-xs text-muted-foreground font-mono">{option.id}</span> : null}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </Field>
  );
}
