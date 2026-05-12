"use client";

import { X } from "lucide-react";
import { NODE_META, FALLBACK } from "./how-to-build-node-meta";

type NodeStatus = "locked" | "available" | "in_progress" | "complete";
export type RoadmapNode = {
  id: string; slug: string; stage: string; title: string;
  position: number;
  description: string | null; what_becomes_true: string | null;
  how_to_move_forward: string | null; checklist_item: string | null;
  agent_can_do_this: boolean;
  external_cta: { label: string; url: string } | null;
  dependencies: string[]; status: NodeStatus;
};

export function DetailDrawer({ node, allNodes, onClose, orgSlug }: {
  node: RoadmapNode; allNodes: RoadmapNode[]; onClose: () => void; orgSlug: string;
}) {
  const { icon: Icon, color } = NODE_META[node.slug] ?? FALLBACK;
  const deps = node.dependencies.map((id) => allNodes.find((n) => n.id === id)).filter((n): n is RoadmapNode => Boolean(n));
  const unblocks = allNodes.filter((n) => n.dependencies.includes(node.id));
  const blockedBy = deps.filter((d) => d.status !== "complete");
  const isBlocked = node.status === "locked" && blockedBy.length > 0;
  const canLaunch = node.agent_can_do_this && (node.status === "available" || node.status === "in_progress");

  async function markComplete() {
    await fetch(`/api/${orgSlug}/roadmap/${node.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "complete" }),
    });
    window.location.reload();
  }

  async function launchAgent() {
    await fetch(`/api/${orgSlug}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: node.how_to_move_forward ?? node.title,
      }),
    });
    window.location.reload();
  }

  return (
    <div className="absolute right-0 top-[57px] bottom-0 w-72 bg-paper border-l border-line/70 overflow-y-auto z-10 flex flex-col">
      <div className="px-4 py-3 border-b border-line/70 flex items-center justify-between shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">{node.stage}</span>
        <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="Close">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-5 flex-1">
        <div className="space-y-2">
          <div className={`size-8 rounded-md flex items-center justify-center ${color}`}><Icon className="size-4" /></div>
          <h2 className="text-base font-medium text-ink leading-snug">{node.what_becomes_true ?? node.title}</h2>
          <div className="flex flex-wrap gap-1.5">
            <Pill>{node.title}</Pill>
            <Pill>{node.agent_can_do_this ? "Agent can do this" : "Needs your input"}</Pill>
          </div>
        </div>

        {isBlocked && (
          <Section label="Locked context">
            <p className="text-xs text-ink-muted leading-relaxed">
              Needs earlier steps first. Complete {blockedBy.length} prerequisite{blockedBy.length !== 1 ? "s" : ""} before this is ready.
            </p>
          </Section>
        )}

        {node.how_to_move_forward && (
          <Section label="How to move this forward">
            <p className="text-xs text-ink-muted leading-relaxed">{node.how_to_move_forward}</p>
          </Section>
        )}

        {node.checklist_item && (
          <Section label="To complete">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Dot done={node.status === "complete"} />
              <span className="flex-1 min-w-0 truncate">{node.checklist_item}</span>
              {node.status === "complete" && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">Done</span>
              )}
              {node.status === "locked" && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium bg-canvas text-ink-soft border-line/60 shrink-0">Waiting</span>
              )}
              {(node.status === "available" || node.status === "in_progress") && node.agent_can_do_this && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">Launch</span>
              )}
              {(node.status === "available" || node.status === "in_progress") && !node.agent_can_do_this && (
                <button type="button" onClick={() => { void markComplete(); }} className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium bg-canvas text-ink border-line/70 hover:border-line-strong shrink-0">Go</button>
              )}
            </div>
          </Section>
        )}

        {deps.length > 0 && (
          <Section label="Required first">
            <div className="space-y-1.5">
              {deps.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <div className={`size-3 rounded-full border shrink-0 ${d.status === "complete" ? "border-emerald-400 bg-emerald-400" : "border-line/70"}`} />
                  <span className="truncate flex-1">{d.title}</span>
                  {d.status !== "complete" && (
                    <span className="text-[9px] uppercase tracking-wider text-ink-soft border border-line/60 rounded px-1 shrink-0">{d.stage}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {unblocks.length > 0 && (
          <Section label="Completing this unlocks">
            <div className="space-y-1.5">
              {unblocks.map((u) => (
                <div key={u.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <div className="size-3 rounded-full border border-line/70 shrink-0" />
                  <span className="truncate flex-1">{u.title}</span>
                  <span className="text-[9px] uppercase tracking-wider text-ink-soft border border-line/60 rounded px-1 shrink-0">{u.stage}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {(canLaunch || node.external_cta) && (
        <div className="p-4 border-t border-line/70 shrink-0 space-y-2">
          {canLaunch && (
            <button type="button" onClick={() => { void launchAgent(); }} className="w-full py-2 rounded-lg bg-ink text-paper text-sm font-medium hover:opacity-90 transition-opacity">
              Launch Agent
            </button>
          )}
          {node.external_cta && (
            <a href={node.external_cta.url} target="_blank" rel="noopener noreferrer"
              className="w-full py-2 rounded-lg border border-line/70 text-ink text-sm font-medium hover:border-line-strong transition-colors flex items-center justify-center">
              {node.external_cta.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">{label}</div>
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] text-ink-muted border border-line/70 rounded-full px-2 py-0.5">{children}</span>;
}

function Dot({ done }: { done: boolean }) {
  return (
    <div className={`size-3.5 rounded-full border flex items-center justify-center shrink-0 ${done ? "border-emerald-400 bg-emerald-50" : "border-line/70"}`}>
      {done && <div className="size-2 rounded-full bg-emerald-400" />}
    </div>
  );
}
