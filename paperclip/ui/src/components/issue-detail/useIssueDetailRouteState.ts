import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useNavigationType } from "@/lib/router";
import type { Issue } from "@paperclipai/shared";

import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import {
  createIssueDetailPath,
  hasLegacyIssueDetailQuery,
  readIssueDetailBreadcrumb,
  readIssueDetailHeaderSeed,
  readIssueDetailLocationState,
  rememberIssueDetailLocationState,
} from "@/lib/issueDetailBreadcrumb";

export function useIssueDetailRouteState(issueId?: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const resolvedIssueDetailState = useMemo(
    () => readIssueDetailLocationState(issueId, location.state, location.search),
    [issueId, location.state, location.search],
  );
  const issueHeaderSeed = useMemo(
    () => readIssueDetailHeaderSeed(location.state) ?? readIssueDetailHeaderSeed(resolvedIssueDetailState),
    [location.state, resolvedIssueDetailState],
  );
  const sourceBreadcrumb = useMemo(
    () => readIssueDetailBreadcrumb(issueId, location.state, location.search) ?? { label: "Tasks", href: "/issues" },
    [issueId, location.state, location.search],
  );
  const isFromInbox = resolvedIssueDetailState?.issueDetailSource === "inbox";

  return {
    isFromInbox,
    issueHeaderSeed,
    location,
    navigate,
    navigationType,
    resolvedIssueDetailState,
    sourceBreadcrumb,
  };
}

type UseIssueDetailRouteEffectsInput = ReturnType<typeof useIssueDetailRouteState> & {
  hasLiveRuns: boolean;
  issue: Issue | null | undefined;
  issueId?: string;
};

export function useIssueDetailRouteEffects({
  hasLiveRuns,
  issue,
  issueId,
  location,
  navigate,
  navigationType,
  resolvedIssueDetailState,
  sourceBreadcrumb,
}: UseIssueDetailRouteEffectsInput) {
  const { setBreadcrumbs } = useBreadcrumbs();
  const breadcrumbTitle = issue?.title ?? issueId ?? "Issue";

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

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const main = document.getElementById("main-content");
    if (main) main.scrollTop = 0;
  }, [issueId, navigationType]);

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
}
