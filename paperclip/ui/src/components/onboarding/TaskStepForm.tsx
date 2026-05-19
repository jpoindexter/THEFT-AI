import { useMemo, useState, type RefObject } from "react";
import { ListTodo, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function buildStageInterviewDraft(input: {
  taskTitle: string;
  taskDescription: string;
  stageInterviewPrompt: string;
}) {
  const title = input.taskTitle.trim();
  const description = input.taskDescription.trim();
  const task = description || title || "the first useful company task";

  if (/first 5 paying customers/i.test(input.stageInterviewPrompt)) {
    return [
      "I would treat this as a validation sprint, not a full launch.",
      `Offer: ${task}`,
      "Channel: warm intros, LinkedIn/manual outbound, and founder communities where the target customer already asks for help.",
      "Timeline: contact 25-40 specific prospects this week, book 5 calls, and ask the best-fit people for a paid pilot or deposit.",
      "Proof: track replies, calls booked, objections, and whether anyone is willing to pay before we build more.",
    ].join("\n");
  }

  return [
    `Current task: ${task}`,
    "What I know: the company needs one concrete next step that can create evidence.",
    "Next move: have Operator turn this into a short plan, assign the right department, and publish the output into Library.",
    "Proof: I should be able to review a saved artifact, ask for revisions, or approve it.",
  ].join("\n");
}

export function TaskStepForm({
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  setTaskTemplateCustomized,
  stageInterviewPrompt,
  stageInterviewPlaceholder,
  stageInterviewAnswer,
  setStageInterviewAnswer,
  textareaRef,
}: {
  taskTitle: string;
  setTaskTitle: (value: string) => void;
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  setTaskTemplateCustomized: (value: boolean) => void;
  stageInterviewPrompt: string;
  stageInterviewPlaceholder: string;
  stageInterviewAnswer: string;
  setStageInterviewAnswer: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [helperOpen, setHelperOpen] = useState(false);
  const helperDraft = useMemo(
    () => buildStageInterviewDraft({ taskTitle, taskDescription, stageInterviewPrompt }),
    [stageInterviewPrompt, taskDescription, taskTitle],
  );

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-3">
        <div className="rounded-md bg-muted/50 p-2">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">Set the first company task</h3>
          <p className="text-xs text-muted-foreground">
            Give the Operator a concrete business task to route, review, and
            turn into Library output.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Task title
        </label>
        <Input
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
          placeholder="e.g. Research competitor pricing"
          value={taskTitle}
          onChange={(e) => {
            setTaskTemplateCustomized(true);
            setTaskTitle(e.target.value);
          }}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Description (optional)
        </label>
        <Textarea
          ref={textareaRef}
          className="min-h-32 max-h-80 w-full resize-none overflow-y-auto rounded-md border border-border bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
          placeholder="Add more detail about what the agent should do..."
          value={taskDescription}
          onChange={(e) => {
            setTaskTemplateCustomized(true);
            setTaskDescription(e.target.value);
          }}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <label className="block text-xs text-muted-foreground">
            Stage interview: {stageInterviewPrompt}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0"
            onClick={() => setHelperOpen((open) => !open)}
          >
            <Sparkles className="h-3 w-3" />
            Help
          </Button>
        </div>
        {helperOpen ? (
          <div className="mb-2 rounded-md border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
              <div className="min-w-0 space-y-2">
                <p>
                  This is just asking what evidence would prove the business
                  is worth moving forward. A useful answer names the channel,
                  offer, timeline, and proof you want Operator to chase.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setStageInterviewAnswer(helperDraft);
                    setTaskTemplateCustomized(true);
                  }}
                >
                  <Wand2 className="h-3 w-3" />
                  Use draft
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <Textarea
          className="min-h-20 w-full resize-none rounded-md border border-border bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
          placeholder={stageInterviewPlaceholder}
          value={stageInterviewAnswer}
          onChange={(e) => setStageInterviewAnswer(e.target.value)}
        />
      </div>
    </div>
  );
}
