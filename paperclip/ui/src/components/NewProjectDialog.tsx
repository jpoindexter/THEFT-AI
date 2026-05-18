import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDialog } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { accessApi } from "../api/access";
import { projectsApi } from "../api/projects";
import { agentsApi } from "../api/agents";
import { goalsApi } from "../api/goals";
import { assetsApi } from "../api/assets";
import { buildMarkdownMentionOptions } from "../lib/company-members";
import { queryKeys } from "../lib/queryKeys";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Maximize2,
  Minimize2,
} from "lucide-react";
import { PROJECT_COLORS } from "@paperclipai/shared";
import { cn } from "../lib/utils";
import { MarkdownEditor, type MarkdownEditorRef, type MentionOption } from "./MarkdownEditor";
import { ProjectPropertyChips } from "./new-project-dialog/ProjectPropertyChips";
import { ProjectWorkspaceFields } from "./new-project-dialog/ProjectWorkspaceFields";

export function NewProjectDialog() {
  const { newProjectOpen, closeNewProject } = useDialog();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [workspaceLocalPath, setWorkspaceLocalPath] = useState("");
  const [workspaceRepoUrl, setWorkspaceRepoUrl] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const descriptionEditorRef = useRef<MarkdownEditorRef>(null);

  const { data: goals } = useQuery({
    queryKey: queryKeys.goals.list(selectedCompanyId!),
    queryFn: () => goalsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId && newProjectOpen,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId && newProjectOpen,
  });

  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId && newProjectOpen,
  });

  const mentionOptions = useMemo<MentionOption[]>(() => {
    return buildMarkdownMentionOptions({
      agents,
      members: companyMembers?.users,
    });
  }, [agents, companyMembers?.users]);

  const createProject = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      projectsApi.create(selectedCompanyId!, data),
  });

  const uploadDescriptionImage = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCompanyId) throw new Error("No company selected");
      return assetsApi.uploadImage(selectedCompanyId, file, "projects/drafts");
    },
  });

  function reset() {
    setName("");
    setDescription("");
    setStatus("planned");
    setGoalIds([]);
    setTargetDate("");
    setExpanded(false);
    setWorkspaceLocalPath("");
    setWorkspaceRepoUrl("");
    setWorkspaceError(null);
  }

  const isAbsolutePath = (value: string) => value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);

  const looksLikeRepoUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") return false;
      const segments = parsed.pathname.split("/").filter(Boolean);
      return segments.length >= 2;
    } catch {
      return false;
    }
  };

  const deriveWorkspaceNameFromPath = (value: string) => {
    const normalized = value.trim().replace(/[\\/]+$/, "");
    const segments = normalized.split(/[\\/]/).filter(Boolean);
    return segments[segments.length - 1] ?? "Local folder";
  };

  const deriveWorkspaceNameFromRepo = (value: string) => {
    try {
      const parsed = new URL(value);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const repo = segments[segments.length - 1]?.replace(/\.git$/i, "") ?? "";
      return repo || "GitHub repo";
    } catch {
      return "GitHub repo";
    }
  };

  async function handleSubmit() {
    if (!selectedCompanyId || !name.trim()) return;
    const localPath = workspaceLocalPath.trim();
    const repoUrl = workspaceRepoUrl.trim();

    if (localPath && !isAbsolutePath(localPath)) {
      setWorkspaceError("Local folder must be a full absolute path.");
      return;
    }
    if (repoUrl && !looksLikeRepoUrl(repoUrl)) {
      setWorkspaceError("Repo must use a valid GitHub or GitHub Enterprise repo URL.");
      return;
    }

    setWorkspaceError(null);

    try {
      const created = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
        ...(goalIds.length > 0 ? { goalIds } : {}),
        ...(targetDate ? { targetDate } : {}),
      });

      if (localPath || repoUrl) {
        const workspacePayload: Record<string, unknown> = {
          name: localPath
            ? deriveWorkspaceNameFromPath(localPath)
            : deriveWorkspaceNameFromRepo(repoUrl),
          ...(localPath ? { cwd: localPath } : {}),
          ...(repoUrl ? { repoUrl } : {}),
        };
        await projectsApi.createWorkspace(created.id, workspacePayload);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(selectedCompanyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(created.id) });
      reset();
      closeNewProject();
    } catch {
      // surface through createProject.isError
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const selectedGoals = (goals ?? []).filter((g) => goalIds.includes(g.id));
  const availableGoals = (goals ?? []).filter((g) => !goalIds.includes(g.id));

  return (
    <Dialog
      open={newProjectOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          closeNewProject();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn("p-0 gap-0", expanded ? "sm:max-w-2xl" : "sm:max-w-lg")}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedCompany && (
              <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-medium">
                {selectedCompany.name.slice(0, 3).toUpperCase()}
              </span>
            )}
            <span className="text-muted-foreground/60">&rsaquo;</span>
            <span>New project</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              onClick={() => { reset(); closeNewProject(); }}
            >
              <span className="text-lg leading-none">&times;</span>
            </Button>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2 shrink-0">
          <Input
            className="h-auto border-0 bg-transparent px-0 py-0 text-lg font-semibold shadow-none placeholder:text-muted-foreground/50 focus-visible:border-transparent focus-visible:ring-0"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                descriptionEditorRef.current?.focus();
              }
            }}
            autoFocus
          />
        </div>

        <div className="px-4 pb-2">
          <MarkdownEditor
            ref={descriptionEditorRef}
            value={description}
            onChange={setDescription}
            placeholder="Add description..."
            bordered={false}
            mentions={mentionOptions}
            contentClassName={cn("text-sm text-muted-foreground", expanded ? "min-h-56" : "min-h-32")}
            imageUploadHandler={async (file) => {
              const asset = await uploadDescriptionImage.mutateAsync(file);
              return asset.contentPath;
            }}
          />
        </div>

        <ProjectWorkspaceFields
          workspaceRepoUrl={workspaceRepoUrl}
          setWorkspaceRepoUrl={setWorkspaceRepoUrl}
          workspaceLocalPath={workspaceLocalPath}
          setWorkspaceLocalPath={setWorkspaceLocalPath}
          workspaceError={workspaceError}
          setWorkspaceError={setWorkspaceError}
        />

        <ProjectPropertyChips
          status={status}
          setStatus={setStatus}
          statusOpen={statusOpen}
          setStatusOpen={setStatusOpen}
          goalOpen={goalOpen}
          setGoalOpen={setGoalOpen}
          selectedGoals={selectedGoals}
          availableGoals={availableGoals}
          setGoalIds={setGoalIds}
          targetDate={targetDate}
          setTargetDate={setTargetDate}
        />

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
          {createProject.isError ? (
            <p className="text-xs text-destructive">Failed to create project.</p>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            disabled={!name.trim() || createProject.isPending}
            onClick={handleSubmit}
          >
            {createProject.isPending ? "Creating…" : "Create project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
