import { useEffect, useMemo, useState } from "react";
import type { RoutineRevision } from "@paperclipai/shared";
import { RotateCcw } from "lucide-react";
import { buildLineDiff, type DiffRow } from "../../lib/line-diff";
import { relativeTime } from "../../lib/utils";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  computeFieldChanges,
  type AgentLookup,
  type ProjectLookup,
} from "./routineRevisionDiffModel";

export function RoutineRevisionDiffModal({
  open,
  onOpenChange,
  revisions,
  initialOldRevisionId,
  initialNewRevisionId,
  agents,
  projects,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisions: RoutineRevision[];
  initialOldRevisionId: string;
  initialNewRevisionId: string;
  agents: AgentLookup;
  projects: ProjectLookup;
  onRestore: (revision: RoutineRevision) => void;
}) {
  const [leftId, setLeftId] = useState<string>(initialOldRevisionId);
  const [rightId, setRightId] = useState<string>(initialNewRevisionId);

  useEffect(() => {
    if (open) {
      setLeftId(initialOldRevisionId);
      setRightId(initialNewRevisionId);
    }
  }, [open, initialOldRevisionId, initialNewRevisionId]);

  const left = revisions.find((r) => r.id === leftId) ?? null;
  const right = revisions.find((r) => r.id === rightId) ?? null;
  const fieldChanges = useMemo(
    () => (left && right ? computeFieldChanges(left, right, agents, projects) : []),
    [left, right, agents, projects],
  );
  const descriptionDiff = useMemo<DiffRow[]>(
    () => (left && right
      ? buildLineDiff(left.snapshot.routine.description ?? "", right.snapshot.routine.description ?? "")
      : []),
    [left, right],
  );
  const newest = revisions[0] ?? null;
  const leftIsHistorical = !!left && !!newest && left.id !== newest.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-screen w-full max-w-screen-2xl flex-col overflow-hidden sm:max-w-screen-2xl">
        <DialogHeader>
          <DialogTitle>Compare routine revisions</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-3">
          <RevisionPicker
            label="Old"
            value={leftId}
            onChange={setLeftId}
            revisions={revisions}
            tone="red"
          />
          <RevisionPicker
            label="New"
            value={rightId}
            onChange={setRightId}
            revisions={revisions}
            tone="green"
          />
        </div>
        <div className="flex-1 space-y-4 overflow-auto">
          <section className="space-y-2">
            <p className="theft-label-compact text-muted-foreground">Field changes</p>
            {fieldChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No structural field changes.</p>
            ) : (
              <table className="w-full overflow-hidden rounded-md border border-border text-sm">
                <thead>
                  <tr className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 text-left">Field</th>
                    <th className="px-3 py-2 text-left">Old value</th>
                    <th className="px-3 py-2 text-left">New value</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldChanges.map((change) => (
                    <tr key={change.field} className="border-t border-border/60">
                      <td className="px-3 py-2 align-top text-xs font-medium">{change.field}</td>
                      <td className="px-3 py-2 align-top text-xs text-red-300">
                        {change.oldValue ?? "-"}
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-emerald-300">
                        {change.newValue ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section className="space-y-2">
            <p className="theft-label-compact text-muted-foreground">Description diff</p>
            <DiffTable rows={descriptionDiff} />
          </section>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {leftIsHistorical && left && (
            <Button onClick={() => onRestore(left)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Restore rev {left.revisionNumber} as new revision
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevisionPicker({
  label,
  value,
  onChange,
  revisions,
  tone,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  revisions: RoutineRevision[];
  tone: "red" | "green";
}) {
  const toneClass = tone === "red"
    ? "border-red-500/30 bg-red-500/10 text-red-300"
    : "border-green-500/30 bg-green-500/10 text-green-300";
  return (
    <div className="flex items-center gap-2">
      <span className={`theft-label-nano rounded-full border px-2 py-0.5 ${toneClass}`}>
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-52 border-border/60 text-xs">
          <SelectValue placeholder="Select revision" />
        </SelectTrigger>
        <SelectContent>
          {revisions.map((revision) => (
            <SelectItem key={revision.id} value={revision.id} className="text-xs">
              rev {revision.revisionNumber} - {relativeTime(revision.createdAt)}
              {revision.changeSummary ? ` - ${revision.changeSummary}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DiffTable({ rows }: { rows: DiffRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No description on either revision.</p>;
  }
  if (rows.every((row) => row.kind === "context")) {
    return <p className="text-sm text-muted-foreground">Descriptions are identical.</p>;
  }
  const lineClassesByKind: Record<DiffRow["kind"], string> = {
    context: "bg-transparent",
    removed: "bg-red-500/10 text-red-100",
    added: "bg-green-500/10 text-green-100",
  };
  const markerByKind: Record<DiffRow["kind"], string> = {
    context: " ",
    removed: "-",
    added: "+",
  };
  return (
    <div className="overflow-hidden rounded-md border border-border font-mono text-xs leading-6">
      <div className="flex min-w-full border-b border-border/60 bg-muted/30 px-3 py-2 text-micro uppercase tracking-wide text-muted-foreground">
        <span className="w-14 shrink-0">Old</span>
        <span className="w-14 shrink-0">New</span>
        <span className="w-6 shrink-0" />
        <span className="min-w-0 flex-1">Content</span>
      </div>
      {rows.map((row, index) => (
        <div
          key={`${row.kind}-${index}-${row.oldLineNumber ?? "x"}-${row.newLineNumber ?? "x"}`}
          className={`flex min-w-full border-b border-border/30 px-3 ${lineClassesByKind[row.kind]}`}
        >
          <span className="w-14 shrink-0 select-none border-r border-border/30 pr-3 text-right text-muted-foreground">
            {row.oldLineNumber ?? ""}
          </span>
          <span className="w-14 shrink-0 select-none border-r border-border/30 px-3 text-right text-muted-foreground">
            {row.newLineNumber ?? ""}
          </span>
          <span className="w-6 shrink-0 select-none text-center text-muted-foreground">
            {markerByKind[row.kind]}
          </span>
          <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-words px-3 py-0 text-inherit">
            {row.text.length > 0 ? row.text : " "}
          </pre>
        </div>
      ))}
    </div>
  );
}
