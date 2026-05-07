"use client";

import { useEffect, useRef, useState } from "react";

type Transform = { x: number; y: number; scale: number };

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

export default function Canvas({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const dragStart = useRef<{
    x: number;
    y: number;
    transformX: number;
    transformY: number;
  } | null>(null);

  // wheel: cmd/ctrl+scroll = zoom around cursor; scroll = pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        setT((prev) => {
          const factor = Math.exp(-e.deltaY * 0.0015);
          const scale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
          if (scale === prev.scale) return prev;
          // zoom around cursor
          const ratio = scale / prev.scale;
          const x = cx - (cx - prev.x) * ratio;
          const y = cy - (cy - prev.y) * ratio;
          return { x, y, scale };
        });
      } else {
        e.preventDefault();
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
    // only middle-click or background drag (target IS the container)
    const target = e.target as HTMLElement;
    if (target.closest("[data-canvas-pan-block]")) return;
    if (e.button !== 0 && e.button !== 1) return;
    if (target !== e.currentTarget && !target.hasAttribute("data-canvas-bg")) {
      // allow dragging if user clicked the background or transformed wrapper
      const wrapper = target.closest("[data-canvas-wrapper]");
      if (wrapper && wrapper === target) {
        // ok
      } else if (
        target === e.currentTarget ||
        target.hasAttribute("data-canvas-bg")
      ) {
        // ok
      } else {
        return;
      }
    }
    e.currentTarget.setPointerCapture(e.pointerId);
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
      className={`relative overflow-hidden ${dragStart.current ? "cursor-grabbing" : "cursor-grab"} ${className ?? ""}`}
      data-canvas-bg
    >
      <div
        data-canvas-wrapper
        className="absolute inset-0 origin-center"
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
          transition: dragStart.current
            ? "none"
            : "transform 80ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        {children}
      </div>

      {/* zoom indicator */}
      <button
        type="button"
        onClick={reset}
        className="absolute top-3 right-3 rounded-md bg-paper border border-line/70 px-2 py-1 text-xs text-ink-muted hover:border-line-strong inline-flex items-center gap-1"
        data-canvas-pan-block
      >
        {Math.round(t.scale * 100)}%
      </button>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
