import { createSuggestTasksInteraction, issueThreadInteractionFixtureMeta } from "./issueThreadInteractionFactories";

export const pendingSuggestedTasksInteraction = createSuggestTasksInteraction({});

export const acceptedSuggestedTasksInteraction = createSuggestTasksInteraction({
  id: "interaction-suggest-accepted",
  status: "accepted",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:16:00.000Z"),
  updatedAt: new Date("2026-04-20T14:16:00.000Z"),
  result: {
    version: 1,
    createdTasks: [
      {
        clientKey: "root-design",
        issueId: "issue-created-1",
        identifier: "PAP-1713",
        title: "Prototype issue-thread interaction cards",
      },
      {
        clientKey: "child-stories",
        issueId: "issue-created-2",
        identifier: "PAP-1714",
        title: "Add Storybook coverage for acceptance and rejection states",
        parentIssueId: "issue-created-1",
        parentIdentifier: "PAP-1713",
      },
      {
        clientKey: "child-mixed-thread",
        issueId: "issue-created-3",
        identifier: "PAP-1715",
        title: "Prototype the mixed thread feed",
        parentIssueId: "issue-created-1",
        parentIdentifier: "PAP-1713",
      },
      {
        clientKey: "hidden-follow-up",
        issueId: "issue-created-4",
        identifier: "PAP-1716",
        title: "Follow-up polish on spacing and answered summaries",
        parentIssueId: "issue-created-3",
        parentIdentifier: "PAP-1715",
      },
    ],
  },
});

export const rejectedSuggestedTasksInteraction = createSuggestTasksInteraction({
  id: "interaction-suggest-rejected",
  status: "rejected",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:17:00.000Z"),
  updatedAt: new Date("2026-04-20T14:17:00.000Z"),
  result: {
    version: 1,
    rejectionReason:
      "Keep the first pass tighter. The hidden follow-on work is useful, but the acceptance story should stay focused on one visible root and one visible child.",
  },
});
