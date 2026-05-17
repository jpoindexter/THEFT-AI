import { useMemo } from "react";
import type { Issue, Project } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FolderOpen, GitBranch } from "lucide-react";
import {
  executionWorkspaceIssuesHref,
  isMainIssueWorkspace,
  runningRuntimeServiceWithUrl,
} from "./helpers";
import { TruncatedCopyable } from "./PropertyControls";
import { PropertyRow } from "./PropertyLayout";

interface WorkspacePropertiesProps {
  issue: Issue;
  issueProject: Project | null | undefined;
  isolatedWorkspacesEnabled: boolean;
}

export function WorkspaceProperties({
  issue,
  issueProject,
  isolatedWorkspacesEnabled,
}: WorkspacePropertiesProps) {
  const issueUsesMainWorkspace = useMemo(
    () => isMainIssueWorkspace({ issue, project: issueProject }),
    [issue, issueProject],
  );
  const workspaceTasksExecutionWorkspaceId = useMemo(() => {
    if (!isolatedWorkspacesEnabled) return null;
    if (issueUsesMainWorkspace) return null;
    return issue.executionWorkspaceId ?? issue.currentExecutionWorkspace?.id ?? null;
  }, [isolatedWorkspacesEnabled, issue, issueUsesMainWorkspace]);
  const showWorkspaceDetailLink = Boolean(issue.executionWorkspaceId) && !issueUsesMainWorkspace;
  const liveWorkspaceService = useMemo(() => {
    if (issueUsesMainWorkspace) return null;
    return runningRuntimeServiceWithUrl(issue.currentExecutionWorkspace?.runtimeServices);
  }, [issue.currentExecutionWorkspace?.runtimeServices, issueUsesMainWorkspace]);

  if (!liveWorkspaceService && !issue.currentExecutionWorkspace?.branchName && !issue.currentExecutionWorkspace?.cwd && !issue.executionWorkspaceId) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="space-y-1">
        {liveWorkspaceService?.url && (
          <PropertyRow label="Service">
            <a
              href={liveWorkspaceService.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-start gap-1 text-sm font-mono text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              <span className="min-w-0 break-all">{liveWorkspaceService.url}</span>
              <ExternalLink className="mt-1 h-3 w-3 shrink-0" />
            </a>
          </PropertyRow>
        )}
        {showWorkspaceDetailLink && issue.executionWorkspaceId && (
          <PropertyRow label="Workspace">
            <Link
              to={`/execution-workspaces/${issue.executionWorkspaceId}`}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View workspace
              <ExternalLink className="h-3 w-3" />
            </Link>
          </PropertyRow>
        )}
        {workspaceTasksExecutionWorkspaceId && (
          <PropertyRow label="Tasks">
            <Link
              to={executionWorkspaceIssuesHref(workspaceTasksExecutionWorkspaceId)}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View workspace tasks
              <ExternalLink className="h-3 w-3" />
            </Link>
          </PropertyRow>
        )}
        {issue.currentExecutionWorkspace?.branchName && (
          <PropertyRow label="Branch">
            <TruncatedCopyable
              value={issue.currentExecutionWorkspace.branchName}
              icon={GitBranch}
            />
          </PropertyRow>
        )}
        {issue.currentExecutionWorkspace?.cwd && (
          <PropertyRow label="Folder">
            <TruncatedCopyable
              value={issue.currentExecutionWorkspace.cwd}
              icon={FolderOpen}
            />
          </PropertyRow>
        )}
      </div>
    </>
  );
}
