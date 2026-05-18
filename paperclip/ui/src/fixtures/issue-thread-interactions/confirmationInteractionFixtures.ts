import { createRequestConfirmationInteraction, issueThreadInteractionFixtureMeta } from "./issueThreadInteractionFactories";

export const pendingRequestConfirmationInteraction = createRequestConfirmationInteraction({});

export const genericPendingRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-generic-pending",
  title: "Confirm next step",
  summary: "The assignee needs a lightweight yes or no before continuing.",
  continuationPolicy: "none",
  payload: {
    version: 1,
    prompt: "Continue with the current approach?",
  },
});

export const optionalDeclineRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-optional-decline",
  continuationPolicy: "none",
  payload: {
    version: 1,
    prompt: "Use the smaller implementation path?",
    acceptLabel: "Confirm",
    rejectLabel: "Decline",
    rejectRequiresReason: false,
    declineReasonPlaceholder: "Optional: tell the agent what you'd change.",
  },
});

export const disabledDeclineReasonRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-no-decline-reason",
  continuationPolicy: "none",
  payload: {
    version: 1,
    prompt: "Close this low-risk follow-up as unnecessary?",
    acceptLabel: "Close it",
    rejectLabel: "Keep it",
    allowDeclineReason: false,
  },
});

export const acceptedRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-accepted",
  status: "accepted",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:34:00.000Z"),
  updatedAt: new Date("2026-04-20T14:34:00.000Z"),
  result: {
    version: 1,
    outcome: "accepted",
  },
});

export const planApprovalAcceptedRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-plan-accepted",
  status: "accepted",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:34:00.000Z"),
  updatedAt: new Date("2026-04-20T14:34:00.000Z"),
  payload: {
    version: 1,
    prompt: "Approve the plan and let the assignee start implementation?",
    acceptLabel: "Approve plan",
    rejectLabel: "Request changes",
    rejectRequiresReason: true,
    declineReasonPlaceholder: "Optional: what would you like revised?",
    target: {
      type: "issue_document",
      issueId: issueThreadInteractionFixtureMeta.issueId,
      key: "plan",
      revisionId: "11111111-1111-4111-8111-111111111111",
      revisionNumber: 4,
    },
  },
  result: {
    version: 1,
    outcome: "accepted",
  },
});

export const rejectedRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-rejected",
  status: "rejected",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:36:00.000Z"),
  updatedAt: new Date("2026-04-20T14:36:00.000Z"),
  result: {
    version: 1,
    outcome: "rejected",
    reason: "Split the migration and UI work into separate reviewable steps.",
  },
});

export const rejectedNoReasonRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-rejected-no-reason",
  status: "rejected",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:37:00.000Z"),
  updatedAt: new Date("2026-04-20T14:37:00.000Z"),
  result: {
    version: 1,
    outcome: "rejected",
    reason: null,
  },
});

export const commentExpiredRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-expired-comment",
  status: "expired",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:38:00.000Z"),
  updatedAt: new Date("2026-04-20T14:38:00.000Z"),
  result: {
    version: 1,
    outcome: "superseded_by_comment",
    commentId: "22222222-2222-4222-8222-222222222222",
  },
});

export const staleTargetRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-expired-target",
  status: "expired",
  resolvedByAgentId: "agent-codex",
  resolvedAt: new Date("2026-04-20T14:40:00.000Z"),
  updatedAt: new Date("2026-04-20T14:40:00.000Z"),
  payload: {
    version: 1,
    prompt: "Approve the plan and let the assignee start implementation?",
    acceptLabel: "Approve plan",
    rejectLabel: "Request revisions",
    rejectRequiresReason: true,
    target: {
      type: "issue_document",
      issueId: issueThreadInteractionFixtureMeta.issueId,
      key: "plan",
      revisionId: "44444444-4444-4444-8444-444444444444",
      revisionNumber: 4,
    },
  },
  result: {
    version: 1,
    outcome: "stale_target",
    staleTarget: {
      type: "issue_document",
      issueId: issueThreadInteractionFixtureMeta.issueId,
      key: "plan",
      revisionId: "11111111-1111-4111-8111-111111111111",
      revisionNumber: 3,
    },
  },
});

export const failedRequestConfirmationInteraction = createRequestConfirmationInteraction({
  id: "interaction-confirmation-failed",
  status: "failed",
  updatedAt: new Date("2026-04-20T14:42:00.000Z"),
});
