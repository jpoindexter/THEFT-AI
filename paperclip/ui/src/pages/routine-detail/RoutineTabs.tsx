import { Activity as ActivityIcon, Clock3, History as HistoryIcon, Play } from "lucide-react";
import type {
  ActivityEvent,
  Agent,
  Project,
  RoutineDetail as RoutineDetailType,
  RoutineRunSummary,
} from "@paperclipai/shared";
import type { RestoreRoutineRevisionResponse } from "../../api/routines";
import { LiveRunWidget } from "../../components/LiveRunWidget";
import {
  RoutineHistoryTab,
  type RoutineHistoryDirtyFieldDescriptor,
} from "../../components/RoutineHistoryTab";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/lib/router";
import { timeAgo } from "../../lib/timeAgo";
import { AddTriggerForm } from "./AddTriggerForm";
import { TriggerEditor } from "./TriggerEditor";
import {
  formatActivityDetailValue,
  type NewRoutineTriggerDraft,
  type RoutineEditDraft,
  type RoutineTab,
} from "./routineDetailModel";

export function RoutineTabs({
  activeTab,
  routine,
  routineRuns,
  activity,
  hasLiveRun,
  activeIssueId,
  newTrigger,
  createTriggerPending,
  dirtyFields,
  isEditDirty,
  routineDefaults,
  saveRoutinePending,
  editTitle,
  agentById,
  projectById,
  onTabChange,
  onNewTriggerChange,
  onCreateTrigger,
  onUpdateTrigger,
  onRotateTrigger,
  onDeleteTrigger,
  onDiscardEdits,
  onSaveEdits,
  onRestoreSecretMaterials,
  onRestored,
}: {
  activeTab: RoutineTab;
  routine: RoutineDetailType;
  routineRuns: RoutineRunSummary[] | undefined;
  activity: ActivityEvent[] | undefined;
  hasLiveRun: boolean;
  activeIssueId: string | undefined;
  newTrigger: NewRoutineTriggerDraft;
  createTriggerPending: boolean;
  dirtyFields: RoutineHistoryDirtyFieldDescriptor[];
  isEditDirty: boolean;
  routineDefaults: RoutineEditDraft | null;
  saveRoutinePending: boolean;
  editTitle: string;
  agentById: Map<string, Agent>;
  projectById: Map<string, Project>;
  onTabChange: (value: string) => void;
  onNewTriggerChange: (patch: Partial<NewRoutineTriggerDraft>) => void;
  onCreateTrigger: () => void;
  onUpdateTrigger: (id: string, patch: Record<string, unknown>) => void;
  onRotateTrigger: (id: string) => void;
  onDeleteTrigger: (id: string) => void;
  onDiscardEdits: () => void;
  onSaveEdits: () => void;
  onRestoreSecretMaterials: (response: RestoreRoutineRevisionResponse) => void;
  onRestored: (response: RestoreRoutineRevisionResponse) => void;
}) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-3">
      <TabsList variant="line" className="w-full justify-start gap-1">
        <TabsTrigger value="triggers" className="gap-1.5">
          <Clock3 className="h-3.5 w-3.5" />
          Triggers
        </TabsTrigger>
        <TabsTrigger value="runs" className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Runs
          {hasLiveRun && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
        </TabsTrigger>
        <TabsTrigger value="activity" className="gap-1.5">
          <ActivityIcon className="h-3.5 w-3.5" />
          Activity
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5">
          <HistoryIcon className="h-3.5 w-3.5" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="triggers" className="space-y-4">
        <AddTriggerForm
          newTrigger={newTrigger}
          isPending={createTriggerPending}
          onDraftChange={onNewTriggerChange}
          onCreate={onCreateTrigger}
        />
        {routine.triggers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No triggers configured yet.</p>
        ) : (
          <div className="space-y-3">
            {routine.triggers.map((trigger) => (
              <TriggerEditor
                key={trigger.id}
                trigger={trigger}
                onSave={onUpdateTrigger}
                onRotate={onRotateTrigger}
                onDelete={onDeleteTrigger}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="runs" className="space-y-4">
        {hasLiveRun && activeIssueId && <LiveRunWidget issueId={activeIssueId} companyId={routine.companyId} />}
        {(routineRuns ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No runs yet.</p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border">
            {(routineRuns ?? []).map((run) => (
              <div key={run.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="shrink-0">{run.source}</Badge>
                  <Badge variant={run.status === "failed" ? "destructive" : "secondary"} className="shrink-0">
                    {run.status.replaceAll("_", " ")}
                  </Badge>
                  {run.trigger && (
                    <span className="text-muted-foreground truncate">{run.trigger.label ?? run.trigger.kind}</span>
                  )}
                  {run.linkedIssue && (
                    <Link to={`/issues/${run.linkedIssue.identifier ?? run.linkedIssue.id}`} className="text-muted-foreground hover:underline truncate">
                      {run.linkedIssue.identifier ?? run.linkedIssue.id.slice(0, 8)}
                    </Link>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{timeAgo(run.triggeredAt)}</span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="activity">
        {(activity ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border">
            {(activity ?? []).map((event) => (
              <div key={event.id} className="flex items-center justify-between px-3 py-2 text-xs gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-foreground/90 shrink-0">{event.action.replaceAll(".", " ")}</span>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <span className="text-muted-foreground truncate">
                      {Object.entries(event.details).slice(0, 3).map(([key, value], i) => (
                        <span key={key}>
                          {i > 0 && <span className="mx-1 text-border">·</span>}
                          <span className="text-muted-foreground/70">{key.replaceAll("_", " ")}:</span>{" "}
                          {formatActivityDetailValue(value)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground/60 shrink-0">{timeAgo(event.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history">
        <RoutineHistoryTab
          routine={routine}
          isEditDirty={isEditDirty}
          dirtyFields={dirtyFields}
          onDiscardEdits={onDiscardEdits}
          onSaveEdits={() => {
            if (!saveRoutinePending && editTitle.trim()) onSaveEdits();
          }}
          agents={agentById}
          projects={projectById}
          onRestoreSecretMaterials={onRestoreSecretMaterials}
          onRestored={onRestored}
        />
      </TabsContent>
    </Tabs>
  );
}
