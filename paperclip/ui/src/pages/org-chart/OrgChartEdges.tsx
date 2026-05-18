import { CARD_H, CARD_W, type OrgChartEdge, type Point } from "./orgChartModel";

interface OrgChartEdgesProps {
  edges: OrgChartEdge[];
  pan: Point;
  zoom: number;
}

export function OrgChartEdges({ edges, pan, zoom }: OrgChartEdgesProps) {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full">
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {edges.map(({ parent, child }) => {
          const x1 = parent.x + CARD_W / 2;
          const y1 = parent.y + CARD_H;
          const x2 = child.x + CARD_W / 2;
          const y2 = child.y;
          const midY = (y1 + y2) / 2;

          return (
            <path
              key={`${parent.id}-${child.id}`}
              d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1.5}
            />
          );
        })}
      </g>
    </svg>
  );
}
