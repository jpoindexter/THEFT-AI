import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentConfigForm } from "../../components/AgentConfigForm";
import { adapterLabels } from "../../components/agent-config-primitives";
import { defaultCreateValues } from "../../components/agent-config-defaults";
import { getAdapterLabel } from "../../adapters/adapter-display-registry";
import { listUIAdapters } from "../../adapters";
import { cn } from "../../lib/utils";

export interface ConflictItem {
  slug: string;
  kind: "agent" | "project" | "issue" | "skill";
  originalName: string;
  plannedName: string;
  filePath: string | null;
  action: "rename" | "update";
}

export interface AdapterPickerItem {
  slug: string;
  name: string;
  adapterType: string;
}

const IMPORT_ADAPTER_OPTIONS: { value: string; label: string }[] = listUIAdapters().map((adapter) => ({
  value: adapter.type,
  label: adapterLabels[adapter.type] ?? getAdapterLabel(adapter.type),
}));

export function ConflictResolutionList({
  conflicts,
  nameOverrides,
  skippedSlugs,
  confirmedSlugs,
  onRename,
  onToggleSkip,
  onToggleConfirm,
}: {
  conflicts: ConflictItem[];
  nameOverrides: Record<string, string>;
  skippedSlugs: Set<string>;
  confirmedSlugs: Set<string>;
  onRename: (slug: string, newName: string) => void;
  onToggleSkip: (slug: string, filePath: string | null) => void;
  onToggleConfirm: (slug: string) => void;
}) {
  if (conflicts.length === 0) return null;

  return (
    <div className="mx-5 mt-3">
      <div className="rounded-md border border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-medium">
            Renames
          </h3>
          <span className="text-xs text-muted-foreground">
            {conflicts.length} item{conflicts.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="divide-y divide-border">
          {conflicts.map((item) => {
            const isSkipped = skippedSlugs.has(item.slug);
            const isConfirmed = confirmedSlugs.has(item.slug);
            const currentName = nameOverrides[item.slug] ?? item.plannedName;
            return (
              <div
                key={item.slug}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm",
                  isSkipped && "opacity-40",
                  isConfirmed && !isSkipped && "bg-emerald-500/5",
                )}
              >
                <Button
                  type="button"
                  size="xs"
                  variant={isSkipped ? "secondary" : "outline"}
                  className={cn("px-2.5", isSkipped && "border-foreground")}
                  onClick={() => onToggleSkip(item.slug, item.filePath)}
                >
                  {isSkipped ? "skipped" : "skip"}
                </Button>

                <span className={cn(
                  "theft-label-nano shrink-0 rounded-full border px-2 py-0.5",
                  isSkipped
                    ? "text-muted-foreground border-border"
                    : isConfirmed
                      ? "text-emerald-500 border-emerald-500/30"
                      : "text-amber-500 border-amber-500/30",
                )}>
                  {item.kind}
                </span>

                <span className={cn(
                  "shrink-0 font-mono text-xs",
                  isSkipped ? "text-muted-foreground line-through" : "text-muted-foreground",
                )}>
                  {item.originalName}
                </span>

                {!isSkipped && (
                  <>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    {isConfirmed ? (
                      <span className="min-w-0 flex-1 font-mono text-xs text-emerald-500">
                        {currentName}
                      </span>
                    ) : (
                      <Input
                        className="h-7 min-w-0 flex-1 font-mono text-xs md:text-xs"
                        value={currentName}
                        onChange={(event) => onRename(item.slug, event.target.value)}
                      />
                    )}
                  </>
                )}

                {!isSkipped && (
                  <Button
                    type="button"
                    size="xs"
                    variant={isConfirmed ? "secondary" : "outline"}
                    className={cn("ml-auto px-2.5", isConfirmed && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500")}
                    onClick={() => onToggleConfirm(item.slug)}
                  >
                    {isConfirmed ? (
                      <>
                        <Check className="h-3 w-3" />
                        confirmed
                      </>
                    ) : (
                      "confirm rename"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AdapterPickerList({
  agents,
  adapterOverrides,
  expandedSlugs,
  configValues,
  onChangeAdapter,
  onToggleExpand,
  onChangeConfig,
}: {
  agents: AdapterPickerItem[];
  adapterOverrides: Record<string, string>;
  expandedSlugs: Set<string>;
  configValues: Record<string, CreateConfigValues>;
  onChangeAdapter: (slug: string, adapterType: string) => void;
  onToggleExpand: (slug: string) => void;
  onChangeConfig: (slug: string, patch: Partial<CreateConfigValues>) => void;
}) {
  if (agents.length === 0) return null;

  return (
    <div className="mx-5 mt-3">
      <div className="rounded-md border border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-medium">Adapters</h3>
          <span className="text-xs text-muted-foreground">
            {agents.length} agent{agents.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="divide-y divide-border">
          {agents.map((agent) => {
            const selectedType = adapterOverrides[agent.slug] ?? agent.adapterType;
            const isExpanded = expandedSlugs.has(agent.slug);
            const vals = configValues[agent.slug] ?? { ...defaultCreateValues, adapterType: selectedType };

            return (
              <div key={agent.slug}>
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="theft-label-nano shrink-0 rounded-full border border-blue-500/30 px-2 py-0.5 text-blue-500">
                    agent
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {agent.name}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <Select value={selectedType} onValueChange={(value) => onChangeAdapter(agent.slug, value)}>
                    <SelectTrigger size="sm" className="min-w-0 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPORT_ADAPTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="xs"
                    variant={isExpanded ? "secondary" : "outline"}
                    className={cn("ml-auto px-2.5", isExpanded && "border-foreground")}
                    onClick={() => onToggleExpand(agent.slug)}
                  >
                    <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                    configure adapter
                  </Button>
                </div>
                {isExpanded && (
                  <div className="space-y-3 border-t border-border bg-accent/10 px-4 py-3">
                    <AgentConfigForm
                      mode="create"
                      values={vals}
                      onChange={(patch) => onChangeConfig(agent.slug, patch)}
                      showAdapterTypeField={false}
                      showAdapterTestEnvironmentButton={false}
                      showCreateRunPolicySection={false}
                      hideInstructionsFile
                      sectionLayout="cards"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
