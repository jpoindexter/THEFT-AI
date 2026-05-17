import type { Dispatch, FocusEvent, KeyboardEvent, SetStateAction } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor, type MentionOption } from "../MarkdownEditor";
import { isPlanKey, type DraftState } from "./IssueDocumentUtils";

interface NewIssueDocumentDraftFormProps {
  draft: DraftState;
  keyError: string | null;
  isSaving: boolean;
  mentions?: MentionOption[];
  imageUploadHandler?: (file: File) => Promise<string>;
  setDraft: Dispatch<SetStateAction<DraftState | null>>;
  onCancel: () => void;
  onCommit: () => void;
  onBlurCapture: (event: FocusEvent<HTMLDivElement>) => void | Promise<void>;
  onKeyDown: (event: KeyboardEvent) => void | Promise<void>;
}

export function NewIssueDocumentDraftForm({
  draft,
  keyError,
  isSaving,
  mentions,
  imageUploadHandler,
  setDraft,
  onCancel,
  onCommit,
  onBlurCapture,
  onKeyDown,
}: NewIssueDocumentDraftFormProps) {
  return (
    <div
      className="space-y-3 rounded-lg border border-border bg-accent/10 p-3"
      onBlurCapture={onBlurCapture}
      onKeyDown={onKeyDown}
    >
      <Input
        autoFocus
        value={draft.key}
        onChange={(event) =>
          setDraft((current) => current ? { ...current, key: event.target.value.toLowerCase() } : current)
        }
        placeholder="Document key"
      />
      {keyError ? (
        <p className="text-xs text-destructive">{keyError}</p>
      ) : null}
      {!isPlanKey(draft.key) ? (
        <Input
          value={draft.title}
          onChange={(event) =>
            setDraft((current) => current ? { ...current, title: event.target.value } : current)
          }
          placeholder="Optional title"
        />
      ) : null}
      <MarkdownEditor
        value={draft.body}
        onChange={(body) =>
          setDraft((current) => current ? { ...current, body } : current)
        }
        placeholder="Markdown body"
        bordered={false}
        className="bg-transparent"
        contentClassName="min-h-56 text-base leading-7"
        mentions={mentions}
        imageUploadHandler={imageUploadHandler}
        onSubmit={onCommit}
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button size="sm" onClick={onCommit} disabled={isSaving}>
          {isSaving ? "Saving..." : "Create document"}
        </Button>
      </div>
    </div>
  );
}
