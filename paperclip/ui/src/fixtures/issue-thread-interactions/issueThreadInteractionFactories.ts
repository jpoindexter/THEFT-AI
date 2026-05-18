import type { IssueChatComment } from "../../lib/issue-chat-messages";
import type {
  AskUserQuestionsInteraction,
  RequestConfirmationInteraction,
  SuggestTasksInteraction,
} from "../../lib/issue-thread-interactions";

export const issueThreadInteractionFixtureMeta = {
  companyId: "company-storybook",
  projectId: "project-board-ui",
  issueId: "issue-thread-interactions",
  currentUserId: "user-board",
} as const;

export function createComment(overrides: Partial<IssueChatComment>): IssueChatComment {
  const createdAt = overrides.createdAt ?? new Date("2026-04-20T14:00:00.000Z");
  return {
    id: "comment-default",
    companyId: issueThreadInteractionFixtureMeta.companyId,
    issueId: issueThreadInteractionFixtureMeta.issueId,
    authorType: overrides.authorAgentId ? "agent" : "user",
    authorAgentId: null,
    authorUserId: issueThreadInteractionFixtureMeta.currentUserId,
    body: "",
    presentation: null,
    metadata: null,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    ...overrides,
  };
}

export function createSuggestTasksInteraction(
  overrides: Partial<SuggestTasksInteraction>,
): SuggestTasksInteraction {
  return {
    id: "interaction-suggest-default",
    companyId: issueThreadInteractionFixtureMeta.companyId,
    issueId: issueThreadInteractionFixtureMeta.issueId,
    kind: "suggest_tasks",
    title: "Suggested issue tree for the first interaction pass",
    summary:
      "Draft task creation stays pending until a reviewer accepts it, so the thread can preview structure without mutating the task system.",
    status: "pending",
    continuationPolicy: "wake_assignee",
    createdByAgentId: "agent-codex",
    createdByUserId: null,
    resolvedByAgentId: null,
    resolvedByUserId: null,
    createdAt: new Date("2026-04-20T14:11:00.000Z"),
    updatedAt: new Date("2026-04-20T14:11:00.000Z"),
    resolvedAt: null,
    payload: {
      version: 1,
      defaultParentId: "PAP-1709",
      tasks: [
        {
          clientKey: "root-design",
          title: "Prototype issue-thread interaction cards",
          description:
            "Build render-only cards that sit in the issue feed and show suggested tasks before anything is persisted.",
          priority: "high",
          assigneeAgentId: "agent-codex",
          billingCode: "ui-research",
          labels: ["UI", "interaction"],
        },
        {
          clientKey: "child-stories",
          parentClientKey: "root-design",
          title: "Add Storybook coverage for acceptance and rejection states",
          description:
            "Cover pending, accepted, rejected, and collapsed-child previews in a fixture-backed story.",
          priority: "medium",
          assigneeAgentId: "agent-qa",
          labels: ["Storybook"],
        },
        {
          clientKey: "child-mixed-thread",
          parentClientKey: "root-design",
          title: "Prototype the mixed thread feed",
          description:
            "Show comments, activity, live runs, and interaction cards in one chronological feed.",
          priority: "medium",
          assigneeAgentId: "agent-codex",
          labels: ["Issue thread"],
        },
        {
          clientKey: "hidden-follow-up",
          parentClientKey: "child-mixed-thread",
          title: "Follow-up polish on spacing and answered summaries",
          description:
            "Collapse this under the visible task tree so the preview proves the hidden-descendant treatment.",
          priority: "low",
          hiddenInPreview: true,
        },
      ],
    },
    result: null,
    ...overrides,
  };
}

export function createAskUserQuestionsInteraction(
  overrides: Partial<AskUserQuestionsInteraction>,
): AskUserQuestionsInteraction {
  return {
    id: "interaction-questions-default",
    companyId: issueThreadInteractionFixtureMeta.companyId,
    issueId: issueThreadInteractionFixtureMeta.issueId,
    kind: "ask_user_questions",
    title: "Resolve open UX decisions before Phase 1",
    summary:
      "This form stays local until the operator submits it, so the assignee only wakes once after the whole answer set is ready.",
    status: "pending",
    continuationPolicy: "wake_assignee",
    createdByAgentId: "agent-codex",
    createdByUserId: null,
    resolvedByAgentId: null,
    resolvedByUserId: null,
    createdAt: new Date("2026-04-20T14:18:00.000Z"),
    updatedAt: new Date("2026-04-20T14:18:00.000Z"),
    resolvedAt: null,
    payload: {
      version: 1,
      title: "Before I wire the persistence layer, which preview behavior do you want?",
      submitLabel: "Send answers",
      questions: [
        {
          id: "collapse-depth",
          prompt: "How aggressive should the suggested-task preview collapse descendant work?",
          helpText:
            "We need enough context to review the tree without making the feed feel like a project plan.",
          selectionMode: "single",
          required: true,
          options: [
            {
              id: "visible-root",
              label: "Only collapse hidden descendants",
              description: "Keep top-level and visible child tasks expanded.",
            },
            {
              id: "collapse-all",
              label: "Collapse all descendants by default",
              description: "Show only root tasks until the operator expands the tree.",
            },
          ],
        },
        {
          id: "post-submit-summary",
          prompt: "What should the answered-state card emphasize after submission?",
          helpText: "Pick every summary treatment that would help future reviewers.",
          selectionMode: "multi",
          required: true,
          options: [
            {
              id: "answers-inline",
              label: "Inline answer pills",
              description: "Keep the exact operator choices visible under each question.",
            },
            {
              id: "summary-note",
              label: "Short markdown summary",
              description: "Add a compact narrative summary at the bottom of the card.",
            },
            {
              id: "resolver-meta",
              label: "Resolver metadata",
              description: "Show who answered and when without opening the raw thread.",
            },
          ],
        },
      ],
    },
    result: null,
    ...overrides,
  };
}

export function createRequestConfirmationInteraction(
  overrides: Partial<RequestConfirmationInteraction>,
): RequestConfirmationInteraction {
  return {
    id: "interaction-confirmation-default",
    companyId: issueThreadInteractionFixtureMeta.companyId,
    issueId: issueThreadInteractionFixtureMeta.issueId,
    kind: "request_confirmation",
    title: "Approve the proposed plan",
    summary:
      "The assignee is waiting on a direct board decision before continuing from the plan document.",
    status: "pending",
    continuationPolicy: "wake_assignee",
    createdByAgentId: "agent-codex",
    createdByUserId: null,
    resolvedByAgentId: null,
    resolvedByUserId: null,
    createdAt: new Date("2026-04-20T14:30:00.000Z"),
    updatedAt: new Date("2026-04-20T14:30:00.000Z"),
    resolvedAt: null,
    payload: {
      version: 1,
      prompt: "Approve the plan and let the assignee start implementation?",
      acceptLabel: "Approve plan",
      rejectLabel: "Request revisions",
      rejectRequiresReason: true,
      rejectReasonLabel: "Describe the plan changes needed before approval",
      detailsMarkdown:
        "This confirmation watches the `plan` document revision so stale approvals are blocked if the plan changes.",
      supersedeOnUserComment: true,
      target: {
        type: "issue_document",
        issueId: issueThreadInteractionFixtureMeta.issueId,
        key: "plan",
        revisionId: "11111111-1111-4111-8111-111111111111",
        revisionNumber: 3,
      },
    },
    result: null,
    ...overrides,
  };
}
