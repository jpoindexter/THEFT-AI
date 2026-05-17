import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import type { TechTreeNodeView } from "@/lib/techTree";
import { CircleMarker } from "./TechTreePrimitives";

export function TechTreeInspector({
  node,
  onStartWork,
}: {
  node: TechTreeNodeView | null;
  onStartWork: () => void;
}) {
  return (
    <aside className="min-w-0 border-t border-border pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
      <TheftSurface tone="plain" padding="md">
        <p className="theft-label">Selected node</p>
        {node ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex min-w-0 items-center gap-2">
                <CircleMarker />
                <h2 className="min-w-0 break-words text-lg font-medium [overflow-wrap:anywhere]">{node.goal.title}</h2>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={node.goal.status} />
                <span className="text-xs text-muted-foreground">{node.stageLabel}</span>
              </div>
            </div>
            <InspectorSection title="Why it matters" rows={[node.nextAction]} />
            <InspectorSection title="Prerequisites" rows={[node.dependency, node.evidence]} />
            <InspectorSection title="Evidence required" rows={["Owner decision", "Linked task output", "Library artifact"]} />
            <InspectorSection title="Owner" rows={[node.owner]} />
            <Button className="w-full" onClick={onStartWork}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Start this work
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Add a node to create the company build order.</p>
        )}
      </TheftSurface>
    </aside>
  );
}

function InspectorSection({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border-t border-border pt-3">
      <p className="theft-label">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-5 text-muted-foreground">
        {rows.map((row) => (
          <li key={row} className="min-w-0 break-words [overflow-wrap:anywhere]">{row}</li>
        ))}
      </ul>
    </div>
  );
}
