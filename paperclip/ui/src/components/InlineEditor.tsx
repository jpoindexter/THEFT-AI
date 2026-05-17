import { useState, useRef, useEffect, useCallback } from "react";
import type { MarkdownEditorRef } from "./MarkdownEditor";
import { useAutosaveIndicator } from "../hooks/useAutosaveIndicator";
import { queueContainedBlurCommit } from "./inline-editor/blur-commit";
import {
  InlineEditorDisplay,
  InlineEditorMarkdownComposer,
  InlineEditorMarkdownPreview,
  InlineEditorTextarea,
} from "./inline-editor/InlineEditorViews";
import type { InlineEditorProps } from "./inline-editor/types";
import { useInlineEditorAutosave } from "./inline-editor/useInlineEditorAutosave";

export { queueContainedBlurCommit } from "./inline-editor/blur-commit";

export function InlineEditor({
  value,
  onSave,
  as: Tag = "span",
  className,
  placeholder = "Click to edit...",
  multiline = false,
  nullable = false,
  imageUploadHandler,
  onDropFile,
  mentions,
  foldable = false,
}: InlineEditorProps) {
  const [editing, setEditing] = useState(false);
  const [multilineEditing, setMultilineEditing] = useState(false);
  const [multilineFocused, setMultilineFocused] = useState(false);
  const [draft, setDraft] = useState(value);
  const lastPropValueRef = useRef(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const markdownRef = useRef<MarkdownEditorRef>(null);
  const autosaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurCommitFrameRef = useRef<(() => void) | null>(null);
  const pendingFocusFrameRef = useRef<number | null>(null);
  const justEnteredEditRef = useRef(false);
  const hasBeenFocusedRef = useRef(false);
  const {
    state: autosaveState,
    markDirty,
    reset,
    runSave,
  } = useAutosaveIndicator();

  useEffect(() => {
    const previousValue = lastPropValueRef.current;
    lastPropValueRef.current = value;
    setDraft((currentDraft) => {
      if (multiline && multilineFocused && currentDraft !== previousValue) {
        return currentDraft;
      }
      return value;
    });
  }, [value, multiline, multilineFocused]);

  useEffect(() => {
    return () => {
      if (autosaveDebounceRef.current) {
        clearTimeout(autosaveDebounceRef.current);
      }
      if (blurCommitFrameRef.current !== null) {
        blurCommitFrameRef.current();
        blurCommitFrameRef.current = null;
      }
      if (pendingFocusFrameRef.current !== null) {
        cancelAnimationFrame(pendingFocusFrameRef.current);
        pendingFocusFrameRef.current = null;
      }
    };
  }, []);

  const autoSize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      if (inputRef.current instanceof HTMLTextAreaElement) {
        autoSize(inputRef.current);
      }
    }
  }, [editing, autoSize]);

  useEffect(() => {
    if (!multilineEditing || !multiline) return;
    if (!justEnteredEditRef.current) return;
    justEnteredEditRef.current = false;
    if (pendingFocusFrameRef.current !== null) {
      cancelAnimationFrame(pendingFocusFrameRef.current);
    }
    pendingFocusFrameRef.current = requestAnimationFrame(() => {
      pendingFocusFrameRef.current = null;
      markdownRef.current?.focus();
    });
    return () => {
      if (pendingFocusFrameRef.current !== null) {
        cancelAnimationFrame(pendingFocusFrameRef.current);
        pendingFocusFrameRef.current = null;
      }
    };
  }, [multilineEditing, multiline]);

  // Once the editor has been focused at least once, it's blurred, and any
  // autosave has settled, swap back to the MarkdownBody preview so inline
  // issue refs render with status + quicklook.
  useEffect(() => {
    if (multilineFocused) {
      hasBeenFocusedRef.current = true;
      return;
    }
    if (!multiline || !multilineEditing) return;
    if (!hasBeenFocusedRef.current) return;
    if (autosaveState !== "idle") return;
    hasBeenFocusedRef.current = false;
    setMultilineEditing(false);
  }, [multiline, multilineEditing, multilineFocused, autosaveState]);


  const commit = useCallback(async (nextValue = draft) => {
    const valueToSave = nextValue.trim();
    const valueChanged = valueToSave !== value;
    const shouldSave = nullable
      ? valueChanged
      : Boolean(valueToSave && valueChanged);
    if (shouldSave) {
      await Promise.resolve(onSave(valueToSave));
    } else {
      setDraft(value);
    }
    if (!multiline) {
      setEditing(false);
    }
  }, [draft, multiline, nullable, onSave, value]);

  /** Multiline blur/submit: show autosave indicator when persisting */
  const finalizeMultilineBlurOrSubmit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      reset();
      void commit();
      return;
    }
    if (!trimmed && !nullable) {
      reset();
      void commit();
      return;
    }
    void runSave(() => commit());
  }, [commit, draft, nullable, reset, runSave, value]);

  const cancelPendingBlurCommit = useCallback(() => {
    if (blurCommitFrameRef.current === null) return;
    blurCommitFrameRef.current();
    blurCommitFrameRef.current = null;
  }, []);

  const scheduleBlurCommit = useCallback((container: HTMLDivElement) => {
    cancelPendingBlurCommit();
    blurCommitFrameRef.current = queueContainedBlurCommit(container, () => {
      blurCommitFrameRef.current = null;
      if (autosaveDebounceRef.current) {
        clearTimeout(autosaveDebounceRef.current);
      }
      setMultilineFocused(false);
      finalizeMultilineBlurOrSubmit();
    });
  }, [cancelPendingBlurCommit, finalizeMultilineBlurOrSubmit]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      void commit();
    }
    if (e.key === "Escape") {
      if (autosaveDebounceRef.current) {
        clearTimeout(autosaveDebounceRef.current);
      }
      reset();
      setDraft(value);
      if (multiline) {
        setMultilineFocused(false);
        setMultilineEditing(false);
        hasBeenFocusedRef.current = false;
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else {
        setEditing(false);
      }
    }
  }

  useInlineEditorAutosave({
    autosaveDebounceRef,
    autosaveState,
    commit,
    draft,
    markDirty,
    multiline,
    multilineFocused,
    nullable,
    reset,
    runSave,
    value,
  });

  if (multiline) {
    const previewValue = autosaveState === "saved" || autosaveState === "idle" ? draft : value;
    const hasValue = Boolean(previewValue.trim());
    const showEditor = multilineEditing || multilineFocused || !hasValue;

    if (!showEditor) {
      const enterEditMode = () => {
        if (multilineEditing) return;
        justEnteredEditRef.current = true;
        setMultilineEditing(true);
      };
      return (
        <InlineEditorMarkdownPreview
          previewValue={previewValue}
          className={className}
          placeholder={placeholder}
          foldable={foldable}
          onEnterEditMode={enterEditMode}
        />
      );
    }

    return (
      <InlineEditorMarkdownComposer
        markdownRef={markdownRef}
        draft={draft}
        placeholder={placeholder}
        className={className}
        multilineFocused={multilineFocused}
        autosaveState={autosaveState}
        imageUploadHandler={imageUploadHandler}
        onDropFile={onDropFile}
        mentions={mentions}
        onFocusCapture={(event) => {
          // Ignore focus events where the active element isn't actually inside
          // the wrapper (React 19 can emit a synthetic focus after a blur).
          const active = document.activeElement;
          if (!(active instanceof Node) || !event.currentTarget.contains(active)) return;
          cancelPendingBlurCommit();
          setMultilineFocused(true);
        }}
        onBlurCapture={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          if (pendingFocusFrameRef.current !== null) {
            cancelAnimationFrame(pendingFocusFrameRef.current);
            pendingFocusFrameRef.current = null;
          }
          scheduleBlurCommit(event.currentTarget);
        }}
        onKeyDown={handleKeyDown}
        onChange={setDraft}
        onSubmit={finalizeMultilineBlurOrSubmit}
      />
    );
  }

  if (editing) {

    return (
      <InlineEditorTextarea
        inputRef={inputRef}
        draft={draft}
        className={className}
        onAutoSize={autoSize}
        onBlur={() => void commit()}
        onChange={setDraft}
        onKeyDown={handleKeyDown}
      />
    );
  }

  // Use div instead of Tag when rendering markdown to avoid invalid nesting
  // (e.g. <p> cannot contain the <div>/<p> elements that markdown produces)
  const DisplayTag = value && multiline ? "div" : Tag;

  return (
    <InlineEditorDisplay
      as={DisplayTag}
      value={value}
      placeholder={placeholder}
      className={className}
      onEdit={() => setEditing(true)}
    />
  );
}
