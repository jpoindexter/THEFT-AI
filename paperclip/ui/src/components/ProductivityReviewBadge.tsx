import { Eye } from "lucide-react";
import type { IssueProductivityReview } from "@paperclipai/shared";
import { Link } from "../lib/router";
import { cn } from "../lib/utils";
import { createIssueDetailPath } from "../lib/issueDetailBreadcrumb";
import { badgeVariants } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const TRIGGER_LABELS: Record<string, string> = {
  no_comment_streak: "No-comment streak",
  long_active_duration: "Long active duration",
  high_churn: "High churn",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  todo: "Open",
  in_progress: "In progress",
  in_review: "In review",
  blocked: "Blocked",
  backlog: "Open",
};

export function productivityReviewTriggerLabel(
  trigger: IssueProductivityReview["trigger"],
): string {
  if (!trigger) return "Productivity review";
  return TRIGGER_LABELS[trigger] ?? "Productivity review";
}

export function ProductivityReviewBadge({
  review,
  className,
  hideLabel = false,
}: {
  review: IssueProductivityReview;
  className?: string;
  hideLabel?: boolean;
}) {
  const label = productivityReviewTriggerLabel(review.trigger);
  const reviewIdentifier = review.reviewIdentifier ?? review.reviewIssueId.slice(0, 8);
  const reviewPath = createIssueDetailPath(review.reviewIdentifier ?? review.reviewIssueId);
  const statusLabel = REVIEW_STATUS_LABELS[review.status] ?? review.status.replace(/_/g, " ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={reviewPath}
          className={cn(
            badgeVariants({ variant: "outline" }),
            "theft-chip-important text-nano font-medium hover:bg-accent/60",
            className,
          )}
          aria-label={`Under review · productivity review ${reviewIdentifier} (${label})`}
        >
          <Eye className="h-3 w-3" aria-hidden />
          {hideLabel ? null : <span>Under review</span>}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <div className="font-semibold">Productivity review open</div>
          <div>
            <span className="text-muted-foreground">Trigger:</span> {label}
          </div>
          {typeof review.noCommentStreak === "number" && review.noCommentStreak > 0 ? (
            <div>
              <span className="text-muted-foreground">No-comment streak:</span>{" "}
              {review.noCommentStreak} runs
            </div>
          ) : null}
          <div>
            <span className="text-muted-foreground">Review:</span> {reviewIdentifier} ({statusLabel})
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
