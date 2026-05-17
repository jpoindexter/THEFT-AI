import type { ReactNode } from "react";
import type { ActivityEvent, Issue, Agent } from "@paperclipai/shared";

import type { RunForIssue, RunLivenessState } from "@/api/activity";
import type { ActiveRunForIssue, LiveRunForIssue, WatchdogDecisionInput } from "@/api/heartbeats";

export type IssueRunLedgerProps = {
  issueId: string;
  companyId: string;
  issueStatus: Issue["status"];
  childIssues: Issue[];
  agentMap: ReadonlyMap<string, Agent>;
  hasLiveRuns: boolean;
  activityEvents?: ActivityEvent[];
  renderActivityEvent?: (event: ActivityEvent) => ReactNode;
};

export type IssueRunLedgerContentProps = {
  runs: RunForIssue[];
  liveRuns?: LiveRunForIssue[];
  activeRun?: ActiveRunForIssue | null;
  issueStatus: Issue["status"];
  childIssues: Issue[];
  agentMap: ReadonlyMap<string, Pick<Agent, "name">>;
  activityEvents?: ActivityEvent[];
  renderActivityEvent?: (event: ActivityEvent) => ReactNode;
  pendingWatchdogDecision?: WatchdogDecisionInput["decision"] | null;
  canRecordWatchdogDecisions?: boolean;
  watchdogDecisionError?: string | null;
  onWatchdogDecision?: (input: WatchdogDecisionInput) => void;
};

export type LedgerRun = RunForIssue & {
  isLive?: boolean;
  agentName?: string;
  outputSilence?: ActiveRunForIssue["outputSilence"];
};

export type LedgerFeedItem =
  | {
      kind: "run";
      id: string;
      timestamp: string;
      run: LedgerRun;
    }
  | {
      kind: "activity";
      id: string;
      timestamp: string;
      event: ActivityEvent;
    };

export type LivenessCopy = {
  label: string;
  tone: string;
  description: string;
};

export type ModelProfileSummary = {
  requested: string;
  applied: string | null;
  configSource: string | null;
  fallbackReason: string | null;
};

export type ChildIssueSummary = {
  active: Issue[];
  done: number;
  cancelled: number;
  total: number;
};

export type RunOutputSilenceLevel = NonNullable<ActiveRunForIssue["outputSilence"]>["level"];

export type RunOutputSilenceCopy = {
  label: string;
  tone: string;
};

export type LedgerLivenessState = RunLivenessState;
