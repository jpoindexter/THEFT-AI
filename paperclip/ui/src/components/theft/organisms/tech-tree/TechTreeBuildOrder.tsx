import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import { cn } from "@/lib/utils";
import type { TechTreeNodeView } from "@/lib/techTree";
import { CircleMarker } from "./TechTreePrimitives";

const BUILD_ORDER_COLUMNS = ["Idea", "Validation", "Build", "Go-to-market", "Launch", "Scale"];
const FALLBACK_BUILD_NODES = [
  "Identify market opportunity",
  "Define paid offer",
  "Build landing page",
  "Create sales script",
  "Ship first artifact",
  "Systematize acquisition",
];

export function TechTreeBuildOrder({
  nodes,
  selectedNode,
}: {
  nodes: TechTreeNodeView[];
  selectedNode: TechTreeNodeView | null;
}) {
  const visibleNodes = BUILD_ORDER_COLUMNS.map((label, index) => nodes[index] ?? null);

  return (
    <TheftSurface tone="muted" padding="sm" className="overflow-hidden">
      <div className="grid min-w-0 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {BUILD_ORDER_COLUMNS.map((column, index) => {
          const node = visibleNodes[index];
          const title = node?.goal.title ?? FALLBACK_BUILD_NODES[index]!;
          const complete = node?.goal.status === "achieved" || index === 0;
          const active = node?.goal.id === selectedNode?.goal.id || (!node && index === 1);
          const locked = !node && index > 2;
          return (
            <div key={column} className="theft-tech-tree-build-column grid min-w-0 gap-2">
              <TheftSurface tone="plain" padding="sm" className="theft-tech-tree-phase-card flex h-full flex-col items-center justify-between text-center">
                <p className="line-clamp-2 text-sm font-medium">{column}</p>
                <p className="mt-1 text-xs text-muted-foreground">{index + 1}</p>
              </TheftSurface>
              {[0, 1, 2].map((row) => {
                const rowTitle = row === 0 ? title : row === 1 ? `${column} support task` : `${column} evidence gate`;
                return (
                  <TheftSurface
                    key={`${column}:${row}`}
                    tone="plain"
                    padding="sm"
                    className={cn(
                      "theft-tech-tree-build-node h-full overflow-hidden text-xs",
                      active && row === 0 && "theft-selected-surface",
                      locked && "opacity-50",
                    )}
                  >
                    <div className="flex h-full items-start justify-between gap-2">
                      <p className="min-w-0 break-words line-clamp-3 [overflow-wrap:anywhere]">{rowTitle}</p>
                      {locked ? <span className="shrink-0 text-xs text-muted-foreground">Lock</span> : <CircleMarker complete={complete && row === 0} />}
                    </div>
                  </TheftSurface>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid min-w-0 gap-2 rounded-lg border border-dashed border-border p-3 md:grid-cols-3 xl:grid-cols-6">
        {BUILD_ORDER_COLUMNS.map((column, index) => (
          <TheftSurface key={`${column}:artifact`} tone="plain" padding="sm" className="theft-tech-tree-artifact-card min-w-0 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {index === 0 ? "Customer interview notes" : index === 1 ? "Offer summary doc" : `${column} artifact`}
          </TheftSurface>
        ))}
      </div>
      <p className="theft-label mt-3 text-center">
        Evidence & artifacts (Library)
      </p>
    </TheftSurface>
  );
}
