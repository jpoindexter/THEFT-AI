import { useCallback, useEffect, useRef, useState } from "react";
import type { Agent } from "@paperclipai/shared";
import { buildAgentUpdatePatch, type AgentConfigOverlay } from "../../lib/agent-config-patch";
import { emptyOverlay, isOverlayDirty } from "./constants";
import type { AgentConfigFormProps, RecordOverlayGroup } from "./types";

export function useAgentConfigOverlay(props: AgentConfigFormProps) {
  const isCreate = props.mode === "create";
  const agent = props.mode === "edit" ? props.agent : null;
  const [overlay, setOverlay] = useState<AgentConfigOverlay>(emptyOverlay);
  const agentRef = useRef<Agent | null>(null);

  useEffect(() => {
    if (!agent) return;
    if (agentRef.current !== null && agent !== agentRef.current) {
      setOverlay({ ...emptyOverlay });
    }
    agentRef.current = agent;
  }, [agent]);

  const isDirty = !isCreate && isOverlayDirty(overlay);

  function eff<T>(group: RecordOverlayGroup, field: string, original: T): T {
    const overlayGroup = overlay[group];
    if (field in overlayGroup) return overlayGroup[field] as T;
    return original;
  }

  function mark(group: RecordOverlayGroup, field: string, value: unknown) {
    setOverlay((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  }

  const handleCancel = useCallback(() => {
    setOverlay({ ...emptyOverlay });
  }, []);

  const handleSave = useCallback(() => {
    if (props.mode !== "edit" || !isDirty) return;
    props.onSave(buildAgentUpdatePatch(props.agent, overlay));
  }, [isDirty, overlay, props]);

  useEffect(() => {
    if (props.mode !== "edit") return;
    props.onDirtyChange?.(isDirty);
    props.onSaveActionChange?.(handleSave);
    props.onCancelActionChange?.(handleCancel);
  }, [
    props,
    isDirty,
    handleSave,
    handleCancel,
  ]);

  useEffect(() => {
    if (props.mode !== "edit") return;
    return () => {
      props.onSaveActionChange?.(null);
      props.onCancelActionChange?.(null);
      props.onDirtyChange?.(false);
    };
  }, [props]);

  const config = agent ? ((agent.adapterConfig ?? {}) as Record<string, unknown>) : {};
  const runtimeConfig = agent ? ((agent.runtimeConfig ?? {}) as Record<string, unknown>) : {};
  const heartbeat = agent ? ((runtimeConfig.heartbeat ?? {}) as Record<string, unknown>) : {};
  const adapterType = props.mode === "create"
    ? props.values.adapterType
    : overlay.adapterType ?? agent!.adapterType;

  return {
    adapterType,
    config,
    eff,
    handleCancel,
    handleSave,
    heartbeat,
    isDirty,
    mark,
    overlay,
    runtimeConfig,
    setOverlay,
  };
}
