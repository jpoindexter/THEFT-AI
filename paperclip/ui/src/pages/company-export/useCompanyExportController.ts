import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  Agent,
  CompanyPortabilityExportPreviewResult,
  CompanyPortabilityFileEntry,
  Project,
} from "@paperclipai/shared";
import { agentsApi } from "@/api/agents";
import { authApi } from "@/api/auth";
import { companiesApi } from "@/api/companies";
import { projectsApi } from "@/api/projects";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToastActions } from "@/context/ToastContext";
import { useAgentOrder } from "@/hooks/useAgentOrder";
import { useProjectOrder } from "@/hooks/useProjectOrder";
import { buildInitialExportCheckedFiles } from "@/lib/company-export-selection";
import { buildPortableSidebarOrder } from "@/lib/company-portability-sidebar";
import { useLocation, useNavigate } from "@/lib/router";
import { queryKeys } from "@/lib/queryKeys";
import { buildFileTree, collectAllPaths, countFiles } from "@/components/FileTree";
import { downloadZip } from "./exportDownload";
import { generateReadmeFromSelection } from "./exportReadmeModel";
import {
  TASKS_PAGE_SIZE,
  collectMatchedParentDirs,
  expandAncestors,
  filePathFromLocation,
  filterTree,
  findTreeNode,
  paginateTaskNodes,
  sortByChecked,
} from "./exportTreeModel";
import { filterPaperclipYaml } from "./exportYamlModel";

