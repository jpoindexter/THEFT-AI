"use client";

import { useState } from "react";
import NewTaskDialog from "@/components/new-task-dialog";

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

export default function TaskContextBar({
  organization,
  agentName,
  taskTitle,
  deptSlug,
}: {
  organization: { id: string; slug: string };
  agentName: string | null;
  taskTitle?: string;
  deptSlug: string | null;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const dotClass = DEPT_DOT[deptSlug ?? ""] ?? "bg-mustard";

  return (
    <>
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-full bg-ink/85 backdrop-blur-sm px-3.5 py-1.5 text-paper text-xs">
          <span className={`size-2 rounded-full shrink-0 ${dotClass}`} />
          <span className="font-medium">{agentName ?? "Agent"}</span>
          {taskTitle && (
            <>
              <span className="text-paper/40 select-none mx-0.5">|</span>
              <span className="text-paper/70 truncate max-w-[200px]">{taskTitle}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="rounded-full bg-ink/85 backdrop-blur-sm px-3 py-1.5 text-paper text-xs font-medium hover:bg-ink transition-colors"
        >
          + New Task
        </button>
      </div>
      <NewTaskDialog
        organization={organization}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
