import { useEffect, useState } from "react";
import { Loader2, MessageSquareQuote } from "lucide-react";
import {
  getQuestionAnswerLabels,
  type AskUserQuestionsInteraction,
} from "../../lib/issue-thread-interactions";
import { MarkdownBody } from "../MarkdownBody";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { InteractionField } from "./InteractionField";
import { QuestionOptionButton } from "./QuestionOptionButton";
import type {
  CancelInteractionHandler,
  SubmitInteractionAnswersHandler,
} from "./types";

export function AskUserQuestionsInteractionCard({
  interaction,
  onSubmitInteractionAnswers,
  onCancelInteraction,
}: {
  interaction: AskUserQuestionsInteraction;
  onSubmitInteractionAnswers?: SubmitInteractionAnswersHandler;
  onCancelInteraction?: CancelInteractionHandler;
}) {
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      (interaction.result?.answers ?? []).map((answer) => [
        answer.questionId,
        [...answer.optionIds],
      ]),
    ),
  );
  const [working, setWorking] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setDraftAnswers(
      Object.fromEntries(
        (interaction.result?.answers ?? []).map((answer) => [
          answer.questionId,
          [...answer.optionIds],
        ]),
      ),
    );
  }, [interaction.result?.answers]);

  const questions = interaction.payload.questions;
  const requiredQuestions = questions.filter((question) => question.required);
  const canSubmit = requiredQuestions.every(
    (question) => (draftAnswers[question.id] ?? []).length > 0,
  );

  function toggleOption(questionId: string, optionId: string, selectionMode: "single" | "multi") {
    setDraftAnswers((current) => {
      const existing = current[questionId] ?? [];
      if (selectionMode === "single") {
        return { ...current, [questionId]: [optionId] };
      }
      const next = existing.includes(optionId)
        ? existing.filter((value) => value !== optionId)
        : [...existing, optionId];
      return { ...current, [questionId]: next };
    });
  }

  async function handleSubmit() {
    if (!onSubmitInteractionAnswers || !canSubmit) return;
    setWorking(true);
    try {
      await onSubmitInteractionAnswers(
        interaction,
        questions.map((question) => ({
          questionId: question.id,
          optionIds: draftAnswers[question.id] ?? [],
        })),
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleCancel() {
    if (!onCancelInteraction) return;
    setCancelling(true);
    try {
      await onCancelInteraction(interaction);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 font-medium uppercase tracking-widest text-foreground/70">
          <MessageSquareQuote className="h-3 w-3" />
          Ask user questions
        </span>
        <span>
          {questions.length === 1
            ? "1 question"
            : `${questions.length} questions`}
        </span>
      </div>

      {interaction.status === "pending" ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="theft-elevation-soft rounded-2xl border border-border/70 bg-background/82 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
                    Question {index + 1}
                  </div>
                  <div
                    id={`${interaction.id}-${question.id}-prompt`}
                    className="mt-1 text-sm font-semibold text-foreground"
                  >
                    {question.prompt}
                  </div>
                  {question.helpText ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {question.helpText}
                    </p>
                  ) : null}
                </div>
                <InteractionField
                  label={question.selectionMode === "single" ? "Pick" : "Pick many"}
                  value={question.required ? "Required" : "Optional"}
                  tone="subtle"
                />
              </div>

              <div
                className="mt-3 grid gap-3"
                role={question.selectionMode === "single" ? "radiogroup" : "group"}
                aria-labelledby={`${interaction.id}-${question.id}-prompt`}
              >
                {question.options.map((option) => (
                  <QuestionOptionButton
                    key={option.id}
                    id={`${interaction.id}-${question.id}-${option.id}`}
                    label={option.label}
                    description={option.description}
                    selected={(draftAnswers[question.id] ?? []).includes(option.id)}
                    selectionMode={question.selectionMode}
                    onClick={() =>
                      toggleOption(question.id, option.id, question.selectionMode)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 p-4">
            <div className="text-sm text-muted-foreground">
              Submit once after you finish the full form.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onCancelInteraction ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={working || cancelling}
                  onClick={() => void handleCancel()}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel question"
                  )}
                </Button>
              ) : null}
              <Button
                size="sm"
                disabled={!onSubmitInteractionAnswers || !canSubmit || working || cancelling}
                onClick={() => void handleSubmit()}
              >
                {working ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  interaction.payload.submitLabel ?? "Submit answers"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : interaction.status === "cancelled" ? (
        <div className="rounded-2xl border border-rose-300/60 bg-rose-50/85 p-4 text-sm leading-6 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          <div className="font-semibold">Question cancelled</div>
          {interaction.result?.cancellationReason ? (
            <p className="mt-1">{interaction.result.cancellationReason}</p>
          ) : (
            <p className="mt-1">No answer was recorded.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => {
            const labels = getQuestionAnswerLabels({
              question,
              answers: interaction.result?.answers ?? [],
            });
            return (
              <div
                key={question.id}
                className="rounded-2xl border border-border/70 bg-background/82 p-4"
              >
                <div className="text-sm font-semibold text-foreground">
                  {question.prompt}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {labels.length > 0 ? (
                    labels.map((label) => (
                      <InteractionField key={label} label="Answer" value={label} />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No answer recorded.</span>
                  )}
                </div>
              </div>
            );
          })}

          {interaction.result?.summaryMarkdown ? (
            <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/85 p-4">
              <div className="mb-2 text-micro font-semibold uppercase tracking-widest text-emerald-700">
                Submitted summary
              </div>
              <MarkdownBody>{interaction.result.summaryMarkdown}</MarkdownBody>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
