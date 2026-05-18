import type { Approval, JoinRequest } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { ACTIONABLE_APPROVAL_STATUSES } from "../../lib/inbox";
import { approvalLabel, defaultTypeIcon, typeIcon } from "../../components/ApprovalPayload";
import { timeAgo } from "../../lib/timeAgo";
import { UserPlus, X } from "lucide-react";

export type NonIssueUnreadState = "visible" | "fading" | "hidden" | null;

export function approvalStatusLabel(status: Approval["status"]): string {
  return status.replaceAll("_", " ");
}

function nonEmptyLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function formatJoinRequestInboxLabel(
  joinRequest: Pick<
    JoinRequest,
    "requestType" | "agentName" | "requestEmailSnapshot" | "requestingUserId"
  > & {
    requesterUser?: {
      name: string | null;
      email: string | null;
    } | null;
  },
) {
  if (joinRequest.requestType !== "human") {
    return `Agent join request${joinRequest.agentName ? `: ${joinRequest.agentName}` : ""}`;
  }

  const requesterName = nonEmptyLabel(joinRequest.requesterUser?.name);
  const requesterEmail =
    nonEmptyLabel(joinRequest.requesterUser?.email) ??
    nonEmptyLabel(joinRequest.requestEmailSnapshot);
  const requesterId = nonEmptyLabel(joinRequest.requestingUserId);

  if (requesterName && requesterEmail) return `${requesterName} (${requesterEmail})`;
  if (requesterEmail) return requesterEmail;
  if (requesterName) return requesterName;
  if (requesterId) return requesterId;
  return "Human join request";
}

function InboxUnreadSlot({
  archiveDisabled,
  onArchive,
  onMarkRead,
  unreadState,
}: {
  archiveDisabled?: boolean;
  onArchive?: () => void;
  onMarkRead?: () => void;
  unreadState: NonIssueUnreadState;
}) {
  if (unreadState === null) return null;
  const showUnreadDot = unreadState === "visible" || unreadState === "fading";

  return (
    <span className="hidden sm:inline-flex h-4 w-4 shrink-0 items-center justify-center self-center">
      {showUnreadDot ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onMarkRead}
          className="h-4 w-4 rounded-full p-0 hover:bg-blue-500/20"
          aria-label="Mark as read"
        >
          <span
            className={cn(
              "block h-2 w-2 rounded-full bg-blue-600 transition-opacity duration-300 dark:bg-blue-400",
              unreadState === "fading" ? "opacity-0" : "opacity-100",
            )}
          />
        </Button>
      ) : onArchive ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onArchive}
          disabled={archiveDisabled}
          className="h-4 w-4 rounded-md p-0 text-muted-foreground opacity-0 hover:bg-transparent hover:text-foreground group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
          aria-label="Dismiss from inbox"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <span className="inline-flex h-4 w-4" aria-hidden="true" />
      )}
    </span>
  );
}

function InboxDecisionActions({
  isPending,
  onApprove,
  onReject,
  mobile = false,
}: {
  isPending: boolean;
  mobile?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className={mobile ? "mt-3 flex gap-2 sm:hidden" : "hidden shrink-0 items-center gap-2 sm:flex"}>
      <Button
        size="sm"
        className="h-8 bg-green-700 px-3 text-white hover:bg-green-600"
        onClick={onApprove}
        disabled={isPending}
      >
        Approve
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="h-8 px-3"
        onClick={onReject}
        disabled={isPending}
      >
        Reject
      </Button>
    </div>
  );
}

