"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

type Toast = {
  id: number;
  body: string;
  tone: "ok" | "warn" | "info";
  ttl: number;
};

let listener: ((t: Omit<Toast, "id">) => void) | null = null;

export function toast(body: string, tone: Toast["tone"] = "info") {
  listener?.({ body, tone, ttl: 4000 });
}

export default function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listener = (t) => {
      const id = Date.now() + Math.random();
      setItems((cur) => [...cur, { id, ...t }]);
      window.setTimeout(
        () => setItems((cur) => cur.filter((c) => c.id !== id)),
        t.ttl,
      );
    };
    return () => {
      listener = null;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1.5 pointer-events-none">
      {items.map((t) => (
        <ToastRow
          key={t.id}
          t={t}
          onClose={() => setItems((cur) => cur.filter((c) => c.id !== t.id))}
        />
      ))}
    </div>
  );
}

function ToastRow({ t, onClose }: { t: Toast; onClose: () => void }) {
  const Icon =
    t.tone === "ok" ? CheckCircle2 : t.tone === "warn" ? AlertCircle : Info;
  const toneClass =
    t.tone === "ok"
      ? "border-sage/60 bg-sage/15 text-sage-ink"
      : t.tone === "warn"
        ? "border-mustard/60 bg-mustard/15 text-mustard-ink"
        : "border-line bg-paper text-ink";
  return (
    <div
      className={`pointer-events-auto inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs shadow-md ${toneClass}`}
    >
      <Icon className="size-3.5" />
      <span>{t.body}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="opacity-60 hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
