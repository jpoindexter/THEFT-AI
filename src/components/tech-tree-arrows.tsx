"use client";

import { useEffect, useRef, useState } from "react";

type Edge = { from: string; to: string };

type Box = { id: string; left: number; top: number; right: number; bottom: number };

export default function TechTreeArrows({
  edges,
  containerRef,
}: {
  edges: Edge[];
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const [boxes, setBoxes] = useState<Map<string, Box>>(new Map());
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const next = new Map<string, Box>();
      container.querySelectorAll<HTMLElement>("[data-tt-node]").forEach((el) => {
        const id = el.dataset.ttNode;
        if (!id) return;
        const r = el.getBoundingClientRect();
        next.set(id, {
          id,
          left: r.left - cRect.left,
          top: r.top - cRect.top + container.scrollTop,
          right: r.right - cRect.left,
          bottom: r.bottom - cRect.top + container.scrollTop,
        });
      });
      setBoxes(next);
      setSize({ w: container.scrollWidth, h: container.scrollHeight });
    }

    function schedule() {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    }

    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    container.querySelectorAll<HTMLElement>("[data-tt-node]").forEach((el) => {
      ro.observe(el);
    });
    container.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      container.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  const paths = edges
    .map((e) => {
      const a = boxes.get(e.from);
      const b = boxes.get(e.to);
      if (!a || !b) return null;
      const x1 = a.right;
      const y1 = (a.top + a.bottom) / 2;
      const x2 = b.left;
      const y2 = (b.top + b.bottom) / 2;
      const midX = x1 + (x2 - x1) * 0.5;
      const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
      return { id: `${e.from}->${e.to}`, d };
    })
    .filter(Boolean) as { id: string; d: string }[];

  if (size.w === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none text-line-strong/60"
      width={size.w}
      height={size.h}
      style={{ width: size.w, height: size.h }}
      aria-hidden
    >
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
