import type { ExecutionWorkspace, Issue, Project, ProjectWorkspace } from "@paperclipai/shared";
import { Copy, ExternalLink } from "lucide-react";
import { Link } from "@/lib/router";
import { CopyText } from "@/components/CopyText";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, issueUrl, projectWorkspaceUrl } from "@/lib/utils";
import { DetailRow, isSafeExternalUrl, MonoValue } from "./WorkspaceDetailPrimitives";

function WorkspaceLink({
  project,
  workspace,
}: {
  project: Project;
  workspace: ProjectWorkspace;
}) {
  return <Link to={projectWorkspaceUrl(project, workspace.id)} className="hover:underline">{workspace.name}</Link>;
}

export function WorkspaceContextCards({
  workspace,
  project,
  projectRef,
  linkedProjectWorkspace,
  sourceIssue,
  derivedWorkspace,
  derivedWorkspaceHref,
}: {
  workspace: ExecutionWorkspace;
  project: Project | null;
  projectRef: string;
  linkedProjectWorkspace: ProjectWorkspace | null;
  sourceIssue: Issue | null;
  derivedWorkspace: ExecutionWorkspace | null;
  derivedWorkspaceHref: string | null;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Workspace context</CardTitle>
          <CardDescription>Linked objects and relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <DetailRow label="Project">
            {project ? <Link to={`/projects/${projectRef}`} className="hover:underline">{project.name}</Link> : <MonoValue value={workspace.projectId} />}
          </DetailRow>
          <DetailRow label="Project workspace">
            {project && linkedProjectWorkspace ? (
              <WorkspaceLink project={project} workspace={linkedProjectWorkspace} />
            ) : workspace.projectWorkspaceId ? (
              <MonoValue value={workspace.projectWorkspaceId} />
            ) : (
              "None"
            )}
          </DetailRow>
          <DetailRow label="Source issue">
            {sourceIssue ? (
              <Link to={issueUrl(sourceIssue)} className="hover:underline">
                {sourceIssue.identifier ?? sourceIssue.id} · {sourceIssue.title}
              </Link>
            ) : workspace.sourceIssueId ? (
              <MonoValue value={workspace.sourceIssueId} />
            ) : (
              "None"
            )}
          </DetailRow>
          <DetailRow label="Derived from">
            {derivedWorkspace && derivedWorkspaceHref ? (
              <Link to={derivedWorkspaceHref} className="hover:underline">
                {derivedWorkspace.name}
              </Link>
            ) : workspace.derivedFromExecutionWorkspaceId ? (
              <MonoValue value={workspace.derivedFromExecutionWorkspaceId} />
            ) : (
              "None"
            )}
          </DetailRow>
          <DetailRow label="Workspace ID">
            <MonoValue value={workspace.id} />
          </DetailRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Concrete location</CardTitle>
          <CardDescription>Paths and refs</CardDescription>
        </CardHeader>
        <CardContent>
          <DetailRow label="Working dir">
            {workspace.cwd ? <MonoValue value={workspace.cwd} copy /> : "None"}
          </DetailRow>
          <DetailRow label="Provider ref">
            {workspace.providerRef ? <MonoValue value={workspace.providerRef} copy /> : "None"}
          </DetailRow>
          <DetailRow label="Repo URL">
            {workspace.repoUrl && isSafeExternalUrl(workspace.repoUrl) ? (
              <div className="inline-flex max-w-full items-start gap-2">
                <a href={workspace.repoUrl} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 break-all hover:underline">
                  {workspace.repoUrl}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
                <CopyText text={workspace.repoUrl} className="shrink-0 text-muted-foreground hover:text-foreground" copiedLabel="Copied">
                  <Copy className="h-3.5 w-3.5" />
                </CopyText>
              </div>
            ) : workspace.repoUrl ? (
              <MonoValue value={workspace.repoUrl} copy />
            ) : (
              "None"
            )}
          </DetailRow>
          <DetailRow label="Base ref">
            {workspace.baseRef ? <MonoValue value={workspace.baseRef} copy /> : "None"}
          </DetailRow>
          <DetailRow label="Branch">
            {workspace.branchName ? <MonoValue value={workspace.branchName} copy /> : "None"}
          </DetailRow>
          <DetailRow label="Opened">{formatDateTime(workspace.openedAt)}</DetailRow>
          <DetailRow label="Last used">{formatDateTime(workspace.lastUsedAt)}</DetailRow>
          <DetailRow label="Cleanup">
            {workspace.cleanupEligibleAt
              ? `${formatDateTime(workspace.cleanupEligibleAt)}${workspace.cleanupReason ? ` · ${workspace.cleanupReason}` : ""}`
              : "Not scheduled"}
          </DetailRow>
        </CardContent>
      </Card>
    </>
  );
}
