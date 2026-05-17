import {
  type ClipboardEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { looksLikeMarkdownPaste } from "../lib/markdownPaste";
import { normalizeMarkdown } from "../lib/normalize-markdown";
import { cn } from "../lib/utils";
import { useEditorAutocomplete } from "../context/EditorAutocompleteContext";
import { isSelectionInsideCodeLikeElement } from "./markdown-editor/autocomplete-utils";
import {
  isRichEditorDomEmpty,
  prepareMarkdownForEditor,
} from "./markdown-editor/content-utils";
import type { MarkdownEditorRef, MentionOption } from "./markdown-editor/types";
import { MarkdownEditorFallback } from "./markdown-editor/MarkdownEditorFallback";
import { MarkdownEditorRichView } from "./markdown-editor/MarkdownEditorRichView";
import { useMarkdownAutocomplete } from "./markdown-editor/use-markdown-autocomplete";
import { useMarkdownEditorPlugins } from "./markdown-editor/use-markdown-editor-plugins";

export type { MarkdownEditorRef, MentionOption } from "./markdown-editor/types";
export { computeMentionMenuPosition, findMentionMatch } from "./markdown-editor/mention-position";
export {
  findClosestAutocompleteAnchor,
  isSameAutocompleteSession,
  placeCaretAfterMentionAnchor,
  shouldAcceptAutocompleteKey,
} from "./markdown-editor/autocomplete-utils";

/* ---- Editor props ---- */

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  onBlur?: () => void;
  imageUploadHandler?: (file: File) => Promise<string>;
  /** Called when a non-image file is dropped onto the editor (e.g. .zip). */
  onDropFile?: (file: File) => Promise<void>;
  /** When set to `parent`, a wrapper owns drag/drop behavior and visuals. */
  fileDropTarget?: "editor" | "parent";
  bordered?: boolean;
  /** List of mentionable entities. Enables @-mention autocomplete. */
  mentions?: MentionOption[];
  /** Called on Cmd/Ctrl+Enter */
  onSubmit?: () => void;
  /** Render the rich editor without allowing edits. */
  readOnly?: boolean;
}

