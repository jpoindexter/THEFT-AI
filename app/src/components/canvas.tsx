"use client";

import { useEffect, useRef, useState } from "react";

type Transform = { x: number; y: number; scale: number };

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

export default function Canvas({
  children,
  className,
  overlay,
}: {
  children: React.ReactNode;
  className?: string;
  overlay?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{
    x: number;
    y: number;
    transformX: number;
    transformY: number;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        setT((prev) => {
          const factor = Math.exp(-e.deltaY * 0.0015);
          const scale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
          if (scale === prev.scale) return prev;
          const ratio = scale / prev.scale;
          return {
            x: cx - (cx - prev.x) * ratio,
            y: cy - (cy - prev.y) * ratio,
            scale,
          };
        });
      } else {
        setT((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-canvas-pan-block]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      transformX: t.x,
      transformY: t.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    setT((prev) => ({
      ...prev,
      x: dragStart.current!.transformX + (e.clientX - dragStart.current!.x),
      y: dragStart.current!.transformY + (e.clientY - dragStart.current!.y),
    }));
  }

  function onPointerUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStart.current = null;
    setIsDragging(false);
  }

  function reset() {
    setT({ x: 0, y: 0, scale: 1 });
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`overflow-hidden select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${className ?? ""}`}
    >
      <div
        className="absolute inset-0 origin-center"
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
          transition: isDragging ? "none" : "transform 80ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={reset}
        data-canvas-pan-block
        className="absolute top-3 right-3 rounded-md bg-paper border border-line/70 px-2 py-1 text-xs text-ink-muted hover:border-line-strong inline-flex items-center gap-1"
      >
        {Math.round(t.scale * 100)}%
      </button>

      {overlay}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
