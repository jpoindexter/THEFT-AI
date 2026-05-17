import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { extractModelName } from "@/lib/model-utils";
import type { AdapterModelEntry, AdapterModelGroup } from "./types";

export function AdapterModelSelector({
  adapterType,
  model,
  setModel,
  modelOpen,
  setModelOpen,
  modelSearch,
  setModelSearch,
  selectedModel,
  groupedModels,
  filteredModels,
}: {
  adapterType: string;
  model: string;
  setModel: (value: string) => void;
  modelOpen: boolean;
  setModelOpen: (value: boolean) => void;
  modelSearch: string;
  setModelSearch: (value: string) => void;
  selectedModel?: AdapterModelEntry;
  groupedModels: AdapterModelGroup[];
  filteredModels: AdapterModelEntry[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">Model</label>
      <Popover
        open={modelOpen}
        onOpenChange={(next) => {
          setModelOpen(next);
          if (!next) setModelSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="inline-flex h-auto w-full items-center justify-between gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent/50"
          >
            <span className={cn(!model && "text-muted-foreground")}>
              {selectedModel
                ? selectedModel.label
                : model ||
                  (adapterType === "opencode_local"
                    ? "Select model (required)"
                    : "Default")}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-1"
          align="start"
        >
          <Input
            className="mb-1 w-full border-b border-border bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground/50"
            placeholder="Search models..."
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            autoFocus
          />
          {adapterType !== "opencode_local" && (
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "flex h-auto w-full items-center justify-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/50",
                !model && "bg-accent",
              )}
              onClick={() => {
                setModel("");
                setModelOpen(false);
              }}
            >
              Default
            </Button>
          )}
          <div className="max-h-60 overflow-y-auto">
            {groupedModels.map((group) => (
              <div key={group.provider} className="mb-1 last:mb-0">
                {adapterType === "opencode_local" && (
                  <div className="px-2 py-1 text-nano uppercase tracking-wide text-muted-foreground">
                    {group.provider} ({group.entries.length})
                  </div>
                )}
                {group.entries.map((entry) => (
                  <Button
                    key={entry.id}
                    type="button"
                    variant="ghost"
                    className={cn(
                      "flex h-auto w-full items-center rounded px-2 py-1.5 text-sm hover:bg-accent/50",
                      entry.id === model && "bg-accent",
                    )}
                    onClick={() => {
                      setModel(entry.id);
                      setModelOpen(false);
                    }}
                  >
                    <span className="block w-full truncate text-left" title={entry.id}>
                      {adapterType === "opencode_local"
                        ? extractModelName(entry.id)
                        : entry.label}
                    </span>
                  </Button>
                ))}
              </div>
            ))}
          </div>
          {filteredModels.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              No models discovered.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
