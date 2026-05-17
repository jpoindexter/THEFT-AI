import type { FeedbackVote } from "@paperclipai/shared";

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "\u2026";
}

export function isMarkdownFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    file.type === "text/markdown"
  );
}

export function fileBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

export function slugifyDocumentKey(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "document";
}

export function titleizeFilename(input: string) {
  return input
    .split(/[-_ ]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mergeOptimisticFeedbackVote(
  previousVotes: FeedbackVote[] | undefined,
  nextVote: {
    issueId: string;
    targetType: "issue_comment" | "issue_document_revision";
    targetId: string;
    vote: "up" | "down";
    reason?: string;
  },
  currentUserId: string | null,
): FeedbackVote[] {
  const now = new Date();
  const existingVotes = previousVotes ?? [];
  const existingIndex = existingVotes.findIndex(
    (feedbackVote) =>
      feedbackVote.targetType === nextVote.targetType &&
      feedbackVote.targetId === nextVote.targetId &&
      (!currentUserId || feedbackVote.authorUserId === currentUserId),
  );

  if (existingIndex >= 0) {
    const existingVote = existingVotes[existingIndex]!;
    const updatedVote: FeedbackVote = {
      ...existingVote,
      vote: nextVote.vote,
      reason:
        nextVote.reason !== undefined
          ? nextVote.reason.trim() || null
          : existingVote.reason,
      updatedAt: now,
    };
    const nextVotes = [...existingVotes];
    nextVotes[existingIndex] = updatedVote;
    return nextVotes;
  }

  return [
    ...existingVotes,
    {
      id: `optimistic:${nextVote.targetType}:${nextVote.targetId}`,
      companyId: "",
      issueId: nextVote.issueId,
      targetType: nextVote.targetType,
      targetId: nextVote.targetId,
      authorUserId: currentUserId ?? "current-user",
      vote: nextVote.vote,
      reason: nextVote.reason?.trim() || null,
      sharedWithLabs: false,
      sharedAt: null,
      consentVersion: null,
      redactionSummary: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
