import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { AdapterModel } from "../../api/agents";
import { extractProviderId } from "../../lib/model-utils";
import { cn } from "../../lib/utils";
import { Field, help } from "../agent-config-primitives";
import { ModelDropdownContent } from "./ModelDropdownContent";

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
        <ModelDropdownContent
          models={models}
          value={value}
          onChange={onChange}
          onOpenChange={onOpenChange}
          allowDefault={allowDefault}
          groupByProvider={groupByProvider}
          creatable={creatable}
          detectedModel={detectedModel}
          detectedModelCandidates={detectedModelCandidates}
          onDetectModel={onDetectModel}
          onRefreshModels={onRefreshModels}
          refreshingModels={refreshingModels}
          detectingModel={detectingModel}
          detectModelLabel={detectModelLabel}
          emptyDetectHint={emptyDetectHint}
          modelSearch={modelSearch}
          setModelSearch={setModelSearch}
          manualModel={manualModel}
          canCreateManualModel={canCreateManualModel}
          promotedModelIds={promotedModelIds}
          filteredModels={filteredModels}
          groupedModels={groupedModels}
          onDetect={() => {
            void handleDetectModel();
          }}
        />
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
