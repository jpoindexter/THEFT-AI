import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate, useNavigationType, useParams } from "@/lib/router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { issuesApi } from "../api/issues";
import { approvalsApi } from "../api/approvals";
import type { RunForIssue } from "../api/activity";
import { heartbeatsApi, type ActiveRunForIssue, type LiveRunForIssue } from "../api/heartbeats";
import { instanceSettingsApi } from "../api/instanceSettings";
import { accessApi } from "../api/access";
import { agentsApi } from "../api/agents";
import { authApi } from "../api/auth";
import { projectsApi } from "../api/projects";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { usePanel } from "../context/PanelContext";
import { useSidebar } from "../context/SidebarContext";
import { useToastActions } from "../context/ToastContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { assigneeValueFromSelection, suggestedCommentAssigneeValue } from "../lib/assignees";
import { buildCompanyUserInlineOptions, buildCompanyUserLabelMap, buildCompanyUserProfileMap, buildMarkdownMentionOptions } from "../lib/company-members";
import { queryKeys } from "../lib/queryKeys";
import { keepPreviousDataForSameQueryTail } from "../lib/query-placeholder-data";
import { collectLiveIssueIds } from "../lib/liveIssueIds";
import {
  hasLegacyIssueDetailQuery,
  createIssueDetailPath,
  readIssueDetailLocationState,
  readIssueDetailBreadcrumb,
  readIssueDetailHeaderSeed,
  rememberIssueDetailLocationState,
} from "../lib/issueDetailBreadcrumb";
import { shouldTrackIssueActiveRun } from "../lib/issueActiveRun";
import { getIssueDetailQueryOptions } from "../lib/issueDetailCache";
import {
  hasBlockingShortcutDialog,
  resolveIssueDetailGoKeyAction,
  resolveInboxQuickArchiveKeyAction,
} from "../lib/keyboardShortcuts";
import {
  applyOptimisticIssueFieldUpdate,
  applyOptimisticIssueFieldUpdateToCollection,
  applyOptimisticIssueCommentUpdate,
  createOptimisticIssueComment,
  flattenIssueCommentPages,
  getNextIssueCommentPageParam,
  loadRemainingIssueCommentPages,
  matchesIssueRef,
  mergeIssueComments,
  removeIssueCommentFromPages,
  shouldAutoloadOlderIssueComments,
  takeOptimisticIssueComment,
  upsertIssueCommentInPages,
  type OptimisticIssueComment,
} from "../lib/optimistic-issue-comments";
import { clearIssueExecutionRun, removeLiveRunById, upsertInterruptedRun } from "../lib/optimistic-issue-runs";
import { useProjectOrder } from "../hooks/useProjectOrder";
import { cn } from "../lib/utils";
import type { IssueChatComposerHandle } from "../components/IssueChatThread";
import { IssueDocumentsSection } from "../components/IssueDocumentsSection";
import { IssuesList } from "../components/IssuesList";
import { IssueRelatedWorkPanel } from "../components/IssueRelatedWorkPanel";
import { IssueProperties } from "../components/IssueProperties";
import { IssueWorkspaceCard } from "../components/IssueWorkspaceCard";
import type { MentionOption } from "../components/MarkdownEditor";
import { ImageGalleryModal } from "../components/ImageGalleryModal";
import { ScrollToBottom } from "../components/ScrollToBottom";
import { IssueAttachmentsSection } from "../components/issue-detail/IssueAttachmentsSection";
import { IssueDetailActivityTab } from "../components/issue-detail/IssueDetailActivityTab";
import { IssueDetailChatTab } from "../components/issue-detail/IssueDetailChatTab";
import type {
  ActionableIssueThreadInteraction,
  CommentReassignment,
  IssueDetailComment,
} from "../components/issue-detail/IssueDetailChatTypes";
import { InboxMobileToolbar } from "../components/issue-detail/InboxMobileToolbar";
import { IssueDetailReviewHeader } from "../components/issue-detail/IssueDetailReviewHeader";
import { IssueDetailTitleSection } from "../components/issue-detail/IssueDetailTitleSection";
import { IssueDetailLoadingState } from "../components/issue-detail/IssueDetailLoadingState";
import {
  fileBaseName,
  isMarkdownFile,
  mergeOptimisticFeedbackVote,
  slugifyDocumentKey,
  titleizeFilename,
  truncate,
} from "../components/issue-detail/IssueDetailUtils";
import {
  IssueTreeControlDialog,
  issueTreeControlLabel,
} from "../components/issue-detail/IssueTreeControlDialog";
import {
  dedupeLiveRunsById,
  readIssueRunStateFromCache,
  resolveRunningIssueRun,
} from "../components/issue-detail/issueRunState";
import { PluginSlotMount, PluginSlotOutlet, usePluginSlots } from "@/plugins/slots";
import { PluginLauncherOutlet } from "@/plugins/launchers";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TheftDetailReviewTemplate } from "@/components/theft/templates/TheftDetailReviewTemplate";
import { buildIssuePropertiesPanelKey } from "../lib/issue-properties-panel-key";
import { shouldRenderRichSubIssuesSection } from "../lib/issue-detail-subissues";
import { filterIssueDescendants } from "../lib/issue-tree";
import { buildSubIssueDefaultsForViewer } from "../lib/subIssueDefaults";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowLeft,
  Library,
  ListTree,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
} from "lucide-react";
import {
  getClosedIsolatedExecutionWorkspaceMessage,
  isClosedIsolatedExecutionWorkspace,
  ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY,
  type AskUserQuestionsAnswer,
  type AskUserQuestionsInteraction,
  type ActivityEvent,
  type Agent,
  type FeedbackVote,
  type Issue,
  type IssueAttachment,
  type IssueComment,
  type IssueWorkMode,
  type IssueThreadInteraction,
  type IssueTreeControlMode,
} from "@paperclipai/shared";

const FEEDBACK_TERMS_URL = import.meta.env.VITE_FEEDBACK_TERMS_URL?.trim() || "https://paperclip.ing/tos";
const ISSUE_COMMENT_PAGE_SIZE = 50;
const ISSUE_COMMENT_AUTOLOAD_LIMIT = ISSUE_COMMENT_PAGE_SIZE * 3;
const JUMP_TO_LATEST_MAX_COMMENT_PAGES = 10;

