"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckSquare,
  Brain,
  Sparkles,
  GitBranch,
  Inbox,
  Calendar,
  Wrench,
  Cpu,
} from "lucide-react";

export type SlashCommand = {
  key: string;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const COMMANDS: SlashCommand[] = [
  {
    key: "task",
    label: "/task",
    hint: "Create a task from this message",
    Icon: CheckSquare,
  },
  {
    key: "memory",
    label: "/memory",
    hint: "Pin this as durable company memory",
    Icon: Brain,
  },
  {
    key: "skill",
    label: "/skill",
    hint: "Search attached skills",
    Icon: Sparkles,
  },
  {
    key: "node",
    label: "/node",
    hint: "Reference a tech-tree node",
    Icon: GitBranch,
  },
  {
    key: "inbox",
    label: "/inbox",
    hint: "Forward an inbound thread",
    Icon: Inbox,
  },
  {
    key: "routine",
    label: "/routine",
    hint: "Schedule this as a recurring routine",
    Icon: Calendar,
  },
  {
    key: "tool",
    label: "/tool",
    hint: "Call a specific tool by name",
    Icon: Wrench,
  },
  {
    key: "agent",
    label: "/agent",
    hint: "Hand off to a different agent",
    Icon: Cpu,
  },
];

export default function SlashMenu({
  q,
  onPick,
  onClose,
}: {
  q: string;
  onPick: (cmd: SlashCommand) => void;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const filtered = !q
    ? COMMANDS
    : COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(q.toLowerCase()) ||
          c.hint.toLowerCase().includes(q.toLowerCase()),
      );

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === "Enter" || e.key === "Tab") {
        const target = filtered[active];
        if (target) {
          e.preventDefault();
          onPick(target);
        }
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [filtered, active, onPick, onClose]);

  if (filtered.length === 0) {
    return (
      <div
        ref={ref}
        className="absolute bottom-full mb-1 left-0 w-64 rounded-md bg-paper border border-line/70 shadow-md p-3 text-xs text-ink-muted z-50"
      >
        No commands match.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-1 left-0 w-64 rounded-md bg-paper border border-line/70 shadow-md p-1 z-50"
    >
      <ul className="space-y-0.5">
        {filtered.map((c, i) => {
          const Icon = c.Icon;
          const on = i === active;
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onPick(c)}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                  on ? "bg-cream" : "hover:bg-canvas"
                }`}
              >
                <Icon className="size-3.5 text-ink-muted" />
                <span className="font-mono">{c.label}</span>
                <span className="ml-auto text-ink-soft truncate">{c.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
