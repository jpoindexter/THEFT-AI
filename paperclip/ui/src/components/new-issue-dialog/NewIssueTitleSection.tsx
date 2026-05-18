import { memo, useEffect, useState, type RefObject } from "react";

import { Textarea } from "@/components/ui/textarea";
import type { MarkdownEditorRef } from "../MarkdownEditor";

type NewIssueTitleSectionProps = {
  value: string;
  pending: boolean;
  assigneeValue: string;
  projectId: string;
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  assigneeSelectorRef: RefObject<HTMLButtonElement | null>;
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  onChange: (value: string) => void;
};

export const NewIssueTitleSection = memo(function NewIssueTitleSection({
  value,
  pending,
  assigneeValue,
  projectId,
  descriptionEditorRef,
  assigneeSelectorRef,
  projectSelectorRef,
  onChange,
}: NewIssueTitleSectionProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <div className="px-4 pt-4 pb-2">
      <Textarea
        className="min-h-0 w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-lg font-semibold shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:border-transparent focus-visible:ring-0 md:text-lg"
        placeholder="Issue title"
        rows={1}
        value={draftValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);
          onChange(nextValue);
          event.target.style.height = "auto";
          event.target.style.height = `${event.target.scrollHeight}px`;
        }}
        readOnly={pending}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            descriptionEditorRef.current?.focus();
          }
          if (event.key === "Tab" && !event.shiftKey) {
            event.preventDefault();
            if (assigneeValue) {
              if (projectId) {
                descriptionEditorRef.current?.focus();
              } else {
                projectSelectorRef.current?.focus();
              }
            } else {
              assigneeSelectorRef.current?.focus();
            }
          }
        }}
        autoFocus
      />
    </div>
  );
});
