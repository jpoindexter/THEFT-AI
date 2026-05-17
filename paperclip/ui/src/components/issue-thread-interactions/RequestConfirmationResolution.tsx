import { ChevronRight } from "lucide-react";
import type { RequestConfirmationInteraction } from "../../lib/issue-thread-interactions";
import { Button } from "../ui/button";
import { RequestConfirmationTargetChip } from "./RequestConfirmationTargetChip";

export function RequestConfirmationResolution({
  interaction,
}: {
  interaction: RequestConfirmationInteraction;
}) {
  const outcome = interaction.result?.outcome;
  const target = interaction.payload.target ?? null;
  const staleTarget = interaction.result?.staleTarget ?? null;

  if (interaction.status === "accepted") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm leading-6 text-foreground">
        <span className="font-medium">Confirmed</span>
        <RequestConfirmationTargetChip interaction={interaction} target={target} />
      </div>
    );
  }

  if (interaction.status === "rejected") {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm leading-6 text-foreground">
          <span className="font-medium">Declined</span>
          <RequestConfirmationTargetChip interaction={interaction} target={target} />
        </div>
        {interaction.result?.reason ? (
          <blockquote className="rounded-sm border-l-2 border-rose-500/70 bg-rose-500/10 px-3 py-2 text-sm leading-6 text-rose-900 dark:text-rose-100">
            {interaction.result.reason}
          </blockquote>
        ) : null}
      </div>
    );
  }

  if (interaction.status === "expired") {
    const expiredByComment = outcome === "superseded_by_comment";
    const expiredByTargetChange = outcome === "stale_target";
    return (
      <div className="space-y-3 rounded-sm border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        <div className="text-micro font-semibold uppercase tracking-widest text-amber-700">
          {expiredByComment ? "Expired by comment" : "Expired by target change"}
        </div>
        <p className="leading-6">
          {expiredByComment
            ? "A board comment superseded this confirmation before it was resolved."
            : "The requested target changed before this confirmation was resolved."}
        </p>
        {expiredByComment && interaction.result?.commentId ? (
          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-amber-950 hover:bg-amber-500/15 dark:text-amber-50">
            <a href={`#comment-${interaction.result.commentId}`}>Jump to comment</a>
          </Button>
        ) : null}
        {expiredByTargetChange ? (
          <div className="flex flex-wrap items-center gap-2">
            <RequestConfirmationTargetChip
              interaction={interaction}
              target={staleTarget}
              tone="subtle"
            />
            {staleTarget && target ? (
              <ChevronRight className="h-3.5 w-3.5 text-amber-700" />
            ) : null}
            <RequestConfirmationTargetChip interaction={interaction} target={target} />
          </div>
        ) : null}
      </div>
    );
  }

  if (interaction.status === "failed") {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        This request could not be resolved. Try again or create a new request.
      </p>
    );
  }

  return null;
}
