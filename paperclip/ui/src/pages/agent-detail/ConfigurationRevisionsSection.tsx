import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AgentDetail as AgentDetailRecord } from "@paperclipai/shared";

import { Button } from "@/components/ui/button";
import { agentsApi } from "../../api/agents";
import { queryKeys } from "../../lib/queryKeys";
import { formatDate } from "../../lib/utils";

type ConfigurationRevisionsSectionProps = {
  agent: AgentDetailRecord;
  companyId?: string;
};

export function ConfigurationRevisionsSection({
  agent,
  companyId,
}: ConfigurationRevisionsSectionProps) {
  const queryClient = useQueryClient();
  const [revisionsOpen, setRevisionsOpen] = useState(false);

  const { data: configRevisions } = useQuery({
    queryKey: queryKeys.agents.configRevisions(agent.id),
    queryFn: () => agentsApi.listConfigRevisions(agent.id, companyId),
  });

  const rollbackConfig = useMutation({
    mutationFn: (revisionId: string) => agentsApi.rollbackConfigRevision(agent.id, revisionId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(agent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(agent.urlKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.configRevisions(agent.id) });
    },
  });

  const revisionCount = configRevisions?.length ?? 0;

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className="h-auto gap-2 px-0 py-0 text-sm font-medium hover:bg-transparent hover:text-foreground"
        onClick={() => setRevisionsOpen((value) => !value)}
      >
        {revisionsOpen
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
        Configuration Revisions
        <span className="text-xs font-normal text-muted-foreground">{revisionCount}</span>
      </Button>
      {revisionsOpen && (
        <div className="mt-3">
          {revisionCount === 0 ? (
            <p className="text-sm text-muted-foreground">No configuration revisions yet.</p>
          ) : (
            <div className="space-y-2">
              {(configRevisions ?? []).slice(0, 10).map((revision) => (
                <div key={revision.id} className="space-y-2 rounded-md border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono">{revision.id.slice(0, 8)}</span>
                      <span className="mx-1">·</span>
                      <span>{formatDate(revision.createdAt)}</span>
                      <span className="mx-1">·</span>
                      <span>{revision.source}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => rollbackConfig.mutate(revision.id)}
                      disabled={rollbackConfig.isPending}
                    >
                      Restore
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Changed:{" "}
                    {revision.changedKeys.length > 0 ? revision.changedKeys.join(", ") : "no tracked changes"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
