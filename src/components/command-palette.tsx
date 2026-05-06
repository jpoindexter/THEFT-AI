"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  Inbox,
  GitBranch,
  Sparkles,
  Receipt,
  Activity,
  Eye,
  CheckSquare,
  Calendar,
  DollarSign,
  Rocket,
  Database,
  Cable,
  Settings,
  Users,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Pill } from "@/components/ui/primitives";

type CmdItem = {
  id: string;
  label: string;
  hint?: string;
  Icon: React.ComponentType<{ className?: string }>;
  group: "Navigate" | "Create" | "Toggle";
  href?: string;
  shortcut?: string;
  action?: () => void;
};

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<CmdItem[]>(
    () => buildItems(params.org),
    [params.org],
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(needle) ||
        i.hint?.toLowerCase().includes(needle),
    );
  }, [items, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  function run(i: CmdItem) {
    onOpenChange(false);
    if (i.href) router.push(i.href);
    else i.action?.();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[active];
      if (target) run(target);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 bg-paper overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-line/70">
          <Search className="size-4 text-ink-soft" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search workspace, run a command…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-ink-soft"
          />
          <Pill>⌘K</Pill>
        </div>
        <CommandList items={filtered} active={active} onSelect={run} />
      </DialogContent>
    </Dialog>
  );
}

function CommandList({
  items,
  active,
  onSelect,
}: {
  items: CmdItem[];
  active: number;
  onSelect: (i: CmdItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-ink-muted">
        No matches.
      </div>
    );
  }
  const groups = ["Navigate", "Create", "Toggle"] as const;
  return (
    <ul className="max-h-[60vh] overflow-y-auto p-1.5">
      {groups.map((g) => {
        const rows = items.filter((i) => i.group === g);
        if (rows.length === 0) return null;
        return (
          <li key={g}>
            <div className="px-2 pt-2 pb-1 text-2xs uppercase tracking-wider text-ink-soft">
              {g}
            </div>
            <ul className="space-y-0.5">
              {rows.map((i) => {
                const idx = items.findIndex((x) => x.id === i.id);
                const on = idx === active;
                const Icon = i.Icon;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onMouseEnter={() => undefined}
                      onClick={() => onSelect(i)}
                      className={`w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                        on ? "bg-cream" : "hover:bg-canvas"
                      }`}
                    >
                      <Icon className="size-3.5 text-ink-muted shrink-0" />
                      <span className="flex-1 truncate text-ink">
                        {i.label}
                      </span>
                      {i.hint && (
                        <span className="text-xs text-ink-soft truncate">
                          {i.hint}
                        </span>
                      )}
                      {i.shortcut && <Pill>{i.shortcut}</Pill>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function buildItems(org: string): CmdItem[] {
  const nav = (id: string, label: string, href: string, Icon: CmdItem["Icon"], hint?: string): CmdItem => ({
    id,
    label,
    hint,
    Icon,
    group: "Navigate",
    href,
  });
  return [
    nav("home", "Home", `/${org}`, Sparkles),
    nav("review", "Review queue", `/${org}/review`, Eye, "⌘."),
    nav("approvals", "Approvals", `/${org}/approvals`, CheckSquare),
    nav("tasks", "Tasks", `/${org}/tasks`, CheckSquare),
    nav("agents", "Agents", `/${org}/agents`, Users),
    nav("library", "Library", `/${org}/library`, Inbox),
    nav("inbox", "Inbox", `/${org}/inbox`, Inbox),
    nav("activity", "Activity", `/${org}/activity`, Activity),
    nav("notifications", "Notifications", `/${org}/notifications`, Bell),
    nav("routines", "Routines", `/${org}/routines`, Calendar),
    nav("publishing", "Publishing", `/${org}/publishing`, Rocket),
    nav("costs", "Costs", `/${org}/costs`, DollarSign),
    nav("roadmap", "Roadmap", `/${org}/roadmap`, GitBranch),
    nav("integrations", "Integrations", `/${org}/integrations`, Cable),
    nav("database", "Database", `/${org}/database`, Database),
    nav("managed", "Managed services", `/${org}/managed-services`, ShieldCheck),
    nav("settings", "Settings", `/${org}/settings`, Settings),
    nav("billing", "Billing", `/${org}/settings/billing`, Receipt),
    {
      id: "new-task",
      label: "New task",
      Icon: CheckSquare,
      group: "Create",
      href: `/${org}/tasks/new`,
      shortcut: "N",
    },
    {
      id: "new-agent",
      label: "New agent",
      Icon: Users,
      group: "Create",
      href: `/${org}/agents/new`,
    },
    {
      id: "new-routine",
      label: "New routine",
      Icon: Calendar,
      group: "Create",
      href: `/${org}/routines/new`,
    },
    {
      id: "new-integration",
      label: "New custom integration",
      Icon: Cable,
      group: "Create",
      href: `/${org}/integrations/new`,
    },
    {
      id: "toggle-theme",
      label: "Toggle theme",
      Icon: Sparkles,
      group: "Toggle",
      action: () => {
        const root = document.documentElement;
        const next = root.classList.contains("dark") ? "light" : "dark";
        root.classList.toggle("dark");
        try {
          localStorage.setItem("theft-theme", next);
        } catch {}
      },
    },
  ];
}
