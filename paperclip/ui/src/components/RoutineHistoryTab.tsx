import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History as HistoryIcon, RotateCcw, Search } from "lucide-react";
import type {
  Routine,
  RoutineRevision,
  RoutineRevisionSnapshotTriggerV1,
  RoutineVariable,
} from "@paperclipai/shared";
import {
  routinesApi,
  type RestoreRoutineRevisionResponse,
} from "../api/routines";
import { ApiError } from "../api/client";
import { queryKeys } from "../lib/queryKeys";
import { relativeTime } from "../lib/utils";
import { useToastActions } from "../context/ToastContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import { MarkdownBody } from "./MarkdownBody";
import { RoutineRevisionDiffModal } from "./routine-history-tab/RoutineRevisionDiffModal";
import { RoutineRevisionList } from "./routine-history-tab/RoutineRevisionList";

type AgentLookup = Map<string, { id: string; name: string }>;
type ProjectLookup = Map<string, { id: string; name: string }>;

type DirtyFieldDescriptor = {
  key: string;
  label: string;
};

type Props = {
  routine: Routine;
  isEditDirty: boolean;
  dirtyFields: DirtyFieldDescriptor[];
  onDiscardEdits: () => void;
  onSaveEdits: () => void;
  agents: AgentLookup;
  projects: ProjectLookup;
  onRestoreSecretMaterials: (response: RestoreRoutineRevisionResponse) => void;
  onRestored?: (response: RestoreRoutineRevisionResponse) => void;
};

