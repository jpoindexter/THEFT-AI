import type { Goal } from "@paperclipai/shared";
import { TheftChip, TheftSectionHeader, TheftStat, TheftSurface } from "@/components/theft";
import type { TechTreeNodeView } from "@/lib/techTree";
import { InspectorMetric } from "./TechTreePrimitives";
import { TechTreeBuildOrder } from "./TechTreeBuildOrder";
import { TechTreeFilterRail } from "./TechTreeFilterRail";
import { TechTreeInspector } from "./TechTreeInspector";

export function TechTreeStrategyMap({
  goals,
  nodes,
  selectedNode,
  onStartWork,
}: {
  goals: Goal[];
  nodes: TechTreeNodeView[];
  selectedNode: TechTreeNodeView | null;
  onStartWork: (node: TechTreeNodeView) => void;
}) {
  return (
    <TheftSurface tone="panel" padding="none" className="overflow-hidden">
      <div className="theft-tech-tree-layout grid min-w-0 gap-4 p-4">
        <TechTreeFilterRail />
        <main className="min-w-0">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <TheftSectionHeader
              eyebrow="Build order"
              title="Strategy map"
              description="Company build order, dependencies, evidence, and next unlocks."
            />
            <div className="theft-tech-tree-stats grid grid-cols-3 gap-2 text-center">
              <TheftStat label="nodes" value={goals.length} />
              <TheftStat label="active" value={goals.filter((goal) => goal.status === "active").length} />
              <TheftStat label="done" value={goals.filter((goal) => goal.status === "achieved").length} />
            </div>
          </div>

          <TechTreeBuildOrder nodes={nodes} selectedNode={selectedNode} />

          <TheftSurface tone="plain" padding="md" className="mt-4">
            <TheftSectionHeader
              eyebrow="Recommended next move"
              title={selectedNode?.goal.title ?? "Create first build-order node"}
              actions={<TheftChip>High impact</TheftChip>}
            />
            <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
              <InspectorMetric label="Rationale" value={selectedNode?.nextAction ?? "Start the company roadmap"} />
              <InspectorMetric label="Impact" value="Unlocks downstream work" />
              <InspectorMetric label="Alternative" value="Route through Operator" />
            </div>
          </TheftSurface>
        </main>
        <TechTreeInspector
          node={selectedNode}
          onStartWork={() => {
            if (selectedNode) onStartWork(selectedNode);
          }}
        />
      </div>
    </TheftSurface>
  );
}
