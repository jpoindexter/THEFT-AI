"use client";

import { useState } from "react";

type DataPoint = { date: string; tokens: number };

const W = 780;
const H = 180;
const PAD = { top: 12, right: 16, bottom: 32, left: 40 };

function fmt(n: number) {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

export function BillingTokenChart({ data }: { data: DataPoint[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; pt: DataPoint } | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-ink-muted">
        No token data for this period
      </div>
    );
  }

  const maxTokens = Math.max(...data.map((d) => d.tokens), 1);
  const yMax = Math.ceil((maxTokens * 1.2) / 10000) * 10000;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) =>
    data.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (data.length - 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  const pts = data.map((d, i) => ({ x: xScale(i), y: yScale(d.tokens), d }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") +
    ` L${pts[pts.length - 1].x},${PAD.top + innerH} L${pts[0].x},${PAD.top + innerH} Z`;

  const yTicks = [0, yMax / 2, yMax];

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let closest = pts[0];
    for (const p of pts) {
      if (Math.abs(p.x - mx) < Math.abs(closest.x - mx)) closest = p;
    }
    setTooltip({ x: closest.x, y: closest.y, pt: closest.d });
  }

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[180px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={yScale(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#9ca3af"
            >
              {v === 0 ? "0" : fmt(v)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#area-grad)" />
        <path d={linePath} fill="none" stroke="#000" strokeWidth="1.5" />

        {data.map((_, i) => {
          const d = new Date(data[i].date);
          return (
            <text
              key={i}
              x={xScale(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          );
        })}

        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              x2={tooltip.x}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="#000"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r="3" fill="#000" />
          </>
        )}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-paper border border-line shadow-sm px-2.5 py-1.5 text-xs"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <div className="font-medium">{fmtDate(tooltip.pt.date)}</div>
          <div className="text-ink-muted">{tooltip.pt.tokens.toLocaleString()} Tokens</div>
        </div>
      )}
    </div>
  );
}
