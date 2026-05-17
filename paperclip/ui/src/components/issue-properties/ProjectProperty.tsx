import { useMemo, useState } from "react";
import type { Issue, Project } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, Hexagon } from "lucide-react";
import { getRecentProjectIds, trackRecentProject } from "../../lib/recent-projects";
import { orderItemsBySelectedAndRecent } from "../../lib/recent-selections";
import { cn, projectUrl } from "../../lib/utils";
import {
  defaultExecutionWorkspaceModeForProject,
  defaultProjectWorkspaceIdForProject,
} from "./helpers";
import { ProjectSwatch } from "./PropertyControls";
import { PropertyPicker } from "./PropertyLayout";

interface ProjectPropertyProps {
  issue: Issue;
  projects: Project[] | undefined;
  orderedProjects: Project[];
  inline?: boolean;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function ProjectProperty({
  issue,
  projects,
  orderedProjects,
  inline,
  onUpdate,
}: ProjectPropertyProps) {
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const recentProjectIds = useMemo(() => getRecentProjectIds(), [projectOpen]);

  const projectName = (id: string | null) => {
    if (!id) return id?.slice(0, 8) ?? "None";
    const project = orderedProjects.find((p) => p.id === id);
    return project?.name ?? id.slice(0, 8);
  };
  const projectLink = (id: string | null) => {
    if (!id) return null;
    const project = projects?.find((p) => p.id === id) ?? null;
    return project ? projectUrl(project) : `/projects/${id}`;
  };

  const projectTrigger = issue.projectId ? (
    <>
      <ProjectSwatch color={orderedProjects.find((p) => p.id === issue.projectId)?.color} />
      <span className="text-sm break-words min-w-0">{projectName(issue.projectId)}</span>
    </>
  ) : (
    <>
      <Hexagon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">No project</span>
    </>
  );
  const projectPickerOptions = orderItemsBySelectedAndRecent(
    [
      { id: "", kind: "none" as const, name: "No project", color: null as string | null },
      ...orderedProjects.map((project) => ({
        id: project.id,
        kind: "project" as const,
        project,
        name: project.name,
        color: project.color ?? null,
      })),
    ],
    issue.projectId ?? "",
    recentProjectIds,
  );

  return (
    <PropertyPicker
      inline={inline}
      label="Project"
      open={projectOpen}
      onOpenChange={(open) => { setProjectOpen(open); if (!open) setProjectSearch(""); }}
      triggerContent={projectTrigger}
      triggerClassName="min-w-0 max-w-full"
      popoverClassName="w-fit min-w-44"
      extra={issue.projectId ? (
        <Link
          to={projectLink(issue.projectId)!}
          className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      ) : undefined}
    >
      <Input
        className="mb-1 h-8 px-2 py-1.5 text-xs shadow-none md:text-xs"
        placeholder="Search projects..."
        value={projectSearch}
        onChange={(e) => setProjectSearch(e.target.value)}
        autoFocus={!inline}
      />
      <div className="max-h-48 overflow-y-auto overscroll-contain">
        {projectPickerOptions
          .filter((option) => {
            if (!projectSearch.trim()) return true;
            const q = projectSearch.toLowerCase();
            return option.name.toLowerCase().includes(q);
          })
          .map((option) => (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              key={option.id || "__none__"}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs whitespace-nowrap",
                option.id === (issue.projectId ?? "") && "bg-accent",
              )}
              onClick={() => {
                if (option.kind === "project") {
                  const defaultMode = defaultExecutionWorkspaceModeForProject(option.project);
                  trackRecentProject(option.project.id);
                  onUpdate({
                    projectId: option.project.id,
                    projectWorkspaceId: defaultProjectWorkspaceIdForProject(option.project),
                    executionWorkspaceId: null,
                    executionWorkspacePreference: defaultMode,
                    executionWorkspaceSettings: option.project.executionWorkspacePolicy?.enabled
                      ? { mode: defaultMode }
                      : null,
                  });
                } else {
                  onUpdate({
                    projectId: null,
                    projectWorkspaceId: null,
                    executionWorkspaceId: null,
                    executionWorkspacePreference: null,
                    executionWorkspaceSettings: null,
                  });
                }
                setProjectOpen(false);
              }}
            >
              {option.kind === "project" ? <ProjectSwatch color={option.color} /> : null}
              {option.name}
            </Button>
          ))}
      </div>
    </PropertyPicker>
  );
}
