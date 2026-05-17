import type { IssueDocument } from "@paperclipai/shared";
import { issuesApi } from "@/api/issues";
import type { LibraryIssueBundle, LibraryItem } from "@/lib/library-items";

const LIBRARY_ISSUE_LIMIT = 500;

function pinnedStorageKey(companyId: string) {
  return `theft:library:pinned:${companyId}`;
}

export function loadPinnedIds(companyId: string) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(pinnedStorageKey(companyId)) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function savePinnedIds(companyId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(pinnedStorageKey(companyId), JSON.stringify(Array.from(ids)));
}

export function itemKindLabel(item: LibraryItem) {
  if (item.kind === "document") return "Document";
  if (item.kind === "attachment") return "Attachment";
  return "Work product";
}

export function formatBytes(bytes: number | undefined) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function loadLibraryBundles(companyId: string): Promise<LibraryIssueBundle[]> {
  const issues = await issuesApi.list(companyId, {
    includeRoutineExecutions: true,
    limit: LIBRARY_ISSUE_LIMIT,
  });

  return Promise.all(
    issues.map(async (issue) => {
      const [documents, attachments, workProducts] = await Promise.all([
        issuesApi.listDocuments(issue.id),
        issuesApi.listAttachments(issue.id),
        issuesApi.listWorkProducts(issue.id),
      ]);
      return { issue, documents, attachments, workProducts };
    }),
  );
}

export type EditableLibraryDocument = IssueDocument;
