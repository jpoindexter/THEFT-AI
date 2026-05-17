import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import { cn } from "@/lib/utils";

export function CircleMarker({ complete = false }: { complete?: boolean }) {
  return (
    <span className={cn("inline-flex size-3 shrink-0 rounded-full border", complete ? "border-foreground bg-foreground" : "border-muted-foreground")} />
  );
}

export function InspectorMetric({ label, value }: { label: string; value: string }) {
  return (
    <TheftSurface tone="muted" padding="sm" className="min-w-0">
      <div className="theft-label-compact">{label}</div>
      <div className="mt-1 truncate text-xs text-foreground">{value}</div>
    </TheftSurface>
  );
}
