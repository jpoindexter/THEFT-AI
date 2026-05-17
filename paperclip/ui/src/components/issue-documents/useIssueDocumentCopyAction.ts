import { useCallback, useEffect, useRef, useState } from "react";

export function useIssueDocumentCopyAction(onError: (message: string) => void) {
  const [copiedDocumentKey, setCopiedDocumentKey] = useState<string | null>(null);
  const copiedDocumentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyDocumentBody = useCallback(async (key: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedDocumentKey(key);
      if (copiedDocumentTimerRef.current) clearTimeout(copiedDocumentTimerRef.current);
      copiedDocumentTimerRef.current = setTimeout(() => setCopiedDocumentKey((current) => current === key ? null : current), 1400);
    } catch {
      onError("Could not copy document");
    }
  }, [onError]);

  useEffect(() => () => {
    if (copiedDocumentTimerRef.current) clearTimeout(copiedDocumentTimerRef.current);
  }, []);

  return {
    copiedDocumentKey,
    copyDocumentBody,
  };
}
