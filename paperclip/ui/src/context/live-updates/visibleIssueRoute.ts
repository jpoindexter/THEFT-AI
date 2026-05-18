import type { QueryClient } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";
import type { RunForIssue } from "../../api/activity";
import type { ActiveRunForIssue, LiveRunForIssue } from "../../api/heartbeats";
import { clearIssueExecutionRun, removeLiveRunById } from "../../lib/optimistic-issue-runs";
import { queryKeys } from "../../lib/queryKeys";
import { toCompanyRelativePath } from "../../lib/company-routes";
import { readRecord, readString, shortId, TERMINAL_RUN_STATUSES, truncate } from "./liveUpdateModel";

export interface IssueToastContext {
  ref: string;
  title: string | null;
  label: string;
  href: string;
}

export interface VisibleRouteOptions {
  isForegrounded?: boolean;
}

interface VisibleIssueRouteContext {
  routeIssueRef: string;
  issueRefs: Set<string>;
  assigneeAgentId: string | null;
  runIds: Set<string>;
}

export function resolveIssueQueryRefs(
  queryClient: QueryClient,
  companyId: string,
  issueId: string,
  details: Record<string, unknown> | null,
): string[] {
  const refs = new Set<string>([issueId]);
  const detailIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId));
  const listIssues = queryClient.getQueryData<Issue[]>(queryKeys.issues.list(companyId));
  const detailsIdentifier =
    readString(details?.identifier) ??
    readString(details?.issueIdentifier);

  if (detailsIdentifier) refs.add(detailsIdentifier);
  if (detailIssue?.id) refs.add(detailIssue.id);
  if (detailIssue?.identifier) refs.add(detailIssue.identifier);

  const listIssue = listIssues?.find((issue) => {
    if (issue.id === issueId) return true;
    if (issue.identifier && issue.identifier === issueId) return true;
    if (detailsIdentifier && issue.identifier === detailsIdentifier) return true;
    return false;
  });
  if (listIssue?.id) refs.add(listIssue.id);
  if (listIssue?.identifier) refs.add(listIssue.identifier);

  return Array.from(refs);
}

export function resolveIssueToastContext(
  queryClient: QueryClient,
  companyId: string,
  issueId: string,
  details: Record<string, unknown> | null,
): IssueToastContext {
  const issueRefs = resolveIssueQueryRefs(queryClient, companyId, issueId, details);
  const detailIssue = issueRefs
    .map((ref) => queryClient.getQueryData<Issue>(queryKeys.issues.detail(ref)))
    .find((issue): issue is Issue => !!issue);
  const listIssue = queryClient
    .getQueryData<Issue[]>(queryKeys.issues.list(companyId))
    ?.find((issue) => issueRefs.some((ref) => issue.id === ref || issue.identifier === ref));
  const cachedIssue = detailIssue ?? listIssue ?? null;
  const ref =
    readString(details?.identifier) ??
    readString(details?.issueIdentifier) ??
    cachedIssue?.identifier ??
    `Issue ${shortId(issueId)}`;
  const title =
    readString(details?.title) ??
    readString(details?.issueTitle) ??
    cachedIssue?.title ??
    null;
  return {
    ref,
    title,
    label: title ? `${ref} - ${truncate(title, 72)}` : ref,
    href: `/issues/${cachedIssue?.identifier ?? issueId}`,
  };
}

function isPageForegrounded(): boolean {
  if (typeof document === "undefined") return false;
  if (document.visibilityState !== "visible") return false;
  if (typeof document.hasFocus === "function" && !document.hasFocus()) return false;
  return true;
}

export function resolveVisibleIssueRouteContext(
  queryClient: QueryClient,
  pathname: string,
  options?: VisibleRouteOptions,
): VisibleIssueRouteContext | null {
  const isForegrounded = options?.isForegrounded ?? isPageForegrounded();
  if (!isForegrounded) return null;

  const relativePath = toCompanyRelativePath(pathname);
  const segments = relativePath.split("/").filter(Boolean);
  if (segments[0] !== "issues" || !segments[1]) return null;

  const issueRef = decodeURIComponent(segments[1]);
  const issue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueRef)) ?? null;
  const issueRefs = new Set<string>([issueRef]);
  if (issue?.id) issueRefs.add(issue.id);
  if (issue?.identifier) issueRefs.add(issue.identifier);

  const runIds = new Set<string>();
  const activeRun = queryClient.getQueryData<ActiveRunForIssue | null>(queryKeys.issues.activeRun(issueRef));
  const liveRuns = queryClient.getQueryData<LiveRunForIssue[]>(queryKeys.issues.liveRuns(issueRef)) ?? [];
  const linkedRuns = queryClient.getQueryData<RunForIssue[]>(queryKeys.issues.runs(issueRef)) ?? [];

  if (activeRun?.id) runIds.add(activeRun.id);
  for (const run of liveRuns) {
    if (run.id) runIds.add(run.id);
  }
  for (const run of linkedRuns) {
    if (run.runId) runIds.add(run.runId);
  }

  return {
    routeIssueRef: issueRef,
    issueRefs,
    assigneeAgentId: issue?.assigneeAgentId ?? null,
    runIds,
  };
}

