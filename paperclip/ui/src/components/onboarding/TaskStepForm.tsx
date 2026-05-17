import type { RefObject } from "react";
import { ListTodo } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
        <label className="mb-1 block text-xs text-muted-foreground">
          Stage interview: {stageInterviewPrompt}
        </label>
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
