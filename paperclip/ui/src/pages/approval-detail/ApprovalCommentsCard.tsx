import type { ApprovalComment } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Identity } from "@/components/Identity";
import { MarkdownBody } from "@/components/MarkdownBody";
import { Link } from "@/lib/router";

type ApprovalCommentsCardProps = {
  comments: ApprovalComment[];
  commentBody: string;
  agentNameById: Map<string, string>;
  isPosting: boolean;
  onCommentBodyChange: (value: string) => void;
  onPostComment: () => void;
};

export function ApprovalCommentsCard({
  comments,
  commentBody,
  agentNameById,
  isPosting,
  onCommentBodyChange,
  onPostComment,
}: ApprovalCommentsCardProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <h3 className="text-sm font-medium">Comments ({comments.length})</h3>
      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-md border border-border/60 p-3">
            <div className="mb-1 flex items-center justify-between">
              {comment.authorAgentId ? (
                <Link to={`/agents/${comment.authorAgentId}`} className="hover:underline">
                  <Identity
                    name={agentNameById.get(comment.authorAgentId) ?? comment.authorAgentId.slice(0, 8)}
                    size="sm"
                  />
                </Link>
              ) : (
                <Identity name="Board" size="sm" />
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <MarkdownBody className="text-sm">{comment.body}</MarkdownBody>
          </div>
        ))}
      </div>
      <Textarea
        value={commentBody}
        onChange={(event) => onCommentBodyChange(event.target.value)}
        placeholder="Add a comment..."
        rows={3}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={onPostComment} disabled={!commentBody.trim() || isPosting}>
          {isPosting ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </div>
  );
}
