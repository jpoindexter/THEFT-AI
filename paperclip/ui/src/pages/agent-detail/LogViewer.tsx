import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { HeartbeatRun } from "@paperclipai/shared";
import { heartbeatsApi } from "../../api/heartbeats";
import { instanceSettingsApi } from "../../api/instanceSettings";
import { getUIAdapter, buildTranscript, onAdapterChange } from "../../adapters";
import type { TranscriptMode } from "../../components/transcript/RunTranscriptView";
import { queryKeys } from "../../lib/queryKeys";
import { RunEventsList } from "./RunEventsList";
import { RunInvocationCard } from "./RunInvocationCard";
import { RunLogFailureDetails } from "./RunLogFailureDetails";
import { RunTranscriptPanel } from "./RunTranscriptPanel";
import { WorkspaceOperationsSection } from "./WorkspaceOperationsSection";
import { redactPathValue } from "./redaction";
import { useRunLogAutoFollow } from "./useRunLogAutoFollow";
import { useRunLogData } from "./useRunLogData";
import { asRecord } from "./valueUtils";

export function LogViewer({ run, adapterType }: { run: HeartbeatRun; adapterType: string }) {
  const isLive = run.status === "running" || run.status === "queued";
  const runLog = useRunLogData({ isLive, run });
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>("nice");
  const [parserTick, setParserTick] = useState(0);

  const autoFollow = useRunLogAutoFollow({
    eventCount: runLog.events.length,
    isLive,
    logLineCount: runLog.logLines.length,
    runId: run.id,
  });

  const { data: workspaceOperations = [] } = useQuery({
    queryKey: queryKeys.runWorkspaceOperations(run.id),
    queryFn: () => heartbeatsApi.workspaceOperations(run.id),
    refetchInterval: isLive ? 2000 : false,
  });

  const censorUsernameInLogs = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  }).data?.censorUsernameInLogs === true;

  const adapterInvokePayload = useMemo(() => {
    const event = runLog.events.find((item) => item.eventType === "adapter.invoke");
    return redactPathValue(asRecord(event?.payload ?? null), censorUsernameInLogs);
  }, [censorUsernameInLogs, runLog.events]);

  const adapter = getUIAdapter(adapterType);
  const transcript = useMemo(
    () => buildTranscript(runLog.logLines, adapter, { censorUsernameInLogs }),
    [adapter, censorUsernameInLogs, runLog.logLines, parserTick],
  );

  useEffect(() => onAdapterChange(() => setParserTick((tick) => tick + 1)), []);
  useEffect(() => setTranscriptMode("nice"), [run.id]);

  if (runLog.loading && runLog.logLoading) {
    return <p className="text-xs text-muted-foreground">Loading run logs...</p>;
  }

  if (runLog.events.length === 0 && runLog.logLines.length === 0 && !runLog.logError) {
    return <p className="text-xs text-muted-foreground">No log events.</p>;
  }

  return (
    <div className="space-y-3">
      <WorkspaceOperationsSection
        operations={workspaceOperations}
        censorUsernameInLogs={censorUsernameInLogs}
      />
      {adapterInvokePayload ? (
        <RunInvocationCard payload={adapterInvokePayload} censorUsernameInLogs={censorUsernameInLogs} />
      ) : null}

      <RunTranscriptPanel
        hasMoreLog={runLog.hasMoreLog}
        isFollowing={autoFollow.isFollowing}
        isLive={isLive}
        loadingMoreLog={runLog.loadingMoreLog}
        logEndRef={autoFollow.logEndRef}
        logError={runLog.logError}
        logOffset={runLog.logOffset}
        onJumpToLive={autoFollow.jumpToLive}
        onLoadMoreLog={runLog.loadMorePersistedLog}
        run={run}
        setTranscriptMode={setTranscriptMode}
        transcript={transcript}
        transcriptMode={transcriptMode}
      />

      <RunLogFailureDetails run={run} censorUsernameInLogs={censorUsernameInLogs} />
      <RunEventsList events={runLog.events} censorUsernameInLogs={censorUsernameInLogs} />
    </div>
  );
}
