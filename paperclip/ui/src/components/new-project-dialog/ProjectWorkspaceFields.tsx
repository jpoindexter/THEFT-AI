import { HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChoosePathButton } from "../PathInstructionsModal";

interface ProjectWorkspaceFieldsProps {
  workspaceRepoUrl: string;
  setWorkspaceRepoUrl: (value: string) => void;
  workspaceLocalPath: string;
  setWorkspaceLocalPath: (value: string) => void;
  workspaceError: string | null;
  setWorkspaceError: (value: string | null) => void;
}

export function ProjectWorkspaceFields({
  workspaceRepoUrl,
  setWorkspaceRepoUrl,
  workspaceLocalPath,
  setWorkspaceLocalPath,
  workspaceError,
  setWorkspaceError,
}: ProjectWorkspaceFieldsProps) {
  return (
    <div className="space-y-3 border-t border-border px-4 pb-3 pt-3">
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <label className="block text-xs text-muted-foreground">Repo URL</label>
          <span className="text-xs text-muted-foreground/50">optional</span>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/50" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-60 text-xs">
              Link a GitHub repository so agents can clone, read, and push code for this project.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          className="h-7 text-xs"
          value={workspaceRepoUrl}
          onChange={(event) => {
            setWorkspaceRepoUrl(event.target.value);
            setWorkspaceError(null);
          }}
          placeholder="https://github.com/org/repo"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <label className="block text-xs text-muted-foreground">Local folder</label>
          <span className="text-xs text-muted-foreground/50">optional</span>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/50" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-60 text-xs">
              Set an absolute path on this machine where local agents will read and write files for this project.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="h-7 font-mono text-xs"
            value={workspaceLocalPath}
            onChange={(event) => {
              setWorkspaceLocalPath(event.target.value);
              setWorkspaceError(null);
            }}
            placeholder="/absolute/path/to/workspace"
          />
          <ChoosePathButton />
        </div>
      </div>

      {workspaceError && (
        <p className="text-xs text-destructive">{workspaceError}</p>
      )}
    </div>
  );
}
