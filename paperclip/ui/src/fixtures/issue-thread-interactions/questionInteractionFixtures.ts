import { createAskUserQuestionsInteraction, issueThreadInteractionFixtureMeta } from "./issueThreadInteractionFactories";

export const pendingAskUserQuestionsInteraction = createAskUserQuestionsInteraction({});

export const answeredAskUserQuestionsInteraction = createAskUserQuestionsInteraction({
  id: "interaction-questions-answered",
  status: "answered",
  resolvedByUserId: issueThreadInteractionFixtureMeta.currentUserId,
  resolvedAt: new Date("2026-04-20T14:24:00.000Z"),
  updatedAt: new Date("2026-04-20T14:24:00.000Z"),
  result: {
    version: 1,
    answers: [
      {
        questionId: "collapse-depth",
        optionIds: ["visible-root"],
      },
      {
        questionId: "post-submit-summary",
        optionIds: ["answers-inline", "summary-note", "resolver-meta"],
      },
    ],
    summaryMarkdown: [
      "- Keep visible child tasks expanded when they are part of the main review path.",
      "- Preserve inline answer chips and resolver metadata in the answered state.",
      "- Add a short summary note so future reviewers understand the operator's intent without replaying the form.",
    ].join("\n"),
  },
});