export function IssueDetail() {
  const { issueId } = useParams<{ issueId: string }>();
  const { selectedCompanyId } = useCompany();
  const { openNewIssue } = useDialogActions();
  const { openPanel, closePanel, panelVisible, setPanelVisible } = usePanel();
  const { setBreadcrumbs, setMobileToolbar } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const { pushToast } = useToastActions();
  const { isMobile } = useSidebar();
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("related-work");
  const [handoffFocusSignal, setHandoffFocusSignal] = useState(0);
  const [pendingApprovalAction, setPendingApprovalAction] = useState<{
    approvalId: string;
    action: "approve" | "reject";
  } | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentDragActive, setAttachmentDragActive] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [treeControlOpen, setTreeControlOpen] = useState(false);
  const [treeControlMode, setTreeControlMode] = useState<IssueTreeControlMode>("pause");
  const [treeControlReason, setTreeControlReason] = useState("");
  const [treeControlWakeAgentsOnResume, setTreeControlWakeAgentsOnResume] = useState(false);
  const [treeControlCancelConfirmed, setTreeControlCancelConfirmed] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<OptimisticIssueComment[]>([]);
  const [locallyQueuedCommentRunIds, setLocallyQueuedCommentRunIds] = useState<Map<string, string>>(() => new Map());
  const [pendingCommentComposerFocusKey, setPendingCommentComposerFocusKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastMarkedReadIssueIdRef = useRef<string | null>(null);
  const commentComposerRef = useRef<IssueChatComposerHandle | null>(null);
  const cancelledQueuedOptimisticCommentIdsRef = useRef(new Set<string>());
  const resolvedIssueDetailState = useMemo(
    () => readIssueDetailLocationState(issueId, location.state, location.search),
    [issueId, location.state, location.search],
  );
  const issueHeaderSeed = useMemo(
    () => readIssueDetailHeaderSeed(location.state) ?? readIssueDetailHeaderSeed(resolvedIssueDetailState),
    [location.state, resolvedIssueDetailState],
  );

  const { data: issue, isLoading, error } = useQuery({
    ...getIssueDetailQueryOptions(queryClient, issueId!, {
      placeholderIssue: issueHeaderSeed ? {
        id: issueHeaderSeed.id,
        identifier: issueHeaderSeed.identifier,
      } : null,
    }),
    enabled: !!issueId,
  });
  const resolvedCompanyId = issue?.companyId ?? selectedCompanyId;
  const commentComposerDisabledReason = useMemo(() => {
    if (!issue?.currentExecutionWorkspace || !isClosedIsolatedExecutionWorkspace(issue.currentExecutionWorkspace)) {
      return null;
    }
    return getClosedIsolatedExecutionWorkspaceMessage(issue.currentExecutionWorkspace);
  }, [issue?.currentExecutionWorkspace]);

  const {
    data: commentPages,
    isLoading: commentsLoading,
    isFetchingNextPage: commentsLoadingOlder,
    hasNextPage: hasOlderComments,
    fetchNextPage: fetchOlderComments,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: queryKeys.issues.comments(issueId!),
    queryFn: ({ pageParam }) =>
      issuesApi.listComments(issueId!, {
        order: "desc",
        limit: ISSUE_COMMENT_PAGE_SIZE,
        ...(pageParam ? { after: pageParam } : {}),
      }),
    enabled: !!issueId,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      getNextIssueCommentPageParam(lastPage, ISSUE_COMMENT_PAGE_SIZE),
    placeholderData: keepPreviousDataForSameQueryTail<InfiniteData<IssueComment[], string | null>>(issueId ?? "pending"),
  });
  const comments = useMemo(
    () => flattenIssueCommentPages(commentPages?.pages),
    [commentPages?.pages],
  );
  const shouldPrefetchOlderComments = useMemo(
    () =>
      shouldAutoloadOlderIssueComments({
        activeDetailTab: detailTab,
        hasOlderComments: hasOlderComments ?? false,
        loadedCommentCount: comments.length,
        initialPageLoading: commentsLoading,
        olderPageLoading: commentsLoadingOlder,
        autoLoadLimit: ISSUE_COMMENT_AUTOLOAD_LIMIT,
      }),
    [comments.length, commentsLoading, commentsLoadingOlder, detailTab, hasOlderComments],
  );
  const { data: interactions = [] } = useQuery({
    queryKey: queryKeys.issues.interactions(issueId!),
    queryFn: () => issuesApi.listInteractions(issueId!),
    enabled: !!issueId,
    placeholderData: keepPreviousDataForSameQueryTail<IssueThreadInteraction[]>(issueId ?? "pending"),
  });

  const { data: attachments, isLoading: attachmentsLoading } = useQuery({
    queryKey: queryKeys.issues.attachments(issueId!),
    queryFn: () => issuesApi.listAttachments(issueId!),
    enabled: !!issueId,
    placeholderData: keepPreviousDataForSameQueryTail<IssueAttachment[]>(issueId ?? "pending"),
  });

  const { data: liveRunCount = 0 } = useQuery<LiveRunForIssue[], Error, number>({
    queryKey: queryKeys.issues.liveRuns(issueId!),
    queryFn: () => heartbeatsApi.liveRunsForIssue(issueId!),
    enabled: !!issueId,
    refetchInterval: 3000,
    select: (runs) => runs.length,
    placeholderData: keepPreviousDataForSameQueryTail<LiveRunForIssue[]>(issueId ?? "pending"),
  });

  const { data: hasActiveRun = false } = useQuery<ActiveRunForIssue | null, Error, boolean>({
    queryKey: queryKeys.issues.activeRun(issueId!),
    queryFn: () => heartbeatsApi.activeRunForIssue(issueId!),
    enabled: !!issueId && (!!issue?.executionRunId || issue?.status === "in_progress"),
    refetchInterval: liveRunCount > 0 ? false : 3000,
    select: (run) => !!run,
    placeholderData: keepPreviousDataForSameQueryTail<ActiveRunForIssue | null>(issueId ?? "pending"),
  });
  const resolvedHasActiveRun = issue ? shouldTrackIssueActiveRun(issue) && hasActiveRun : hasActiveRun;
  const hasLiveRuns = liveRunCount > 0 || resolvedHasActiveRun;
  useEffect(() => {
    if (!hasLiveRuns && locallyQueuedCommentRunIds.size > 0) {
      setLocallyQueuedCommentRunIds(new Map());
    }
  }, [hasLiveRuns, locallyQueuedCommentRunIds.size]);
  const sourceBreadcrumb = useMemo(
    () => readIssueDetailBreadcrumb(issueId, location.state, location.search) ?? { label: "Tasks", href: "/issues" },
    [issueId, location.state, location.search],
  );

  const { data: rawChildIssues = [], isLoading: childIssuesLoading } = useQuery({
    queryKey:
      issue?.id && resolvedCompanyId
        ? queryKeys.issues.listByDescendantRoot(resolvedCompanyId, issue.id)
        : ["issues", "parent", "pending"],
    queryFn: () => issuesApi.list(resolvedCompanyId!, { descendantOf: issue!.id, includeBlockedBy: true }),
    enabled: !!resolvedCompanyId && !!issue?.id,
    placeholderData: keepPreviousDataForSameQueryTail<Issue[]>(issue?.id ?? "pending"),
  });
  const { data: companyLiveRuns } = useQuery({
    queryKey: resolvedCompanyId ? queryKeys.liveRuns(resolvedCompanyId) : ["live-runs", "pending"],
    queryFn: () => heartbeatsApi.liveRunsForCompany(resolvedCompanyId!),
    enabled: !!resolvedCompanyId,
    refetchInterval: 5000,
    placeholderData: keepPreviousDataForSameQueryTail<LiveRunForIssue[]>(resolvedCompanyId ?? "pending"),
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const { data: boardAccess } = useQuery({
    queryKey: queryKeys.access.currentBoardAccess,
    queryFn: () => accessApi.getCurrentBoardAccess(),
    enabled: !!session?.user?.id,
    retry: false,
  });
  const canManageTreeControl = Boolean(
    selectedCompanyId
    && boardAccess?.companyIds?.includes(selectedCompanyId),
  );
  const { data: feedbackVotes } = useQuery({
    queryKey: queryKeys.issues.feedbackVotes(issueId!),
    queryFn: () => issuesApi.listFeedbackVotes(issueId!),
    enabled: !!issueId && !!currentUserId,
  });
  const { data: instanceGeneralSettings } = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
    enabled: !!issueId,
    retry: false,
  });
  const keyboardShortcutsEnabled = instanceGeneralSettings?.keyboardShortcuts === true;
  const feedbackDataSharingPreference = instanceGeneralSettings?.feedbackDataSharingPreference ?? "prompt";
  const { orderedProjects } = useProjectOrder({
    projects: projects ?? [],
    companyId: selectedCompanyId,
    userId: currentUserId,
  });
  const { slots: issuePluginDetailSlots } = usePluginSlots({
    slotTypes: ["detailTab"],
    entityType: "issue",
    companyId: resolvedCompanyId,
    enabled: !!resolvedCompanyId,
  });
  const issuePluginTabItems = useMemo(
    () => issuePluginDetailSlots.map((slot) => ({
      value: `plugin:${slot.pluginKey}:${slot.id}`,
      label: slot.displayName,
      slot,
    })),
    [issuePluginDetailSlots],
  );
  const activePluginTab = issuePluginTabItems.find((item) => item.value === detailTab) ?? null;
  const {
    data: treeControlPreview,
    isFetching: treeControlPreviewLoading,
    error: treeControlPreviewError,
    refetch: refetchTreeControlPreview,
  } = useQuery({
    queryKey: [
      "issues",
      "tree-control-preview",
      issueId ?? "pending",
      treeControlMode,
    ],
    queryFn: () =>
      issuesApi.previewTreeControl(issueId!, {
        mode: treeControlMode,
        releasePolicy: {
          strategy: "manual",
        },
      }),
    enabled: treeControlOpen && !!issueId && canManageTreeControl,
    staleTime: 0,
    retry: false,
  });
  const { data: treeControlState } = useQuery({
    queryKey: ["issues", "tree-control-state", issueId ?? "pending"],
    queryFn: () => issuesApi.getTreeControlState(issueId!),
    enabled: !!issueId && canManageTreeControl,
    retry: false,
  });
  const { data: activeRootPauseHolds = [] } = useQuery({
    queryKey: ["issues", "tree-holds", issueId ?? "pending", "active-pause-with-members"],
    queryFn: () =>
      issuesApi.listTreeHolds(issueId!, {
        status: "active",
        mode: "pause",
        includeMembers: true,
      }),
    enabled: !!issueId && treeControlState?.activePauseHold?.isRoot === true,
  });
  const { data: activeCancelHolds = [] } = useQuery({
    queryKey: ["issues", "tree-holds", issueId ?? "pending", "active-cancel"],
    queryFn: () =>
      issuesApi.listTreeHolds(issueId!, {
        status: "active",
        mode: "cancel",
      }),
    enabled: !!issueId && canManageTreeControl,
  });

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents ?? []) map.set(a.id, a);
    return map;
  }, [agents]);
  const userProfileMap = useMemo(
    () => buildCompanyUserProfileMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const userLabelMap = useMemo(
    () => buildCompanyUserLabelMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const mentionOptions = useMemo<MentionOption[]>(() => {
    return buildMarkdownMentionOptions({
      agents,
      projects: orderedProjects,
      members: companyMembers?.users,
    });
  }, [agents, companyMembers?.users, orderedProjects]);

  const resolvedProject = useMemo(
    () => (issue?.projectId ? orderedProjects.find((project) => project.id === issue.projectId) ?? issue.project ?? null : null),
    [issue?.project, issue?.projectId, orderedProjects],
  );
  const childIssues = useMemo(
    () => {
      const descendants = issue?.id ? filterIssueDescendants(issue.id, rawChildIssues) : rawChildIssues;
      return [...descendants].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    [issue?.id, rawChildIssues],
  );
  const liveIssueIds = useMemo(() => collectLiveIssueIds(companyLiveRuns), [companyLiveRuns]);
  const issuePanelKey = useMemo(
    () => buildIssuePropertiesPanelKey(issue ?? null, childIssues),
    [childIssues, issue],
  );
  const panelIssue = useMemo(
    () => issue ?? null,
    [issue?.id, issuePanelKey],
  );
  const panelChildIssues = useMemo(
    () => childIssues,
    [issuePanelKey],
  );
  const showRichSubIssuesSection = shouldRenderRichSubIssuesSection(childIssuesLoading, childIssues.length);
  const openNewSubIssue = useCallback(() => {
    if (!issue) return;
    openNewIssue(buildSubIssueDefaultsForViewer(issue, currentUserId));
  }, [
    currentUserId,
    issue,
    openNewIssue,
  ]);

  const commentReassignOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; searchText?: string }> = [];
    options.push(...buildCompanyUserInlineOptions(companyMembers?.users, { excludeUserIds: [currentUserId] }));
    const activeAgents = [...(agents ?? [])]
      .filter((agent) => agent.status !== "terminated")
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const agent of activeAgents) {
      options.push({ id: `agent:${agent.id}`, label: agent.name });
    }
    if (currentUserId) {
      options.push({ id: `user:${currentUserId}`, label: "Me" });
    }
    return options;
  }, [agents, companyMembers?.users, currentUserId]);

  const actualAssigneeValue = useMemo(
    () => assigneeValueFromSelection(issue ?? {}),
    [issue],
  );

  const suggestedAssigneeValue = useMemo(
    () =>
      suggestedCommentAssigneeValue(
        issue ?? {},
        mergeIssueComments(comments ?? [], optimisticComments),
        currentUserId,
      ),
    [issue, comments, optimisticComments, currentUserId],
  );

  const threadComments = useMemo(
    () => mergeIssueComments(comments ?? [], optimisticComments),
    [comments, optimisticComments],
  );
  const breadcrumbTitle = issue?.title ?? issueId ?? "Issue";
  const issueCacheRefs = useMemo(() => {
    const refs = new Set<string>();
    if (issueId) refs.add(issueId);
    if (issue?.id) refs.add(issue.id);
    if (issue?.identifier) refs.add(issue.identifier);
    return [...refs];
  }, [issue?.id, issue?.identifier, issueId]);

  const invalidateIssueDetail = useCallback(() => {
    for (const ref of issueCacheRefs) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.interactions(ref) });
    }
  }, [issueCacheRefs, queryClient]);
  const invalidateIssueThreadLazily = useCallback(() => {
    for (const ref of issueCacheRefs) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(ref), refetchType: "inactive" });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(ref), refetchType: "inactive" });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.interactions(ref), refetchType: "inactive" });
    }
  }, [issueCacheRefs, queryClient]);

  const invalidateIssueRunState = useCallback(() => {
    for (const ref of issueCacheRefs) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.runs(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.liveRuns(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activeRun(ref) });
    }
  }, [issueCacheRefs, queryClient]);

  const removeCommentFromCache = useCallback((commentId: string) => {
    queryClient.setQueryData<InfiniteData<IssueComment[], string | null> | undefined>(
      queryKeys.issues.comments(issueId!),
      (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: removeIssueCommentFromPages(current.pages, commentId),
        };
      },
    );
  }, [issueId, queryClient]);

  const restoreQueuedCommentDraft = useCallback((body: string) => {
    commentComposerRef.current?.restoreDraft(body);
  }, []);

  const invalidateIssueCollections = useCallback(() => {
    if (selectedCompanyId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(selectedCompanyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId) });
    }
  }, [queryClient, selectedCompanyId]);
  const upsertInteractionInCache = useCallback((interaction: IssueThreadInteraction) => {
    queryClient.setQueryData<IssueThreadInteraction[] | undefined>(
      queryKeys.issues.interactions(issueId!),
      (current) => {
        const existing = current ?? [];
        const next = existing.filter((entry) => entry.id !== interaction.id);
        next.push(interaction);
        next.sort((left, right) => {
          const createdAtDelta =
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
          return createdAtDelta === 0 ? left.id.localeCompare(right.id) : createdAtDelta;
        });
        return next;
      },
    );
  }, [issueId, queryClient]);

  const applyOptimisticIssueCacheUpdate = useCallback((refs: Iterable<string>, data: Record<string, unknown>) => {
    queryClient.setQueriesData<Issue>(
      { queryKey: ["issues", "detail"] },
      (cached) => (cached && matchesIssueRef(cached, refs) ? applyOptimisticIssueFieldUpdate(cached, data) : cached),
    );

    if (!selectedCompanyId) return;
    queryClient.setQueryData<Issue[] | undefined>(
      queryKeys.issues.list(selectedCompanyId),
      (cached) => applyOptimisticIssueFieldUpdateToCollection(cached, refs, data),
    );
  }, [queryClient, selectedCompanyId]);

  const mergeIssueResponseIntoCaches = useCallback((refs: Iterable<string>, nextIssue: Issue) => {
    queryClient.setQueriesData<Issue>(
      { queryKey: ["issues", "detail"] },
      (cached) => (cached && matchesIssueRef(cached, refs) ? { ...cached, ...nextIssue } : cached),
    );

    if (!selectedCompanyId) return;
    queryClient.setQueryData<Issue[] | undefined>(
      queryKeys.issues.list(selectedCompanyId),
      (cached) => cached?.map((item) => (matchesIssueRef(item, refs) ? { ...item, ...nextIssue } : item)),
    );
  }, [queryClient, selectedCompanyId]);

  const markIssueRead = useMutation({
    mutationFn: (id: string) => issuesApi.markRead(id),
    onSuccess: () => {
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId) });
      }
    },
  });

  const updateIssue = useMutation({
    mutationFn: (data: Record<string, unknown>) => issuesApi.update(issueId!, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId!) });
      if (selectedCompanyId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
      }

      const previousIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId!));
      const issueRefs = new Set<string>([issueId!]);
      if (previousIssue?.id) issueRefs.add(previousIssue.id);
      if (previousIssue?.identifier) issueRefs.add(previousIssue.identifier);

      const previousDetailQueries = queryClient
        .getQueriesData<Issue>({ queryKey: ["issues", "detail"] })
        .filter(([, cachedIssue]) => cachedIssue && matchesIssueRef(cachedIssue, issueRefs));
      const previousList = selectedCompanyId
        ? queryClient.getQueryData<Issue[]>(queryKeys.issues.list(selectedCompanyId))
        : undefined;

      applyOptimisticIssueCacheUpdate(issueRefs, data);

      return { previousDetailQueries, previousList, selectedCompanyId };
    },
    onSuccess: ({ comment: _comment, ...nextIssue }) => {
      const issueRefs = new Set<string>([issueId!, nextIssue.id]);
      if (nextIssue.identifier) issueRefs.add(nextIssue.identifier);
      mergeIssueResponseIntoCaches(issueRefs, nextIssue);
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(issueId!) });
      invalidateIssueCollections();
    },
    onError: (err, _variables, context) => {
      for (const [queryKey, previousIssue] of context?.previousDetailQueries ?? []) {
        queryClient.setQueryData(queryKey, previousIssue);
      }
      if (context?.selectedCompanyId) {
        queryClient.setQueryData(queryKeys.issues.list(context.selectedCompanyId), context.previousList);
      }
      pushToast({
        title: "Issue update failed",
        body: err instanceof Error ? err.message : "Unable to save issue changes",
        tone: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId!) });
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
      }
    },
  });
  const executeTreeControl = useMutation({
    mutationFn: async () => {
      if (treeControlMode === "resume") {
        const pauseHoldId = treeControlState?.activePauseHold?.holdId;
        if (!pauseHoldId) {
          throw new Error("No active subtree pause hold is available to resume.");
        }
        const releasedHold = await issuesApi.releaseTreeHold(issueId!, pauseHoldId, {
          reason: treeControlReason.trim() || null,
          metadata: {
            wakeAgents: treeControlWakeAgentsOnResume,
          },
        });
        return { kind: "release" as const, hold: releasedHold };
      }
      const created = await issuesApi.createTreeHold(issueId!, {
        mode: treeControlMode,
        reason: treeControlReason.trim() || null,
        releasePolicy: {
          strategy: "manual",
          ...(treeControlMode === "pause" ? { note: treeControlScope === "leaf" ? "leaf_pause" : "full_pause" } : {}),
        },
        ...(treeControlMode === "restore"
          ? { metadata: { wakeAgents: treeControlWakeAgentsOnResume } }
          : {}),
      });
      return { kind: "create" as const, hold: created.hold, preview: created.preview };
    },
    onSuccess: async (result) => {
      const modeLabel = issueTreeControlLabel(result.hold.mode, treeControlScope);
      const cancelCount = result.preview?.totals.activeRuns ?? 0;
      pushToast({
        title: result.kind === "release"
          ? treeControlScope === "leaf" ? "Work resumed" : "Subtree resumed"
          : result.hold.mode === "pause"
            ? treeControlScope === "leaf" ? "Work paused" : "Subtree paused"
            : `${modeLabel} applied`,
        body: result.kind === "release"
          ? (result.hold.releaseReason?.trim() || (treeControlScope === "leaf" ? "Active issue pause released." : "Active subtree pause released."))
          : result.hold.mode === "pause"
            ? treeControlScope === "leaf"
              ? `Work paused. ${cancelCount} run${cancelCount === 1 ? "" : "s"} cancelled.`
              : `Subtree paused. ${cancelCount} run${cancelCount === 1 ? "" : "s"} cancelled.`
            : result.hold.reason?.trim()
              ? result.hold.reason
              : "Subtree control applied.",
      });
      setTreeControlOpen(false);
      setTreeControlReason("");
      setTreeControlWakeAgentsOnResume(false);
      setTreeControlCancelConfirmed(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.liveRuns(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.activeRun(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.runs(issueId!) }),
        queryClient.invalidateQueries({ queryKey: ["issues", "tree-control-state", issueId ?? "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["issues", "tree-holds", issueId ?? "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["issues", "tree-control-preview", issueId ?? "pending"] }),
      ]);
      if (selectedCompanyId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) }),
          ...(issue?.id
            ? [
                queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByParent(selectedCompanyId, issue.id) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByDescendantRoot(selectedCompanyId, issue.id) }),
              ]
            : []),
        ]);
      }
    },
    onError: (err) => {
      pushToast({
        title: "Unable to apply subtree control",
        body: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    },
  });
  const pauseIssueWorkRun = useMutation({
    mutationFn: async ({ runId, scope }: { runId: string; scope: "leaf" | "subtree" }) => {
      const created = await issuesApi.createTreeHold(issueId!, {
        mode: "pause",
        reason: "Paused from active run controls.",
        releasePolicy: { strategy: "manual", note: scope === "leaf" ? "leaf_pause" : "full_pause" },
        metadata: { source: "issue_active_run_control", runId },
      });
      return created;
    },
    onSuccess: async (result) => {
      const cancelCount = result.preview?.totals.activeRuns ?? 0;
      pushToast({
        title: "Work paused",
        body: cancelCount > 0
          ? `Work paused. ${cancelCount} run${cancelCount === 1 ? "" : "s"} cancelled.`
          : "Work paused. This issue is held until resume.",
        tone: "success",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.liveRuns(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.activeRun(issueId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.runs(issueId!) }),
        queryClient.invalidateQueries({ queryKey: ["issues", "tree-control-state", issueId ?? "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["issues", "tree-holds", issueId ?? "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["issues", "tree-control-preview", issueId ?? "pending"] }),
      ]);
      invalidateIssueCollections();
    },
    onError: (err) => {
      pushToast({
        title: "Unable to pause work",
        body: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    },
  });
  const handleIssuePropertiesUpdate = useCallback((data: Record<string, unknown>) => {
    updateIssue.mutate(data);
  }, [updateIssue.mutate]);

  const updateChildIssue = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => issuesApi.update(id, data),
    onSuccess: () => {
      if (resolvedCompanyId) {
        queryClient.invalidateQueries({ queryKey: ["issues", resolvedCompanyId] });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(resolvedCompanyId) });
      }
    },
    onError: (err) => {
      pushToast({
        title: "Issue update failed",
        body: err instanceof Error ? err.message : "Unable to save sub-issue changes",
        tone: "error",
      });
    },
  });
  const handleChildIssueUpdate = useCallback((id: string, data: Record<string, unknown>) => {
    updateChildIssue.mutate({ id, data });
  }, [updateChildIssue]);

  const checkIssueMonitorNow = useMutation({
    mutationFn: () => issuesApi.checkMonitorNow(issueId!),
    onSuccess: () => {
      invalidateIssueDetail();
      invalidateIssueRunState();
      invalidateIssueCollections();
      pushToast({
        title: "Monitor check queued",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Monitor check failed",
        body: err instanceof Error ? err.message : "Unable to trigger the monitor right now",
        tone: "error",
      });
    },
  });

  const approvalDecision = useMutation({
    mutationFn: async ({ approvalId, action }: { approvalId: string; action: "approve" | "reject" }) => {
      if (action === "approve") {
        return approvalsApi.approve(approvalId);
      }
      return approvalsApi.reject(approvalId);
    },
    onMutate: ({ approvalId, action }) => {
      setPendingApprovalAction({ approvalId, action });
    },
    onSuccess: (_approval, variables) => {
      invalidateIssueDetail();
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.approvals(issueId!) });
      invalidateIssueCollections();
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.detail(variables.approvalId) });
      if (resolvedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(resolvedCompanyId) });
      }
      pushToast({
        title: variables.action === "approve" ? "Approval approved" : "Approval rejected",
        tone: "success",
      });
    },
    onError: (err, variables) => {
      pushToast({
        title: variables.action === "approve" ? "Approval failed" : "Rejection failed",
        body: err instanceof Error ? err.message : "Unable to update approval",
        tone: "error",
      });
    },
    onSettled: () => {
      setPendingApprovalAction(null);
    },
  });

  const addComment = useMutation({
    mutationFn: ({ body, reopen, interrupt }: { body: string; reopen?: boolean; interrupt?: boolean }) =>
      issuesApi.addComment(issueId!, body, reopen, interrupt),
    onMutate: async ({ body, reopen, interrupt }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.comments(issueId!) });
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId!) });

      const previousIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId!));
      const queuedComment = !interrupt ? readIssueRunStateFromCache(queryClient, issueId!).runningIssueRun : null;
      const optimisticComment = issue
        ? createOptimisticIssueComment({
            companyId: issue.companyId,
            issueId: issue.id,
            body,
            authorUserId: currentUserId,
            clientStatus: queuedComment ? "queued" : "pending",
            queueTargetRunId: queuedComment?.id ?? null,
          })
        : null;

      if (optimisticComment) {
        setOptimisticComments((current) => [...current, optimisticComment]);
      }
      if (previousIssue) {
        queryClient.setQueryData(
          queryKeys.issues.detail(issueId!),
          applyOptimisticIssueCommentUpdate(previousIssue, { reopen }),
        );
      }

      return {
        optimisticCommentId: optimisticComment?.clientId ?? null,
        queuedCommentTargetRunId: queuedComment?.id ?? null,
        previousIssue,
      };
    },
    onSuccess: async (comment, _variables, context) => {
      if (context?.optimisticCommentId) {
        setOptimisticComments((current) =>
          current.filter((entry) => entry.clientId !== context.optimisticCommentId),
        );
      }
      if (context?.optimisticCommentId && cancelledQueuedOptimisticCommentIdsRef.current.has(context.optimisticCommentId)) {
        cancelledQueuedOptimisticCommentIdsRef.current.delete(context.optimisticCommentId);
        try {
          await issuesApi.cancelComment(issueId!, comment.id);
          invalidateIssueDetail();
          invalidateIssueThreadLazily();
          invalidateIssueCollections();
          return;
        } catch (err) {
          pushToast({
            title: "Cancel failed",
            body: err instanceof Error ? err.message : "Unable to cancel the queued comment",
            tone: "error",
          });
        }
      }
      if (context?.queuedCommentTargetRunId) {
        setLocallyQueuedCommentRunIds((current) => {
          const next = new Map(current);
          next.set(comment.id, context.queuedCommentTargetRunId!);
          return next;
        });
      }
      queryClient.setQueryData<InfiniteData<IssueComment[], string | null>>(
        queryKeys.issues.comments(issueId!),
        (current) => current ? {
          ...current,
          pages: upsertIssueCommentInPages(current.pages, comment),
        } : {
          pageParams: [null],
          pages: upsertIssueCommentInPages(undefined, comment),
        },
      );
    },
    onError: (err, _variables, context) => {
      if (context?.optimisticCommentId) {
        setOptimisticComments((current) =>
          current.filter((entry) => entry.clientId !== context.optimisticCommentId),
        );
      }
      if (context?.previousIssue) {
        queryClient.setQueryData(queryKeys.issues.detail(issueId!), context.previousIssue);
      }
      pushToast({
        title: "Comment failed",
        body: err instanceof Error ? err.message : "Unable to post comment",
        tone: "error",
      });
    },
    onSettled: (_result, _error, variables) => {
      invalidateIssueThreadLazily();
      if (variables.interrupt) {
        invalidateIssueRunState();
      }
      if (variables.reopen) {
        invalidateIssueCollections();
      }
    },
  });
  const acceptInteraction = useMutation({
    mutationFn: ({
      interaction,
      selectedClientKeys,
    }: {
      interaction: ActionableIssueThreadInteraction;
      selectedClientKeys?: string[];
    }) => issuesApi.acceptInteraction(issueId!, interaction.id, { selectedClientKeys }),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      if (interaction.kind === "suggest_tasks" && resolvedCompanyId && issue?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByParent(resolvedCompanyId, issue.id) });
      }
      invalidateIssueDetail();
      invalidateIssueCollections();
      const createdCount = interaction.kind === "suggest_tasks"
        ? interaction.result?.createdTasks?.length ?? 0
        : 0;
      const skippedCount = interaction.kind === "suggest_tasks"
        ? interaction.result?.skippedClientKeys?.length ?? 0
        : 0;
      pushToast({
        title: interaction.kind === "request_confirmation"
          ? "Request confirmed"
          : skippedCount > 0
          ? `Accepted ${createdCount} draft${createdCount === 1 ? "" : "s"} and skipped ${skippedCount}`
          : "Suggested tasks accepted",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Accept failed",
        body: err instanceof Error ? err.message : "Unable to accept the suggested tasks",
        tone: "error",
      });
    },
  });
  const rejectInteraction = useMutation({
    mutationFn: ({ interaction, reason }: { interaction: ActionableIssueThreadInteraction; reason?: string }) =>
      issuesApi.rejectInteraction(issueId!, interaction.id, reason),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      invalidateIssueDetail();
      invalidateIssueCollections();
      pushToast({
        title: interaction.kind === "request_confirmation" ? "Request declined" : "Suggestion rejected",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Reject failed",
        body: err instanceof Error ? err.message : "Unable to reject the suggested tasks",
        tone: "error",
      });
    },
  });
  const answerInteraction = useMutation({
    mutationFn: ({
      interaction,
      answers,
    }: {
      interaction: IssueThreadInteraction;
      answers: AskUserQuestionsAnswer[];
    }) => issuesApi.respondToInteraction(issueId!, interaction.id, { answers }),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      invalidateIssueDetail();
      invalidateIssueCollections();
      pushToast({
        title: "Answers submitted",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Submit failed",
        body: err instanceof Error ? err.message : "Unable to submit answers",
        tone: "error",
      });
    },
  });

  const cancelInteraction = useMutation({
    mutationFn: ({ interaction }: { interaction: AskUserQuestionsInteraction }) =>
      issuesApi.cancelInteraction(issueId!, interaction.id),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      invalidateIssueDetail();
      invalidateIssueCollections();
      pushToast({
        title: "Question cancelled",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Cancel failed",
        body: err instanceof Error ? err.message : "Unable to cancel the question",
        tone: "error",
      });
    },
  });

  const addCommentAndReassign = useMutation({
    mutationFn: ({
      body,
      reopen,
      interrupt,
      reassignment,
    }: {
      body: string;
      reopen?: boolean;
      interrupt?: boolean;
      reassignment: CommentReassignment;
    }) =>
      issuesApi.update(issueId!, {
        comment: body,
        assigneeAgentId: reassignment.assigneeAgentId,
        assigneeUserId: reassignment.assigneeUserId,
        ...(reopen ? { status: "todo" } : {}),
        ...(interrupt ? { interrupt } : {}),
      }),
    onMutate: async ({ body, reopen, reassignment, interrupt }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.comments(issueId!) });
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId!) });

      const previousIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId!));
      const queuedComment = !interrupt ? readIssueRunStateFromCache(queryClient, issueId!).runningIssueRun : null;
      const optimisticComment = issue
        ? createOptimisticIssueComment({
            companyId: issue.companyId,
            issueId: issue.id,
            body,
            authorUserId: currentUserId,
            clientStatus: queuedComment ? "queued" : "pending",
            queueTargetRunId: queuedComment?.id ?? null,
          })
        : null;

      if (optimisticComment) {
        setOptimisticComments((current) => [...current, optimisticComment]);
      }
      if (previousIssue) {
        queryClient.setQueryData(
          queryKeys.issues.detail(issueId!),
          applyOptimisticIssueCommentUpdate(previousIssue, { reopen, reassignment }),
        );
      }

      return {
        optimisticCommentId: optimisticComment?.clientId ?? null,
        queuedCommentTargetRunId: queuedComment?.id ?? null,
        previousIssue,
      };
    },
    onSuccess: async (result, _variables, context) => {
      if (context?.optimisticCommentId) {
        setOptimisticComments((current) =>
          current.filter((entry) => entry.clientId !== context.optimisticCommentId),
        );
      }

      const { comment, ...nextIssue } = result;
      queryClient.setQueryData(queryKeys.issues.detail(issueId!), nextIssue);
      if (comment && context?.optimisticCommentId && cancelledQueuedOptimisticCommentIdsRef.current.has(context.optimisticCommentId)) {
        cancelledQueuedOptimisticCommentIdsRef.current.delete(context.optimisticCommentId);
        try {
          await issuesApi.cancelComment(issueId!, comment.id);
          invalidateIssueDetail();
          invalidateIssueThreadLazily();
          invalidateIssueCollections();
          return;
        } catch (err) {
          pushToast({
            title: "Cancel failed",
            body: err instanceof Error ? err.message : "Unable to cancel the queued comment",
            tone: "error",
          });
        }
      }
      if (comment && context?.queuedCommentTargetRunId) {
        setLocallyQueuedCommentRunIds((current) => {
          const next = new Map(current);
          next.set(comment.id, context.queuedCommentTargetRunId!);
          return next;
        });
      }
      if (comment) {
        queryClient.setQueryData<InfiniteData<IssueComment[], string | null>>(
          queryKeys.issues.comments(issueId!),
          (current) => current ? {
            ...current,
            pages: upsertIssueCommentInPages(current.pages, comment),
          } : {
            pageParams: [null],
            pages: upsertIssueCommentInPages(undefined, comment),
          },
        );
      }
    },
    onError: (err, _variables, context) => {
      if (context?.optimisticCommentId) {
        setOptimisticComments((current) =>
          current.filter((entry) => entry.clientId !== context.optimisticCommentId),
        );
      }
      if (context?.previousIssue) {
        queryClient.setQueryData(queryKeys.issues.detail(issueId!), context.previousIssue);
      }
      pushToast({
        title: "Comment failed",
        body: err instanceof Error ? err.message : "Unable to post comment",
        tone: "error",
      });
    },
    onSettled: (_result, _error, variables) => {
      invalidateIssueThreadLazily();
      if (variables.interrupt) {
        invalidateIssueRunState();
      }
      invalidateIssueCollections();
    },
  });

  const interruptQueuedComment = useMutation({
    mutationFn: (runId: string) => heartbeatsApi.cancel(runId),
    onMutate: async (runId) => {
      await Promise.all(issueCacheRefs.flatMap((ref) => [
        queryClient.cancelQueries({ queryKey: queryKeys.issues.runs(ref) }),
        queryClient.cancelQueries({ queryKey: queryKeys.issues.liveRuns(ref) }),
        queryClient.cancelQueries({ queryKey: queryKeys.issues.activeRun(ref) }),
        queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(ref) }),
      ]));

      const previousRunState = issueCacheRefs.map((ref) => ({
        ref,
        runs: queryClient.getQueryData<RunForIssue[]>(queryKeys.issues.runs(ref)),
        liveRuns: queryClient.getQueryData<LiveRunForIssue[]>(queryKeys.issues.liveRuns(ref)),
        activeRun: queryClient.getQueryData<ActiveRunForIssue | null>(queryKeys.issues.activeRun(ref)),
        issue: queryClient.getQueryData<Issue>(queryKeys.issues.detail(ref)),
      }));
      const previousLocalQueuedCommentRunIds = locallyQueuedCommentRunIds;
      const cachedActiveRun =
        previousRunState.find((state) => state.activeRun?.id === runId)?.activeRun ??
        previousRunState.find((state) => state.activeRun)?.activeRun ??
        null;
      const liveRunList = dedupeLiveRunsById(previousRunState.flatMap((state) => state.liveRuns ?? []));
      const runningIssueRun = resolveRunningIssueRun(cachedActiveRun, liveRunList);
      const targetRun =
        cachedActiveRun?.id === runId
          ? cachedActiveRun
          : liveRunList?.find((run) => run.id === runId) ?? runningIssueRun ?? null;

      if (targetRun) {
        const interruptedAt = new Date().toISOString();
        for (const ref of issueCacheRefs) {
          queryClient.setQueryData<RunForIssue[] | undefined>(
            queryKeys.issues.runs(ref),
            (current) => upsertInterruptedRun(current, targetRun, interruptedAt),
          );
        }
      }

      for (const ref of issueCacheRefs) {
        queryClient.setQueryData(
          queryKeys.issues.liveRuns(ref),
          (current: LiveRunForIssue[] | undefined) => removeLiveRunById(current, runId),
        );
        queryClient.setQueryData(
          queryKeys.issues.activeRun(ref),
          (current: ActiveRunForIssue | null | undefined) => (current?.id === runId ? null : current),
        );
        queryClient.setQueryData(
          queryKeys.issues.detail(ref),
          (current: Issue | undefined) => clearIssueExecutionRun(current, runId),
        );
      }
      setLocallyQueuedCommentRunIds((current) => {
        const next = new Map([...current].filter(([, targetRunId]) => targetRunId !== runId));
        return next.size === current.size ? current : next;
      });

      return {
        previousRunState,
        previousLocalQueuedCommentRunIds,
      };
    },
    onSuccess: () => {
      invalidateIssueDetail();
      invalidateIssueRunState();
      pushToast({
        title: "Interrupt requested",
        body: "The active run is stopping so queued comments can continue next.",
        tone: "success",
      });
    },
    onError: (err, _runId, context) => {
      for (const state of context?.previousRunState ?? []) {
        queryClient.setQueryData(queryKeys.issues.runs(state.ref), state.runs);
        queryClient.setQueryData(queryKeys.issues.liveRuns(state.ref), state.liveRuns);
        queryClient.setQueryData(queryKeys.issues.activeRun(state.ref), state.activeRun);
        queryClient.setQueryData(queryKeys.issues.detail(state.ref), state.issue);
      }
      if (context?.previousLocalQueuedCommentRunIds) {
        setLocallyQueuedCommentRunIds(context.previousLocalQueuedCommentRunIds);
      }
      pushToast({
        title: "Interrupt failed",
        body: err instanceof Error ? err.message : "Unable to interrupt the active run",
        tone: "error",
      });
    },
  });

  const cancelQueuedComment = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => issuesApi.cancelComment(issueId!, commentId),
    onSuccess: (comment) => {
      setLocallyQueuedCommentRunIds((current) => {
        if (!current.has(comment.id)) return current;
        const next = new Map(current);
        next.delete(comment.id);
        return next;
      });
      removeCommentFromCache(comment.id);
      restoreQueuedCommentDraft(comment.body);
      invalidateIssueDetail();
      invalidateIssueThreadLazily();
      invalidateIssueCollections();
      pushToast({
        title: "Queued comment canceled",
        body: "The queued message was restored to the composer.",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Cancel failed",
        body: err instanceof Error ? err.message : "Unable to cancel the queued comment",
        tone: "error",
      });
    },
  });

  const handleCancelQueuedComment = useCallback((commentId: string) => {
    if (commentId.startsWith("optimistic-")) {
      cancelledQueuedOptimisticCommentIdsRef.current.add(commentId);
      let cancelledCommentBody: string | null = null;
      setOptimisticComments((current) => {
        const next = takeOptimisticIssueComment(current, commentId);
        cancelledCommentBody = next.comment?.body ?? null;
        return next.comments;
      });
      if (cancelledCommentBody) {
        restoreQueuedCommentDraft(cancelledCommentBody);
        pushToast({
          title: "Queued comment canceled",
          body: "The queued message was restored to the composer.",
          tone: "success",
        });
      }
      return;
    }

    void cancelQueuedComment.mutateAsync({ commentId });
  }, [cancelQueuedComment, restoreQueuedCommentDraft, pushToast]);

  const feedbackVoteMutation = useMutation({
    mutationFn: (variables: {
      targetType: "issue_comment" | "issue_document_revision";
      targetId: string;
      vote: "up" | "down";
      reason?: string;
      allowSharing?: boolean;
      sharingPreferenceAtSubmit: "allowed" | "not_allowed" | "prompt";
    }) =>
      issuesApi.upsertFeedbackVote(issueId!, {
        targetType: variables.targetType,
        targetId: variables.targetId,
        vote: variables.vote,
        ...(variables.reason ? { reason: variables.reason } : {}),
        ...(variables.allowSharing ? { allowSharing: true } : {}),
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.feedbackVotes(issueId!) });
      const previousVotes = queryClient.getQueryData<FeedbackVote[]>(
        queryKeys.issues.feedbackVotes(issueId!),
      );
      queryClient.setQueryData<FeedbackVote[]>(
        queryKeys.issues.feedbackVotes(issueId!),
        mergeOptimisticFeedbackVote(
          previousVotes,
          {
            issueId: issueId!,
            targetType: variables.targetType,
            targetId: variables.targetId,
            vote: variables.vote,
            reason: variables.reason,
          },
          currentUserId,
        ),
      );
      return { previousVotes };
    },
    onSuccess: (_savedVote, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.feedbackVotes(issueId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings });
      pushToast({
        title:
          variables.sharingPreferenceAtSubmit === "prompt"
            ? variables.allowSharing
              ? "Feedback saved. Future votes will share"
              : "Feedback saved. Future votes will stay local"
            : variables.allowSharing
              ? "Feedback saved and sharing enabled"
              : "Feedback saved",
        tone: "success",
      });
    },
    onError: (err, _variables, context) => {
      if (context?.previousVotes) {
        queryClient.setQueryData(queryKeys.issues.feedbackVotes(issueId!), context.previousVotes);
      }
      pushToast({
        title: "Failed to save feedback",
        body: err instanceof Error ? err.message : "Unknown error",
        tone: "error",
      });
    },
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCompanyId) throw new Error("No company selected");
      return issuesApi.uploadAttachment(selectedCompanyId, issueId!, file);
    },
    onSuccess: () => {
      setAttachmentError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.attachments(issueId!) });
      invalidateIssueDetail();
    },
    onError: (err) => {
      setAttachmentError(err instanceof Error ? err.message : "Upload failed");
    },
  });

  const importMarkdownDocument = useMutation({
    mutationFn: async (file: File) => {
      const baseName = fileBaseName(file.name);
      const key = slugifyDocumentKey(baseName);
      const existing = (issue?.documentSummaries ?? []).find((doc) => doc.key === key) ?? null;
      const body = await file.text();
      const inferredTitle = titleizeFilename(baseName);
      const nextTitle = existing?.title ?? inferredTitle ?? null;
      return issuesApi.upsertDocument(issueId!, key, {
        title: key === "plan" ? null : nextTitle,
        format: "markdown",
        body,
        baseRevisionId: existing?.latestRevisionId ?? null,
      });
    },
    onSuccess: () => {
      setAttachmentError(null);
      invalidateIssueDetail();
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.documents(issueId!) });
    },
    onError: (err) => {
      setAttachmentError(err instanceof Error ? err.message : "Document import failed");
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => issuesApi.deleteAttachment(attachmentId),
    onSuccess: () => {
      setAttachmentError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.attachments(issueId!) });
      invalidateIssueDetail();
    },
    onError: (err) => {
      setAttachmentError(err instanceof Error ? err.message : "Delete failed");
    },
  });

  const archiveFromInbox = useMutation({
    mutationFn: (id: string) => issuesApi.archiveFromInbox(id),
    onSuccess: () => {
      invalidateIssueCollections();
      navigate(sourceBreadcrumb.href.startsWith("/inbox") ? sourceBreadcrumb.href : "/inbox", { replace: true });
      pushToast({ title: "Issue archived from inbox", tone: "success" });
    },
    onError: (err) => {
      pushToast({
        title: "Archive failed",
        body: err instanceof Error ? err.message : "Unable to archive this issue from the inbox",
        tone: "error",
      });
    },
  });

  useEffect(() => {
    setBreadcrumbs([
      sourceBreadcrumb,
      { label: hasLiveRuns ? `🔵 ${breadcrumbTitle}` : breadcrumbTitle },
    ]);
  }, [
    breadcrumbTitle,
    hasLiveRuns,
    setBreadcrumbs,
    sourceBreadcrumb.href,
    sourceBreadcrumb.label,
  ]);

  const isFromInbox = resolvedIssueDetailState?.issueDetailSource === "inbox";

  // Scroll to top on forward navigation (PUSH/REPLACE) so issue doesn't
  // inherit the inbox/issues-list scroll position on mobile.
  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const main = document.getElementById("main-content");
    if (main) main.scrollTop = 0;
  }, [issueId, navigationType]);

  // Redirect to identifier-based URL if navigated via UUID
  useEffect(() => {
    const nextState = resolvedIssueDetailState ?? location.state;
    if (issue?.identifier && issueId !== issue.identifier) {
      rememberIssueDetailLocationState(issue.identifier, nextState, location.search);
      navigate(createIssueDetailPath(issue.identifier), {
        replace: true,
        state: nextState,
      });
      return;
    }

    if (issueId && hasLegacyIssueDetailQuery(location.search)) {
      rememberIssueDetailLocationState(issueId, nextState, location.search);
      navigate(createIssueDetailPath(issueId), {
        replace: true,
        state: nextState,
      });
    }
  }, [issue, issueId, navigate, location.state, location.search, resolvedIssueDetailState]);

  useEffect(() => {
    if (!issue?.id) return;
    if (lastMarkedReadIssueIdRef.current === issue.id) return;
    lastMarkedReadIssueIdRef.current = issue.id;
    markIssueRead.mutate(issue.id);
  }, [issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!panelIssue) {
      closePanel();
      return;
    }
    openPanel(
      <IssueProperties
        issue={panelIssue}
        childIssues={panelChildIssues}
        onAddSubIssue={openNewSubIssue}
        onUpdate={handleIssuePropertiesUpdate}
      />
    );
    return () => closePanel();
  }, [
    closePanel,
    handleIssuePropertiesUpdate,
    issuePanelKey,
    openNewSubIssue,
    openPanel,
    panelChildIssues,
    panelIssue,
  ]);

  const goToInboxShortcutArmedRef = useRef(false);
  const goToInboxShortcutTimeoutRef = useRef<number | null>(null);
  const canQuickArchiveFromInbox =
    keyboardShortcutsEnabled &&
    !issue?.hiddenAt;

  useEffect(() => {
    if (!issue?.id || !canQuickArchiveFromInbox) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = resolveInboxQuickArchiveKeyAction({
        armed: canQuickArchiveFromInbox,
        defaultPrevented: event.defaultPrevented,
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        target: event.target,
        hasOpenDialog: hasBlockingShortcutDialog(document),
      });

      if (action !== "archive") return;

      event.preventDefault();
      if (!archiveFromInbox.isPending) {
        archiveFromInbox.mutate(issue.id);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [archiveFromInbox, canQuickArchiveFromInbox, issue?.id]);

  useEffect(() => {
    if (!keyboardShortcutsEnabled) {
      goToInboxShortcutArmedRef.current = false;
      if (goToInboxShortcutTimeoutRef.current !== null) {
        window.clearTimeout(goToInboxShortcutTimeoutRef.current);
        goToInboxShortcutTimeoutRef.current = null;
      }
      return;
    }

    const clearArmTimeout = () => {
      if (goToInboxShortcutTimeoutRef.current !== null) {
        window.clearTimeout(goToInboxShortcutTimeoutRef.current);
        goToInboxShortcutTimeoutRef.current = null;
      }
    };

    const disarm = () => {
      goToInboxShortcutArmedRef.current = false;
      clearArmTimeout();
    };

    const arm = () => {
      goToInboxShortcutArmedRef.current = true;
      clearArmTimeout();
      goToInboxShortcutTimeoutRef.current = window.setTimeout(() => {
        goToInboxShortcutArmedRef.current = false;
        goToInboxShortcutTimeoutRef.current = null;
      }, 1200);
    };

    const handlePointerDown = () => {
      disarm();
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target !== document.body) {
        disarm();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = resolveIssueDetailGoKeyAction({
        armed: goToInboxShortcutArmedRef.current,
        defaultPrevented: event.defaultPrevented,
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        target: event.target,
        hasOpenDialog: hasBlockingShortcutDialog(document),
      });

      if (action === "ignore") return;
      if (action === "arm") {
        arm();
        return;
      }

      disarm();
      if (action === "navigate_inbox") {
        event.preventDefault();
        event.stopPropagation();
        navigate(sourceBreadcrumb.href.startsWith("/inbox") ? sourceBreadcrumb.href : "/inbox");
        return;
      }
      if (action === "focus_comment") {
        event.preventDefault();
        event.stopPropagation();
        setDetailTab("chat");
        setPendingCommentComposerFocusKey((current) => current + 1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      disarm();
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [keyboardShortcutsEnabled, navigate, sourceBreadcrumb.href]);

  useEffect(() => {
    const hash = location.hash;
    if (!hash.startsWith("#document-")) return;
    const documentKey = decodeURIComponent(hash.slice("#document-".length));
    if (documentKey !== ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY) return;
    setDetailTab("activity");
    setHandoffFocusSignal((current) => current + 1);
  }, [location.hash]);

  useEffect(() => {
    if (pendingCommentComposerFocusKey === 0) return;
    if (detailTab !== "chat") return;
    commentComposerRef.current?.focus();
  }, [detailTab, pendingCommentComposerFocusKey]);

  const isImageAttachment = (attachment: IssueAttachment) => attachment.contentType.startsWith("image/");
  const attachmentList = attachments ?? [];
  const imageAttachments = attachmentList.filter(isImageAttachment);
  const nonImageAttachments = attachmentList.filter((a) => !isImageAttachment(a));

  const handleChatImageClick = useCallback(
    (src: string) => {
      // Try exact contentPath match first
      let idx = imageAttachments.findIndex((a) => a.contentPath === src);
      if (idx < 0) {
        // Try matching by asset ID extracted from /api/assets/{assetId}/content URLs
        const assetMatch = src.match(/\/api\/assets\/([^/]+)\/content/);
        if (assetMatch) {
          idx = imageAttachments.findIndex((a) => a.assetId === assetMatch[1]);
        }
      }
      if (idx >= 0) {
        setGalleryIndex(idx);
        setGalleryOpen(true);
      } else {
        // Image not in attachment list — open in new tab
        window.open(src, "_blank");
      }
    },
    [imageAttachments],
  );

  const copyIssueToClipboard = async () => {
    if (!issue) return;
    const decodeEntities = (text: string) => {
      const el = document.createElement("textarea");
      el.innerHTML = text;
      return el.value;
    };
    const title = decodeEntities(issue.title);
    const body = decodeEntities(issue.description ?? "");
    const md = `# ${issue.identifier}: ${title}\n\n${body}`.trimEnd();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    pushToast({ title: "Copied to clipboard", tone: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  // Gmail-style mobile toolbar when viewing an issue from inbox.
  // Callbacks are stored in a ref so the effect deps stay stable and
  // don't trigger an infinite render loop (useMutation results and
  // non-memoized functions change identity every render).
  const inboxToolbarCallbacksRef = useRef({
    onArchive: () => {
      if (!archiveFromInbox.isPending && issue?.id) archiveFromInbox.mutate(issue.id);
    },
    onCopy: () => copyIssueToClipboard(),
    onProperties: () => setMobilePropsOpen(true),
    onHide: () => {
      updateIssue.mutate(
        { hiddenAt: new Date().toISOString() },
        { onSuccess: () => navigate("/issues/all") },
      );
    },
  });
  inboxToolbarCallbacksRef.current = {
    onArchive: () => {
      if (!archiveFromInbox.isPending && issue?.id) archiveFromInbox.mutate(issue.id);
    },
    onCopy: () => copyIssueToClipboard(),
    onProperties: () => setMobilePropsOpen(true),
    onHide: () => {
      updateIssue.mutate(
        { hiddenAt: new Date().toISOString() },
        { onSuccess: () => navigate("/issues/all") },
      );
    },
  };

  const backHref = sourceBreadcrumb.href ?? "/inbox";
  const showInboxToolbar = isMobile && isFromInbox;
  const archivePending = archiveFromInbox.isPending;
  const issueHidden = !!issue?.hiddenAt;
  const canArchiveFromInbox = isFromInbox && !!issue?.id && !issueHidden;

  useEffect(() => {
    if (!showInboxToolbar) {
      setMobileToolbar(null);
      return;
    }

    setMobileToolbar(
      <InboxMobileToolbar
        backHref={backHref}
        issueId={issue?.id}
        issueHidden={issueHidden}
        archivePending={archivePending}
        onArchive={() => inboxToolbarCallbacksRef.current.onArchive()}
        onCopy={() => inboxToolbarCallbacksRef.current.onCopy()}
        onProperties={() => inboxToolbarCallbacksRef.current.onProperties()}
        onHide={() => inboxToolbarCallbacksRef.current.onHide()}
      />,
    );

    return () => setMobileToolbar(null);
  }, [showInboxToolbar, backHref, issue?.id, issueHidden, archivePending, setMobileToolbar]);

  const attachmentsInitialLoading = attachmentsLoading && attachments === undefined;
  const loadOlderComments = useCallback(() => {
    void fetchOlderComments();
  }, [fetchOlderComments]);
  const refetchLatestComments = useCallback(async () => {
    // Refetch page 0 first so comments that arrived after initial load are
    // visible, then load every remaining older page. The chat thread is
    // paginated and virtualized, so "latest" must be resolved against the
    // complete comment set rather than the current loaded window.
    const refreshed = await refetchComments();
    const loaded = await loadRemainingIssueCommentPages<IssueComment>({
      pages: refreshed.data?.pages,
      pageParams: refreshed.data?.pageParams as Array<string | null> | undefined,
      pageSize: ISSUE_COMMENT_PAGE_SIZE,
      maxPages: JUMP_TO_LATEST_MAX_COMMENT_PAGES,
      fetchPage: (afterCommentId) =>
        issuesApi.listComments(issueId!, {
          order: "desc",
          limit: ISSUE_COMMENT_PAGE_SIZE,
          after: afterCommentId,
        }),
    });
    queryClient.setQueryData<InfiniteData<IssueComment[], string | null>>(
      queryKeys.issues.comments(issueId!),
      loaded,
    );
    await new Promise<void>((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }
      window.requestAnimationFrame(() => resolve());
    });
  }, [issueId, queryClient, refetchComments]);
  useEffect(() => {
    if (!shouldPrefetchOlderComments) return;
    void fetchOlderComments();
  }, [fetchOlderComments, shouldPrefetchOlderComments]);
  const handleCommentVote = useCallback(async (commentId: string, vote: "up" | "down", options?: { allowSharing?: boolean; reason?: string }) => {
    await feedbackVoteMutation.mutateAsync({
      targetType: "issue_comment",
      targetId: commentId,
      vote,
      reason: options?.reason,
      allowSharing: options?.allowSharing,
      sharingPreferenceAtSubmit: feedbackDataSharingPreference,
    });
  }, [feedbackDataSharingPreference, feedbackVoteMutation]);
  const handleChatAdd = useCallback(async (body: string, reopen?: boolean, reassignment?: CommentReassignment) => {
    if (reassignment) {
      await addCommentAndReassign.mutateAsync({ body, reopen, reassignment });
      return;
    }
    await addComment.mutateAsync({ body, reopen });
  }, [addComment, addCommentAndReassign]);
  const handleCommentImageUpload = useCallback(async (file: File) => {
    const attachment = await uploadAttachment.mutateAsync(file);
    return attachment.contentPath;
  }, [uploadAttachment]);
  const handleCommentAttachImage = useCallback(async (file: File) => {
    return uploadAttachment.mutateAsync(file);
  }, [uploadAttachment]);
  const handleInterruptQueuedRun = useCallback(async (runId: string) => {
    await interruptQueuedComment.mutateAsync(runId);
  }, [interruptQueuedComment]);
  const handleAcceptInteraction = useCallback(async (
    interaction: ActionableIssueThreadInteraction,
    selectedClientKeys?: string[],
  ) => {
    await acceptInteraction.mutateAsync({ interaction, selectedClientKeys });
  }, [acceptInteraction]);
  const handleRejectInteraction = useCallback(async (interaction: ActionableIssueThreadInteraction, reason?: string) => {
    await rejectInteraction.mutateAsync({ interaction, reason });
  }, [rejectInteraction]);
  const handleSubmitInteractionAnswers = useCallback(async (
    interaction: IssueThreadInteraction,
    answers: AskUserQuestionsAnswer[],
  ) => {
    await answerInteraction.mutateAsync({ interaction, answers });
  }, [answerInteraction]);
  const handleCancelInteraction = useCallback(async (interaction: AskUserQuestionsInteraction) => {
    await cancelInteraction.mutateAsync({ interaction });
  }, [cancelInteraction]);

  const treePreviewAffectedIssues = useMemo(
    () => (treeControlPreview?.issues ?? []).filter((candidate) => !candidate.skipped),
    [treeControlPreview],
  );
  const treePreviewDisplayIssues = useMemo(
    () => {
      const previewIssues = treeControlPreview?.issues ?? [];
      if (treeControlMode !== "pause") {
        return previewIssues.filter((candidate) => !candidate.skipped);
      }
      return previewIssues.filter((candidate) => !candidate.skipped || candidate.skipReason === "terminal_status");
    },
    [treeControlMode, treeControlPreview],
  );
  const activePauseHold = treeControlState?.activePauseHold ?? null;
  const activeRootPauseHoldsForDisplay = useMemo(
    () => activePauseHold?.isRoot === true ? activeRootPauseHolds : [],
    [activePauseHold?.isRoot, activeRootPauseHolds],
  );
  const heldIssueIds = useMemo(() => {
    const ids = new Set<string>();
    for (const hold of activeRootPauseHoldsForDisplay) {
      for (const member of hold.members ?? []) {
        if (member.skipped) continue;
        ids.add(member.issueId);
      }
    }
    return ids;
  }, [activeRootPauseHoldsForDisplay]);
  const mutedChildIssueIds = useMemo(() => {
    const ids = new Set<string>();
    for (const child of childIssues) {
      if (heldIssueIds.has(child.id)) ids.add(child.id);
    }
    return ids;
  }, [childIssues, heldIssueIds]);
  const childPauseBadgeById = useMemo(() => {
    const badges = new Map<string, string>();
    for (const child of childIssues) {
      if (!heldIssueIds.has(child.id)) continue;
      badges.set(child.id, "Paused");
    }
    return badges;
  }, [childIssues, heldIssueIds]);
  const activePauseHoldRoot = useMemo(() => {
    if (!activePauseHold) return null;
    if (activePauseHold.rootIssueId === issue?.id) return issue ?? null;
    return issue?.ancestors?.find((ancestor) => ancestor.id === activePauseHold.rootIssueId) ?? null;
  }, [activePauseHold, issue]);
  const activeRootPauseHold = useMemo(
    () => activeRootPauseHoldsForDisplay.find((hold) => hold.id === activePauseHold?.holdId) ?? null,
    [activePauseHold?.holdId, activeRootPauseHoldsForDisplay],
  );

  if (isLoading) return <IssueDetailLoadingState headerSeed={issueHeaderSeed} />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!issue) return null;

  // Ancestors are returned oldest-first from the server (root at end, immediate parent at start)
  const ancestors = issue.ancestors ?? [];
  const handleFilePicked = async (evt: ChangeEvent<HTMLInputElement>) => {
    const files = evt.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (isMarkdownFile(file)) {
        await importMarkdownDocument.mutateAsync(file);
      } else {
        await uploadAttachment.mutateAsync(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAttachmentFiles = async (files: File[]) => {
    if (files.length === 0) return;
    for (const file of files) {
      if (isMarkdownFile(file)) {
        await importMarkdownDocument.mutateAsync(file);
      } else {
        await uploadAttachment.mutateAsync(file);
      }
    }
  };

  const hasAttachments = attachmentList.length > 0;
  const treePreviewWarnings = treeControlPreview?.warnings ?? [];
  const heldDescendantCount = activeRootPauseHold?.members?.filter((member) => member.depth > 0 && !member.skipped).length
    ?? Math.max(heldIssueIds.size - 1, 0);
  const canShowSubtreeControls = canManageTreeControl && childIssues.length > 0;
  const canResumeSubtree = canShowSubtreeControls && activePauseHold?.isRoot === true;
  const canRestoreSubtree = canShowSubtreeControls && activeCancelHolds.length > 0;
  const isTerminalIssue = issue.status === "done" || issue.status === "cancelled";
  const isAgentOwnedNonTerminalIssue = Boolean(issue.assigneeAgentId) && !isTerminalIssue;
  const canPauseLeafWork = canManageTreeControl && childIssues.length === 0 && !activePauseHold && !isTerminalIssue;
  const canResumeLeafWork = canManageTreeControl && childIssues.length === 0 && activePauseHold?.isRoot === true;
  const treeControlScope: "leaf" | "subtree" = childIssues.length === 0 ? "leaf" : "subtree";
  const previewAffectedIssueCount = treePreviewAffectedIssues.length;
  const previewAffectedAgentCount = treeControlPreview?.totals.affectedAgents ?? 0;
  const treeControlPrimaryButtonLabel =
    treeControlMode === "pause"
      ? treeControlScope === "leaf"
        ? "Pause work"
        : "Pause and stop work"
      : treeControlMode === "cancel"
        ? `Cancel ${previewAffectedIssueCount} issues`
      : treeControlMode === "restore"
          ? `Restore ${previewAffectedIssueCount} issues`
          : treeControlScope === "leaf"
            ? "Resume work"
            : "Resume subtree";
  const treePreviewAffectedIssueRows = treePreviewDisplayIssues.map((candidate) => ({
    candidate,
    issue: {
      ...issue,
      id: candidate.id,
      identifier: candidate.identifier,
      title: candidate.title,
      status: candidate.status,
      parentId: candidate.parentId,
      assigneeAgentId: candidate.assigneeAgentId,
      assigneeUserId: candidate.assigneeUserId,
      executionRunId: candidate.activeRun?.id ?? null,
    } satisfies Issue,
  }));
  const treePreviewAffectedAgentRows = (treeControlPreview?.affectedAgents ?? [])
    .map((previewAgent) => ({
      ...previewAgent,
      agent: agentMap.get(previewAgent.agentId) ?? null,
    }))
    .sort((a, b) => (a.agent?.name ?? a.agentId).localeCompare(b.agent?.name ?? b.agentId));
  const pausedComposerHint = activePauseHold
    ? (
      issue.assigneeAgentId
        ? `Sending this comment will wake ${agentMap.get(issue.assigneeAgentId)?.name ?? "the assignee"} for triage while the subtree remains paused.`
        : "Assign an agent to wake them for triage while the subtree remains paused."
    )
    : null;
  const composerHint = pausedComposerHint;
  const queuedCommentReason: "hold" | "active_run" | "other" = activePauseHold ? "hold" : "active_run";
  const canApplyTreeControl =
    Boolean(treeControlPreview)
    && !treeControlPreviewLoading
    && (treeControlMode !== "cancel" || treeControlCancelConfirmed);
  const attachmentUploadButton = (
    <>
      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFilePicked}
        multiple
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadAttachment.isPending || importMarkdownDocument.isPending}
        className={cn(
          "shadow-none",
          attachmentDragActive && "border-primary bg-primary/5",
        )}
      >
        <Paperclip className="h-3.5 w-3.5 mr-1.5" />
        {uploadAttachment.isPending || importMarkdownDocument.isPending ? "Uploading..." : (
          <>
            <span className="hidden sm:inline">Upload attachment</span>
            <span className="sm:hidden">Upload</span>
          </>
        )}
      </Button>
    </>
  );
  const taskReviewOutputTitles = [
    ...(issue.documentSummaries ?? []).map((document) => document.title ?? document.key),
    ...(issue.planDocument ? [issue.planDocument.title ?? "Plan document"] : []),
  ];
  const taskReviewOutputCount = taskReviewOutputTitles.length;
  const taskReviewDecisionCount = interactions.filter((interaction) => interaction.status === "pending").length;

  return (
    <TheftDetailReviewTemplate className="min-h-0">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <IssueDetailReviewHeader
          issue={issue}
          ancestors={ancestors}
          issueLinkState={resolvedIssueDetailState ?? location.state}
          locationSearch={location.search}
          activePauseHold={activePauseHold}
          childIssueCount={childIssues.length}
          heldDescendantCount={heldDescendantCount}
          activeRootPauseHoldCreatedAt={activeRootPauseHold?.createdAt}
          activePauseHoldRootIdentifier={activePauseHoldRoot?.identifier}
          canShowSubtreeControls={canShowSubtreeControls}
          canResumeLeafWork={canResumeLeafWork}
          owner={issue.assigneeAgentId ? agentMap.get(issue.assigneeAgentId) ?? null : null}
          outputCount={taskReviewOutputCount}
          outputTitles={taskReviewOutputTitles}
          decisionCount={taskReviewDecisionCount}
          commentCount={threadComments.length}
          hasLiveRuns={hasLiveRuns}
          hasBlocker={issue.status === "blocked" || (issue.blockedBy?.length ?? 0) > 0}
          onResume={() => {
            setTreeControlMode("resume");
            setTreeControlWakeAgentsOnResume(isAgentOwnedNonTerminalIssue || canShowSubtreeControls);
            setTreeControlOpen(true);
          }}
          onViewAffected={() => {
            setTreeControlMode("resume");
            setTreeControlWakeAgentsOnResume(isAgentOwnedNonTerminalIssue || canShowSubtreeControls);
            setTreeControlOpen(true);
          }}
          onCancelSubtree={() => {
            setTreeControlMode("cancel");
            setTreeControlCancelConfirmed(false);
            setTreeControlOpen(true);
          }}
        />

        <IssueDetailTitleSection
          issue={issue}
          projectName={resolvedProject?.name ?? issue.project?.name ?? null}
          mentions={mentionOptions}
          hasLiveRuns={hasLiveRuns}
          isMobileInbox={isMobile && isFromInbox}
          copied={copied}
          panelVisible={panelVisible}
          canArchiveFromInbox={canArchiveFromInbox}
          archivePending={archivePending}
          moreOpen={moreOpen}
          canPauseLeafWork={canPauseLeafWork}
          canResumeLeafWork={canResumeLeafWork}
          canShowSubtreeControls={canShowSubtreeControls}
          canResumeSubtree={canResumeSubtree}
          canRestoreSubtree={canRestoreSubtree}
          onMoreOpenChange={setMoreOpen}
          onStatusChange={(status) => updateIssue.mutate({ status })}
          onPriorityChange={(priority) => updateIssue.mutate({ priority })}
          onCopy={copyIssueToClipboard}
          onOpenMobileProps={() => setMobilePropsOpen(true)}
          onShowPanel={() => setPanelVisible(true)}
          onArchiveFromInbox={() => {
            if (!archivePending) archiveFromInbox.mutate(issue.id);
          }}
          onPauseLeafWork={() => {
            setTreeControlMode("pause");
            setTreeControlCancelConfirmed(false);
            setTreeControlOpen(true);
          }}
          onResumeLeafWork={() => {
            setTreeControlMode("resume");
            setTreeControlWakeAgentsOnResume(isAgentOwnedNonTerminalIssue);
            setTreeControlOpen(true);
          }}
          onPauseSubtree={() => {
            setTreeControlMode("pause");
            setTreeControlCancelConfirmed(false);
            setTreeControlOpen(true);
          }}
          onResumeSubtree={() => {
            setTreeControlMode("resume");
            setTreeControlWakeAgentsOnResume(true);
            setTreeControlOpen(true);
          }}
          onCancelSubtree={() => {
            setTreeControlMode("cancel");
            setTreeControlCancelConfirmed(false);
            setTreeControlOpen(true);
          }}
          onRestoreSubtree={() => {
            setTreeControlMode("restore");
            setTreeControlWakeAgentsOnResume(false);
            setTreeControlCancelConfirmed(false);
            setTreeControlOpen(true);
          }}
          onHideIssue={() => {
            updateIssue.mutate(
              { hiddenAt: new Date().toISOString() },
              { onSuccess: () => navigate("/issues/all") },
            );
          }}
          onSaveTitle={(title) => updateIssue.mutateAsync({ title })}
          onSaveDescription={(description) => updateIssue.mutateAsync({ description })}
          onUploadDescriptionImage={async (file) => {
            const attachment = await uploadAttachment.mutateAsync(file);
            return attachment.contentPath;
          }}
          onDropDescriptionFile={async (file) => {
            await uploadAttachment.mutateAsync(file);
          }}
        />

      <PluginSlotOutlet
        slotTypes={["toolbarButton", "contextMenuItem"]}
        entityType="issue"
        context={{
          companyId: issue.companyId,
          projectId: issue.projectId ?? null,
          entityId: issue.id,
          entityType: "issue",
        }}
        className="flex flex-wrap gap-2"
        itemClassName="inline-flex"
        missingBehavior="placeholder"
      />

      <PluginLauncherOutlet
        placementZones={["toolbarButton"]}
        entityType="issue"
        context={{
          companyId: issue.companyId,
          projectId: issue.projectId ?? null,
          entityId: issue.id,
          entityType: "issue",
        }}
        className="flex flex-wrap gap-2"
        itemClassName="inline-flex"
      />

      <PluginSlotOutlet
        slotTypes={["taskDetailView"]}
        entityType="issue"
        context={{
          companyId: issue.companyId,
          projectId: issue.projectId ?? null,
          entityId: issue.id,
          entityType: "issue",
        }}
        className="space-y-3"
        itemClassName="rounded-lg border border-border p-3"
        missingBehavior="placeholder"
      />

      {showRichSubIssuesSection ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>
          </div>
          <IssuesList
            issues={childIssues}
            isLoading={childIssuesLoading}
            agents={agents}
            projects={projects}
            liveIssueIds={liveIssueIds}
            mutedIssueIds={mutedChildIssueIds}
            issueBadgeById={childPauseBadgeById}
            projectId={issue.projectId ?? undefined}
            viewStateKey={`paperclip:issue-detail:${issue.id}:subissues-view`}
            issueLinkState={resolvedIssueDetailState ?? location.state}
            searchFilters={{ descendantOf: issue.id, includeBlockedBy: true }}
            searchWithinLoadedIssues
            baseCreateIssueDefaults={buildSubIssueDefaultsForViewer(issue, currentUserId)}
            createIssueLabel="Subtask"
            defaultSortField="workflow"
            showProgressSummary
            parentIssueIdForCostSummary={issue.id}
            onUpdateIssue={handleChildIssueUpdate}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
          <Button variant="outline" size="sm" onClick={openNewSubIssue} className="shrink-0 shadow-none">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New subtask
          </Button>
        </div>
      )}

      <IssueDocumentsSection
        issue={issue}
        canDeleteDocuments={Boolean(session?.user?.id)}
        feedbackVotes={feedbackVotes}
        feedbackDataSharingPreference={feedbackDataSharingPreference}
        feedbackTermsUrl={FEEDBACK_TERMS_URL}
        mentions={mentionOptions}
        imageUploadHandler={async (file) => {
          const attachment = await uploadAttachment.mutateAsync(file);
          return attachment.contentPath;
        }}
        onVote={async (revisionId, vote, options) => {
          await feedbackVoteMutation.mutateAsync({
            targetType: "issue_document_revision",
            targetId: revisionId,
            vote,
            reason: options?.reason,
            allowSharing: options?.allowSharing,
            sharingPreferenceAtSubmit: feedbackDataSharingPreference,
          });
        }}
        extraActions={!hasAttachments ? attachmentUploadButton : null}
      />

      <IssueAttachmentsSection
        initialLoading={attachmentsInitialLoading}
        imageAttachments={imageAttachments}
        nonImageAttachments={nonImageAttachments}
        uploadAction={attachmentUploadButton}
        error={attachmentError}
        deletePending={deleteAttachment.isPending}
        onOpenImage={(attachment) => {
          const idx = imageAttachments.findIndex((candidate) => candidate.id === attachment.id);
          setGalleryIndex(idx >= 0 ? idx : 0);
          setGalleryOpen(true);
        }}
        onDeleteAttachment={(attachmentId) => deleteAttachment.mutate(attachmentId)}
        onDragActiveChange={setAttachmentDragActive}
        onDropFiles={(files) => void handleAttachmentFiles(files)}
      />

      <ImageGalleryModal
        images={imageAttachments}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />

      <IssueWorkspaceCard
        issue={issue}
        project={resolvedProject}
        onUpdate={(data) => updateIssue.mutate(data)}
      />

      <Separator />

      <Tabs value={detailTab} onValueChange={setDetailTab} className="space-y-3">
        <TabsList variant="line" className="w-full justify-start gap-1">
          <TabsTrigger value="related-work" className="gap-1.5">
            <ListTree className="h-3.5 w-3.5" />
            Context
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Runtime diagnostics
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <ActivityIcon className="h-3.5 w-3.5" />
            Audit
          </TabsTrigger>
          {issuePluginTabItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="chat">
          <IssueDetailChatTab
            issueId={issue.id}
            companyId={issue.companyId}
            projectId={issue.projectId ?? null}
            issueStatus={issue.status}
            issueWorkMode={issue.workMode ?? "standard"}
            executionRunId={issue.executionRunId ?? null}
            blockedBy={issue.blockedBy ?? []}
            blockerAttention={issue.blockerAttention ?? null}
            successfulRunHandoff={issue.successfulRunHandoff ?? null}
            comments={threadComments}
            locallyQueuedCommentRunIds={locallyQueuedCommentRunIds}
            interactions={interactions}
            hasOlderComments={hasOlderComments}
            commentsLoadingOlder={commentsLoadingOlder}
            onLoadOlderComments={loadOlderComments}
            onRefreshLatestComments={refetchLatestComments}
            composerRef={commentComposerRef}
            feedbackVotes={feedbackVotes}
            feedbackDataSharingPreference={feedbackDataSharingPreference}
            feedbackTermsUrl={FEEDBACK_TERMS_URL}
            agentMap={agentMap}
            currentUserId={currentUserId}
            userLabelMap={userLabelMap}
            userProfileMap={userProfileMap}
            draftKey={`paperclip:issue-comment-draft:${issue.id}`}
            reassignOptions={commentReassignOptions}
            currentAssigneeValue={actualAssigneeValue}
            suggestedAssigneeValue={suggestedAssigneeValue}
            mentions={mentionOptions}
            composerDisabledReason={commentComposerDisabledReason}
            composerHint={composerHint}
            queuedCommentReason={queuedCommentReason}
            onVote={handleCommentVote}
            onAdd={handleChatAdd}
            onImageUpload={handleCommentImageUpload}
            onAttachImage={handleCommentAttachImage}
            onInterruptQueued={handleInterruptQueuedRun}
            onPauseWorkRun={canManageTreeControl
              ? (runId) => pauseIssueWorkRun.mutateAsync({ runId, scope: treeControlScope }).then(() => undefined)
              : undefined}
            onWorkModeChange={(nextMode) => {
              const currentMode: IssueWorkMode = issue.workMode ?? "standard";
              if (currentMode === nextMode) return;
              return updateIssue.mutateAsync({ workMode: nextMode }).then(() => undefined);
            }}
            onCancelQueued={handleCancelQueuedComment}
            interruptingQueuedRunId={interruptQueuedComment.isPending ? interruptQueuedComment.variables ?? null : null}
            pausingWorkRunId={pauseIssueWorkRun.isPending ? pauseIssueWorkRun.variables?.runId ?? null : null}
            onImageClick={handleChatImageClick}
            onAcceptInteraction={handleAcceptInteraction}
            onRejectInteraction={handleRejectInteraction}
            onSubmitInteractionAnswers={handleSubmitInteractionAnswers}
            onCancelInteraction={handleCancelInteraction}
          />
        </TabsContent>

        <TabsContent value="activity">
          {detailTab === "activity" ? (
            <IssueDetailActivityTab
              issue={issue}
              issueId={issue.id}
              companyId={issue.companyId}
              issueStatus={issue.status}
              childIssues={childIssues}
              agentMap={agentMap}
              hasLiveRuns={hasLiveRuns}
              currentUserId={currentUserId}
              userProfileMap={userProfileMap}
              pendingApprovalAction={pendingApprovalAction}
              handoffFocusSignal={handoffFocusSignal}
              onApprovalAction={(approvalId, action) => {
                approvalDecision.mutate({ approvalId, action });
              }}
              onCheckMonitorNow={() => checkIssueMonitorNow.mutate()}
              checkingMonitorNow={checkIssueMonitorNow.isPending}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="related-work">
          <IssueRelatedWorkPanel relatedWork={issue.relatedWork} />
        </TabsContent>

        {activePluginTab && (
          <TabsContent value={activePluginTab.value}>
            <PluginSlotMount
              slot={activePluginTab.slot}
              context={{
                companyId: issue.companyId,
                projectId: issue.projectId ?? null,
                entityId: issue.id,
                entityType: "issue",
              }}
              missingBehavior="placeholder"
            />
          </TabsContent>
        )}
      </Tabs>

      <IssueTreeControlDialog
        open={treeControlOpen}
        mode={treeControlMode}
        scope={treeControlScope}
        reason={treeControlReason}
        wakeAgentsOnResume={treeControlWakeAgentsOnResume}
        cancelConfirmed={treeControlCancelConfirmed}
        previewLoading={treeControlPreviewLoading}
        previewError={treeControlPreviewError}
        preview={treeControlPreview}
        warnings={treePreviewWarnings}
        affectedIssueRows={treePreviewAffectedIssueRows}
        affectedAgentRows={treePreviewAffectedAgentRows}
        affectedIssueCount={previewAffectedIssueCount}
        affectedAgentCount={previewAffectedAgentCount}
        primaryButtonLabel={treeControlPrimaryButtonLabel}
        canApply={canApplyTreeControl}
        applying={executeTreeControl.isPending}
        onOpenChange={setTreeControlOpen}
        onReasonChange={setTreeControlReason}
        onWakeAgentsOnResumeChange={setTreeControlWakeAgentsOnResume}
        onCancelConfirmedChange={setTreeControlCancelConfirmed}
        onRetryPreview={() => {
          void refetchTreeControlPreview();
        }}
        onApply={() => executeTreeControl.mutate()}
      />

      {/* Mobile properties drawer */}
      <Sheet open={mobilePropsOpen} onOpenChange={setMobilePropsOpen}>
        <SheetContent side="bottom" className="max-h-dvh pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle className="text-sm">Properties</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-4 pb-4">
              <IssueProperties
                issue={issue}
                childIssues={childIssues}
                onAddSubIssue={openNewSubIssue}
                onUpdate={(data) => updateIssue.mutate(data)}
                inline
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <ScrollToBottom />
      </div>
    </TheftDetailReviewTemplate>
  );
}
