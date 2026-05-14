"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link2, ChevronDown, Check } from "lucide-react";

type Agent = {
  id: string;
  slug: string;
  name: string;
  department_id: string | null;
};

type Department = { id: string; slug: string };

const DEPT_DOT: Record<string, string> = {
  engineering: "bg-[#c8a87a]",
  design: "bg-[#7ab4c8]",
  marketing: "bg-[#e0907a]",
  sales: "bg-[#7ac87a]",
  operations: "bg-[#7ac8b4]",
  finance: "bg-[#9a7ac8]",
  legal: "bg-[#4a5a6a]",
  support: "bg-[#e0a050]",
};

export default function NewTaskDialog({
  organization,
  open,
  onOpenChange,
  onCreated,
}: {
  organization: { id: string; slug: string };
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated?: () => void;
}) {
  const [description, setDescription] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deptSlugById, setDeptSlugById] = useState<Record<string, string>>({});
  const [agentId, setAgentId] = useState<string | "auto">("auto");
  const [mode, setMode] = useState<"plan" | "execute">("execute");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      fetch(`/api/${organization.slug}/agents`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/departments`).then((r) => r.json()),
    ]).then(([agentsJson, deptsJson]) => {
      setAgents(agentsJson.agents ?? []);
      const map: Record<string, string> = {};
      for (const d of (deptsJson.departments ?? []) as Department[]) {
        map[d.id] = d.slug;
      }
      setDeptSlugById(map);
    });
  }, [organization.slug, open]);

  async function submit() {
    setSubmitting(true);
    try {
      await fetch(`/api/${organization.slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          agentId: agentId === "auto" ? null : agentId,
          mode,
        }),
      });
      onCreated?.();
      onOpenChange(false);
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAgent = agents.find((a) => a.id === agentId);
  const agentLabel = selectedAgent?.name ?? "Auto-assign";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 bg-paper">
        <DialogHeader className="sr-only">
          <DialogTitle>Create a task</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <textarea
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (description.trim() && !submitting) void submit();
              }
            }}
            placeholder="Describe a task for your agent…"
            rows={5}
            className="w-full resize-none text-base focus:outline-none placeholder:text-ink-soft"
          />
        </div>
        <div className="flex items-center gap-1.5 border-t border-line/80 px-2 py-2 text-xs flex-wrap">
          <PillBtn
            icon={<Link2 className="size-3" />}
            label="Add files"
          />
          <ModeDropdown mode={mode} onChange={setMode} />
          <AgentDropdown
            agents={agents}
            deptSlugById={deptSlugById}
            value={agentId}
            label={agentLabel}
            onChange={setAgentId}
          />
          <AppDropdown />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!description.trim() || submitting}
            className="rounded-md bg-ink text-paper px-3 py-1 text-xs disabled:opacity-30 hover:opacity-90"
          >
            {submitting ? "Creating…" : "Create Task"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PillBtn({
  icon,
  label,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-line/80 bg-paper px-2 py-1 hover:border-line-strong transition-colors text-ink"
    >
      {icon}
      {label}
    </button>
  );
}

function ModeDropdown({
  mode,
  onChange,
}: {
  mode: "execute" | "plan";
  onChange: (m: "execute" | "plan") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md border border-line/80 bg-paper px-2 py-1 hover:border-line-strong transition-colors text-ink"
      >
        {mode === "execute" ? "Execute" : "Plan"}
        <ChevronDown className="size-3 text-ink-muted" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-44 rounded-lg border border-line/80 bg-paper shadow-md overflow-hidden">
          <div className="px-3 py-1.5 text-2xs text-ink-soft border-b border-line/70">
            Agent will execute your request immediately
          </div>
          {(["execute", "plan"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { onChange(m); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-canvas text-sm capitalize"
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
              {mode === m && <Check className="size-3 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentDropdown({
  agents,
  deptSlugById,
  value,
  label,
  onChange,
}: {
  agents: Agent[];
  deptSlugById: Record<string, string>;
  value: string;
  label: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md border border-line/80 bg-paper px-2 py-1 hover:border-line-strong transition-colors text-ink"
      >
        {label}
        <ChevronDown className="size-3 text-ink-muted" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-44 rounded-lg border border-line/80 bg-paper shadow-md overflow-hidden">
          <div className="px-3 py-1.5 text-2xs text-ink-soft border-b border-line/70">
            Your Agents
          </div>
          <button
            type="button"
            onClick={() => { onChange("auto"); setOpen(false); }}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-canvas text-sm"
          >
            Auto-assign
            {value === "auto" && <Check className="size-3 text-ink" />}
          </button>
          {agents.map((a) => {
            const deptSlug = a.department_id ? (deptSlugById[a.department_id] ?? "") : "";
            const dotColor = DEPT_DOT[deptSlug] ?? "bg-mustard/60";
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => { onChange(a.id); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-canvas text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={`size-2 rounded-full inline-block ${dotColor}`} />
                  {a.name}
                </span>
                {value === a.id && <Check className="size-3 text-ink" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppDropdown() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("App");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const options = ["App", "Marketing Website"];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md border border-line/80 bg-paper px-2 py-1 hover:border-line-strong transition-colors text-ink"
      >
        {selected}
        <ChevronDown className="size-3 text-ink-muted" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-44 rounded-lg border border-line/80 bg-paper shadow-md overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setSelected(opt); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-canvas text-sm"
            >
              {opt}
              {selected === opt && <Check className="size-3 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
