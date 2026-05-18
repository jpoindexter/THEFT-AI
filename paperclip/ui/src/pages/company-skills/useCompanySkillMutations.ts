import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "@/lib/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CompanySkillCreateRequest,
  CompanySkillDetail,
  CompanySkillFileDetail,
} from "@paperclipai/shared";
import { companySkillsApi } from "../../api/companySkills";
import { useToastActions } from "../../context/ToastContext";
import { queryKeys } from "../../lib/queryKeys";
import { mergeFrontmatter, splitFrontmatter } from "./skillMarkdown";
import { formatProjectScanSummary, shortRef } from "./skillSource";
import { skillRoute } from "./skillRoutes";

export function useCompanySkillMutations({
  selectedCompanyId,
  selectedSkillId,
  selectedPath,
  activeFile,
  draft,
  deleteTargetSkillId,
  closeDeleteDialog,
  setSource,
  setCreateOpen,
  setScanStatusMessage,
  setDraft,
  setEditMode,
  setDisplayedDetail,
  setDisplayedFile,
}: {
  selectedCompanyId: string;
  selectedSkillId: string | null;
  selectedPath: string;
  activeFile: CompanySkillFileDetail | null | undefined;
  draft: string;
  deleteTargetSkillId: string | null;
  closeDeleteDialog: (open: boolean) => void;
  setSource: Dispatch<SetStateAction<string>>;
  setCreateOpen: Dispatch<SetStateAction<boolean>>;
  setScanStatusMessage: Dispatch<SetStateAction<string | null>>;
  setDraft: Dispatch<SetStateAction<string>>;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  setDisplayedDetail: Dispatch<SetStateAction<CompanySkillDetail | null>>;
  setDisplayedFile: Dispatch<SetStateAction<CompanySkillFileDetail | null>>;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const importSkill = useMutation({
    mutationFn: (importSource: string) => companySkillsApi.importFromSource(selectedCompanyId, importSource),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId) });
      if (result.imported[0]) navigate(skillRoute(result.imported[0].id));
      pushToast({
        tone: "success",
        title: "Skills imported",
        body: `${result.imported.length} skill${result.imported.length === 1 ? "" : "s"} added.`,
      });
      if (result.warnings[0]) {
        pushToast({ tone: "warn", title: "Import warnings", body: result.warnings[0] });
      }
      setSource("");
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: "Skill import failed",
        body: error instanceof Error ? error.message : "Failed to import skill source.",
      });
    },
  });

  const createSkill = useMutation({
    mutationFn: (payload: CompanySkillCreateRequest) => companySkillsApi.create(selectedCompanyId, payload),
    onSuccess: async (skill) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId) });
      navigate(skillRoute(skill.id));
      setCreateOpen(false);
      pushToast({
        tone: "success",
        title: "Skill created",
        body: `${skill.name} is now editable in the Paperclip workspace.`,
      });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: "Skill creation failed",
        body: error instanceof Error ? error.message : "Failed to create skill.",
      });
    },
  });

  const scanProjects = useMutation({
    mutationFn: () => companySkillsApi.scanProjects(selectedCompanyId),
    onMutate: () => setScanStatusMessage("Scanning project workspaces for skills..."),
    onSuccess: async (result) => {
      setScanStatusMessage("Refreshing skills list...");
      await queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId) });
      const summary = formatProjectScanSummary(result);
      setScanStatusMessage(summary);
      pushToast({ tone: "success", title: "Project skill scan complete", body: summary });
      if (result.conflicts[0]) {
        pushToast({ tone: "warn", title: "Skill conflicts found", body: result.conflicts[0].reason });
      } else if (result.warnings[0]) {
        pushToast({ tone: "warn", title: "Scan warnings", body: result.warnings[0] });
      }
    },
    onError: (error) => {
      setScanStatusMessage(null);
      pushToast({
        tone: "error",
        title: "Project skill scan failed",
        body: error instanceof Error ? error.message : "Failed to scan project workspaces.",
      });
    },
  });

  const saveFile = useMutation({
    mutationFn: () => companySkillsApi.updateFile(
      selectedCompanyId,
      selectedSkillId!,
      selectedPath,
      activeFile?.markdown ? mergeFrontmatter(activeFile.content, draft) : draft,
    ),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.detail(selectedCompanyId, selectedSkillId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.file(selectedCompanyId, selectedSkillId!, selectedPath) }),
      ]);
      setDraft(result.markdown ? splitFrontmatter(result.content).body : result.content);
      setEditMode(false);
      pushToast({ tone: "success", title: "Skill saved", body: result.path });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: "Save failed",
        body: error instanceof Error ? error.message : "Failed to save skill file.",
      });
    },
  });

  const installUpdate = useMutation({
    mutationFn: () => companySkillsApi.installUpdate(selectedCompanyId, selectedSkillId!),
    onSuccess: async (skill) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.detail(selectedCompanyId, selectedSkillId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.updateStatus(selectedCompanyId, selectedSkillId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.file(selectedCompanyId, selectedSkillId!, selectedPath) }),
      ]);
      navigate(skillRoute(skill.id, selectedPath));
      pushToast({
        tone: "success",
        title: "Skill updated",
        body: skill.sourceRef ? `Pinned to ${shortRef(skill.sourceRef)}` : skill.name,
      });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: "Update failed",
        body: error instanceof Error ? error.message : "Failed to install skill update.",
      });
    },
  });

  const deleteSkill = useMutation({
    mutationFn: () => companySkillsApi.delete(selectedCompanyId, deleteTargetSkillId!),
    onSuccess: async (skill) => {
      closeDeleteDialog(false);
      setDisplayedDetail(null);
      setDisplayedFile(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(selectedCompanyId) }),
        ...(deleteTargetSkillId ? [
          queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.detail(selectedCompanyId, deleteTargetSkillId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.updateStatus(selectedCompanyId, deleteTargetSkillId) }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.companySkills.file(selectedCompanyId, deleteTargetSkillId, selectedPath),
          }),
        ] : []),
      ]);
      await queryClient.refetchQueries({
        queryKey: queryKeys.companySkills.list(selectedCompanyId),
        type: "active",
      });
      navigate("/skills", { replace: true });
      pushToast({
        tone: "success",
        title: "Skill removed",
        body: `${skill.name} was removed from the company skill library.`,
      });
    },
    onError: (error) => {
      pushToast({
        tone: "error",
        title: "Remove failed",
        body: error instanceof Error ? error.message : "Failed to remove skill.",
      });
    },
  });

  return { importSkill, createSkill, scanProjects, saveFile, installUpdate, deleteSkill };
}
