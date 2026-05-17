import type { FocusEvent, KeyboardEvent } from "react";

import type { DraftState } from "./IssueDocumentUtils";

type CommitDraft = (
  currentDraft: DraftState | null,
  options?: { clearAfterSave?: boolean; trackAutosave?: boolean; overrideConflict?: boolean },
) => Promise<boolean>;

export function useIssueDocumentDraftEvents({
  cancelDraft,
  clearAutosaveDebounce,
  commitDraft,
  draft,
}: {
  cancelDraft: () => void;
  clearAutosaveDebounce: () => void;
  commitDraft: CommitDraft;
  draft: DraftState | null;
}) {
  const handleDraftBlur = async (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    clearAutosaveDebounce();
    await commitDraft(draft, { clearAfterSave: true, trackAutosave: true });
  };

  const handleDraftKeyDown = async (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelDraft();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      clearAutosaveDebounce();
      await commitDraft(draft, { clearAfterSave: false, trackAutosave: true });
    }
  };

  return {
    handleDraftBlur,
    handleDraftKeyDown,
  };
}
