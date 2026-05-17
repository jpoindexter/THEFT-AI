import type { FocusEventHandler, KeyboardEventHandler, RefObject } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AutosaveState } from "@/hooks/useAutosaveIndicator";
import { FoldCurtain } from "../FoldCurtain";
import { MarkdownBody } from "../MarkdownBody";
import { MarkdownEditor, type MarkdownEditorRef, type MentionOption } from "../MarkdownEditor";

const pad = "px-1 -mx-1";
const markdownPad = "px-1";

export function InlineEditorMarkdownPreview({
  previewValue,
  className,
  placeholder,
  foldable,
  onEnterEditMode,
}: {
  previewValue: string;
  className?: string;
  placeholder: string;
  foldable: boolean;
  onEnterEditMode: () => void;
}) {
  return (
    <div
      className={cn(markdownPad, "rounded transition-colors hover:bg-accent/20")}
      onClick={(event) => {
        if (event.defaultPrevented) return;
        const target = event.target as HTMLElement | null;
        if (target && target.closest("a,button,[data-mention-kind],[data-radix-popper-content-wrapper]")) {
          return;
        }
        onEnterEditMode();
      }}
      onDragEnter={onEnterEditMode}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onEnterEditMode();
      }}
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      tabIndex={0}
    >
      {foldable ? (
        <FoldCurtain>
          <MarkdownBody className={cn("paperclip-edit-in-place-content", className)}>
            {previewValue}
          </MarkdownBody>
        </FoldCurtain>
      ) : (
        <MarkdownBody className={cn("paperclip-edit-in-place-content", className)}>
          {previewValue}
        </MarkdownBody>
      )}
    </div>
  );
}

export function InlineEditorMarkdownComposer({
  markdownRef,
  draft,
  placeholder,
  className,
  multilineFocused,
  autosaveState,
  imageUploadHandler,
  onDropFile,
  mentions,
  onBlurCapture,
  onChange,
  onFocusCapture,
  onKeyDown,
  onSubmit,
}: {
  markdownRef: RefObject<MarkdownEditorRef | null>;
  draft: string;
  placeholder: string;
  className?: string;
  multilineFocused: boolean;
  autosaveState: AutosaveState;
  imageUploadHandler?: (file: File) => Promise<string>;
  onDropFile?: (file: File) => Promise<void>;
  mentions?: MentionOption[];
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
  onChange: (value: string) => void;
  onFocusCapture: FocusEventHandler<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onSubmit: () => void;
}) {
  return (
    <div
      className={cn(
        markdownPad,
        "rounded transition-colors",
        multilineFocused ? "bg-transparent" : "hover:bg-accent/20",
      )}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
      onKeyDown={onKeyDown}
    >
      <MarkdownEditor
        ref={markdownRef}
        value={draft}
        onChange={onChange}
        placeholder={placeholder}
        bordered={false}
        className="bg-transparent"
        contentClassName={cn("paperclip-edit-in-place-content", className)}
        imageUploadHandler={imageUploadHandler}
        onDropFile={onDropFile}
        mentions={mentions}
        onSubmit={onSubmit}
      />
      <div className="flex min-h-4 items-center justify-end pr-1">
        <span
          className={cn(
            "text-micro transition-opacity duration-150",
            autosaveState === "error" ? "text-destructive" : "text-muted-foreground",
            autosaveState === "idle" ? "opacity-0" : "opacity-100",
          )}
        >
          {autosaveState === "saving"
            ? "Autosaving..."
            : autosaveState === "saved"
              ? "Saved"
              : autosaveState === "error"
                ? "Could not save"
                : "Idle"}
        </span>
      </div>
    </div>
  );
}

export function InlineEditorTextarea({
  inputRef,
  draft,
  className,
  onAutoSize,
  onBlur,
  onChange,
  onKeyDown,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  className?: string;
  onAutoSize: (el: HTMLTextAreaElement | null) => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
}) {
  return (
    <Textarea
      ref={inputRef}
      value={draft}
      rows={1}
      onChange={(event) => {
        onChange(event.target.value);
        onAutoSize(event.target);
      }}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={cn(
        "min-h-0 w-full resize-none overflow-hidden rounded border-0 bg-transparent py-0 shadow-none focus-visible:border-transparent focus-visible:ring-0",
        pad,
        className,
      )}
    />
  );
}

export function InlineEditorDisplay({
  as: DisplayTag,
  value,
  placeholder,
  className,
  onEdit,
}: {
  as: "h1" | "h2" | "p" | "span" | "div";
  value: string;
  placeholder: string;
  className?: string;
  onEdit: () => void;
}) {
  return (
    <DisplayTag
      className={cn(
        "cursor-pointer rounded hover:bg-accent/50 transition-colors overflow-hidden",
        pad,
        !value && "text-muted-foreground italic",
        className,
      )}
      onClick={onEdit}
    >
      {value || placeholder}
    </DisplayTag>
  );
}
