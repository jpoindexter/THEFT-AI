import { useCallback, useEffect, useRef, useState } from "react";
import type { Issue } from "@paperclipai/shared";

import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useToastActions } from "@/context/ToastContext";

import { InboxMobileToolbar } from "./InboxMobileToolbar";

type UseIssueDetailInboxToolbarInput = {
  archivePending: boolean;
  issue: Issue | null | undefined;
  isFromInbox: boolean;
  isMobile: boolean;
  onArchive: (issueId: string) => void;
  onHide: () => void;
  onOpenProperties: () => void;
  sourceBreadcrumbHref?: string | null;
};

function decodeEntities(text: string) {
  const element = document.createElement("textarea");
  element.innerHTML = text;
  return element.value;
}

export function useIssueDetailInboxToolbar({
  archivePending,
  issue,
  isFromInbox,
  isMobile,
  onArchive,
  onHide,
  onOpenProperties,
  sourceBreadcrumbHref,
}: UseIssueDetailInboxToolbarInput) {
  const { setMobileToolbar } = useBreadcrumbs();
  const { pushToast } = useToastActions();
  const [copied, setCopied] = useState(false);

  const copyIssueToClipboard = useCallback(async () => {
    if (!issue) return;
    const title = decodeEntities(issue.title);
    const body = decodeEntities(issue.description ?? "");
    const markdown = `# ${issue.identifier}: ${title}\n\n${body}`.trimEnd();
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    pushToast({ title: "Copied to clipboard", tone: "success" });
    setTimeout(() => setCopied(false), 2000);
  }, [issue, pushToast]);

  const issueHidden = !!issue?.hiddenAt;
  const backHref = sourceBreadcrumbHref ?? "/inbox";
  const showInboxToolbar = isMobile && isFromInbox;
  const canArchiveFromInbox = isFromInbox && !!issue?.id && !issueHidden;
  const inboxToolbarCallbacksRef = useRef({
    onArchive: () => {
      if (!archivePending && issue?.id) onArchive(issue.id);
    },
    onCopy: () => {
      void copyIssueToClipboard();
    },
    onProperties: onOpenProperties,
    onHide,
  });
  inboxToolbarCallbacksRef.current = {
    onArchive: () => {
      if (!archivePending && issue?.id) onArchive(issue.id);
    },
    onCopy: () => {
      void copyIssueToClipboard();
    },
    onProperties: onOpenProperties,
    onHide,
  };

  useEffect(() => {
    if (!showInboxToolbar) {
      setMobileToolbar(null);
      return;
    }

    setMobileToolbar(
      <InboxMobileToolbar
        backHref={backHref}
        issueId={issue?.id}
        issueHidden={issueHidden}
        archivePending={archivePending}
        onArchive={() => inboxToolbarCallbacksRef.current.onArchive()}
        onCopy={() => inboxToolbarCallbacksRef.current.onCopy()}
        onProperties={() => inboxToolbarCallbacksRef.current.onProperties()}
        onHide={() => inboxToolbarCallbacksRef.current.onHide()}
      />,
    );

    return () => setMobileToolbar(null);
  }, [showInboxToolbar, backHref, issue?.id, issueHidden, archivePending, setMobileToolbar]);

  return {
    canArchiveFromInbox,
    copied,
    copyIssueToClipboard,
  };
}