export function ApprovalInboxRow({
  approval,
  requesterName,
  onApprove,
  onReject,
  isPending,
  unreadState = null,
  onMarkRead,
  onArchive,
  archiveDisabled,
  selected = false,
  className,
}: {
  approval: Approval;
  requesterName: string | null;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
  unreadState?: NonIssueUnreadState;
  onMarkRead?: () => void;
  onArchive?: () => void;
  archiveDisabled?: boolean;
  selected?: boolean;
  className?: string;
}) {
  const Icon = typeIcon[approval.type] ?? defaultTypeIcon;
  const label = approvalLabel(approval.type, approval.payload as Record<string, unknown> | null);
  const showResolutionButtons =
    approval.type !== "budget_override_required" &&
    ACTIONABLE_APPROVAL_STATUSES.has(approval.status);
  const showUnreadSlot = unreadState !== null;

  return (
    <div className={cn(
      "group border-b border-border px-2 py-2.5 last:border-b-0 sm:px-1 sm:pr-3 sm:py-2",
      className,
    )}>
      <div className="flex items-start gap-2 sm:items-center">
        <InboxUnreadSlot
          archiveDisabled={archiveDisabled}
          onArchive={onArchive}
          onMarkRead={onMarkRead}
          unreadState={unreadState}
        />
        <Link
          to={`/approvals/${approval.id}`}
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2 no-underline text-inherit transition-colors",
            selected ? "hover:bg-transparent" : "hover:bg-accent/50",
          )}
        >
          {!showUnreadSlot && <span className="hidden h-2 w-2 shrink-0 sm:inline-flex" aria-hidden="true" />}
          <span className="hidden h-3.5 w-3.5 shrink-0 sm:inline-flex" aria-hidden="true" />
          <span className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5 sm:mt-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-sm font-medium sm:truncate sm:line-clamp-none">
              {label}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="capitalize">{approvalStatusLabel(approval.status)}</span>
              {requesterName ? <span>requested by {requesterName}</span> : null}
              <span>updated {timeAgo(approval.updatedAt)}</span>
            </span>
          </span>
        </Link>
        {showResolutionButtons ? (
          <InboxDecisionActions
            isPending={isPending}
            onApprove={onApprove}
            onReject={onReject}
          />
        ) : null}
      </div>
      {showResolutionButtons ? (
        <InboxDecisionActions
          isPending={isPending}
          mobile
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : null}
    </div>
  );
}

export function JoinRequestInboxRow({
  joinRequest,
  onApprove,
  onReject,
  isPending,
  unreadState = null,
  onMarkRead,
  onArchive,
  archiveDisabled,
  className,
}: {
  joinRequest: JoinRequest;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
  unreadState?: NonIssueUnreadState;
  onMarkRead?: () => void;
  onArchive?: () => void;
  archiveDisabled?: boolean;
  selected?: boolean;
  className?: string;
}) {
  const label = formatJoinRequestInboxLabel(joinRequest);
  const showUnreadSlot = unreadState !== null;

  return (
    <div className={cn(
      "group border-b border-border px-2 py-2.5 last:border-b-0 sm:px-1 sm:pr-3 sm:py-2",
      className,
    )}>
      <div className="flex items-start gap-2 sm:items-center">
        <InboxUnreadSlot
          archiveDisabled={archiveDisabled}
          onArchive={onArchive}
          onMarkRead={onMarkRead}
          unreadState={unreadState}
        />
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {!showUnreadSlot && <span className="hidden h-2 w-2 shrink-0 sm:inline-flex" aria-hidden="true" />}
          <span className="hidden h-3.5 w-3.5 shrink-0 sm:inline-flex" aria-hidden="true" />
          <span className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5 sm:mt-0">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-sm font-medium sm:truncate sm:line-clamp-none">
              {label}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>requested {timeAgo(joinRequest.createdAt)} from IP {joinRequest.requestIp}</span>
              {joinRequest.adapterType && <span>adapter: {joinRequest.adapterType}</span>}
            </span>
          </span>
        </div>
        <InboxDecisionActions
          isPending={isPending}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>
      <InboxDecisionActions
        isPending={isPending}
        mobile
        onApprove={onApprove}
        onReject={onReject}
      />
    </div>
  );
}
