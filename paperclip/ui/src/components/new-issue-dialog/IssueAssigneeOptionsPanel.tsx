import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "../../lib/utils";
import type { IssueModelLane } from "../../lib/issue-assignee-overrides";
import { InlineEntitySelector, type InlineEntityOption } from "../InlineEntitySelector";

type ThinkingEffortOption = {
  value: string;
  label: string;
};

type IssueAssigneeOptionsPanelProps = {
  adapterType: string | null;
  assigneeChrome: boolean;
  assigneeOptionsOpen: boolean;
  assigneeOptionsTitle: string;
  assigneeSupportsCheapLane: boolean;
  assigneeThinkingEffort: string;
  cheapProfile: { adapterConfig?: unknown } | null;
  modelLane: IssueModelLane;
  modelOverride: string;
  modelOverrideOptions: InlineEntityOption[];
  supportsAssigneeOverrides: boolean;
  thinkingEffortOptions: readonly ThinkingEffortOption[];
  onAssigneeChromeToggle: () => void;
  onAssigneeOptionsOpenChange: (open: boolean) => void;
  onModelLaneChange: (lane: IssueModelLane) => void;
  onModelOverrideChange: (model: string) => void;
  onThinkingEffortChange: (effort: string) => void;
};

function CheapLaneDescription({
  cheapProfile,
}: {
  cheapProfile: { adapterConfig?: unknown } | null;
}) {
  const model =
    cheapProfile?.adapterConfig && typeof (cheapProfile.adapterConfig as Record<string, unknown>).model === "string"
      ? String((cheapProfile.adapterConfig as Record<string, unknown>).model)
      : "";

  return (
    <p className="text-micro text-muted-foreground">
      Sends <code>modelProfile: "cheap"</code>{" "}
      {model ? (
        <>· adapter default <code>{model}</code></>
      ) : cheapProfile ? (
        <>· uses the agent's configured cheap profile</>
      ) : (
        <>· falls back to the primary model if no cheap profile is configured</>
      )}
    </p>
  );
}

export function IssueAssigneeOptionsPanel({
  adapterType,
  assigneeChrome,
  assigneeOptionsOpen,
  assigneeOptionsTitle,
  assigneeSupportsCheapLane,
  assigneeThinkingEffort,
  cheapProfile,
  modelLane,
  modelOverride,
  modelOverrideOptions,
  supportsAssigneeOverrides,
  thinkingEffortOptions,
  onAssigneeChromeToggle,
  onAssigneeOptionsOpenChange,
  onModelLaneChange,
  onModelOverrideChange,
  onThinkingEffortChange,
}: IssueAssigneeOptionsPanelProps) {
  if (!supportsAssigneeOverrides) return null;

  return (
    <div className="px-4 pb-2">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="-ml-1 h-auto px-1 py-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={() => onAssigneeOptionsOpenChange(!assigneeOptionsOpen)}
      >
        {assigneeOptionsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {assigneeOptionsTitle}
      </Button>
      {assigneeOptionsOpen ? (
        <div className="mt-2 rounded-md border border-border p-3 bg-muted/20 space-y-3">
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Model lane</div>
            <div
              className="flex w-full overflow-hidden rounded-md border border-border"
              role="radiogroup"
              aria-label="Model lane"
            >
              {(["primary", ...(assigneeSupportsCheapLane ? (["cheap"] as const) : ([] as const)), "custom"] as const).map((lane) => (
                <Button
                  key={lane}
                  type="button"
                  variant="ghost"
                  size="xs"
                  role="radio"
                  aria-checked={modelLane === lane}
                  className={cn(
                    "h-auto flex-1 px-2 py-1 text-xs capitalize hover:bg-accent/40",
                    modelLane === lane && "bg-accent text-foreground",
                  )}
                  onClick={() => onModelLaneChange(lane)}
                >
                  {lane === "primary" ? "Primary" : lane === "cheap" ? "Cheap" : "Custom"}
                </Button>
              ))}
            </div>
            {modelLane === "cheap" ? <CheapLaneDescription cheapProfile={cheapProfile} /> : null}
            {modelLane === "primary" ? (
              <p className="text-micro text-muted-foreground">Runs on the agent's primary model.</p>
            ) : null}
            {modelLane === "custom" ? (
              <p className="text-micro text-muted-foreground">Override the model and effort for this issue only.</p>
            ) : null}
          </div>
          {modelLane === "custom" ? (
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Model</div>
              <InlineEntitySelector
                value={modelOverride}
                options={modelOverrideOptions}
                placeholder="Default model"
                disablePortal
                noneLabel="Default model"
                searchPlaceholder="Search models..."
                emptyMessage="No models found."
                onChange={onModelOverrideChange}
              />
            </div>
          ) : null}
          {modelLane === "custom" ? (
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Thinking effort</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {thinkingEffortOptions.map((option) => (
                  <Button
                    key={option.value || "default"}
                    type="button"
                    variant="outline"
                    size="xs"
                    className={cn(
                      "font-normal hover:bg-accent/50",
                      assigneeThinkingEffort === option.value && "bg-accent",
                    )}
                    onClick={() => onThinkingEffortChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {adapterType === "claude_local" && modelLane === "custom" ? (
            <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
              <div className="text-xs text-muted-foreground">Enable Chrome (--chrome)</div>
              <ToggleSwitch checked={assigneeChrome} onCheckedChange={onAssigneeChromeToggle} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
