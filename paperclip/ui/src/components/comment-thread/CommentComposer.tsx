import type { ChangeEvent, RefObject } from "react";
import type { Agent } from "@paperclipai/shared";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineEntitySelector, type InlineEntityOption } from "../InlineEntitySelector";
import { MarkdownEditor, type MarkdownEditorRef, type MentionOption } from "../MarkdownEditor";
import { AgentIcon } from "../AgentIconPicker";

export function CommentComposer({
  body,
  setBody,
  submitting,
  attaching,
  canSubmit,
  editorRef,
  attachInputRef,
  mentions,
  imageUploadHandler,
  onAttachImage,
  enableReassign,
  reassignOptions,
  reassignTarget,
  setReassignTarget,
  agentMap,
  onSubmit,
  onAttachFile,
}: {
  body: string;
  setBody: (body: string) => void;
  submitting: boolean;
  attaching: boolean;
  canSubmit: boolean;
  editorRef: RefObject<MarkdownEditorRef | null>;
  attachInputRef: RefObject<HTMLInputElement | null>;
  mentions: MentionOption[];
  imageUploadHandler?: (file: File) => Promise<string>;
  onAttachImage?: (file: File) => Promise<void>;
  enableReassign: boolean;
  reassignOptions: InlineEntityOption[];
  reassignTarget: string;
  setReassignTarget: (value: string) => void;
  agentMap?: Map<string, Agent>;
  onSubmit: () => Promise<void>;
  onAttachFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <MarkdownEditor
        ref={editorRef}
        value={body}
        onChange={setBody}
        placeholder="Leave a comment..."
        mentions={mentions}
        onSubmit={onSubmit}
        imageUploadHandler={imageUploadHandler}
        contentClassName="min-h-16 text-sm"
      />
      <div className="flex items-center justify-end gap-3">
        {(imageUploadHandler || onAttachImage) && (
          <div className="mr-auto flex items-center gap-3">
            <Input
              ref={attachInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void onAttachFile(event)}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => attachInputRef.current?.click()}
              disabled={attaching}
              title="Attach image"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        )}
        {enableReassign && reassignOptions.length > 0 && (
          <InlineEntitySelector
            value={reassignTarget}
            options={reassignOptions}
            placeholder="Assignee"
            noneLabel="No assignee"
            searchPlaceholder="Search assignees..."
            emptyMessage="No assignees found."
            onChange={setReassignTarget}
            className="h-8 text-xs"
            renderTriggerValue={(option) => (
              <AssigneeOption option={option} agentMap={agentMap} fallback="Assignee" />
            )}
            renderOption={(option) => (
              <AssigneeOption option={option} agentMap={agentMap} />
            )}
          />
        )}
        <Button size="sm" disabled={!canSubmit} onClick={() => void onSubmit()}>
          {submitting ? "Posting..." : "Comment"}
        </Button>
      </div>
    </div>
  );
}

function AssigneeOption({
  option,
  agentMap,
  fallback,
}: {
  option: InlineEntityOption | null;
  agentMap?: Map<string, Agent>;
  fallback?: string;
}) {
  if (!option) return <span className="text-muted-foreground">{fallback ?? "Assignee"}</span>;
  const agentId = option.id.startsWith("agent:") ? option.id.slice("agent:".length) : null;
  const agent = agentId ? agentMap?.get(agentId) : null;
  return (
    <>
      {agent ? (
        <AgentIcon icon={agent.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : null}
      <span className="truncate">{option.label}</span>
    </>
  );
}
