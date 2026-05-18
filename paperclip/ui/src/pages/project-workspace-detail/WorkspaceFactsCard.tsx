import type { Project, ProjectWorkspace } from "@paperclipai/shared";
import { ExternalLink } from "lucide-react";
import { Link } from "@/lib/router";
import { TheftLabel } from "@/components/theft/atoms/TheftLabel";
import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import { Separator } from "@/components/ui/separator";
import { isSafeExternalUrl } from "./workspaceModel";
import { WorkspaceDetailRow } from "./WorkspaceDetailPrimitives";

type WorkspaceFactsCardProps = {
  project: Project;
  workspace: ProjectWorkspace;
  canonicalProjectRef: string;
};

export function WorkspaceFactsCard({ project, workspace, canonicalProjectRef }: WorkspaceFactsCardProps) {
  return (
    <TheftSurface padding="lg" className="space-y-4">
      <div className="space-y-1">
        <TheftLabel density="compact">Workspace facts</TheftLabel>
        <h2 className="text-lg font-semibold">Current state</h2>
      </div>
      <Separator />
      <WorkspaceDetailRow label="Project">
        <Link to={`/projects/${canonicalProjectRef}`} className="hover:underline">{project.name}</Link>
      </WorkspaceDetailRow>
      <WorkspaceDetailRow label="Workspace ID">
        <span className="break-all font-mono text-xs">{workspace.id}</span>
      </WorkspaceDetailRow>
      <WorkspaceDetailRow label="Local path">
        <span className="break-all font-mono text-xs">{workspace.cwd ?? "None"}</span>
      </WorkspaceDetailRow>
      <WorkspaceDetailRow label="Repo">
        <WorkspaceRepoValue repoUrl={workspace.repoUrl} />
      </WorkspaceDetailRow>
      <WorkspaceDetailRow label="Default ref">{workspace.defaultRef ?? "None"}</WorkspaceDetailRow>
      <WorkspaceDetailRow label="Updated">{new Date(workspace.updatedAt).toLocaleString()}</WorkspaceDetailRow>
    </TheftSurface>
  );
}

function WorkspaceRepoValue({ repoUrl }: { repoUrl: string | null | undefined }) {
  if (!repoUrl) return <>None</>;
  if (!isSafeExternalUrl(repoUrl)) {
    return <span className="break-all font-mono text-xs">{repoUrl}</span>;
  }
  return (
    <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
      {repoUrl}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