export function useCompanyExportController() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToastActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [exportData, setExportData] = useState<CompanyPortabilityExportPreviewResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());
  const [treeSearch, setTreeSearch] = useState("");
  const [taskLimit, setTaskLimit] = useState(TASKS_PAGE_SIZE);
  const savedExpandedRef = useRef<Set<string> | null>(null);
  const initialFileFromUrl = useRef(filePathFromLocation(location.pathname));

  const { data: session, isFetched: isSessionFetched } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const { data: agents = [], isFetched: areAgentsFetched } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const { data: projects = [], isFetched: areProjectsFetched } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const visibleAgents = useMemo(() => agents.filter((agent: Agent) => agent.status !== "terminated"), [agents]);
  const visibleProjects = useMemo(() => projects.filter((project: Project) => !project.archivedAt), [projects]);
  const { orderedAgents } = useAgentOrder({ agents: visibleAgents, companyId: selectedCompanyId, userId: currentUserId });
  const { orderedProjects } = useProjectOrder({ projects: visibleProjects, companyId: selectedCompanyId, userId: currentUserId });
  const sidebarOrder = useMemo(
    () => buildPortableSidebarOrder({ agents: visibleAgents, orderedAgents, projects: visibleProjects, orderedProjects }),
    [orderedAgents, orderedProjects, visibleAgents, visibleProjects],
  );
  const sidebarOrderKey = useMemo(() => JSON.stringify(sidebarOrder ?? null), [sidebarOrder]);

  const selectFile = useCallback(
    (filePath: string | null, replace = false) => {
      setSelectedFile(filePath);
      navigate(filePath ? `/company/export/files/${encodeURI(filePath)}` : "/company/export", { replace });
    },
    [navigate],
  );

  useEffect(() => {
    if (!exportData) return;
    const urlFile = filePathFromLocation(location.pathname);
    if (urlFile && urlFile in exportData.files && urlFile !== selectedFile) {
      setSelectedFile(urlFile);
      setExpandedDirs((prev) => new Set([...prev, ...expandAncestors(urlFile)]));
    } else if (!urlFile && selectedFile) {
      setSelectedFile(null);
    }
  }, [location.pathname, exportData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setBreadcrumbs([{ label: "Org Chart", href: "/org" }, { label: "Export" }]);
  }, [setBreadcrumbs]);

  const exportPreviewMutation = useMutation({
    mutationFn: () =>
      companiesApi.exportPreview(selectedCompanyId!, {
        include: { company: true, agents: true, projects: true, issues: true },
        sidebarOrder,
      }),
    onSuccess: (result) => {
      setExportData(result);
      setCheckedFiles((prev) => buildInitialExportCheckedFiles(Object.keys(result.files), result.manifest.issues, prev));
      const topDirs = new Set<string>();
      for (const node of buildFileTree(result.files)) {
        if (node.kind === "dir" && node.name !== "tasks") topDirs.add(node.path);
      }

      const urlFile = initialFileFromUrl.current;
      if (urlFile && urlFile in result.files) {
        setSelectedFile(urlFile);
        setExpandedDirs(new Set([...topDirs, ...expandAncestors(urlFile)]));
      } else {
        const defaultFile = "README.md" in result.files ? "README.md" : Object.keys(result.files)[0];
        if (defaultFile) selectFile(defaultFile, true);
        setExpandedDirs(topDirs);
      }
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Export failed",
        body: err instanceof Error ? err.message : "Failed to load export data.",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: () =>
      companiesApi.exportBundle(selectedCompanyId!, {
        include: { company: true, agents: true, projects: true, issues: true },
        selectedFiles: Array.from(checkedFiles).sort(),
        sidebarOrder,
      }),
    onSuccess: (result) => {
      const resultCheckedFiles = new Set(Object.keys(result.files));
      downloadZip(result, resultCheckedFiles, result.files);
      pushToast({
        tone: "success",
        title: "Export downloaded",
        body: `${resultCheckedFiles.size} file${resultCheckedFiles.size === 1 ? "" : "s"} exported as ${result.rootPath}.zip`,
      });
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Export failed",
        body: err instanceof Error ? err.message : "Failed to build export package.",
      });
    },
  });

  useEffect(() => {
    if (!selectedCompanyId || exportPreviewMutation.isPending) return;
    if (!isSessionFetched || !areAgentsFetched || !areProjectsFetched) return;
    setExportData(null);
    exportPreviewMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, isSessionFetched, areAgentsFetched, areProjectsFetched, sidebarOrderKey]);

  const tree = useMemo(() => (exportData ? buildFileTree(exportData.files) : []), [exportData]);
  const visibleTree = useMemo(() => {
    const filteredTree = treeSearch ? filterTree(tree, treeSearch) : tree;
    return paginateTaskNodes(sortByChecked(filteredTree, checkedFiles), taskLimit, checkedFiles, treeSearch);
  }, [tree, treeSearch, checkedFiles, taskLimit]);
  const effectiveFiles = useMemo(() => {
    if (!exportData) return {} as Record<string, CompanyPortabilityFileEntry>;
    const filtered = { ...exportData.files };
    const yamlPath = exportData.paperclipExtensionPath;
    if (yamlPath && typeof exportData.files[yamlPath] === "string") {
      filtered[yamlPath] = filterPaperclipYaml(exportData.files[yamlPath], checkedFiles);
    }
    if (typeof exportData.files["README.md"] === "string") {
      filtered["README.md"] = generateReadmeFromSelection(
        exportData.manifest,
        checkedFiles,
        exportData.manifest.company?.name ?? selectedCompany?.name ?? "Company",
        exportData.manifest.company?.description ?? null,
      );
    }
    return filtered;
  }, [exportData, checkedFiles, selectedCompany?.name]);

  const handleToggleDir = (path: string) => setExpandedDirs((prev) => {
    const next = new Set(prev);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
  });

  const handleToggleCheck = (path: string, kind: "file" | "dir") => {
    if (!exportData) return;
    setCheckedFiles((prev) => {
      const next = new Set(prev);
      if (kind === "file") {
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      }
      const dirNode = findTreeNode(buildFileTree(exportData.files), path);
      if (!dirNode) return next;
      const childFiles = collectAllPaths(dirNode.children, "file");
      for (const child of dirNode.children) if (child.kind === "file") childFiles.add(child.path);
      const allChecked = [...childFiles].every((filePath) => next.has(filePath));
      for (const filePath of childFiles) allChecked ? next.delete(filePath) : next.add(filePath);
      return next;
    });
  };

  const handleSearchChange = (query: string) => {
    const wasSearching = treeSearch.length > 0;
    if (query.length > 0 && !wasSearching) savedExpandedRef.current = new Set(expandedDirs);
    setTreeSearch(query);
    if (query.length > 0) setExpandedDirs((prev) => new Set([...prev, ...collectMatchedParentDirs(tree, query)]));
    else if (wasSearching && savedExpandedRef.current) {
      setExpandedDirs(savedExpandedRef.current);
      savedExpandedRef.current = null;
    }
  };

  const handleSkillClick = (skillKey: string) => {
    if (!exportData) return;
    const manifestSkill = exportData.manifest.skills.find((skill) => skill.key === skillKey || skill.slug === skillKey);
    const skillPath = manifestSkill?.path ?? `skills/${skillKey}/SKILL.md`;
    if (!(skillPath in exportData.files)) return;
    selectFile(skillPath);
    setExpandedDirs((prev) => new Set([...prev, "skills", ...expandAncestors(skillPath)]));
  };

  return {
    selectedCompanyId,
    companyName: selectedCompany?.name ?? "Company",
    exportData,
    selectedFile,
    expandedDirs,
    checkedFiles,
    treeSearch,
    displayTree: visibleTree.nodes,
    totalTaskChildren: visibleTree.totalTaskChildren,
    visibleTaskChildren: visibleTree.visibleTaskChildren,
    previewContent: selectedFile ? effectiveFiles[selectedFile] ?? null : null,
    effectiveFiles,
    totalFiles: countFiles(tree),
    selectedCount: checkedFiles.size,
    warnings: exportData?.warnings.filter((warning) => !/terminated agent/i.test(warning)) ?? [],
    isLoading: exportPreviewMutation.isPending && !exportData,
    isDownloading: downloadMutation.isPending,
    download: () => downloadMutation.mutate(),
    increaseTaskLimit: () => setTaskLimit((prev) => prev + TASKS_PAGE_SIZE),
    selectFile,
    handleToggleDir,
    handleToggleCheck,
    handleSearchChange,
    handleSkillClick,
  };
}
