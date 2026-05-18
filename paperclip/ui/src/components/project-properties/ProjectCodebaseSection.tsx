import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@paperclipai/shared";
import { projectsApi } from "../../api/projects";
import { queryKeys } from "../../lib/queryKeys";
import {
  CodebaseHelpLabel,
  LocalFolderSummary,
  LocalWorkspaceEditPanel,
  RepoSummary,
  RepoWorkspaceEditPanel,
  RuntimeServices,
} from "./ProjectCodebaseParts";

function isAbsolutePath(value: string) {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);
}

function looksLikeRepoUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

function deriveSourceType(cwd: string | null, repoUrl: string | null) {
  if (repoUrl) return "git_repo";
  if (cwd) return "local_path";
  return undefined;
}

export function ProjectCodebaseSection({
  project,
  selectedCompanyId,
}: {
  project: Project;
  selectedCompanyId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [workspaceMode, setWorkspaceMode] = useState<"local" | "repo" | null>(null);
  const [workspaceCwd, setWorkspaceCwd] = useState("");
  const [workspaceRepoUrl, setWorkspaceRepoUrl] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const workspaces = project.workspaces ?? [];
  const codebase = project.codebase;
  const primaryCodebaseWorkspace = project.primaryWorkspace ?? null;
  const hasAdditionalLegacyWorkspaces = workspaces.some((workspace) => workspace.id !== primaryCodebaseWorkspace?.id);

  const resetWorkspaceForm = () => {
    setWorkspaceCwd("");
    setWorkspaceRepoUrl("");
    setWorkspaceMode(null);
    setWorkspaceError(null);
  };

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
    if (project.urlKey !== project.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.urlKey) });
    }
    if (selectedCompanyId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(selectedCompanyId) });
    }
  };

  const createWorkspace = useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsApi.createWorkspace(project.id, data),
    onSuccess: () => {
      resetWorkspaceForm();
      invalidateProject();
    },
  });

  const removeWorkspace = useMutation({
    mutationFn: (workspaceId: string) => projectsApi.removeWorkspace(project.id, workspaceId),
    onSuccess: () => {
      resetWorkspaceForm();
      invalidateProject();
    },
  });

  const updateWorkspace = useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: Record<string, unknown> }) =>
      projectsApi.updateWorkspace(project.id, workspaceId, data),
    onSuccess: () => {
      resetWorkspaceForm();
      invalidateProject();
    },
  });

  const persistCodebase = (patch: { cwd?: string | null; repoUrl?: string | null }) => {
    const nextCwd = patch.cwd !== undefined ? patch.cwd : codebase.localFolder;
    const nextRepoUrl = patch.repoUrl !== undefined ? patch.repoUrl : codebase.repoUrl;
    if (!nextCwd && !nextRepoUrl) {
      if (primaryCodebaseWorkspace) {
        removeWorkspace.mutate(primaryCodebaseWorkspace.id);
      }
      return;
    }

    const sourceType = deriveSourceType(nextCwd, nextRepoUrl);
    const data: Record<string, unknown> = {
      ...(patch.cwd !== undefined ? { cwd: patch.cwd } : {}),
      ...(patch.repoUrl !== undefined ? { repoUrl: patch.repoUrl } : {}),
      ...(sourceType ? { sourceType } : {}),
      isPrimary: true,
    };

    if (primaryCodebaseWorkspace) {
      updateWorkspace.mutate({ workspaceId: primaryCodebaseWorkspace.id, data });
      return;
    }

    createWorkspace.mutate(data);
  };

  const submitLocalWorkspace = () => {
    const cwd = workspaceCwd.trim();
    if (!cwd) {
      setWorkspaceError(null);
      persistCodebase({ cwd: null });
      return;
    }
    if (!isAbsolutePath(cwd)) {
      setWorkspaceError("Local folder must be a full absolute path.");
      return;
    }
    setWorkspaceError(null);
    persistCodebase({ cwd });
  };

  const submitRepoWorkspace = () => {
    const repoUrl = workspaceRepoUrl.trim();
    if (!repoUrl) {
      setWorkspaceError(null);
      persistCodebase({ repoUrl: null });
      return;
    }
    if (!looksLikeRepoUrl(repoUrl)) {
      setWorkspaceError("Repo must use a valid GitHub or GitHub Enterprise repo URL.");
      return;
    }
    setWorkspaceError(null);
    persistCodebase({ repoUrl });
  };

  const clearLocalWorkspace = () => {
    const confirmed = window.confirm(
      codebase.repoUrl
        ? "Clear local folder from this workspace?"
        : "Delete this workspace local folder?",
    );
    if (!confirmed) return;
    persistCodebase({ cwd: null });
  };

  const clearRepoWorkspace = () => {
    const hasLocalFolder = Boolean(codebase.localFolder);
    const confirmed = window.confirm(
      hasLocalFolder
        ? "Clear repo from this workspace?"
        : "Delete this workspace repo?",
    );
    if (!confirmed) return;
    if (primaryCodebaseWorkspace && hasLocalFolder) {
      updateWorkspace.mutate({
        workspaceId: primaryCodebaseWorkspace.id,
        data: { repoUrl: null, repoRef: null, defaultRef: null, sourceType: deriveSourceType(codebase.localFolder, null) },
      });
      return;
    }
    persistCodebase({ repoUrl: null });
  };

  return (
    <div className="space-y-2">
      <CodebaseHelpLabel />
      <div className="space-y-2 rounded-md border border-border/70 p-3">
        <RepoSummary
          repoUrl={codebase.repoUrl}
          onChange={() => {
            setWorkspaceMode("repo");
            setWorkspaceRepoUrl(codebase.repoUrl ?? "");
            setWorkspaceError(null);
          }}
          onClear={clearRepoWorkspace}
        />

        <LocalFolderSummary
          effectiveLocalFolder={codebase.effectiveLocalFolder}
          origin={codebase.origin}
          hasLocalFolder={Boolean(codebase.localFolder)}
          onChange={() => {
            setWorkspaceMode("local");
            setWorkspaceCwd(codebase.localFolder ?? "");
            setWorkspaceError(null);
          }}
          onClear={clearLocalWorkspace}
        />

        {hasAdditionalLegacyWorkspaces ? (
          <div className="text-micro text-muted-foreground">
            Additional legacy workspace records exist on this project. Paperclip is using the primary workspace as the codebase view.
          </div>
        ) : null}

        <RuntimeServices services={primaryCodebaseWorkspace?.runtimeServices ?? []} />
      </div>

      {workspaceMode === "local" ? (
        <LocalWorkspaceEditPanel
          value={workspaceCwd}
          onChange={setWorkspaceCwd}
          saveDisabled={(!workspaceCwd.trim() && !primaryCodebaseWorkspace) || createWorkspace.isPending || updateWorkspace.isPending}
          onSave={submitLocalWorkspace}
          onCancel={() => {
            setWorkspaceMode(null);
            setWorkspaceCwd("");
            setWorkspaceError(null);
          }}
        />
      ) : null}

      {workspaceMode === "repo" ? (
        <RepoWorkspaceEditPanel
          value={workspaceRepoUrl}
          onChange={setWorkspaceRepoUrl}
          saveDisabled={(!workspaceRepoUrl.trim() && !primaryCodebaseWorkspace) || createWorkspace.isPending || updateWorkspace.isPending}
          onSave={submitRepoWorkspace}
          onCancel={() => {
            setWorkspaceMode(null);
            setWorkspaceRepoUrl("");
            setWorkspaceError(null);
          }}
        />
      ) : null}

      {workspaceError ? <p className="text-xs text-destructive">{workspaceError}</p> : null}
      {createWorkspace.isError ? <p className="text-xs text-destructive">Failed to save workspace.</p> : null}
      {removeWorkspace.isError ? <p className="text-xs text-destructive">Failed to delete workspace.</p> : null}
      {updateWorkspace.isError ? <p className="text-xs text-destructive">Failed to update workspace.</p> : null}
    </div>
  );
}
