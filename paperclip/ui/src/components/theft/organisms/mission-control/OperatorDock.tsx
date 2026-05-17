import { Bot, CheckCircle2, Route, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OperatorDock({
  open,
  onToggle,
  operatorDraft,
  setOperatorDraft,
  createTask,
  isPending,
  canSubmit,
}: {
  open: boolean;
  onToggle: () => void;
  operatorDraft: string;
  setOperatorDraft: (value: string) => void;
  createTask: () => void;
  isPending: boolean;
  canSubmit: boolean;
}) {
  if (open) return null;

  return (
    <div className="theft-operator-dock fixed bottom-4 left-4 right-4 z-30 flex items-center gap-2 p-2 backdrop-blur md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2">
      <Button
        type="button"
        onClick={onToggle}
        title="Open Operator"
        variant="secondary"
        className="h-11 shrink-0 justify-start gap-2 px-3 text-left text-sm md:h-12 md:px-4"
      >
        <Bot className="h-5 w-5" />
        <span>
          <span className="theft-label-compact block">Operator dock</span>
          <span className="block text-xs">Collapsed</span>
        </span>
      </Button>
      <Input
        value={operatorDraft}
        onChange={(event) => setOperatorDraft(event.target.value)}
        placeholder="Ask Operator..."
        className="hidden h-12 min-w-0 flex-1 bg-secondary px-5 text-base shadow-none sm:block"
      />
      <Button variant="ghost" onClick={onToggle} className="hidden h-12 gap-2 px-3 sm:inline-flex" aria-label="Explain next move">
        <Sparkles className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">Explain</span>
      </Button>
      <Button variant="ghost" onClick={onToggle} className="hidden h-12 gap-2 px-3 sm:inline-flex" aria-label="Route work">
        <Route className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">Route</span>
      </Button>
      <Button variant="ghost" onClick={onToggle} className="hidden h-12 gap-2 px-3 sm:inline-flex" aria-label="Review work">
        <CheckCircle2 className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">Review</span>
      </Button>
      <Button variant="outline" onClick={onToggle} className="ml-auto h-11 gap-2 px-3 sm:hidden" aria-label="Open Operator">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs">Open</span>
      </Button>
      <Button disabled={!canSubmit || isPending} onClick={createTask} className="hidden h-12 gap-2 px-4 sm:inline-flex">
        <Send className="h-4 w-4" />
        <span className="hidden text-xs lg:inline">{isPending ? "Routing" : "Task"}</span>
      </Button>
    </div>
  );
}
