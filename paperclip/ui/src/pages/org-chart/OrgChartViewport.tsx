import { useLayoutEffect, useRef, type MouseEventHandler, type RefObject, type TouchEventHandler, type WheelEventHandler } from "react";
import type { Agent } from "@paperclipai/shared";
import { cn } from "@/lib/utils";
import { agentUrl } from "../../lib/utils";
import { OrgChartEdges } from "./OrgChartEdges";
import { OrgChartNodeCard } from "./OrgChartNodeCard";
import { OrgChartZoomControls } from "./OrgChartZoomControls";
import type { LayoutNode, OrgChartEdge, Point } from "./orgChartModel";

interface OrgChartViewportProps {
  containerRef: RefObject<HTMLDivElement | null>;
  nodes: LayoutNode[];
  edges: OrgChartEdge[];
  agentMap: Map<string, Agent>;
  pan: Point;
  zoom: number;
  dragging: boolean;
  onNavigate: (href: string) => void;
  onZoomTowardPoint: (newZoom: number, point: Point) => void;
  onFitToScreen: () => void;
  onCardClickCapture: MouseEventHandler;
  handlers: {
    handleMouseDown: MouseEventHandler<HTMLDivElement>;
    handleMouseMove: MouseEventHandler<HTMLDivElement>;
    handleMouseUp: MouseEventHandler<HTMLDivElement>;
    handleWheel: WheelEventHandler<HTMLDivElement>;
    handleTouchStart: TouchEventHandler<HTMLDivElement>;
    handleTouchMove: TouchEventHandler<HTMLDivElement>;
    handleTouchEnd: TouchEventHandler<HTMLDivElement>;
  };
}

export function OrgChartViewport({
  containerRef,
  nodes,
  edges,
  agentMap,
  pan,
  zoom,
  dragging,
  onNavigate,
  onZoomTowardPoint,
  onFitToScreen,
  onCardClickCapture,
  handlers,
}: OrgChartViewportProps) {
  const cardLayerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const layer = cardLayerRef.current;
    if (!layer) return;
    layer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [pan.x, pan.y, zoom]);

  return (
    <div
      ref={containerRef}
      data-testid="org-chart-viewport"
      className={cn(
        "relative min-h-0 w-full flex-1 touch-none overflow-hidden overscroll-contain rounded-lg border border-border bg-muted/20",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onMouseDown={handlers.handleMouseDown}
      onMouseMove={handlers.handleMouseMove}
      onMouseUp={handlers.handleMouseUp}
      onMouseLeave={handlers.handleMouseUp}
      onWheel={handlers.handleWheel}
      onTouchStart={handlers.handleTouchStart}
      onTouchMove={handlers.handleTouchMove}
      onTouchEnd={handlers.handleTouchEnd}
      onTouchCancel={handlers.handleTouchEnd}
    >
      <OrgChartZoomControls
        zoom={zoom}
        container={containerRef.current}
        onZoomTowardPoint={onZoomTowardPoint}
        onFitToScreen={onFitToScreen}
      />
      <OrgChartEdges edges={edges} pan={pan} zoom={zoom} />
      <div
        ref={cardLayerRef}
        data-testid="org-chart-card-layer"
        className="absolute inset-0 origin-top-left"
      >
        {nodes.map((node) => {
          const agent = agentMap.get(node.id);
          return (
            <OrgChartNodeCard
              key={node.id}
              node={node}
              agent={agent}
              onOpen={() => onNavigate(agent ? agentUrl(agent) : `/agents/${node.id}`)}
              onClickCapture={onCardClickCapture}
            />
          );
        })}
      </div>
    </div>
  );
}
