import type { Agent } from "@paperclipai/shared";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TheftChip, TheftSurface } from "@/components/theft";
import type { CompanyBottleneck, DepartmentCanvasRow } from "@/lib/theft-canvas";
import { cn } from "@/lib/utils";

export function OperatorDrawer({
  operator,
  departments,
  selectedDepartmentKey,
  setSelectedDepartmentKey,
  operatorDraft,
  setOperatorDraft,
  createTask,
  error,
  isPending,
  nextMove,
  onClose,
}: {
  operator: Agent | null;
  departments: DepartmentCanvasRow[];
  selectedDepartmentKey: string;
  setSelectedDepartmentKey: (key: string) => void;
  operatorDraft: string;
  setOperatorDraft: (value: string) => void;
  createTask: () => void;
  error: string | undefined;
  isPending: boolean;
  canSubmit: boolean;
  nextMove: CompanyBottleneck;
  onClose: () => void;
}) {
  const selectedDepartment =
    departments.find((department) => department.key === selectedDepartmentKey) ?? departments[0] ?? null;
  const proposedTasks = [
    {
      title: nextMove.issue?.title ?? nextMove.label,
      department: selectedDepartment?.title ?? "Operator",
      artifact: "Decision brief",
    },
    {
      title: "Collect evidence for the recommended path",
      department: selectedDepartment?.title ?? "Operator",
      artifact: "Evidence notes",
    },
  ];

  return (
    <TheftSurface tone="panel" padding="none" className="theft-operator-drawer flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 p-5 pb-3 md:p-6 md:pb-3">
          <p className="theft-label-compact">Operator</p>
          <h2 className="mt-1 truncate text-lg font-medium">{operator?.name ?? "Operator"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mission Control context</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Collapse Operator" className="m-4 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 md:px-6">
        <div className="space-y-4">
          <OperatorPromptPreview nextMove={nextMove} selectedDepartment={selectedDepartment} />
          <ProposedTasks tasks={proposedTasks} />
          <DepartmentPicker
            departments={departments}
            selectedDepartmentKey={selectedDepartmentKey}
            onSelect={setSelectedDepartmentKey}
          />
        </div>
      </div>

      <div className="border-t border-border p-5 md:p-6">
        <Textarea
          value={operatorDraft}
          onChange={(event) => setOperatorDraft(event.target.value)}
          placeholder="Ask Operator about this recommendation..."
          className="min-h-24 resize-none border-0 bg-secondary p-4"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button className="col-span-2" disabled={isPending} onClick={createTask}>
            <Send className="h-4 w-4" />
            {isPending ? "Routing..." : "Create recommended task"}
          </Button>
          <Button variant="outline" size="sm">Compare options</Button>
          <Button variant="outline" size="sm">Explain risk</Button>
        </div>
      </div>
    </TheftSurface>
  );
}

function OperatorPromptPreview({
  nextMove,
  selectedDepartment,
}: {
  nextMove: CompanyBottleneck;
  selectedDepartment: DepartmentCanvasRow | null;
}) {
  return (
    <>
      <div className="theft-surface-muted p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>You</span>
          <span>now</span>
        </div>
        <p className="mt-2 text-sm">What should we do next?</p>
      </div>

      <div className="theft-surface-plain p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Operator</span>
          <span>recommended</span>
        </div>
        <div className="theft-inset-surface theft-selected-surface mt-3 p-3">
          <p className="theft-label-compact">Next move</p>
          <p className="mt-2 text-base font-medium">{nextMove.label}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {nextMove.tone === "clear" ? "Ready to advance." : "High leverage based on current constraints."}
          </p>
        </div>

        <div className="mt-4">
          <p className="theft-label-compact">Rationale</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-5 text-muted-foreground">
            <li>Locks the current bottleneck into one concrete action.</li>
            <li>Uses latest execution state and Library evidence.</li>
            <li>Creates a reviewable artifact instead of more status.</li>
          </ul>
        </div>

        <div className="mt-4 grid gap-2">
          <EvidenceChip label="Constraint" value={nextMove.tone === "clear" ? "Clear" : "Needs action"} />
          <EvidenceChip label="Department" value={selectedDepartment?.title ?? "Operator"} />
          <EvidenceChip label="Artifact" value="Expected Library output" />
        </div>

        <div className="mt-4">
          <p className="theft-label-compact">Tradeoffs</p>
          <div className="mt-2 grid gap-2 text-xs text-muted-foreground">
            <div className="theft-inset-surface p-2">
              <span className="font-medium text-foreground">Upside:</span> moves the company toward a durable outcome.
            </div>
            <div className="theft-inset-surface p-2">
              <span className="font-medium text-foreground">Risk:</span> may need revision if context is incomplete.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProposedTasks({ tasks }: { tasks: Array<{ title: string; department: string; artifact: string }> }) {
  return (
    <div className="theft-surface-plain p-4">
      <p className="theft-label-compact">Proposed tasks</p>
      <div className="mt-3 space-y-2">
        {tasks.map((task) => (
          <div key={task.title} className="theft-surface-muted p-3">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {task.department} · {task.artifact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DepartmentPicker({
  departments,
  selectedDepartmentKey,
  onSelect,
}: {
  departments: DepartmentCanvasRow[];
  selectedDepartmentKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div>
      <p className="theft-label-compact">Route to department</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {departments.map((department) => (
          <Button
            key={department.key}
            type="button"
            variant={selectedDepartmentKey === department.key ? "secondary" : "outline"}
            onClick={() => onSelect(department.key)}
            className={cn(
              "h-auto flex-col items-start justify-start px-3 py-3 text-left text-xs font-normal",
              selectedDepartmentKey !== department.key && "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="block truncate">{department.title}</span>
            <span className="mt-0.5 block truncate">{department.agent?.name ?? "No lead"}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function EvidenceChip({ label, value }: { label: string; value: string }) {
  return (
    <TheftChip tone="muted" className="flex items-center justify-between gap-3 p-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </TheftChip>
  );
}
