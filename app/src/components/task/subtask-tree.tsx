import Link from "next/link";
import { GitBranch, Plus, Circle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type Subtask = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  agent: string | null;
  children?: Subtask[];
};

const STATUS_ICON = {
  todo: Circle,
  in_progress: Clock,
  blocked: AlertTriangle,
  done: CheckCircle2,
} as const;

const STATUS_TONE = {
  todo: "text-ink-soft",
  in_progress: "text-mustard-ink",
  blocked: "text-brick-ink",
  done: "text-sage-ink",
} as const;

export default function SubtaskTree({
  org,
  parentId,
  subtasks,
}: {
  org: string;
  parentId: string;
  subtasks: Subtask[];
}) {
  return (
    <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-2xs uppercase tracking-wider text-ink-soft inline-flex items-center gap-1">
          <GitBranch className="size-3" /> Subtasks ({countTotal(subtasks)})
        </div>
        <Link
          href={`/${org}/tasks/new?parent=${parentId}`}
          className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
        >
          <Plus className="size-3" /> Add subtask
        </Link>
      </div>
      {subtasks.length === 0 ? (
        <div className="text-xs text-ink-muted">
          No subtasks. Break the task down if it has more than one named step.
        </div>
      ) : (
        <ul className="space-y-1">
          {subtasks.map((s) => (
            <SubtaskNode key={s.id} org={org} node={s} depth={0} />
          ))}
        </ul>
      )}
    </section>
  );
}

function countTotal(items: Subtask[]): number {
  return items.reduce(
    (sum, i) => sum + 1 + (i.children ? countTotal(i.children) : 0),
    0,
  );
}

function SubtaskNode({
  org,
  node,
  depth,
}: {
  org: string;
  node: Subtask;
  depth: number;
}) {
  const Icon = STATUS_ICON[node.status];
  return (
    <li className="text-sm">
      <div
        className="flex items-center gap-2 py-1 hover:bg-cream/40 rounded-md px-1"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <Icon className={`size-3.5 shrink-0 ${STATUS_TONE[node.status]}`} />
        <Link
          href={`/${org}/tasks/${node.id}`}
          className="flex-1 truncate hover:underline"
        >
          {node.title}
        </Link>
        {node.agent && (
          <span className="text-2xs text-ink-soft shrink-0">{node.agent}</span>
        )}
      </div>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <SubtaskNode key={c.id} org={org} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
