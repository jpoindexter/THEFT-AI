import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { RequestConfirmationInteraction } from "../../lib/issue-thread-interactions";
import { cn } from "../../lib/utils";
import { MarkdownBody } from "../MarkdownBody";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { RequestConfirmationResolution } from "./RequestConfirmationResolution";
import { RequestConfirmationTargetChip } from "./RequestConfirmationTargetChip";
import type {
  AcceptInteractionHandler,
  RejectInteractionHandler,
} from "./types";

export function RequestConfirmationInteractionCard({
  interaction,
  onAcceptInteraction,
  onRejectInteraction,
}: {
  interaction: RequestConfirmationInteraction;
  onAcceptInteraction?: AcceptInteractionHandler;
  onRejectInteraction?: RejectInteractionHandler;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [working, setWorking] = useState<"accept" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState(interaction.result?.reason ?? "");
  const [rejectAttempted, setRejectAttempted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const rejectRequiresReason = interaction.payload.rejectRequiresReason === true;
  const allowDeclineReason = interaction.payload.allowDeclineReason !== false;
  const trimmedRejectReason = rejectReason.trim();
  const canReject = !rejectRequiresReason || trimmedRejectReason.length > 0;
  const declineReasonInvalid = rejectRequiresReason && !canReject;
  const declineReasonPlaceholder =
    interaction.payload.declineReasonPlaceholder
    ?? (interaction.payload.acceptLabel === "Approve plan"
      ? "Optional: what would you like revised?"
      : "Optional: tell the agent what you'd change.");

  useEffect(() => {
    setRejectReason(interaction.result?.reason ?? "");
    setRejectAttempted(false);
    setActionError(null);
    if (interaction.status !== "pending") {
      setRejecting(false);
      setWorking(null);
    }
  }, [interaction.id, interaction.result?.reason, interaction.status]);

  async function handleAccept() {
    if (!onAcceptInteraction) return;
    setWorking("accept");
    setActionError(null);
    try {
      await onAcceptInteraction(interaction);
    } catch {
      setActionError("Try again");
    } finally {
      setWorking(null);
    }
  }

  async function handleReject() {
    setRejectAttempted(true);
    if (!onRejectInteraction || !canReject) return;
    setWorking("reject");
    setActionError(null);
    try {
      await onRejectInteraction(interaction, trimmedRejectReason || undefined);
      setRejecting(false);
    } catch {
      setActionError("Try again");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-4">
      {interaction.status === "pending" ? (
        <div className="space-y-3 rounded-sm border border-border/70 bg-background/75 p-4">
          <div className="text-sm leading-6 text-foreground">
            {interaction.payload.prompt}
          </div>
          {interaction.payload.detailsMarkdown ? (
            <div className="border-t border-border/60 pt-3 text-sm">
              <MarkdownBody>{interaction.payload.detailsMarkdown}</MarkdownBody>
            </div>
          ) : null}
          <RequestConfirmationTargetChip
            interaction={interaction}
            target={interaction.payload.target}
          />
        </div>
      ) : null}

      {interaction.status === "pending" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant={rejecting ? "outline" : "default"}
              disabled={!onAcceptInteraction || working !== null}
              onClick={() => void handleAccept()}
            >
              {working === "accept" ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Confirming...
                </>
              ) : (
                interaction.payload.acceptLabel ?? "Confirm"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!onRejectInteraction || working !== null}
              onClick={() => {
                if (!allowDeclineReason) {
                  void handleReject();
                  return;
                }
                setRejectAttempted(false);
                setRejecting((current) => !current);
              }}
            >
              {interaction.payload.rejectLabel ?? "Decline"}
            </Button>
          </div>

          {rejecting ? (
            <div className="space-y-3 rounded-sm border border-border/70 bg-background/75 p-3">
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder={declineReasonPlaceholder}
                aria-invalid={rejectAttempted && declineReasonInvalid}
                className={cn(
                  "min-h-24 bg-background text-sm",
                  rejectAttempted && declineReasonInvalid
                    && "border-rose-500 focus-visible:ring-rose-500/25",
                )}
              />
              {rejectAttempted && declineReasonInvalid ? (
                <p className="text-xs text-destructive">A decline reason is required.</p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={working !== null}
                  onClick={() => {
                    setRejecting(false);
                    setRejectAttempted(false);
                  }}
                >
                  Cancel decline
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!onRejectInteraction || working !== null}
                  onClick={() => void handleReject()}
                >
                  {working === "reject" ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    interaction.payload.rejectLabel ?? "Decline"
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-sm border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}
        </div>
      ) : (
        <RequestConfirmationResolution interaction={interaction} />
      )}
    </div>
  );
}
