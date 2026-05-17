import type { Issue } from "@paperclipai/shared";

import type { RunLivenessState } from "@/api/activity";
import type {
  LivenessCopy,
  RunOutputSilenceCopy,
  RunOutputSilenceLevel,
} from "./types";

export const LIVENESS_COPY: Record<RunLivenessState, LivenessCopy> = {
  completed: {
    label: "Completed",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    description: "Issue reached a terminal state.",
  },
  advanced: {
    label: "Advanced",
    tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    description: "Run produced concrete evidence of progress.",
  },
  plan_only: {
    label: "Plan only",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    description: "Run described future work without concrete action evidence.",
  },
  empty_response: {
    label: "Empty response",
    tone: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    description: "Run finished without useful output.",
  },
  blocked: {
    label: "Blocked",
    tone: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    description: "Run or issue declared a blocker.",
  },
  failed: {
    label: "Failed",
    tone: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    description: "Run ended unsuccessfully.",
  },
  needs_followup: {
    label: "Needs follow-up",
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    description: "Run produced useful output but did not prove concrete progress.",
  },
};

export const PENDING_LIVENESS_COPY: LivenessCopy = {
  label: "Checks after finish",
  tone: "border-border bg-background text-muted-foreground",
  description: "Liveness is evaluated after the run finishes.",
};

export const RETRY_PENDING_LIVENESS_COPY: LivenessCopy = {
  label: "Retry pending",
  tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  description: "Paperclip queued an automatic retry that has not started yet.",
};

export const MISSING_LIVENESS_COPY: LivenessCopy = {
  label: "No liveness data",
  tone: "border-border bg-background text-muted-foreground",
  description: "This run has no persisted liveness classification.",
};

export const TERMINAL_CHILD_STATUSES = new Set<Issue["status"]>(["done", "cancelled"]);

export const ACTIVE_RUN_STATUSES = new Set(["queued", "running"]);

export const RUN_OUTPUT_SILENCE_COPY: Partial<Record<RunOutputSilenceLevel, RunOutputSilenceCopy>> = {
  suspicious: {
    label: "Silence watch",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  critical: {
    label: "Stale run",
    tone: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  snoozed: {
    label: "Silence snoozed",
    tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
};
