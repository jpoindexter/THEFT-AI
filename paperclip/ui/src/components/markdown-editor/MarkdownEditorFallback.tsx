import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "../../lib/utils";

export function MarkdownEditorFallback({
  autoSizeTextarea,
  bordered,
  className,
  containerRef,
  contentClassName,
  fallbackTextareaRef,
  onBlur,
  onChange,
  onSubmit,
  placeholder,
  readOnly,
  setRichEditorError,
  value,
}: {
  autoSizeTextarea: (element: HTMLTextAreaElement | null) => void;
  bordered: boolean;
  className?: string;
  containerRef: RefObject<HTMLDivElement | null>;
  contentClassName?: string;
  fallbackTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  readOnly: boolean;
  setRichEditorError: (message: string | null) => void;
  value: string;
}) {
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative paperclip-mdxeditor-scope",
        bordered ? "rounded-md border border-border bg-transparent" : "bg-transparent",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-3 pt-2 text-xs text-muted-foreground">
        <p>Rich editor unavailable for this markdown. Showing raw source instead.</p>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto shrink-0 px-0 py-0 text-xs text-muted-foreground"
          onClick={() => {
            setRichEditorError(null);
          }}
        >
          Retry rich editor
        </Button>
      </div>
      <Textarea
        ref={fallbackTextareaRef}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => {
          if (readOnly) return;
          onChange(event.target.value);
          autoSizeTextarea(event.target);
        }}
        onBlur={() => onBlur?.()}
        onKeyDown={(event) => {
          if (onSubmit && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className={cn(
          "min-h-48 resize-none border-0 px-3 pb-3 pt-2 font-mono text-sm leading-6 shadow-none focus-visible:border-transparent focus-visible:ring-0",
          contentClassName,
        )}
      />
    </div>
  );
}
