import { Link } from "@/lib/router";
import { Eye, Hexagon, Repeat } from "lucide-react";
import type { Issue } from "@paperclipai/shared";

import { TheftChip } from "@/components/theft/atoms/TheftChip";
import { InlineEditor } from "@/components/InlineEditor";
import type { MentionOption } from "@/components/MarkdownEditor";
import { PriorityIcon } from "@/components/PriorityIcon";
import { ProductivityReviewBadge } from "@/components/ProductivityReviewBadge";
import { StatusIcon } from "@/components/StatusIcon";
import {
  IssueDetailHeaderActions,
  type IssueDetailHeaderActionsProps,
} from "./IssueDetailHeaderActions";

type IssueDetailTitleSectionProps = IssueDetailHeaderActionsProps & {
  issue: Issue;
  projectName: string | null;
  mentions: MentionOption[];
  hasLiveRuns: boolean;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onSaveTitle: (title: string) => void | Promise<unknown>;
  onSaveDescription: (description: string) => void | Promise<unknown>;
  onUploadDescriptionImage: (file: File) => Promise<string>;
  onDropDescriptionFile: (file: File) => Promise<void>;
};

export function IssueDetailTitleSection({
  issue,
  projectName,
  mentions,
  hasLiveRuns,
  isMobileInbox,
  copied,
  panelVisible,
  canArchiveFromInbox,
  archivePending,
  moreOpen,
  canPauseLeafWork,
  canResumeLeafWork,
  canShowSubtreeControls,
  canResumeSubtree,
  canRestoreSubtree,
  onMoreOpenChange,
  onStatusChange,
  onPriorityChange,
  onCopy,
  onOpenMobileProps,
  onShowPanel,
  onArchiveFromInbox,
  onPauseLeafWork,
  onResumeLeafWork,
  onPauseSubtree,
  onResumeSubtree,
  onCancelSubtree,
  onRestoreSubtree,
  onHideIssue,
  onSaveTitle,
  onSaveDescription,
  onUploadDescriptionImage,
  onDropDescriptionFile,
}: IssueDetailTitleSectionProps) {
  const labels = issue.labels ?? [];

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <StatusIcon
          status={issue.status}
          blockerAttention={issue.blockerAttention}
          onChange={onStatusChange}
        />
        <PriorityIcon priority={issue.priority} onChange={onPriorityChange} />
        <span className="shrink-0 font-mono text-sm text-muted-foreground">
          {issue.identifier ?? issue.id.slice(0, 8)}
        </span>

        {hasLiveRuns ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-micro font-medium text-cyan-600 dark:text-cyan-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            Live
          </span>
        ) : null}

        {issue.originKind === "routine_execution" && issue.originId ? (
          <Link
            to={`/routines/${issue.originId}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-micro font-medium text-violet-600 transition-colors hover:bg-violet-500/20 dark:text-violet-400"
          >
            <Repeat className="h-3 w-3" />
            Routine
          </Link>
        ) : null}

        {issue.productivityReview ? (
          <ProductivityReviewBadge review={issue.productivityReview} />
        ) : null}

        {issue.originKind === "issue_productivity_review" ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-micro font-medium text-amber-700 dark:text-amber-300"
            title="This task is a productivity review."
          >
            <Eye className="h-3 w-3" />
            Productivity review
          </span>
        ) : null}

        {issue.workMode === "planning" ? (
          <span
            className="inline-flex shrink-0 items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-micro font-medium text-amber-700 dark:text-amber-300"
            title="This issue is in planning mode."
          >
            Planning
          </span>
        ) : null}

        {issue.projectId ? (
          <Link
            to={`/projects/${issue.projectId}`}
            className="-mx-1 inline-flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Hexagon className="h-3 w-3 shrink-0" />
            <span className="truncate">{projectName ?? issue.projectId.slice(0, 8)}</span>
          </Link>
        ) : (
          <span className="-mx-1 inline-flex items-center gap-1 px-1 py-0.5 text-xs text-muted-foreground opacity-50">
            <Hexagon className="h-3 w-3 shrink-0" />
            No project
          </span>
        )}

        {labels.length > 0 ? (
          <div className="hidden items-center gap-1 sm:flex">
            {labels.slice(0, 4).map((label) => (
              <TheftChip key={label.id} tone="muted" density="compact">
                {label.name}
              </TheftChip>
            ))}
            {labels.length > 4 ? (
              <span className="text-micro text-muted-foreground">+{labels.length - 4}</span>
            ) : null}
          </div>
        ) : null}

        <IssueDetailHeaderActions
          isMobileInbox={isMobileInbox}
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
          onMoreOpenChange={onMoreOpenChange}
          onCopy={onCopy}
          onOpenMobileProps={onOpenMobileProps}
          onShowPanel={onShowPanel}
          onArchiveFromInbox={onArchiveFromInbox}
          onPauseLeafWork={onPauseLeafWork}
          onResumeLeafWork={onResumeLeafWork}
          onPauseSubtree={onPauseSubtree}
          onResumeSubtree={onResumeSubtree}
          onCancelSubtree={onCancelSubtree}
          onRestoreSubtree={onRestoreSubtree}
          onHideIssue={onHideIssue}
        />
      </div>

      <InlineEditor value={issue.title} onSave={onSaveTitle} as="h2" className="text-xl font-bold" />

      <InlineEditor
        value={issue.description ?? ""}
        onSave={onSaveDescription}
        as="p"
        className="text-sm leading-7 text-foreground"
        placeholder="Add a description..."
        multiline
        foldable
        mentions={mentions}
        imageUploadHandler={onUploadDescriptionImage}
        onDropFile={onDropDescriptionFile}
      />
    </div>
  );
}
