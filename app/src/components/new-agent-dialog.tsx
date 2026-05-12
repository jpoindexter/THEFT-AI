"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Search, Plus, X, Check } from "lucide-react";

const DEFAULT_APPS = ["Supabase", "Vercel", "GitHub"] as const;
type AppKey = (typeof DEFAULT_APPS)[number];

const APP_DESCRIPTIONS: Record<AppKey, string> = {
  Supabase: "Manage your Supabase database tables and data",
  Vercel: "Manage Vercel deployments, projects, and DNS",
  GitHub: "Use this integration to receive events from GitHub repositories including commits, pull requests, reviews, comments, and CI/CD workflow events.",
};

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
] as const;
type ModelId = (typeof MODELS)[number]["id"];

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

export default function NewAgentDialog({
  organization,
  defaultDepartment,
  open,
  onOpenChange,
  onCreated,
}: {
  organization: { id: string; slug: string };
  defaultDepartment: string;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [apps, setApps] = useState<AppKey[]>([...DEFAULT_APPS]);
  const [skills, setSkills] = useState<string[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState(false);
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setApps([...DEFAULT_APPS]);
      setSkills([]);
      setScheduledTasks(false);
      setModel("claude-sonnet-4-6");
      setInstructions("");
    }
  }, [open]);

  const dot = DEPT_DOT[defaultDepartment] ?? "bg-line";

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/${organization.slug}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role: name.trim(),
          department: defaultDepartment,
          model,
          instructions: instructions.trim() || null,
          attached_skills: skills,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      onCreated?.();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 bg-paper overflow-hidden">
        <DialogHeader className="px-6 py-3 border-b border-line/70">
          <DialogTitle className="text-xs text-ink-muted font-normal">New Agent</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Avatar + name */}
          <div className="space-y-3">
            <div className={`size-9 rounded-md ${dot}/40 border border-line/70 inline-flex items-center justify-center`}>
              <span className="size-3 rounded-sm bg-paper" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My agent"
              className="w-full text-2xl font-medium text-ink bg-transparent focus:outline-none placeholder:text-ink-soft"
            />
          </div>

          {/* Form rows */}
          <div className="space-y-3 text-sm">
            <FormRow label="Apps">
              <AppMultiselect value={apps} onChange={setApps} />
            </FormRow>

            <FormRow label="Skills">
              <SkillMultiselect value={skills} onChange={setSkills} />
            </FormRow>

            <FormRow label="Tasks">
              <Toggle
                on={scheduledTasks}
                onChange={setScheduledTasks}
                label="Scheduled tasks"
              />
            </FormRow>

            <FormRow label="Model">
              <ModelDropdown value={model} onChange={setModel} />
            </FormRow>
          </div>

          {/* Instructions */}
          <div className="pt-3 border-t border-line/70 space-y-2">
            <div className="text-sm text-ink-muted">Instructions</div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe what this agent does, what tools it uses, what artifacts it produces…"
              rows={6}
              className="w-full resize-y text-sm bg-transparent focus:outline-none placeholder:text-ink-soft leading-relaxed"
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-line/70 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm text-ink hover:border-line-strong"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!name.trim() || submitting}
            className="rounded-md bg-ink text-paper px-3 py-1.5 text-sm disabled:opacity-30 hover:opacity-90"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-start gap-3 min-h-[36px]">
      <div className="text-ink-muted pt-1.5">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2 text-ink"
    >
      <span className={`relative w-8 h-4 rounded-full transition-colors ${on ? "bg-ink" : "bg-line"}`}>
        <span className={`absolute top-0.5 size-3 rounded-full bg-paper transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
      <span className="text-sm text-ink-muted">{label}</span>
    </button>
  );
}

function AppMultiselect({ value, onChange }: { value: AppKey[]; onChange: (v: AppKey[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function toggle(app: AppKey) {
    onChange(value.includes(app) ? value.filter((a) => a !== app) : [...value, app]);
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md border border-line/70 bg-paper px-2.5 py-1 text-sm text-ink-muted hover:border-line-strong"
        >
          Add apps
          <ChevronDown className="size-3" />
        </button>
        {open && (
          <div className="absolute top-full mt-1 left-0 z-50 w-80 rounded-lg border border-line/80 bg-paper shadow-md overflow-hidden">
            <div className="p-2 border-b border-line/70">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" />
                <input
                  placeholder="Search apps…"
                  className="w-full pl-7 pr-2 py-1.5 text-sm bg-canvas rounded-md focus:outline-none placeholder:text-ink-soft"
                />
              </div>
            </div>
            <div className="py-1">
              {DEFAULT_APPS.map((app) => {
                const checked = value.includes(app);
                return (
                  <button
                    key={app}
                    type="button"
                    onClick={() => toggle(app)}
                    className="w-full flex items-start gap-2 px-3 py-2 hover:bg-canvas text-left"
                  >
                    <span className={`mt-0.5 size-4 rounded-sm border ${checked ? "bg-ink border-ink" : "border-line/70 bg-paper"} inline-flex items-center justify-center shrink-0`}>
                      {checked && <Check className="size-3 text-paper" />}
                    </span>
                    <span className="flex-1">
                      <div className="text-sm text-ink">{app}</div>
                      <div className="text-xs text-ink-muted">{APP_DESCRIPTIONS[app]}</div>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-ink-muted hover:bg-canvas border-t border-line/70"
            >
              <Plus className="size-3.5" />
              Add more apps
            </button>
          </div>
        )}
      </div>
      {value.map((app) => (
        <span key={app} className="inline-flex items-center gap-1 rounded-md border border-line/70 bg-paper px-2 py-1 text-xs text-ink">
          {app}
          <button type="button" onClick={() => toggle(app)} className="text-ink-muted hover:text-ink">
            <X className="size-3" />
          </button>
        </span>
      ))}
    </>
  );
}

function SkillMultiselect({ value, onChange: _onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-line/70 bg-paper px-2.5 py-1 text-sm text-ink-muted hover:border-line-strong"
      >
        Add skills
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-80 rounded-lg border border-line/80 bg-paper shadow-md overflow-hidden">
          <div className="p-2 border-b border-line/70">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" />
              <input
                placeholder="Search skills…"
                className="w-full pl-7 pr-2 py-1.5 text-sm bg-canvas rounded-md focus:outline-none placeholder:text-ink-soft"
              />
            </div>
          </div>
          <div className="py-6 text-center text-sm text-ink-muted">No skills found</div>
          <button
            type="button"
            className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-ink-muted hover:bg-canvas border-t border-line/70"
          >
            <Plus className="size-3.5" />
            Add more skills
          </button>
        </div>
      )}
      {value.map((s) => (
        <span key={s} className="ml-1.5 inline-flex items-center gap-1 rounded-md border border-line/70 bg-paper px-2 py-1 text-xs text-ink">
          {s}
        </span>
      ))}
    </div>
  );
}

function ModelDropdown({ value, onChange }: { value: ModelId; onChange: (m: ModelId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = MODELS.find((m) => m.id === value)?.label ?? "Claude Sonnet 4.6";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-sm text-ink hover:bg-canvas"
      >
        {current}
        <ChevronDown className="size-3 text-ink-muted" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-56 rounded-lg border border-line/80 bg-paper shadow-md overflow-hidden">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m.id); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-canvas text-sm"
            >
              <span className="text-ink">{m.label}</span>
              {m.id === value && <Check className="size-3.5 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
