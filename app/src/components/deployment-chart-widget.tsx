"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Bucket = {
  timestamp: string;
  total: number;
  success: number;
  error: number;
  building: number;
};

type DeploymentsResponse = {
  buckets: Bucket[];
  is_connected: boolean;
  total_deployments: number;
  time_range_minutes: number;
};

type SeriesKey = "success" | "building" | "error";

type Props = {
  id: string;
  orgSlug: string;
  target: "production" | "preview";
  title: string;
  initialX: number;
  initialY: number;
  onClose: () => void;
};

const VBW = 480;
const VBH = 120;
const PAD = { l: 28, r: 8, t: 8, b: 26 };
const CW = VBW - PAD.l - PAD.r;
const CH = VBH - PAD.t - PAD.b;

const SERIES: { key: SeriesKey; color: string; label: string }[] = [
  { key: "success", color: "#4ade80", label: "Ready" },
  { key: "building", color: "#fb923c", label: "Building" },
  { key: "error", color: "#f87171", label: "Error" },
];

const Y_TICKS = [1, 0.75, 0.5, 0.25, 0];

function toX(i: number, n: number): number {
  return PAD.l + (i / Math.max(n - 1, 1)) * CW;
}

function toY(v: number): number {
  return PAD.t + CH * (1 - v);
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m} ${period}`;
}

export default function DeploymentChartWidget({
  id: _id,
  orgSlug,
  target,
  title,
  initialX,
  initialY,
  onClose,
}: Props) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [dragging, setDragging] = useState(false);
  const [buckets, setBuckets] = useState<Bucket[] | null>(null);
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch(
        `/api/${orgSlug}/deployments?target=${target}&time_range_minutes=60`
      );
      const json: DeploymentsResponse = await res.json();
      if (alive) setBuckets(json.buckets);
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [orgSlug, target]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const el = e.target as HTMLElement;
    if (el.closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setPos({
      x: drag.current.px + (e.clientX - drag.current.sx),
      y: drag.current.py + (e.clientY - drag.current.sy),
    });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
  }

  return (
    <div
      className={`absolute w-[370px] rounded-xl bg-paper border border-line/60 shadow-md overflow-hidden select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ left: pos.x, top: pos.y }}
      data-canvas-pan-block
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-line/50">
        <div className="flex items-center gap-1.5">
          <VercelMark />
          <span className="text-[10px] font-mono text-ink">Vercel</span>
          <span className="text-[9px] text-ink-muted ml-0.5">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-ink-muted tracking-widest uppercase">Last 1h</span>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink cursor-default"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      <div className="px-2 pt-1">
        {buckets ? (
          <DeployChart buckets={buckets} />
        ) : (
          <div className="h-[120px] flex items-center justify-center text-[10px] text-ink-muted">
            Loading…
          </div>
        )}
      </div>

      <div className="px-3 pb-1 flex items-center gap-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <span
              className="size-2 rounded-full inline-block shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-[9px] text-ink-muted">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="px-3 pb-2 flex items-center justify-between">
        <span className="text-[8px] text-ink-soft tracking-wider uppercase">Time Series</span>
        <span className="text-[8px] text-ink-soft tracking-wider uppercase">Refreshes Every 30s</span>
      </div>
    </div>
  );
}

function DeployChart({ buckets }: { buckets: Bucket[] }) {
  if (buckets.length === 0) return null;
  const n = buckets.length;

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-full" aria-hidden>
      {Y_TICKS.map((v) => (
        <g key={v}>
          <line
            x1={PAD.l} x2={VBW - PAD.r}
            y1={toY(v)} y2={toY(v)}
            stroke="#e5e7eb" strokeWidth="0.5"
          />
          <text
            x={PAD.l - 3} y={toY(v) + 2}
            textAnchor="end" fontSize="5.5" fill="#9ca3af"
          >
            {v}
          </text>
        </g>
      ))}

      {buckets.map((b, i) =>
        i % 8 === 0 ? (
          <text
            key={i}
            x={toX(i, n)}
            y={VBH - 4}
            textAnchor="middle"
            fontSize="5.5"
            fill="#9ca3af"
          >
            {formatTime(b.timestamp)}
          </text>
        ) : null
      )}

      {SERIES.map((s) => (
        <polyline
          key={s.key}
          points={buckets.map((b, i) => `${toX(i, n)},${toY(b[s.key])}`).join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      ))}

      {SERIES.flatMap((s) =>
        buckets.flatMap((b, i) =>
          b[s.key] > 0
            ? [<circle key={`${s.key}-${i}`} cx={toX(i, n)} cy={toY(b[s.key])} r="2" fill={s.color} />]
            : []
        )
      )}
    </svg>
  );
}

function VercelMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-ink shrink-0">
      <path d="M12 2L2 20h20L12 2z" />
    </svg>
  );
}
