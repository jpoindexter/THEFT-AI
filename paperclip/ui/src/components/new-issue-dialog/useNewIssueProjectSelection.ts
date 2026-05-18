import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { trackRecentProject } from "../../lib/recent-projects";
import {
  defaultExecutionWorkspaceModeForProject,
  defaultProjectWorkspaceIdForProject,
} from "./issueDialogDefaults";

type ProjectForDefaults = NonNullable<Parameters<typeof defaultProjectWorkspaceIdForProject>[0]> & {
  id: string;
};

type UseNewIssueProjectSelectionInput = {
  executionWorkspaceDefaultProjectId: MutableRefObject<string | null>;
  newIssueOpen: boolean;
  orderedProjects: ProjectForDefaults[];
  projectId: string;
  selectedExecutionWorkspaceId: string;
  setExecutionWorkspaceMode: Dispatch<SetStateAction<string>>;
  setProjectId: Dispatch<SetStateAction<string>>;
  setProjectWorkspaceId: Dispatch<SetStateAction<string>>;
  setSelectedExecutionWorkspaceId: Dispatch<SetStateAction<string>>;
};

export function useNewIssueProjectSelection(input: UseNewIssueProjectSelectionInput) {
  const {
    executionWorkspaceDefaultProjectId,
    newIssueOpen,
    orderedProjects,
    projectId,
    selectedExecutionWorkspaceId,
    setExecutionWorkspaceMode,
    setProjectId,
    setProjectWorkspaceId,
    setSelectedExecutionWorkspaceId,
  } = input;

  const handleProjectChange = useCallback((nextProjectId: string) => {
    if (nextProjectId) trackRecentProject(nextProjectId);
    setProjectId(nextProjectId);
    const nextProject = orderedProjects.find((project) => project.id === nextProjectId);
    executionWorkspaceDefaultProjectId.current = nextProjectId || null;
    setProjectWorkspaceId(defaultProjectWorkspaceIdForProject(nextProject));
    setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForProject(nextProject));
    setSelectedExecutionWorkspaceId("");
  }, [
    executionWorkspaceDefaultProjectId,
    orderedProjects,
    setExecutionWorkspaceMode,
    setProjectId,
    setProjectWorkspaceId,
    setSelectedExecutionWorkspaceId,
  ]);

  useEffect(() => {
    if (
      !newIssueOpen ||
      !projectId ||
      selectedExecutionWorkspaceId ||
      executionWorkspaceDefaultProjectId.current === projectId
    ) {
      return;
    }
    const project = orderedProjects.find((entry) => entry.id === projectId);
    if (!project) return;
    executionWorkspaceDefaultProjectId.current = projectId;
    setProjectWorkspaceId(defaultProjectWorkspaceIdForProject(project));
    setExecutionWorkspaceMode(defaultExecutionWorkspaceModeForProject(project));
    setSelectedExecutionWorkspaceId("");
  }, [
    executionWorkspaceDefaultProjectId,
    newIssueOpen,
    orderedProjects,
    projectId,
    selectedExecutionWorkspaceId,
    setExecutionWorkspaceMode,
    setProjectWorkspaceId,
    setSelectedExecutionWorkspaceId,
  ]);

  return handleProjectChange;
}