export function RoutineHistoryTab({
  routine,
  isEditDirty,
  dirtyFields,
  onDiscardEdits,
  onSaveEdits,
  agents,
  projects,
  onRestoreSecretMaterials,
  onRestored,
}: Props) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [highlightedRevisionId, setHighlightedRevisionId] = useState<string | null>(null);
  const [showOlder, setShowOlder] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState("");

  const revisionsQuery = useQuery({
    queryKey: queryKeys.routines.revisions(routine.id),
    queryFn: () => routinesApi.listRevisions(routine.id),
  });

  const revisions = useMemo(() => revisionsQuery.data ?? [], [revisionsQuery.data]);
  const sortedRevisions = useMemo(
    () => [...revisions].sort((a, b) => b.revisionNumber - a.revisionNumber),
    [revisions],
  );
  const currentRevision = useMemo(
    () => sortedRevisions.find((r) => r.id === routine.latestRevisionId) ?? sortedRevisions[0] ?? null,
    [sortedRevisions, routine.latestRevisionId],
  );

  useEffect(() => {
    if (selectedRevisionId === null && currentRevision) {
      setSelectedRevisionId(currentRevision.id);
    }
  }, [currentRevision, selectedRevisionId]);

  const selectedRevision = useMemo(
    () => sortedRevisions.find((r) => r.id === selectedRevisionId) ?? null,
    [sortedRevisions, selectedRevisionId],
  );
  const isHistoricalSelected = !!selectedRevision && selectedRevision.id !== routine.latestRevisionId;
  const visibleRevisions = useMemo(() => {
    if (showOlder || sortedRevisions.length <= 8) return sortedRevisions;
    return sortedRevisions.slice(0, 8);
  }, [sortedRevisions, showOlder]);

  const restoreMutation = useMutation({
    mutationFn: (input: { revisionId: string; changeSummary: string }) =>
      routinesApi.restoreRevision(routine.id, input.revisionId, {
        changeSummary: input.changeSummary.trim() || null,
      }),
    onSuccess: async (data) => {
      const restoredFromNumber = data.restoredFromRevisionNumber;
      const newNumber = data.revision.revisionNumber;
      pushToast({
        title: `Restored revision ${restoredFromNumber} as revision ${newNumber}`,
        body: data.secretMaterials.length > 0
          ? "Trigger enabled state was restored from the snapshot. New webhook secrets are available in the banner above."
          : "Trigger enabled state was restored from the snapshot.",
        tone: "success",
      });
      onRestoreSecretMaterials(data);
      onRestored?.(data);
      setConfirmOpen(false);
      setRestoreSummary("");
      setSelectedRevisionId(data.revision.id);
      setHighlightedRevisionId(data.revision.id);
      window.setTimeout(() => {
        setHighlightedRevisionId((current) =>
          current === data.revision.id ? null : current,
        );
      }, 3000);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(routine.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.runs(routine.id) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.routines.activity(routine.companyId, routine.id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(routine.companyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.revisions(routine.id) }),
      ]);
    },
    onError: (error) => {
      pushToast({
        title: "Failed to restore revision",
        body: error instanceof Error ? error.message : "Paperclip could not restore the revision.",
        tone: "error",
      });
    },
  });

  const handleSelectRevision = (revisionId: string) => {
    if (isEditDirty) return;
    setSelectedRevisionId(revisionId);
  };

  const handleReturnToCurrent = () => {
    if (currentRevision) setSelectedRevisionId(currentRevision.id);
  };

  const openRestoreConfirm = () => {
    if (!selectedRevision || !isHistoricalSelected) return;
    setRestoreSummary("");
    setConfirmOpen(true);
  };

  const confirmRestore = () => {
    if (!selectedRevision) return;
    restoreMutation.mutate({
      revisionId: selectedRevision.id,
      changeSummary: restoreSummary,
    });
  };

  if (revisionsQuery.isLoading) {
    return (
      <div className="grid gap-5 md:flex">
        <div className="space-y-2 md:w-72 md:shrink-0">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-32 w-full md:flex-1" />
      </div>
    );
  }

  if (revisionsQuery.error) {
    return (
      <div className="rounded-md border border-l-2 border-l-destructive border-border p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">Could not load revisions</p>
          <p className="text-xs text-muted-foreground">
            {revisionsQuery.error instanceof Error
              ? revisionsQuery.error.message
              : "Unknown error loading revisions."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => revisionsQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const onlyBootstrapRevision = revisions.length <= 1;

  return (
    <div className="grid gap-5 md:flex">
      <div className="md:w-72 md:shrink-0">
        <RoutineRevisionList
          revisions={visibleRevisions}
          latestRevisionId={routine.latestRevisionId}
          selectedRevisionId={selectedRevisionId}
          highlightedRevisionId={highlightedRevisionId}
          isEditDirty={isEditDirty}
          totalRevisions={sortedRevisions.length}
          onSelect={handleSelectRevision}
          onShowOlder={() => setShowOlder(true)}
          showOlder={showOlder}
        />
      </div>
      <div className="min-w-0 space-y-4 md:flex-1">
        {isEditDirty && (
          <ConflictBanner
            dirtyFields={dirtyFields}
            onDiscard={onDiscardEdits}
            onSave={onSaveEdits}
          />
        )}
        {!isEditDirty && onlyBootstrapRevision ? (
          <div className="space-y-2">
            <EmptyState
              icon={HistoryIcon}
              message="No edits yet"
            />
            <p className="text-center text-xs text-muted-foreground">
              Revision 1 is the only history this routine has. Saving an edit creates the first
              additional revision.
            </p>
          </div>
        ) : (
          selectedRevision && (
            <>
              {isHistoricalSelected && currentRevision && (
                <HistoricalPreviewBanner
                  revisionNumber={selectedRevision.revisionNumber}
                  nextRevisionNumber={currentRevision.revisionNumber + 1}
                  onReturn={handleReturnToCurrent}
                  onRestore={openRestoreConfirm}
                  pending={restoreMutation.isPending}
                />
              )}
              <RevisionPreview
                revision={selectedRevision}
                currentRevision={currentRevision}
                isHistorical={isHistoricalSelected}
                agents={agents}
                projects={projects}
                onCompare={() => setDiffOpen(true)}
                onRestore={openRestoreConfirm}
                restorePending={restoreMutation.isPending}
                highlighted={highlightedRevisionId === selectedRevision.id}
              />
            </>
          )
        )}
      </div>

      {selectedRevision && currentRevision && (
        <RestoreConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          target={selectedRevision}
          currentRevisionNumber={currentRevision.revisionNumber}
          changeSummary={restoreSummary}
          onChangeSummaryChange={setRestoreSummary}
          onConfirm={confirmRestore}
          pending={restoreMutation.isPending}
          recreatedWebhookLabels={collectWebhookTriggerDifferences(
            selectedRevision,
            currentRevision,
          )}
        />
      )}

      {currentRevision && selectedRevision && (
        <RoutineRevisionDiffModal
          open={diffOpen}
          onOpenChange={setDiffOpen}
          revisions={sortedRevisions}
          initialOldRevisionId={selectedRevision.id}
          initialNewRevisionId={currentRevision.id}
          agents={agents}
          projects={projects}
          onRestore={(rev) => {
            setSelectedRevisionId(rev.id);
            setDiffOpen(false);
            setRestoreSummary("");
            setConfirmOpen(true);
          }}
        />
      )}
    </div>
  );
}

function HistoricalPreviewBanner({
  revisionNumber,
  nextRevisionNumber,
  onReturn,
  onRestore,
  pending,
}: {
  revisionNumber: number;
  nextRevisionNumber: number;
  onReturn: () => void;
  onRestore: () => void;
  pending: boolean;
}) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-200">
            Viewing revision {revisionNumber} (read-only)
          </p>
          <p className="text-xs text-muted-foreground">
            Restoring this revision creates a new revision {nextRevisionNumber} with the same content.
            History stays append-only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReturn} disabled={pending}>
            Return to current
          </Button>
          <Button size="sm" onClick={onRestore} disabled={pending}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restore as new revision
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConflictBanner({
  dirtyFields,
  onDiscard,
  onSave,
}: {
  dirtyFields: DirtyFieldDescriptor[];
  onDiscard: () => void;
  onSave: () => void;
}) {
  const labels = dirtyFields.length > 0
    ? dirtyFields.map((field) => field.label)
    : ["the routine"];
  const fieldsText = formatDirtyFieldList(labels);
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-200">Unsaved routine edits</p>
          <p className="text-xs text-muted-foreground">
            You changed {fieldsText} but haven&apos;t saved yet. Save or discard before previewing or
            restoring an older revision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDiscard}>
            Discard changes
          </Button>
          <Button size="sm" onClick={onSave}>
            Save and continue
          </Button>
        </div>
      </div>
      {dirtyFields.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {dirtyFields.map((field) => (
            <li key={field.key} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              {field.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RevisionPreview({
  revision,
  currentRevision,
  isHistorical,
  agents,
  projects,
  onCompare,
  onRestore,
  restorePending,
  highlighted,
}: {
  revision: RoutineRevision;
  currentRevision: RoutineRevision | null;
  isHistorical: boolean;
  agents: AgentLookup;
  projects: ProjectLookup;
  onCompare: () => void;
  onRestore: () => void;
  restorePending: boolean;
  highlighted: boolean;
}) {
  const snapshot = revision.snapshot.routine;
  const triggers = revision.snapshot.triggers;
  const currentSnapshot = currentRevision?.snapshot.routine ?? null;
  const restoreLabel = isHistorical ? "Restore this revision" : "Restore this revision";
  const cardWrapper = `rounded-md border transition-colors duration-1000 ${
    highlighted ? "border-emerald-500/40 bg-emerald-500/10" : "border-border"
  }`;

  const fieldRows: Array<{ key: string; label: string; value: string; differs: boolean }> = [
    {
      key: "title",
      label: "Title",
      value: snapshot.title,
      differs: !!currentSnapshot && currentSnapshot.title !== snapshot.title,
    },
    {
      key: "priority",
      label: "Priority",
      value: snapshot.priority,
      differs: !!currentSnapshot && currentSnapshot.priority !== snapshot.priority,
    },
    {
      key: "status",
      label: "Status",
      value: snapshot.status,
      differs: !!currentSnapshot && currentSnapshot.status !== snapshot.status,
    },
    {
      key: "assigneeAgentId",
      label: "Default agent",
      value: resolveAgentName(snapshot.assigneeAgentId, agents),
      differs: !!currentSnapshot && currentSnapshot.assigneeAgentId !== snapshot.assigneeAgentId,
    },
    {
      key: "projectId",
      label: "Project",
      value: resolveProjectName(snapshot.projectId, projects),
      differs: !!currentSnapshot && currentSnapshot.projectId !== snapshot.projectId,
    },
    {
      key: "concurrencyPolicy",
      label: "Concurrency",
      value: snapshot.concurrencyPolicy.replaceAll("_", " "),
      differs: !!currentSnapshot && currentSnapshot.concurrencyPolicy !== snapshot.concurrencyPolicy,
    },
    {
      key: "catchUpPolicy",
      label: "Catch-up",
      value: snapshot.catchUpPolicy.replaceAll("_", " "),
      differs: !!currentSnapshot && currentSnapshot.catchUpPolicy !== snapshot.catchUpPolicy,
    },
  ];

  return (
    <div className="space-y-4">
      <header className={`${cardWrapper} p-4 space-y-2`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium">rev {revision.revisionNumber}</p>
            <p className="text-xs text-muted-foreground truncate">
              Saved {relativeTime(revision.createdAt)} by {getActorLabel(revision)}
              {revision.changeSummary ? ` · ${revision.changeSummary}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCompare}>
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Compare with current
            </Button>
            <Button
              size="sm"
              onClick={onRestore}
              disabled={!isHistorical || restorePending}
              aria-label={restoreLabel}
              className={!isHistorical ? "text-muted-foreground/60" : undefined}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {restoreLabel}
            </Button>
          </div>
        </div>
      </header>

      <div className={`${cardWrapper} p-3`}>
        <p className="theft-label-compact pb-2 text-muted-foreground">
          Structured fields
        </p>
        <div className="grid gap-3 md:grid-cols-2 divide-y md:divide-y-0 divide-border">
          {fieldRows.map((row) => (
            <div key={row.key} className="space-y-1 p-2">
              <p className="theft-label-nano text-muted-foreground">{row.label}</p>
              <p className="text-sm">
                {row.value || <span className="text-muted-foreground">—</span>}
                {row.differs && (
                  <span className="theft-label-nano ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 text-amber-200">
                    differs from current
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${cardWrapper} p-3 space-y-2`}>
        <p className="theft-label-compact text-muted-foreground">
          Description
        </p>
        <div className="rounded-md bg-background/40 p-3 text-sm leading-7">
          {snapshot.description ? (
            <MarkdownBody>{snapshot.description}</MarkdownBody>
          ) : (
            <span className="text-muted-foreground">No description</span>
          )}
        </div>
      </div>

      <div className={`${cardWrapper} p-3 space-y-2`}>
        <p className="theft-label-compact text-muted-foreground">
          Triggers ({triggers.length})
        </p>
        {triggers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No triggers in this revision.</p>
        ) : (
          <ul className="divide-y divide-border">
            {triggers.map((trigger) => (
              <li key={trigger.id} className="py-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="theft-label-nano rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {trigger.kind}
                </span>
                <span className="font-medium">{trigger.label ?? trigger.kind}</span>
                <span className="text-xs text-muted-foreground">
                  {summarizeTriggerSnapshot(trigger)}
                </span>
                <span
                  className={`ml-auto text-xs ${trigger.enabled ? "text-emerald-400" : "text-muted-foreground"}`}
                >
                  {trigger.enabled ? "enabled" : "disabled"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Webhook secrets are not stored in revisions. If a restored webhook trigger needs re-creation,
          Paperclip mints fresh secret material at restore time.
        </p>
      </div>

      {snapshot.variables.length > 0 && (
        <div className={`${cardWrapper} p-3 space-y-2`}>
          <p className="theft-label-compact text-muted-foreground">
            Variables ({snapshot.variables.length})
          </p>
          <ul className="divide-y divide-border">
            {snapshot.variables.map((variable) => (
              <li key={variable.name} className="py-2 flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{variable.name}</span>
                <span className="text-xs text-muted-foreground">
                  default: {formatVariableDefault(variable)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RestoreConfirmDialog({
  open,
  onOpenChange,
  target,
  currentRevisionNumber,
  changeSummary,
  onChangeSummaryChange,
  onConfirm,
  pending,
  recreatedWebhookLabels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: RoutineRevision;
  currentRevisionNumber: number;
  changeSummary: string;
  onChangeSummaryChange: (value: string) => void;
  onConfirm: () => void;
  pending: boolean;
  recreatedWebhookLabels: string[];
}) {
  const newRevisionNumber = currentRevisionNumber + 1;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restore revision {target.revisionNumber}?</DialogTitle>
          <DialogDescription>
            This creates a new revision {newRevisionNumber} with the same content as revision{" "}
            {target.revisionNumber}. Revisions {target.revisionNumber}–{currentRevisionNumber} stay
            in history and are not modified.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Routine field values, variables, and schedule cron will revert.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Previous run history is preserved.
          </li>
          {recreatedWebhookLabels.map((label) => (
            <li key={label} className="flex items-start gap-2 text-amber-200">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              The webhook trigger {label} will be recreated with a new URL and secret. Paperclip will
              show the secret once after restore — copy it before closing.
            </li>
          ))}
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="restore-change-summary" className="text-xs">
            Change summary (optional)
          </Label>
          <Input
            id="restore-change-summary"
            value={changeSummary}
            placeholder="Why are you restoring? Visible in history."
            onChange={(event) => onChangeSummaryChange(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {pending ? "Restoring…" : `Restore as revision ${newRevisionNumber}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getActorLabel(revision: RoutineRevision): string {
  if (revision.createdByUserId) return "board";
  if (revision.createdByAgentId) return "agent";
  return "system";
}

function resolveAgentName(agentId: string | null, lookup: AgentLookup) {
  if (!agentId) return "Unassigned";
  return lookup.get(agentId)?.name ?? agentId;
}

function resolveProjectName(projectId: string | null, lookup: ProjectLookup) {
  if (!projectId) return "No project";
  return lookup.get(projectId)?.name ?? projectId;
}

function summarizeTriggerSnapshot(trigger: RoutineRevisionSnapshotTriggerV1): string {
  if (trigger.kind === "schedule") {
    return [trigger.cronExpression, trigger.timezone].filter(Boolean).join(" · ");
  }
  if (trigger.kind === "webhook") {
    const replay = trigger.replayWindowSec != null ? `replay ${trigger.replayWindowSec}s` : "";
    return [trigger.signingMode, replay].filter(Boolean).join(" · ");
  }
  return "API";
}

function formatVariableDefault(variable: RoutineVariable): string {
  if (variable.defaultValue == null) return "—";
  return String(variable.defaultValue);
}

function formatDirtyFieldList(labels: string[]): string {
  if (labels.length === 0) return "the routine";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function collectWebhookTriggerDifferences(
  target: RoutineRevision,
  current: RoutineRevision,
): string[] {
  const currentIds = new Set(current.snapshot.triggers.map((t) => t.id));
  return target.snapshot.triggers
    .filter((trigger) => trigger.kind === "webhook" && !currentIds.has(trigger.id))
    .map((trigger) => trigger.label ?? "webhook");
}

export function isUpdateConflictError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409;
}

export type RoutineHistoryDirtyFieldDescriptor = DirtyFieldDescriptor;
export type RoutineHistoryAgentLookup = AgentLookup;
export type RoutineHistoryProjectLookup = ProjectLookup;
