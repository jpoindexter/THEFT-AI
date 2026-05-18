import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { issueComments, issues } from "@paperclipai/db";
import { parseObject } from "../adapters/utils.js";
import {
  PAPERCLIP_HARNESS_CHECKOUT_KEY,
  extractWakeCommentIds,
} from "./heartbeat-wake-comments.js";

const MAX_INLINE_WAKE_COMMENTS = 8;
const MAX_INLINE_WAKE_COMMENT_BODY_CHARS = 4_000;
const MAX_INLINE_WAKE_COMMENT_BODY_TOTAL_CHARS = 12_000;

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function buildPaperclipWakePayload(input: {
  db: Db;
  companyId: string;
  contextSnapshot: Record<string, unknown>;
  continuationSummary?:
    | {
        key: string;
        title: string | null;
        body: string;
        updatedAt: Date;
      }
    | null;
  issueSummary?:
    | {
        id: string;
        identifier: string | null;
        title: string;
        status: string;
        priority: string;
        workMode: string;
      }
    | null;
}) {
  const executionStage = parseObject(input.contextSnapshot.executionStage);
  const commentIds = extractWakeCommentIds(input.contextSnapshot);
  const issueId = readNonEmptyString(input.contextSnapshot.issueId);
  const continuationSummary = input.continuationSummary ?? null;
  const issueSummary =
    input.issueSummary ??
    (issueId
      ? await input.db
          .select({
            id: issues.id,
            identifier: issues.identifier,
            title: issues.title,
            status: issues.status,
            priority: issues.priority,
            workMode: issues.workMode,
          })
          .from(issues)
          .where(and(eq(issues.id, issueId), eq(issues.companyId, input.companyId)))
          .then((rows) => rows[0] ?? null)
      : null);
  if (commentIds.length === 0 && Object.keys(executionStage).length === 0 && !issueSummary) return null;

  const commentRows =
    commentIds.length === 0
      ? []
      : await input.db
          .select({
            id: issueComments.id,
            issueId: issueComments.issueId,
            body: issueComments.body,
            authorType: issueComments.authorType,
            authorAgentId: issueComments.authorAgentId,
            authorUserId: issueComments.authorUserId,
            presentation: issueComments.presentation,
            metadata: issueComments.metadata,
            createdAt: issueComments.createdAt,
          })
          .from(issueComments)
          .where(
            and(
              eq(issueComments.companyId, input.companyId),
              inArray(issueComments.id, commentIds),
            ),
          );

  const commentsById = new Map(commentRows.map((comment) => [comment.id, comment]));
  const comments: Array<Record<string, unknown>> = [];
  let remainingBodyChars = MAX_INLINE_WAKE_COMMENT_BODY_TOTAL_CHARS;
  let truncated = false;
  let missingCommentCount = 0;

  for (const commentId of commentIds) {
    const row = commentsById.get(commentId);
    if (!row) {
      truncated = true;
      missingCommentCount += 1;
      continue;
    }
    if (comments.length >= MAX_INLINE_WAKE_COMMENTS) {
      truncated = true;
      break;
    }

    const fullBody = row.body;
    const allowedBodyChars = Math.min(MAX_INLINE_WAKE_COMMENT_BODY_CHARS, remainingBodyChars);
    if (allowedBodyChars <= 0) {
      truncated = true;
      break;
    }

    const body = fullBody.length > allowedBodyChars ? fullBody.slice(0, allowedBodyChars) : fullBody;
    const bodyTruncated = body.length < fullBody.length;
    if (bodyTruncated) truncated = true;
    remainingBodyChars -= body.length;

    comments.push({
      id: row.id,
      issueId: row.issueId,
      authorType: row.authorType ?? (row.authorAgentId ? "agent" : row.authorUserId ? "user" : "system"),
      body,
      bodyTruncated,
      presentation: row.presentation ?? null,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt.toISOString(),
      author: row.authorAgentId
        ? { type: "agent", id: row.authorAgentId }
        : row.authorUserId
          ? { type: "user", id: row.authorUserId }
          : { type: "system", id: null },
    });
  }

  return {
    reason: readNonEmptyString(input.contextSnapshot.wakeReason),
    issue: issueSummary
      ? {
          id: issueSummary.id,
          identifier: issueSummary.identifier,
          title: issueSummary.title,
          status: issueSummary.status,
          priority: issueSummary.priority,
          workMode: issueSummary.workMode,
        }
      : null,
    childIssueSummaries: Array.isArray(input.contextSnapshot.childIssueSummaries)
      ? input.contextSnapshot.childIssueSummaries
      : [],
    childIssueSummaryTruncated: input.contextSnapshot.childIssueSummaryTruncated === true,
    livenessContinuation: readNonEmptyString(input.contextSnapshot.livenessContinuationState) ||
      readNonEmptyString(input.contextSnapshot.livenessContinuationInstruction) ||
      readNonEmptyString(input.contextSnapshot.livenessContinuationSourceRunId) ||
      typeof input.contextSnapshot.livenessContinuationAttempt === "number"
      ? {
          attempt: input.contextSnapshot.livenessContinuationAttempt,
          maxAttempts: input.contextSnapshot.livenessContinuationMaxAttempts,
          sourceRunId: readNonEmptyString(input.contextSnapshot.livenessContinuationSourceRunId),
          state: readNonEmptyString(input.contextSnapshot.livenessContinuationState),
          reason: readNonEmptyString(input.contextSnapshot.livenessContinuationReason),
          instruction: readNonEmptyString(input.contextSnapshot.livenessContinuationInstruction),
        }
      : null,
    interactionKind: readNonEmptyString(input.contextSnapshot.interactionKind),
    interactionStatus: readNonEmptyString(input.contextSnapshot.interactionStatus),
    checkedOutByHarness: input.contextSnapshot[PAPERCLIP_HARNESS_CHECKOUT_KEY] === true,
    dependencyBlockedInteraction: input.contextSnapshot.dependencyBlockedInteraction === true,
    treeHoldInteraction: input.contextSnapshot.treeHoldInteraction === true,
    activeTreeHold: parseObject(input.contextSnapshot.activeTreeHold),
    unresolvedBlockerIssueIds: Array.isArray(input.contextSnapshot.unresolvedBlockerIssueIds)
      ? input.contextSnapshot.unresolvedBlockerIssueIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [],
    unresolvedBlockerSummaries: Array.isArray(input.contextSnapshot.unresolvedBlockerSummaries)
      ? input.contextSnapshot.unresolvedBlockerSummaries
      : [],
    executionStage: Object.keys(executionStage).length > 0 ? executionStage : null,
    continuationSummary: continuationSummary
      ? {
          key: continuationSummary.key,
          title: continuationSummary.title,
          body:
            continuationSummary.body.length > 4_000
              ? continuationSummary.body.slice(0, 4_000)
              : continuationSummary.body,
          bodyTruncated: continuationSummary.body.length > 4_000,
          updatedAt: continuationSummary.updatedAt.toISOString(),
        }
      : null,
    commentIds,
    latestCommentId: commentIds[commentIds.length - 1] ?? null,
    comments,
    commentWindow: {
      requestedCount: commentIds.length,
      includedCount: comments.length,
      missingCount: missingCommentCount,
    },
    truncated,
    fallbackFetchNeeded: truncated || missingCommentCount > 0,
  };
}