/* ---- Component ---- */

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  contentClassName,
  onBlur,
  imageUploadHandler,
  onDropFile,
  fileDropTarget = "editor",
  bordered = true,
  mentions,
  onSubmit,
  readOnly = false,
}: MarkdownEditorProps, forwardedRef) {
  const editorValue = useMemo(() => prepareMarkdownForEditor(value), [value]);
  const { slashCommands } = useEditorAutocomplete();
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<MDXEditorMethods>(null);
  const fallbackTextareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(editorValue);
  valueRef.current = editorValue;
  const latestValueRef = useRef(editorValue);
  const initialChildOnChangeRef = useRef(true);
  /**
   * After imperative `setMarkdown` (prop sync, mentions, image upload), MDXEditor may emit `onChange`
   * with the same markdown. Skip notifying the parent for that echo so controlled parents that
   * normalize or transform values cannot loop. Replaces the older blur/focus gate for the same concern.
   */
  const echoIgnoreMarkdownRef = useRef<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [richEditorError, setRichEditorError] = useState<string | null>(null);
  const dragDepthRef = useRef(0);

  // Stable ref for imageUploadHandler so plugins don't recreate on every render
  const imageUploadHandlerRef = useRef(imageUploadHandler);
  imageUploadHandlerRef.current = imageUploadHandler;

  const autocomplete = useMarkdownAutocomplete({
    containerRef,
    echoIgnoreMarkdownRef,
    editorRef: ref,
    latestValueRef,
    mentions,
    onChange,
    slashCommands,
  });

  const setEditorRef = useCallback((instance: MDXEditorMethods | null) => {
    ref.current = instance;
    if (!instance) {
      return;
    }
    if (valueRef.current !== latestValueRef.current) {
      // Re-apply the latest controlled value once MDXEditor exposes its imperative API.
      echoIgnoreMarkdownRef.current = valueRef.current;
      instance.setMarkdown(valueRef.current);
      latestValueRef.current = valueRef.current;
    }
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    focus: () => {
      if (richEditorError) {
        fallbackTextareaRef.current?.focus();
        return;
      }
      ref.current?.focus(undefined, { defaultSelection: "rootEnd" });
    },
  }), [richEditorError]);

  const autoSizeFallbackTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (!richEditorError) return;
    autoSizeFallbackTextarea(fallbackTextareaRef.current);
  }, [autoSizeFallbackTextarea, richEditorError, value]);

  useEffect(() => {
    if (richEditorError || editorValue.trim().length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    let timeoutId = 0;
    const scheduleCheck = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        const editable = container.querySelector('[contenteditable="true"]');
        if (!(editable instanceof HTMLElement)) return;
        const activeElement = document.activeElement;
        if (activeElement === editable || editable.contains(activeElement)) return;
        if (isRichEditorDomEmpty(editable, editorValue, placeholder)) {
          setRichEditorError("Rich editor failed to load content");
        }
      }, 0);
    };

    scheduleCheck();
    const observer = new MutationObserver(() => {
      scheduleCheck();
    });
    observer.observe(container, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [editorValue, placeholder, richEditorError]);

  // Whether the image plugin should be included (boolean is stable across renders
  // as long as the handler presence doesn't toggle)
  const hasImageUpload = Boolean(imageUploadHandler);

  const plugins = useMarkdownEditorPlugins({
    echoIgnoreMarkdownRef,
    editorRef: ref,
    hasImageUpload,
    imageUploadHandlerRef,
    latestValueRef,
    onChange,
    setUploadError,
  });

  useEffect(() => {
    if (editorValue !== latestValueRef.current) {
      if (ref.current) {
        // Pair with onChange echo suppression (echoIgnoreMarkdownRef).
        echoIgnoreMarkdownRef.current = editorValue;
        ref.current.setMarkdown(editorValue);
        latestValueRef.current = editorValue;
      }
    }
  }, [editorValue]);

  const canDropFile = fileDropTarget === "editor" && Boolean(imageUploadHandler || onDropFile);
  const handlePasteCapture = useCallback((event: ClipboardEvent<HTMLDivElement>) => {
    const clipboard = event.clipboardData;
    if (!clipboard || !ref.current) return;
    const types = new Set(Array.from(clipboard.types));
    if (types.has("Files") || types.has("text/html")) return;
    if (isSelectionInsideCodeLikeElement(containerRef.current)) return;

    const rawText = clipboard.getData("text/plain");
    if (!looksLikeMarkdownPaste(rawText)) return;

    event.preventDefault();
    ref.current.insertMarkdown(normalizeMarkdown(rawText));
  }, []);

  if (richEditorError) {
    return (
      <MarkdownEditorFallback
        autoSizeTextarea={autoSizeFallbackTextarea}
        bordered={bordered}
        className={className}
        containerRef={containerRef}
        contentClassName={contentClassName}
        fallbackTextareaRef={fallbackTextareaRef}
        onBlur={onBlur}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder={placeholder}
        readOnly={readOnly}
        setRichEditorError={setRichEditorError}
        value={value}
      />
    );
  }

  return (
    <MarkdownEditorRichView
      autocomplete={autocomplete}
      bordered={bordered}
      canDropFile={canDropFile}
      className={className}
      containerRef={containerRef}
      contentClassName={contentClassName}
      dragDepthRef={dragDepthRef}
      echoIgnoreMarkdownRef={echoIgnoreMarkdownRef}
      editorRef={ref}
      editorValue={editorValue}
      initialChildOnChangeRef={initialChildOnChangeRef}
      isDragOver={isDragOver}
      latestValueRef={latestValueRef}
      onBlur={onBlur}
      onChange={onChange}
      onDropFile={onDropFile}
      onPasteCapture={handlePasteCapture}
      onSubmit={onSubmit}
      placeholder={placeholder}
      plugins={plugins}
      readOnly={readOnly}
      setEditorRef={setEditorRef}
      setIsDragOver={setIsDragOver}
      setRichEditorError={setRichEditorError}
      uploadError={uploadError}
    />
  );
});
