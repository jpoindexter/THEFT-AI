import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Point } from "./orgChartModel";

interface OrgChartZoomControlsProps {
  zoom: number;
  container: HTMLDivElement | null;
  onZoomTowardPoint: (newZoom: number, point: Point) => void;
  onFitToScreen: () => void;
}

export function OrgChartZoomControls({
  zoom,
  container,
  onZoomTowardPoint,
  onFitToScreen,
}: OrgChartZoomControlsProps) {
  function zoomFromCenter(factor: number) {
    if (!container) return;
    onZoomTowardPoint(zoom * factor, { x: container.clientWidth / 2, y: container.clientHeight / 2 });
  }

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
      <Button type="button" variant="outline" size="icon-sm" onClick={() => zoomFromCenter(1.2)} title="Zoom in" aria-label="Zoom in">
        <Plus className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="icon-sm" onClick={() => zoomFromCenter(0.8)} title="Zoom out" aria-label="Zoom out">
        <Minus className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="icon-sm" onClick={onFitToScreen} title="Fit to screen" aria-label="Fit chart to screen">
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}
