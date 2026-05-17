import type { Agent } from "@paperclipai/shared";
import { ChevronRight, GitBranch } from "lucide-react";
import { Link } from "@/lib/router";
import {
  countSuggestedTaskNodes,
  type SuggestTasksResultCreatedTask,
  type SuggestedTaskTreeNode,
} from "../../lib/issue-thread-interactions";
import { cn } from "../../lib/utils";
import { PriorityIcon } from "../PriorityIcon";
import { Checkbox } from "../ui/checkbox";
import { resolveActorLabel } from "./actor-labels";
import { InteractionField } from "./InteractionField";

const TASK_TREE_DEPTH_PADDING_CLASSES = [
  "pl-3",
  "pl-9",
  "pl-15",
  "pl-21",
  "pl-27",
  "pl-33",
  "pl-39",
  "pl-45",
  "pl-51",
  "pl-57",
  "pl-63",
  "pl-69",
  "pl-75",
] as const;

function taskTreeDepthPaddingClass(depth: number) {
  return TASK_TREE_DEPTH_PADDING_CLASSES[
    Math.min(depth, TASK_TREE_DEPTH_PADDING_CLASSES.length - 1)
  ];
}

export function createdTaskMap(
  createdTasks: readonly SuggestTasksResultCreatedTask[] | undefined,
) {
  return new Map(
    (createdTasks ?? []).map((entry) => [entry.clientKey, entry] as const),
  );
}

export function SuggestedTaskTreeNodeRow({
  node,
  createdByClientKey,
  agentMap,
  currentUserId,
  userLabelMap,
  depth = 0,
  selectedClientKeys,
  skippedClientKeys,
  showSelection,
  onToggleSelection,
}: {
  node: SuggestedTaskTreeNode;
  createdByClientKey: ReadonlyMap<string, SuggestTasksResultCreatedTask>;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
  depth?: number;
  selectedClientKeys?: ReadonlySet<string>;
  skippedClientKeys?: ReadonlySet<string>;
  showSelection?: boolean;
  onToggleSelection?: (node: SuggestedTaskTreeNode, checked: boolean) => void;
}) {
  const visibleChildren = node.children.filter((child) => !child.task.hiddenInPreview);
  const hiddenChildCount = node.children
    .filter((child) => child.task.hiddenInPreview)
    .reduce((sum, child) => sum + countSuggestedTaskNodes(child), 0);
  const createdTask = createdByClientKey.get(node.task.clientKey);
  const isSelected = selectedClientKeys?.has(node.task.clientKey) ?? false;
  const isSkipped = skippedClientKeys?.has(node.task.clientKey) ?? false;
  const assigneeLabel = resolveActorLabel({
    agentId: node.task.assigneeAgentId,
    userId: node.task.assigneeUserId,
    agentMap,
    currentUserId,
    userLabelMap,
  });
  const hasExplicitAssignee = Boolean(
    node.task.assigneeAgentId || node.task.assigneeUserId,
  );
  const labels = node.task.labels ?? [];
  const hasMetadata = hasExplicitAssignee
    || Boolean(node.task.billingCode)
    || Boolean(node.task.projectId)
    || labels.length > 0;

  return (
    <>
      <div
        className={cn(
          "relative border-b border-border/60 px-3 py-2.5 last:border-b-0",
          depth > 0 && "before:absolute before:left-3 before:top-0 before:h-full before:w-px before:bg-border/70",
          taskTreeDepthPaddingClass(depth),
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {showSelection ? (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggleSelection?.(node, checked === true)}
                  aria-label={`Include ${node.task.title}`}
                  className="mt-0.5"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  {node.task.priority ? (
                    <PriorityIcon
                      priority={node.task.priority}
                      className="mt-px"
                    />
                  ) : null}
                  <div className="min-w-0 truncate text-sm font-medium text-foreground">
                    {node.task.title}
                  </div>
                </div>
                {depth > 0 ? (
                  <div className="mt-0.5 text-nano font-medium uppercase tracking-widest text-muted-foreground">
                    Child task
                  </div>
                ) : null}
                {node.task.description ? (
                  <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
                    {node.task.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {createdTask?.issueId ? (
            <Link
              to={`/issues/${createdTask.identifier ?? createdTask.issueId}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-micro font-medium text-emerald-900 transition-colors hover:bg-emerald-500/15 dark:text-emerald-100"
            >
              {createdTask.identifier ?? createdTask.issueId.slice(0, 8)}
              <ChevronRight className="h-3 w-3" />
            </Link>
          ) : isSkipped ? (
            <span className="inline-flex shrink-0 items-center rounded-sm border border-amber-500/60 bg-amber-500/10 px-2.5 py-1 text-micro font-medium text-amber-900 dark:text-amber-100">
              Skipped
            </span>
          ) : null}
        </div>

        {hasMetadata ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hasExplicitAssignee ? (
              <InteractionField label="Assignee" value={assigneeLabel} />
            ) : null}
            {node.task.billingCode ? (
              <InteractionField label="Billing" value={node.task.billingCode} />
            ) : null}
            {node.task.projectId ? (
              <InteractionField label="Project" value={node.task.projectId} tone="subtle" />
            ) : null}
            {labels.map((label) => (
              <InteractionField key={label} label="Label" value={label} tone="subtle" />
            ))}
          </div>
        ) : null}

        {hiddenChildCount > 0 ? (
          <div className="mt-2 flex items-center gap-2 rounded-sm border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            <GitBranch className="h-3.5 w-3.5 shrink-0" />
            <span>
              {hiddenChildCount === 1
                ? "1 follow-on task hidden in preview"
                : `${hiddenChildCount} follow-on tasks hidden in preview`}
            </span>
          </div>
        ) : null}
      </div>

      {visibleChildren.length > 0 ? (
        <>
          {visibleChildren.map((child) => (
            <SuggestedTaskTreeNodeRow
              key={child.task.clientKey}
              node={child}
              createdByClientKey={createdByClientKey}
              agentMap={agentMap}
              currentUserId={currentUserId}
              userLabelMap={userLabelMap}
              depth={depth + 1}
              selectedClientKeys={selectedClientKeys}
              skippedClientKeys={skippedClientKeys}
              showSelection={showSelection}
              onToggleSelection={onToggleSelection}
            />
          ))}
        </>
      ) : null}
    </>
  );
}
