import { X } from "lucide-react";
import { PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdapterModel } from "../../api/agents";
import { extractModelName } from "../../lib/model-utils";
import { cn } from "../../lib/utils";

type ModelGroup = {
  provider: string;
  entries: AdapterModel[];
};

interface ModelDropdownContentProps {
  models: AdapterModel[];
  value: string;
  onChange: (id: string) => void;
  onOpenChange: (open: boolean) => void;
  allowDefault: boolean;
  groupByProvider: boolean;
  creatable?: boolean;
  detectedModel?: string | null;
  detectedModelCandidates?: string[];
  onDetectModel?: () => Promise<string | null>;
  onRefreshModels?: () => Promise<void>;
  refreshingModels?: boolean;
  detectingModel: boolean;
  detectModelLabel?: string;
  emptyDetectHint?: string;
  modelSearch: string;
  setModelSearch: (search: string) => void;
  manualModel: string;
  canCreateManualModel: boolean;
  promotedModelIds: ReadonlySet<string>;
  filteredModels: AdapterModel[];
  groupedModels: ModelGroup[];
  onDetect: () => void;
}

export function ModelDropdownContent({
  models,
  value,
  onChange,
  onOpenChange,
  allowDefault,
  groupByProvider,
  creatable,
  detectedModel,
  detectedModelCandidates,
  onDetectModel,
  onRefreshModels,
  refreshingModels,
  detectingModel,
  detectModelLabel,
  emptyDetectHint,
  modelSearch,
  setModelSearch,
  manualModel,
  canCreateManualModel,
  promotedModelIds,
  filteredModels,
  groupedModels,
  onDetect,
}: ModelDropdownContentProps) {
  return (
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
        <ModelDropdownActionButton
          disabled={detectingModel}
          label={detectingModel ? "Detecting..." : detectedModel ? (detectModelLabel?.replace(/^Detect\b/, "Re-detect") ?? "Re-detect from config") : (detectModelLabel ?? "Detect from config")}
          onClick={onDetect}
          variant="detect"
        />
      )}
      {onRefreshModels && !modelSearch.trim() && (
        <ModelDropdownActionButton
          disabled={refreshingModels}
          label={refreshingModels ? "Refreshing..." : "Refresh models"}
          onClick={() => {
            void onRefreshModels();
          }}
          variant="refresh"
        />
      )}
      {value && (!models.some((m) => m.id === value) || promotedModelIds.has(value)) && (
        <PromotedModelButton
          value={value}
          label={models.find((m) => m.id === value)?.label ?? value}
          badge="current"
          tone="green"
          onClick={() => onOpenChange(false)}
        />
      )}
      {detectedModel && detectedModel !== value && (
        <PromotedModelButton
          value={detectedModel}
          label={models.find((m) => m.id === detectedModel)?.label ?? detectedModel}
          badge="detected"
          tone="blue"
          onClick={() => {
            onChange(detectedModel);
            onOpenChange(false);
          }}
        />
      )}
      {detectedModelCandidates
        ?.filter((candidate) => candidate && candidate !== detectedModel && candidate !== value)
        .map((candidate) => (
          <PromotedModelButton
            key={`detected-${candidate}`}
            value={candidate}
            label={models.find((m) => m.id === candidate)?.label ?? candidate}
            badge="config"
            tone="sky"
            onClick={() => {
              onChange(candidate);
              onOpenChange(false);
            }}
          />
        ))}
      <div className="max-h-60 overflow-y-auto">
        {allowDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50", !value && "bg-accent")}
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
            {group.entries.map((model) => (
              <Button
                type="button"
                key={model.id}
                variant="ghost"
                size="sm"
                className={cn("h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50", model.id === value && "bg-accent")}
                onClick={() => {
                  onChange(model.id);
                  onOpenChange(false);
                }}
              >
                <span className="block w-full text-left truncate" title={model.id}>
                  {groupByProvider ? extractModelName(model.id) : model.label}
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
  );
}

function ModelDropdownActionButton({
  disabled,
  label,
  onClick,
  variant,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  variant: "detect" | "refresh";
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className="h-auto w-full justify-start px-2 py-1.5 text-muted-foreground hover:bg-accent/50"
      onClick={onClick}
      disabled={disabled}
    >
      {variant === "detect" ? (
        <svg aria-hidden="true" focusable="false" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      ) : (
        <svg aria-hidden="true" focusable="false" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 15.28-6.36L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15.28 6.36L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      )}
      {label}
    </Button>
  );
}

function PromotedModelButton({
  value,
  label,
  badge,
  tone,
  onClick,
}: {
  value: string;
  label: string;
  badge: string;
  tone: "green" | "blue" | "sky";
  onClick: () => void;
}) {
  const badgeClassName = {
    green: "bg-green-500/15 text-green-400 border-green-500/20",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    sky: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  }[tone];
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50"
      onClick={onClick}
    >
      <span className="block w-full text-left truncate font-mono text-xs" title={value}>
        {label}
      </span>
      <span className={cn("shrink-0 ml-auto text-badge font-medium px-1.5 py-0.5 rounded-full border", badgeClassName)}>
        {badge}
      </span>
    </Button>
  );
}
