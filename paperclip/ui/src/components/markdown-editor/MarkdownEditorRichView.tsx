import type {
  ClipboardEvent,
  DragEvent,
  MutableRefObject,
  RefObject,
} from "react";
import {
  MDXEditor,
  type MDXEditorMethods,
  type RealmPlugin,
} from "@mdxeditor/editor";
import { MentionAwareLinkNode, mentionAwareLinkNodeReplacement } from "../../lib/mention-aware-link-node";
import { cn } from "../../lib/utils";
import { MarkdownAutocompleteMenu } from "./MarkdownAutocompleteMenu";
import { shouldAcceptAutocompleteKey } from "./autocomplete-utils";
import type { useMarkdownAutocomplete } from "./use-markdown-autocomplete";

type AutocompleteState = ReturnType<typeof useMarkdownAutocomplete>;

export function MarkdownEditorRichView({
  autocomplete,
  bordered,
  canDropFile,
  className,
  containerRef,
  contentClassName,
  dragDepthRef,
  echoIgnoreMarkdownRef,
  editorRef,
  editorValue,
  initialChildOnChangeRef,
  isDragOver,
  latestValueRef,
  onBlur,
  onChange,
  onDropFile,
  onPasteCapture,
  onSubmit,
  placeholder,
  plugins,
  readOnly,
  setEditorRef,
  setIsDragOver,
  setRichEditorError,
  uploadError,
}: {
  autocomplete: AutocompleteState;
  bordered: boolean;
  canDropFile: boolean;
  className?: string;
  containerRef: RefObject<HTMLDivElement | null>;
  contentClassName?: string;
  dragDepthRef: MutableRefObject<number>;
  echoIgnoreMarkdownRef: MutableRefObject<string | null>;
  editorRef: MutableRefObject<MDXEditorMethods | null>;
  editorValue: string;
  initialChildOnChangeRef: MutableRefObject<boolean>;
  isDragOver: boolean;
  latestValueRef: MutableRefObject<string>;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onDropFile?: (file: File) => Promise<void>;
  onPasteCapture: (event: ClipboardEvent<HTMLDivElement>) => void;
  onSubmit?: () => void;
  placeholder?: string;
  plugins: RealmPlugin[];
  readOnly: boolean;
  setEditorRef: (instance: MDXEditorMethods | null) => void;
  setIsDragOver: (dragOver: boolean) => void;
  setRichEditorError: (message: string | null) => void;
  uploadError: string | null;
}) {
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative paperclip-mdxeditor-scope",
        bordered ? "rounded-md border border-border bg-transparent" : "bg-transparent",
        isDragOver && "ring-1 ring-primary/60 bg-accent/20",
        className,
      )}
      onKeyDownCapture={(event) => {
        if (readOnly) return;
        if (onSubmit && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          event.stopPropagation();
          onSubmit();
          return;
        }

        if (autocomplete.mentionActive) {
          if (event.key === " " && autocomplete.mentionStateRef.current?.trigger === "skill") {
            autocomplete.mentionStateRef.current = null;
            autocomplete.skillEnterArmedRef.current = false;
            autocomplete.setMentionState(null);
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            autocomplete.mentionStateRef.current = null;
            autocomplete.skillEnterArmedRef.current = false;
            autocomplete.setMentionState(null);
            return;
          }
          if (autocomplete.filteredMentions.length > 0) {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              event.stopPropagation();
              autocomplete.skillEnterArmedRef.current = autocomplete.mentionStateRef.current?.trigger === "skill";
              autocomplete.setMentionIndex((prev) => Math.min(prev + 1, autocomplete.filteredMentions.length - 1));
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              event.stopPropagation();
              autocomplete.skillEnterArmedRef.current = autocomplete.mentionStateRef.current?.trigger === "skill";
              autocomplete.setMentionIndex((prev) => Math.max(prev - 1, 0));
              return;
            }
            if (
              shouldAcceptAutocompleteKey(
                event.key,
                autocomplete.mentionStateRef.current?.trigger ?? null,
                autocomplete.skillEnterArmedRef.current,
              )
            ) {
              event.preventDefault();
              event.stopPropagation();
              autocomplete.selectMention(autocomplete.filteredMentions[autocomplete.mentionIndex]);
            }
          }
        }
      }}
      onDragEnter={(event: DragEvent<HTMLDivElement>) => {
        if (readOnly) return;
        if (!canDropFile || !hasFilePayload(event)) return;
        dragDepthRef.current += 1;
        setIsDragOver(true);
      }}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        if (readOnly) return;
        if (!canDropFile || !hasFilePayload(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        if (readOnly) return;
        if (!canDropFile) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setIsDragOver(false);
      }}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        if (readOnly) return;
        dragDepthRef.current = 0;
        setIsDragOver(false);
        if (!onDropFile) return;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return;
        const allFiles = Array.from(files);
        const nonImageFiles = allFiles.filter((file) => !file.type.startsWith("image/"));
        if (nonImageFiles.length === 0) return;
        if (nonImageFiles.length === allFiles.length) {
          event.preventDefault();
          event.stopPropagation();
        }
        for (const file of nonImageFiles) {
          void onDropFile(file);
        }
      }}
      onPasteCapture={onPasteCapture}
    >
      <MDXEditor
        ref={setEditorRef}
        markdown={editorValue}
        suppressHtmlProcessing
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(next) => {
          if (readOnly) return;
          const echo = echoIgnoreMarkdownRef.current;
          if (echo !== null && next === echo) {
            echoIgnoreMarkdownRef.current = null;
            latestValueRef.current = next;
            return;
          }
          if (echo !== null) {
            echoIgnoreMarkdownRef.current = null;
          }

          if (initialChildOnChangeRef.current) {
            initialChildOnChangeRef.current = false;
            if (next === "" && editorValue !== "") {
              echoIgnoreMarkdownRef.current = editorValue;
              editorRef.current?.setMarkdown(editorValue);
              return;
            }
          }
          latestValueRef.current = next;
          onChange(next);
        }}
        onBlur={() => onBlur?.()}
        onError={(payload) => {
          setRichEditorError(payload.error);
        }}
        className={cn("paperclip-mdxeditor", !bordered && "paperclip-mdxeditor--borderless")}
        contentEditableClassName={cn(
          "paperclip-mdxeditor-content focus:outline-none",
          contentClassName,
        )}
        additionalLexicalNodes={[MentionAwareLinkNode, mentionAwareLinkNodeReplacement]}
        plugins={plugins}
      />

      <MarkdownAutocompleteMenu
        filteredMentions={autocomplete.filteredMentions}
        handleAutocompletePress={autocomplete.handleAutocompletePress}
        handleAutocompleteTouchEnd={autocomplete.handleAutocompleteTouchEnd}
        handleAutocompleteTouchMove={autocomplete.handleAutocompleteTouchMove}
        handleAutocompleteTouchStart={autocomplete.handleAutocompleteTouchStart}
        mentionActive={autocomplete.mentionActive}
        mentionIndex={autocomplete.mentionIndex}
        mentionMenuPosition={autocomplete.mentionMenuPosition}
        mentionStateRef={autocomplete.mentionStateRef}
        setMentionIndex={autocomplete.setMentionIndex}
        skillEnterArmedRef={autocomplete.skillEnterArmedRef}
      />

      {isDragOver && canDropFile && (
        <div
          className={cn(
            "pointer-events-none absolute inset-1 z-40 flex items-center justify-center rounded-md border border-dashed border-primary/80 bg-primary/10 text-xs font-medium text-primary",
            !bordered && "inset-0 rounded-sm",
          )}
        >
          Drop {onDropFile ? "file" : "image"} to upload
        </div>
      )}
      {uploadError && (
        <p className="px-3 pb-2 text-xs text-destructive">{uploadError}</p>
      )}
    </div>
  );
}

function hasFilePayload(event: DragEvent<HTMLDivElement>) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}
