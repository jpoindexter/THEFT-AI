import type { Agent } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { CommentCard } from "./CommentCard";
import type { CommentWithRunMeta } from "./CommentThreadTypes";

export function QueuedCommentsSection({
  queuedComments,
  agentMap,
  companyId,
  projectId,
  highlightCommentId,
  onInterruptQueued,
  interruptingQueuedRunId,
}: {
  queuedComments: CommentWithRunMeta[];
  agentMap?: Map<string, Agent>;
  companyId?: string | null;
  projectId?: string | null;
  highlightCommentId?: string | null;
  onInterruptQueued?: (runId: string) => Promise<void>;
  interruptingQueuedRunId?: string | null;
}) {
  const firstTargetRunId = queuedComments[0]?.queueTargetRunId;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="theft-label-compact text-chart-3">
          Queued Comments ({queuedComments.length})
        </h4>
        {onInterruptQueued && firstTargetRunId ? (
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={interruptingQueuedRunId === firstTargetRunId}
            onClick={() => void onInterruptQueued(firstTargetRunId)}
          >
            {interruptingQueuedRunId === firstTargetRunId ? "Interrupting..." : "Interrupt"}
          </Button>
        ) : null}
      </div>
      <div className="space-y-3">
        {queuedComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            agentMap={agentMap}
            companyId={companyId}
            projectId={projectId}
            highlightCommentId={highlightCommentId}
            queued
          />
        ))}
      </div>
    </div>
  );
}
