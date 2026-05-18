import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentDetail as AgentDetailRecord } from "@paperclipai/shared";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { AgentConfigForm } from "../../components/AgentConfigForm";
import { AgentKeysTab } from "./AgentKeysTab";
import { ConfigurationRevisionsSection } from "./ConfigurationRevisionsSection";
import { ApiError } from "../../api/client";
import { agentsApi, type AgentPermissionUpdate } from "../../api/agents";
import { queryKeys } from "../../lib/queryKeys";
import { useToastActions } from "../../context/ToastContext";

export function AgentConfigurePage({
  agent,
  agentId,
  companyId,
  onDirtyChange,
  onSaveActionChange,
  onCancelActionChange,
  onSavingChange,
  updatePermissions,
}: {
  agent: AgentDetailRecord;
  agentId: string;
  companyId?: string;
  onDirtyChange: (dirty: boolean) => void;
  onSaveActionChange: (save: (() => void) | null) => void;
  onCancelActionChange: (cancel: (() => void) | null) => void;
  onSavingChange: (saving: boolean) => void;
  updatePermissions: { mutate: (permissions: AgentPermissionUpdate) => void; isPending: boolean };
}) {
  return (
    <div className="max-w-3xl space-y-6">
      <ConfigurationTab
        agent={agent}
        companyId={companyId}
        hideInstructionsFile
        hidePromptTemplate
        onCancelActionChange={onCancelActionChange}
        onDirtyChange={onDirtyChange}
        onSaveActionChange={onSaveActionChange}
        onSavingChange={onSavingChange}
        updatePermissions={updatePermissions}
      />
      <div>
        <h3 className="mb-3 text-sm font-medium">API Keys</h3>
        <AgentKeysTab agentId={agentId} companyId={companyId} />
      </div>
      <ConfigurationRevisionsSection agent={agent} companyId={companyId} />
    </div>
  );
}

function ConfigurationTab({
  agent,
  companyId,
  onDirtyChange,
  onSaveActionChange,
  onCancelActionChange,
  onSavingChange,
  updatePermissions,
  hidePromptTemplate,
  hideInstructionsFile,
}: {
  agent: AgentDetailRecord;
  companyId?: string;
  onDirtyChange: (dirty: boolean) => void;
  onSaveActionChange: (save: (() => void) | null) => void;
  onCancelActionChange: (cancel: (() => void) | null) => void;
  onSavingChange: (saving: boolean) => void;
  updatePermissions: { mutate: (permissions: AgentPermissionUpdate) => void; isPending: boolean };
  hidePromptTemplate?: boolean;
  hideInstructionsFile?: boolean;
}) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [awaitingRefreshAfterSave, setAwaitingRefreshAfterSave] = useState(false);
  const lastAgentRef = useRef(agent);

  const { data: adapterModels } = useQuery({
    queryKey: companyId
      ? queryKeys.agents.adapterModels(companyId, agent.adapterType)
      : ["agents", "none", "adapter-models", agent.adapterType],
    queryFn: () => agentsApi.adapterModels(companyId!, agent.adapterType),
    enabled: Boolean(companyId),
  });

  const updateAgent = useMutation({
    mutationFn: (data: Record<string, unknown>) => agentsApi.update(agent.id, data, companyId),
    onMutate: () => setAwaitingRefreshAfterSave(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(agent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(agent.urlKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.configRevisions(agent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(agent.companyId) });
    },
    onError: (err) => {
      setAwaitingRefreshAfterSave(false);
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not save agent";
      pushToast({ title: "Save failed", body: message, tone: "error" });
    },
  });

  useEffect(() => {
    if (awaitingRefreshAfterSave && agent !== lastAgentRef.current) setAwaitingRefreshAfterSave(false);
    lastAgentRef.current = agent;
  }, [agent, awaitingRefreshAfterSave]);
  const isConfigSaving = updateAgent.isPending || awaitingRefreshAfterSave;

  useEffect(() => {
    onSavingChange(isConfigSaving);
  }, [onSavingChange, isConfigSaving]);

  const canCreateAgents = Boolean(agent.permissions?.canCreateAgents);
  const canAssignTasks = Boolean(agent.access?.canAssignTasks);
  const taskAssignSource = agent.access?.taskAssignSource ?? "none";
  const taskAssignLocked = agent.role === "ceo" || canCreateAgents;
  const taskAssignHint =
    taskAssignSource === "ceo_role"
      ? "Enabled automatically for CEO agents."
      : taskAssignSource === "agent_creator"
        ? "Enabled automatically while this agent can create new agents."
        : taskAssignSource === "explicit_grant"
          ? "Enabled via explicit company permission grant."
          : "Disabled unless explicitly granted.";

  return (
    <div className="space-y-6">
      <AgentConfigForm
        mode="edit"
        agent={agent}
        adapterModels={adapterModels}
        hideInlineSave
        hideInstructionsFile={hideInstructionsFile}
        hidePromptTemplate={hidePromptTemplate}
        isSaving={isConfigSaving}
        onCancelActionChange={onCancelActionChange}
        onDirtyChange={onDirtyChange}
        onSave={(patch) => updateAgent.mutate(patch)}
        onSaveActionChange={onSaveActionChange}
        sectionLayout="cards"
      />

      <div>
        <h3 className="mb-3 text-sm font-medium">Permissions</h3>
        <div className="space-y-4 rounded-lg border border-border p-4">
          <PermissionToggle
            checked={canCreateAgents}
            description="Lets this agent create or hire agents and implicitly assign tasks."
            disabled={updatePermissions.isPending}
            label="Can create new agents"
            onChange={() => updatePermissions.mutate({ canCreateAgents: !canCreateAgents, canAssignTasks: !canCreateAgents ? true : canAssignTasks })}
          />
          <PermissionToggle
            checked={canAssignTasks}
            description={taskAssignHint}
            disabled={updatePermissions.isPending || taskAssignLocked}
            label="Can assign tasks"
            onChange={() => updatePermissions.mutate({ canCreateAgents, canAssignTasks: !canAssignTasks })}
          />
        </div>
      </div>
    </div>
  );
}

function PermissionToggle({
  checked,
  description,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div className="space-y-1">
        <div>{label}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ToggleSwitch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
