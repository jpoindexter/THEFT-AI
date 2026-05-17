import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { AutosaveState } from "@/hooks/useAutosaveIndicator";

const AUTOSAVE_DEBOUNCE_MS = 900;

interface UseInlineEditorAutosaveOptions {
  autosaveDebounceRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  autosaveState: AutosaveState;
  commit: (nextValue?: string) => Promise<void>;
  draft: string;
  markDirty: () => void;
  multiline: boolean;
  multilineFocused: boolean;
  nullable: boolean;
  reset: () => void;
  runSave: (save: () => Promise<void>) => Promise<void>;
  value: string;
}

export function useInlineEditorAutosave({
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
}: UseInlineEditorAutosaveOptions) {
  useEffect(() => {
    if (!multiline) return;
    if (!multilineFocused) return;
    const trimmed = draft.trim();
    // Nullable: empty draft can still be a real edit; only skip debounce when unchanged or empty is invalid.
    if (trimmed === value || (!trimmed && !nullable)) {
      if (autosaveState !== "saved") {
        reset();
      }
      return;
    }
    markDirty();
    if (autosaveDebounceRef.current) {
      clearTimeout(autosaveDebounceRef.current);
    }
    autosaveDebounceRef.current = setTimeout(() => {
      void runSave(() => commit(trimmed));
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveDebounceRef.current) {
        clearTimeout(autosaveDebounceRef.current);
      }
    };
  }, [autosaveDebounceRef, autosaveState, commit, draft, markDirty, multiline, multilineFocused, nullable, reset, runSave, value]);
}
