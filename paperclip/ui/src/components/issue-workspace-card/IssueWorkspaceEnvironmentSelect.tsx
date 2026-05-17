import type { Environment, ExecutionWorkspace } from "@paperclipai/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NO_ENVIRONMENT_SELECT_VALUE } from "./workspace-card-utils";

interface IssueWorkspaceEnvironmentSelectProps {
  configuredReusableWorkspace: ExecutionWorkspace | null;
  draftEnvironmentId: string;
  projectEnvironmentId: string | null;
  reuseExistingSelection: boolean;
  runSelectableEnvironments: Environment[];
  selectedReusableEnvironmentId: string;
  onDraftEnvironmentIdChange: (value: string) => void;
}

export function IssueWorkspaceEnvironmentSelect({
  configuredReusableWorkspace,
  draftEnvironmentId,
  projectEnvironmentId,
  reuseExistingSelection,
  runSelectableEnvironments,
  selectedReusableEnvironmentId,
  onDraftEnvironmentIdChange,
}: IssueWorkspaceEnvironmentSelectProps) {
  return (
    <>
      <Select
        value={(reuseExistingSelection ? selectedReusableEnvironmentId : draftEnvironmentId) || NO_ENVIRONMENT_SELECT_VALUE}
        onValueChange={(value) => {
          onDraftEnvironmentIdChange(value === NO_ENVIRONMENT_SELECT_VALUE ? "" : value);
        }}
        disabled={reuseExistingSelection}
      >
        <SelectTrigger
          size="sm"
          className={cn("w-full text-xs", reuseExistingSelection && "cursor-not-allowed opacity-70")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_ENVIRONMENT_SELECT_VALUE} className="text-xs">
            {reuseExistingSelection
              ? configuredReusableWorkspace
                ? "No environment on reused workspace"
                : "Select an existing workspace to inspect its environment"
              : projectEnvironmentId
                ? "Project default environment"
                : "No environment"}
          </SelectItem>
          {runSelectableEnvironments.map((environment) => (
            <SelectItem key={environment.id} value={environment.id} className="text-xs">
              {environment.name} · {environment.driver}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {reuseExistingSelection && (
        <div className="text-micro text-muted-foreground">
          {configuredReusableWorkspace
            ? "Environment selection is locked while reusing an existing workspace. The next run will use that workspace's persisted environment config."
            : "Choose an existing workspace first. Its persisted environment config will determine the next run."}
        </div>
      )}
    </>
  );
}
