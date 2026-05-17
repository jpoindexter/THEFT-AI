import { ListTodo } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PlanSection } from "./types";

export function PlanReviewForm({
  planSections,
  stageInterviewAnswer,
  setStageInterviewAnswer,
  agentName,
  adapterLabel,
}: {
  planSections: PlanSection[];
  stageInterviewAnswer: string;
  setStageInterviewAnswer: (value: string) => void;
  agentName: string;
  adapterLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-3">
        <div className="rounded-md bg-muted/50 p-2">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">Review the business plan</h3>
          <p className="text-xs text-muted-foreground">
            Accept this plan to activate Operator, departments, starter tasks,
            and Mission Control.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {planSections.map((section) => (
          <div key={section.title} className="theft-surface-plain p-3">
            <div className="flex items-center gap-2">
              <section.icon className="h-4 w-4 text-muted-foreground" />
              <p className="theft-label">{section.title}</p>
            </div>
            {"body" in section ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {section.body}
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm leading-6 text-muted-foreground">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-2 size-1 rounded-full bg-foreground/40" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <Input
        className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
        placeholder="I want to change the plan..."
        value={stageInterviewAnswer}
        onChange={(e) => setStageInterviewAnswer(e.target.value)}
      />

      <div className="theft-inset-surface grid grid-cols-2 gap-2 p-3 text-xs">
        <div className="min-w-0">
          <p className="text-muted-foreground">Operator</p>
          <p className="mt-1 truncate font-medium">{agentName}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Runtime</p>
          <p className="mt-1 truncate font-medium">{adapterLabel}</p>
        </div>
      </div>
    </div>
  );
}
