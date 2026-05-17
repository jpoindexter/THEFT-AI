import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  buildSuggestedTaskTree,
  collectSuggestedTaskClientKeys,
  type SuggestTasksInteraction,
  type SuggestedTaskTreeNode,
} from "../../lib/issue-thread-interactions";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { InteractionField } from "./InteractionField";
import { createdTaskMap, SuggestedTaskTreeNodeRow } from "./SuggestedTaskTree";
import type {
  AcceptInteractionHandler,
  InteractionActorContext,
  RejectInteractionHandler,
} from "./types";

export function SuggestedTasksInteractionCard({
  interaction,
  agentMap,
  currentUserId,
  userLabelMap,
  onAcceptInteraction,
  onRejectInteraction,
}: {
  interaction: SuggestTasksInteraction;
  onAcceptInteraction?: AcceptInteractionHandler;
  onRejectInteraction?: RejectInteractionHandler;
} & InteractionActorContext) {
  const [rejecting, setRejecting] = useState(false);
  const [working, setWorking] = useState<"accept" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState(
    interaction.result?.rejectionReason ?? "",
  );

  useEffect(() => {
    setRejectReason(interaction.result?.rejectionReason ?? "");
    if (interaction.status !== "pending") {
      setRejecting(false);
      setWorking(null);
    }
  }, [interaction.result?.rejectionReason, interaction.status]);

  const roots = useMemo(
    () =>
      buildSuggestedTaskTree(interaction.payload.tasks).filter(
        (node) => !node.task.hiddenInPreview,
      ),
    [interaction.payload.tasks],
  );
  const createdByClientKey = useMemo(
    () => createdTaskMap(interaction.result?.createdTasks),
    [interaction.result?.createdTasks],
  );
  const skippedClientKeys = useMemo(
    () => new Set(interaction.result?.skippedClientKeys ?? []),
    [interaction.result?.skippedClientKeys],
  );
  const totalTasks = interaction.payload.tasks.length;
  const [selectedClientKeys, setSelectedClientKeys] = useState<Set<string>>(
    () => new Set(interaction.payload.tasks.map((task) => task.clientKey)),
  );
  const taskSelectionSeed = useMemo(
    () => interaction.payload.tasks.map((task) => task.clientKey).join("\n"),
    [interaction.payload.tasks],
  );

  useEffect(() => {
    setSelectedClientKeys(new Set(interaction.payload.tasks.map((task) => task.clientKey)));
  }, [interaction.id, interaction.status, taskSelectionSeed]);

  const taskByClientKey = useMemo(
    () => new Map(interaction.payload.tasks.map((task) => [task.clientKey, task] as const)),
    [interaction.payload.tasks],
  );
  const selectedCount = selectedClientKeys.size;
  const createdCount = interaction.result?.createdTasks?.length ?? 0;
  const skippedCount = interaction.result?.skippedClientKeys?.length ?? 0;

  async function handleAccept() {
    if (!onAcceptInteraction) return;
    setWorking("accept");
    try {
      await onAcceptInteraction(interaction, [...selectedClientKeys]);
    } finally {
      setWorking(null);
    }
  }

  async function handleReject() {
    if (!onRejectInteraction) return;
    setWorking("reject");
    try {
      await onRejectInteraction(interaction, rejectReason.trim() || undefined);
      setRejecting(false);
    } finally {
      setWorking(null);
    }
  }

  function handleToggleSelection(node: SuggestedTaskTreeNode, checked: boolean) {
    const subtreeClientKeys = collectSuggestedTaskClientKeys(node);
    setSelectedClientKeys((current) => {
      const next = new Set(current);
      if (!checked) {
        for (const clientKey of subtreeClientKeys) {
          next.delete(clientKey);
        }
        return next;
      }

      for (const clientKey of subtreeClientKeys) {
        next.add(clientKey);
      }

      let parentClientKey = taskByClientKey.get(node.task.clientKey)?.parentClientKey ?? null;
      while (parentClientKey) {
        next.add(parentClientKey);
        parentClientKey = taskByClientKey.get(parentClientKey)?.parentClientKey ?? null;
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{totalTasks === 1 ? "1 draft issue" : `${totalTasks} draft issues`}</span>
        {interaction.payload.defaultParentId ? (
          <InteractionField label="Default parent" value={interaction.payload.defaultParentId} tone="subtle" />
        ) : null}
      </div>

      <div className="overflow-hidden border border-border/70">
        {roots.map((root) => (
          <SuggestedTaskTreeNodeRow
            key={root.task.clientKey}
            node={root}
            createdByClientKey={createdByClientKey}
            agentMap={agentMap}
            currentUserId={currentUserId}
            userLabelMap={userLabelMap}
            selectedClientKeys={selectedClientKeys}
            skippedClientKeys={skippedClientKeys}
            showSelection={interaction.status === "pending"}
            onToggleSelection={handleToggleSelection}
          />
        ))}
      </div>

      {interaction.status === "accepted" ? (
        <div className="rounded-sm border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          <div className="text-micro font-semibold uppercase tracking-widest text-emerald-700">
            Resolution summary
          </div>
          <p className="mt-1 leading-6">
            {skippedCount > 0
              ? `Created ${createdCount} draft ${createdCount === 1 ? "issue" : "issues"} and skipped ${skippedCount} during review.`
              : `Created all ${createdCount} draft ${createdCount === 1 ? "issue" : "issues"}.`}
          </p>
        </div>
      ) : null}

      {interaction.status === "rejected" ? (
        <div className="rounded-sm border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-100">
          <div className="text-micro font-semibold uppercase tracking-widest text-rose-700">
            Rejection reason
          </div>
          <p className={cn(
            "mt-1 leading-6",
            !interaction.result?.rejectionReason && "text-rose-900/75",
          )}>
            {interaction.result?.rejectionReason || "No reason provided."}
          </p>
        </div>
      ) : null}

      {interaction.status === "pending" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {selectedCount === totalTasks
                  ? `All ${totalTasks} draft ${totalTasks === 1 ? "issue" : "issues"} selected`
                  : `${selectedCount} of ${totalTasks} draft ${totalTasks === 1 ? "issue" : "issues"} selected`}
              </span>
              {selectedCount < totalTasks ? (
                <span>
                  {totalTasks - selectedCount} will be skipped if you accept this interaction.
                </span>
              ) : null}
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                disabled={!onAcceptInteraction || working !== null || selectedCount === 0}
                onClick={() => void handleAccept()}
              >
                {working === "accept" ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  selectedCount === totalTasks ? "Accept drafts" : "Accept selected drafts"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!onRejectInteraction || working !== null}
                onClick={() => setRejecting((current) => !current)}
              >
                Reject
              </Button>
              {selectedCount < totalTasks ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={working !== null}
                  onClick={() => setSelectedClientKeys(new Set(interaction.payload.tasks.map((task) => task.clientKey)))}
                >
                  Reset selection
                </Button>
              ) : null}
            </div>
          </div>

          {rejecting ? (
            <div className="space-y-3">
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Add a short reason for rejecting this suggestion"
                className="min-h-24 bg-background text-sm"
              />
              <div className="flex justify-end">
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
                    "Save rejection"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
