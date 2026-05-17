import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  DRAFT_DEBOUNCE_MS,
  clearDraft,
  loadDraft,
  saveDraft,
} from "./ComposerHelpers";

export function useIssueChatComposerDraft({
  body,
  draftKey,
  setBody,
}: {
  body: string;
  draftKey?: string;
  setBody: Dispatch<SetStateAction<string>>;
}) {
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!draftKey) return;
    setBody(loadDraft(draftKey));
  }, [draftKey, setBody]);

  useEffect(() => {
    if (!draftKey) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(draftKey, body);
    }, DRAFT_DEBOUNCE_MS);
  }, [body, draftKey]);

  useEffect(() => {
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, []);

  const clearStoredDraft = useCallback(() => {
    if (draftKey) clearDraft(draftKey);
  }, [draftKey]);

  return { clearStoredDraft };
}
