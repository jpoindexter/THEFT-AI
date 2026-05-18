import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import type { CompanySkillDetail, CompanySkillFileDetail } from "@paperclipai/shared";
import { Boxes } from "lucide-react";
import { companySkillsApi } from "../api/companySkills";
import { EmptyState } from "../components/EmptyState";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import {
  DeleteSkillDialog,
  EmptySourceHelpDialog,
} from "./company-skills/CompanySkillDialogs";
import { CompanySkillsSidebar } from "./company-skills/CompanySkillsSidebar";
import { SkillPane } from "./company-skills/SkillPane";
import { splitFrontmatter } from "./company-skills/skillMarkdown";
import { parentDirectoryPaths, parseSkillRoute, skillRoute } from "./company-skills/skillRoutes";
import { useCompanySkillMutations } from "./company-skills/useCompanySkillMutations";

export function CompanySkills() {
  const { "*": routePath } = useParams<{ "*": string }>();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [skillFilter, setSkillFilter] = useState("");
  const [source, setSource] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [emptySourceHelpOpen, setEmptySourceHelpOpen] = useState(false);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, Set<string>>>({});
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [displayedDetail, setDisplayedDetail] = useState<CompanySkillDetail | null>(null);
  const [displayedFile, setDisplayedFile] = useState<CompanySkillFileDetail | null>(null);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetSkillId, setDeleteTargetSkillId] = useState<string | null>(null);
  const [deleteTargetDetail, setDeleteTargetDetail] = useState<CompanySkillDetail | null>(null);
  const parsedRoute = useMemo(() => parseSkillRoute(routePath), [routePath]);
  const routeSkillId = parsedRoute.skillId;
  const selectedPath = parsedRoute.filePath;

  useEffect(() => {
    setBreadcrumbs([
      { label: "Skills", href: "/skills" },
      ...(routeSkillId ? [{ label: "Detail" }] : []),
    ]);
  }, [routeSkillId, setBreadcrumbs]);

  const skillsQuery = useQuery({
    queryKey: queryKeys.companySkills.list(selectedCompanyId ?? ""),
    queryFn: () => companySkillsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });

  const selectedSkillId = useMemo(() => {
    if (!routeSkillId) return skillsQuery.data?.[0]?.id ?? null;
    return routeSkillId;
  }, [routeSkillId, skillsQuery.data]);

  useEffect(() => {
    if (routeSkillId || !selectedSkillId) return;
    navigate(skillRoute(selectedSkillId), { replace: true });
  }, [navigate, routeSkillId, selectedSkillId]);

  const detailQuery = useQuery({
    queryKey: queryKeys.companySkills.detail(selectedCompanyId ?? "", selectedSkillId ?? ""),
    queryFn: () => companySkillsApi.detail(selectedCompanyId!, selectedSkillId!),
    enabled: Boolean(selectedCompanyId && selectedSkillId),
  });

  const fileQuery = useQuery({
    queryKey: queryKeys.companySkills.file(selectedCompanyId ?? "", selectedSkillId ?? "", selectedPath),
    queryFn: () => companySkillsApi.file(selectedCompanyId!, selectedSkillId!, selectedPath),
    enabled: Boolean(selectedCompanyId && selectedSkillId && selectedPath),
  });

  const updateStatusQuery = useQuery({
    queryKey: queryKeys.companySkills.updateStatus(selectedCompanyId ?? "", selectedSkillId ?? ""),
    queryFn: () => companySkillsApi.updateStatus(selectedCompanyId!, selectedSkillId!),
    enabled: Boolean(
      selectedCompanyId
      && selectedSkillId
      && (detailQuery.data?.sourceType === "github" || displayedDetail?.sourceType === "github"),
    ),
    staleTime: 60_000,
  });

  useEffect(() => {
    setExpandedSkillId(selectedSkillId);
  }, [selectedSkillId]);

  useEffect(() => {
    if (!selectedSkillId || selectedPath === "SKILL.md") return;
    const parents = parentDirectoryPaths(selectedPath);
    if (parents.length === 0) return;
    setExpandedDirs((current) => {
      const next = new Set(current[selectedSkillId] ?? []);
      let changed = false;
      for (const parent of parents) {
        if (!next.has(parent)) {
          next.add(parent);
          changed = true;
        }
      }
      return changed ? { ...current, [selectedSkillId]: next } : current;
    });
  }, [selectedPath, selectedSkillId]);

  useEffect(() => {
    setEditMode(false);
  }, [selectedSkillId, selectedPath]);

  useEffect(() => {
    if (detailQuery.data) {
      setDisplayedDetail(detailQuery.data);
    }
  }, [detailQuery.data]);

  useEffect(() => {
    if (fileQuery.data) {
      setDisplayedFile(fileQuery.data);
      setDraft(fileQuery.data.markdown ? splitFrontmatter(fileQuery.data.content).body : fileQuery.data.content);
    }
  }, [fileQuery.data]);

  useEffect(() => {
    if (selectedSkillId) return;
    setDisplayedDetail(null);
    setDisplayedFile(null);
  }, [selectedSkillId]);

  const activeDetail = detailQuery.data ?? displayedDetail;
  const activeFile = fileQuery.data ?? displayedFile;

  const { importSkill, createSkill, scanProjects, saveFile, installUpdate, deleteSkill } = useCompanySkillMutations({
    selectedCompanyId: selectedCompanyId ?? "",
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
  });

  if (!selectedCompanyId) {
    return <EmptyState icon={Boxes} message="Select a company to manage skills." />;
  }

  function openDeleteDialog() {
    setDeleteTargetSkillId(selectedSkillId);
    setDeleteTargetDetail(activeDetail ?? null);
    setDeleteOpen(true);
  }

  function closeDeleteDialog(open: boolean) {
    setDeleteOpen(open);
    if (!open) {
      setDeleteTargetSkillId(null);
      setDeleteTargetDetail(null);
    }
  }

  function handleAddSkillSource() {
    const trimmedSource = source.trim();
    if (trimmedSource.length === 0) {
      setEmptySourceHelpOpen(true);
      return;
    }
    importSkill.mutate(trimmedSource);
  }

  return (
    <>
      <DeleteSkillDialog
        open={deleteOpen}
        onOpenChange={closeDeleteDialog}
        targetDetail={deleteTargetDetail}
        targetSkillId={deleteTargetSkillId}
        isPending={deleteSkill.isPending}
        onConfirm={() => deleteSkill.mutate()}
      />

      <EmptySourceHelpDialog open={emptySourceHelpOpen} onOpenChange={setEmptySourceHelpOpen} />

      <div className="grid min-h-[calc(100vh-12rem)] gap-0 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <CompanySkillsSidebar
          skills={skillsQuery.data}
          skillsLoading={skillsQuery.isLoading}
          skillsError={skillsQuery.error}
          selectedSkillId={selectedSkillId}
          selectedPath={selectedPath}
          skillFilter={skillFilter}
          source={source}
          createOpen={createOpen}
          scanStatusMessage={scanStatusMessage}
          importPending={importSkill.isPending}
          createPending={createSkill.isPending}
          scanPending={scanProjects.isPending}
          expandedSkillId={expandedSkillId}
          expandedDirs={expandedDirs}
          onSkillFilterChange={setSkillFilter}
          onSourceChange={setSource}
          onCreateOpenChange={setCreateOpen}
          onScanProjects={() => scanProjects.mutate()}
          onAddSkillSource={handleAddSkillSource}
          onCreateSkill={(payload) => createSkill.mutate(payload)}
          onToggleSkill={(currentSkillId) =>
            setExpandedSkillId((current) => current === currentSkillId ? null : currentSkillId)
          }
          onToggleDir={(currentSkillId, path) => {
            setExpandedDirs((current) => {
              const next = new Set(current[currentSkillId] ?? []);
              if (next.has(path)) next.delete(path);
              else next.add(path);
              return { ...current, [currentSkillId]: next };
            });
          }}
          onSelectSkill={(currentSkillId) => setExpandedSkillId(currentSkillId)}
        />

        <div className="min-w-0 pl-6">
          <SkillPane
            loading={skillsQuery.isLoading || detailQuery.isLoading}
            detail={activeDetail}
            file={activeFile}
            fileLoading={fileQuery.isLoading && !activeFile}
            updateStatus={updateStatusQuery.data}
            updateStatusLoading={updateStatusQuery.isLoading}
            viewMode={viewMode}
            editMode={editMode}
            draft={draft}
            setViewMode={setViewMode}
            setEditMode={setEditMode}
            setDraft={setDraft}
            onCheckUpdates={() => {
              void updateStatusQuery.refetch();
            }}
            checkUpdatesPending={updateStatusQuery.isFetching}
            onInstallUpdate={() => installUpdate.mutate()}
            installUpdatePending={installUpdate.isPending}
            onDelete={openDeleteDialog}
            deletePending={deleteSkill.isPending}
            onSave={() => saveFile.mutate()}
            savePending={saveFile.isPending}
          />
        </div>
      </div>
    </>
  );
}
