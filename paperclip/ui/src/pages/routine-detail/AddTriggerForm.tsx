import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleEditor } from "../../components/ScheduleEditor";
import {
  signingModeDescriptions,
  signingModes,
  SIGNING_MODES_WITHOUT_REPLAY_WINDOW,
  triggerKinds,
  type NewRoutineTriggerDraft,
} from "./routineDetailModel";

export function AddTriggerForm({
  newTrigger,
  isPending,
  onDraftChange,
  onCreate,
}: {
  newTrigger: NewRoutineTriggerDraft;
  isPending: boolean;
  onDraftChange: (patch: Partial<NewRoutineTriggerDraft>) => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <p className="text-sm font-medium">Add trigger</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Kind</Label>
          <Select value={newTrigger.kind} onValueChange={(kind) => onDraftChange({ kind })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {triggerKinds.map((kind) => (
                <SelectItem key={kind} value={kind} disabled={kind === "webhook"}>
                  {kind}{kind === "webhook" ? " — COMING SOON" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {newTrigger.kind === "schedule" && (
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">Schedule</Label>
            <ScheduleEditor
              value={newTrigger.cronExpression}
              onChange={(cronExpression) => onDraftChange({ cronExpression })}
            />
          </div>
        )}
        {newTrigger.kind === "webhook" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Signing mode</Label>
              <Select value={newTrigger.signingMode} onValueChange={(signingMode) => onDraftChange({ signingMode })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {signingModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{signingModeDescriptions[newTrigger.signingMode]}</p>
            </div>
            {!SIGNING_MODES_WITHOUT_REPLAY_WINDOW.has(newTrigger.signingMode) && (
              <div className="space-y-1.5">
                <Label className="text-xs">Replay window (seconds)</Label>
                <Input value={newTrigger.replayWindowSec} onChange={(event) => onDraftChange({ replayWindowSec: event.target.value })} />
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={onCreate} disabled={isPending}>
          {isPending ? "Adding..." : "Add trigger"}
        </Button>
      </div>
    </div>
  );
}