export function buildIssueRefsForPayload(entityId: string, details: Record<string, unknown> | null): Set<string> {
  const refs = new Set<string>([entityId]);
  const identifier = readString(details?.identifier) ?? readString(details?.issueIdentifier);
  if (identifier) refs.add(identifier);
  return refs;
}

export function overlaps(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}

export function shouldSuppressActivityToastForVisibleIssue(
  queryClient: QueryClient,
  pathname: string,
  payload: Record<string, unknown>,
  options?: VisibleRouteOptions,
): boolean {
  const entityType = readString(payload.entityType);
  const entityId = readString(payload.entityId);
  if (entityType !== "issue" || !entityId) return false;

  const context = resolveVisibleIssueRouteContext(queryClient, pathname, options);
  if (!context) return false;

  return overlaps(context.issueRefs, buildIssueRefsForPayload(entityId, readRecord(payload.details)));
}

export function shouldSuppressRunStatusToastForVisibleIssue(
  queryClient: QueryClient,
  pathname: string,
  payload: Record<string, unknown>,
  options?: VisibleRouteOptions,
): boolean {
  const context = resolveVisibleIssueRouteContext(queryClient, pathname, options);
  if (!context) return false;

  const runId = readString(payload.runId);
  if (runId && context.runIds.has(runId)) return true;

  const agentId = readString(payload.agentId);
  return !!agentId && !!context.assigneeAgentId && agentId === context.assigneeAgentId;
}

export function invalidateVisibleIssueRunQueries(
  queryClient: QueryClient,
  pathname: string,
  payload: Record<string, unknown>,
  options?: VisibleRouteOptions,
): boolean {
  const context = resolveVisibleIssueRouteContext(queryClient, pathname, options);
  if (!context) return false;

  const runId = readString(payload.runId);
  const agentId = readString(payload.agentId);
  const matchesVisibleIssue =
    (runId !== null && context.runIds.has(runId)) ||
    (!!agentId && !!context.assigneeAgentId && agentId === context.assigneeAgentId);
  if (!matchesVisibleIssue) return false;

  const status = readString(payload.status);
  if (runId && status && TERMINAL_RUN_STATUSES.has(status)) {
    for (const issueRef of context.issueRefs) {
      queryClient.setQueryData(
        queryKeys.issues.liveRuns(issueRef),
        (current: LiveRunForIssue[] | undefined) => removeLiveRunById(current, runId),
      );
      queryClient.setQueryData(
        queryKeys.issues.activeRun(issueRef),
        (current: ActiveRunForIssue | null | undefined) => (current?.id === runId ? null : current),
      );
      queryClient.setQueryData(
        queryKeys.issues.detail(issueRef),
        (current: Issue | undefined) => clearIssueExecutionRun(current, runId),
      );
    }
  }

  for (const issueRef of context.issueRefs) {
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueRef) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(issueRef) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.runs(issueRef) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.liveRuns(issueRef) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.activeRun(issueRef) });
  }
  return true;
}

export function shouldSuppressAgentStatusToastForVisibleIssue(
  queryClient: QueryClient,
  pathname: string,
  payload: Record<string, unknown>,
  options?: VisibleRouteOptions,
): boolean {
  const context = resolveVisibleIssueRouteContext(queryClient, pathname, options);
  if (!context?.assigneeAgentId) return false;

  const agentId = readString(payload.agentId);
  return !!agentId && agentId === context.assigneeAgentId;
}

export function shouldDeferIssueRefetchForVisibleAgentActivity(
  queryClient: QueryClient,
  pathname: string,
  payload: Record<string, unknown>,
  options?: VisibleRouteOptions,
): boolean {
  const entityType = readString(payload.entityType);
  const entityId = readString(payload.entityId);
  const actorType = readString(payload.actorType);
  const action = readString(payload.action);
  const details = readRecord(payload.details);

  if (entityType !== "issue" || !entityId) return false;
  if (actorType !== "agent" && actorType !== "system") return false;
  if (action !== "issue.updated") return false;
  if (readString(details?.source) === "comment") return false;

  const context = resolveVisibleIssueRouteContext(queryClient, pathname, options);
  if (!context) return false;

  return overlaps(context.issueRefs, buildIssueRefsForPayload(entityId, details));
}

export function shouldDeferVisibleIssueCommentActivity(
  queryClient: QueryClient,
  pathname: string,
  payload: Record<string, unknown>,
  options?: VisibleRouteOptions,
): boolean {
  const entityType = readString(payload.entityType);
  const entityId = readString(payload.entityId);
  const action = readString(payload.action);
  const details = readRecord(payload.details);

  if (entityType !== "issue" || !entityId) return false;
  if (action !== "issue.comment_added") return false;

  const context = resolveVisibleIssueRouteContext(queryClient, pathname, options);
  if (!context) return false;

  return overlaps(context.issueRefs, buildIssueRefsForPayload(entityId, details));
}
