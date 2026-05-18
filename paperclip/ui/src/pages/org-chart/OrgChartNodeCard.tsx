import { useLayoutEffect, useRef, type MouseEvent } from "react";
import type { Agent } from "@paperclipai/shared";
import { AgentIcon } from "../../components/AgentIconPicker";
import { getAdapterLabel } from "../../adapters/adapter-display-registry";
import { CARD_H, CARD_W, getStatusDotClass, roleLabel, type LayoutNode } from "./orgChartModel";

interface OrgChartNodeCardProps {
  node: LayoutNode;
  agent: Agent | undefined;
  onOpen: () => void;
  onClickCapture: (event: MouseEvent) => void;
}

export function OrgChartNodeCard({ node, agent, onOpen, onClickCapture }: OrgChartNodeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.left = `${node.x}px`;
    card.style.top = `${node.y}px`;
    card.style.width = `${CARD_W}px`;
    card.style.minHeight = `${CARD_H}px`;
  }, [node.x, node.y]);

  return (
    <div
      ref={cardRef}
      data-org-card
      className="absolute cursor-pointer select-none rounded-lg border border-border bg-card shadow-sm transition-[box-shadow,border-color] duration-150 hover:border-foreground/20 hover:shadow-md"
      onClick={onOpen}
      onClickCapture={onClickCapture}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative shrink-0">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted">
            <AgentIcon icon={agent?.icon} className="size-4 text-foreground/70" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${getStatusDotClass(node.status)}`} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="text-sm font-semibold leading-tight text-foreground">{node.name}</span>
          <span className="mt-0.5 text-xs leading-tight text-muted-foreground">{agent?.title ?? roleLabel(node.role)}</span>
          {agent ? <span className="mt-1 font-mono text-xs leading-tight text-muted-foreground/60">{getAdapterLabel(agent.adapterType)}</span> : null}
          {agent?.capabilities ? <span className="mt-1 line-clamp-2 text-xs leading-tight text-muted-foreground/80">{agent.capabilities}</span> : null}
        </div>
      </div>
    </div>
  );
}
