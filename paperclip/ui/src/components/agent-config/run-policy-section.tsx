import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { AGENT_DEFAULT_MAX_CONCURRENT_RUNS } from "@paperclipai/shared";
import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  CollapsibleSection,
  DraftNumberInput,
  Field,
  ToggleField,
  ToggleWithNumber,
  help,
} from "../agent-config-primitives";
import {
  MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP,
  clampDelayMsFromSeconds,
  clampInteger,
} from "./constants";

type EffectiveHeartbeatValue = <T>(group: "heartbeat", field: string, original: T) => T;
type MarkHeartbeatValue = (group: "heartbeat", field: string, value: unknown) => void;

export function AgentRunPolicySection({
  advancedOpen,
  cards,
  eff,
  heartbeat,
  inputClass,
  isCreate,
  mark,
  maxTurnContinuationDelaySec,
  maxTurnContinuationEnabled,
  maxTurnContinuationMaxAttempts,
  onAdvancedOpenChange,
  onCreateChange,
  showCreateRunPolicySection,
  updateMaxTurnContinuation,
  values,
}: {
  advancedOpen: boolean;
  cards: boolean;
  eff: EffectiveHeartbeatValue;
  heartbeat: Record<string, unknown>;
  inputClass: string;
  isCreate: boolean;
  mark: MarkHeartbeatValue;
  maxTurnContinuationDelaySec: number;
  maxTurnContinuationEnabled: boolean;
  maxTurnContinuationMaxAttempts: number;
  onAdvancedOpenChange: (open: boolean) => void;
  onCreateChange: ((patch: Partial<CreateConfigValues>) => void) | null;
  showCreateRunPolicySection: boolean;
  updateMaxTurnContinuation: (patch: Record<string, unknown>) => void;
  values: CreateConfigValues | null;
}) {
  if (isCreate) {
    if (!showCreateRunPolicySection || !values || !onCreateChange) {
      return null;
    }

    return (
      <RunPolicyShell cards={cards}>
        <ToggleWithNumber
          label="Heartbeat on interval"
          hint={help.heartbeatInterval}
          checked={values.heartbeatEnabled}
          onCheckedChange={(nextValue) => onCreateChange({ heartbeatEnabled: nextValue })}
          number={values.intervalSec}
          onNumberChange={(nextValue) => onCreateChange({ intervalSec: nextValue })}
          numberLabel="sec"
          numberPrefix="Run heartbeat every"
          numberHint={help.intervalSec}
          showNumber={values.heartbeatEnabled}
        />
      </RunPolicyShell>
    );
  }

  return (
    <RunPolicyShell cards={cards}>
      <ToggleWithNumber
        label="Heartbeat on interval"
        hint={help.heartbeatInterval}
        checked={eff("heartbeat", "enabled", heartbeat.enabled === true)}
        onCheckedChange={(nextValue) => mark("heartbeat", "enabled", nextValue)}
        number={eff("heartbeat", "intervalSec", Number(heartbeat.intervalSec ?? 300))}
        onNumberChange={(nextValue) => mark("heartbeat", "intervalSec", nextValue)}
        numberLabel="sec"
        numberPrefix="Run heartbeat every"
        numberHint={help.intervalSec}
        showNumber={eff("heartbeat", "enabled", heartbeat.enabled === true)}
      />
      <CollapsibleSection
        title="Advanced Run Policy"
        bordered={cards}
        open={advancedOpen}
        onToggle={() => onAdvancedOpenChange(!advancedOpen)}
      >
        <div className="space-y-3">
          <ToggleField
            label="Wake on demand"
            hint={help.wakeOnDemand}
            checked={eff("heartbeat", "wakeOnDemand", heartbeat.wakeOnDemand !== false)}
            onChange={(nextValue) => mark("heartbeat", "wakeOnDemand", nextValue)}
          />
          <Field label="Cooldown (sec)" hint={help.cooldownSec}>
            <DraftNumberInput
              value={eff("heartbeat", "cooldownSec", Number(heartbeat.cooldownSec ?? 10))}
              onCommit={(nextValue) => mark("heartbeat", "cooldownSec", nextValue)}
              immediate
              className={inputClass}
            />
          </Field>
          <Field label="Max concurrent runs" hint={help.maxConcurrentRuns}>
            <DraftNumberInput
              value={eff(
                "heartbeat",
                "maxConcurrentRuns",
                Number(heartbeat.maxConcurrentRuns ?? AGENT_DEFAULT_MAX_CONCURRENT_RUNS),
              )}
              onCommit={(nextValue) => mark("heartbeat", "maxConcurrentRuns", nextValue)}
              immediate
              className={inputClass}
            />
          </Field>
          <div className="rounded-md border border-border/70 px-3 py-2">
            <ToggleField
              label="Continue after max-turn stop"
              hint={help.maxTurnContinuationEnabled}
              checked={maxTurnContinuationEnabled}
              onChange={(nextValue) => updateMaxTurnContinuation({ enabled: nextValue })}
            />
            {maxTurnContinuationEnabled ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Continuation attempts" hint={help.maxTurnContinuationMaxAttempts}>
                  <DraftNumberInput
                    value={maxTurnContinuationMaxAttempts}
                    onCommit={(nextValue) =>
                      updateMaxTurnContinuation({
                        maxAttempts: clampInteger(
                          nextValue,
                          0,
                          MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP,
                        ),
                      })}
                    immediate
                    className={inputClass}
                  />
                </Field>
                <Field label="Continuation delay (sec)" hint={help.maxTurnContinuationDelaySec}>
                  <DraftNumberInput
                    value={maxTurnContinuationDelaySec}
                    onCommit={(nextValue) =>
                      updateMaxTurnContinuation({
                        delayMs: clampDelayMsFromSeconds(nextValue),
                      })}
                    immediate
                    className={inputClass}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </div>
      </CollapsibleSection>
    </RunPolicyShell>
  );
}

function RunPolicyShell({ cards, children }: { cards: boolean; children: ReactNode }) {
  return (
    <div className={cn(!cards && "border-b border-border")}>
      {cards ? (
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Heart className="h-3 w-3" /> Run Policy
        </h3>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
          <Heart className="h-3 w-3" /> Run Policy
        </div>
      )}
      <div className={cn(cards ? "border border-border rounded-lg overflow-hidden" : "")}>
        <div className={cn(cards ? "p-4 space-y-3" : "px-4 pb-3 space-y-3")}>{children}</div>
      </div>
    </div>
  );
}
