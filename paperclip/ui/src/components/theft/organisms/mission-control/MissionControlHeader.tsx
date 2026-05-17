import { Link } from "@/lib/router";
import { Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TheftChip, TheftSectionHeader, TheftStat } from "@/components/theft";
import type { DepartmentCanvasRow } from "@/lib/theft-canvas";
import { MissionControlPanel } from "./MissionControlPanel";

export function ObjectiveHeader({
  companyName,
  stage,
  objective,
  detail,
  departments,
  reviewCount,
  outcomeCount,
}: {
  companyName: string;
  stage: string | null;
  objective: string;
  detail: string;
  departments: DepartmentCanvasRow[];
  reviewCount: number;
  outcomeCount: number;
}) {
  const activeDepartments = departments.filter((department) => department.agent).length;

  return (
    <MissionControlPanel className="space-y-0 p-4 md:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center bg-secondary md:flex">
            <Target className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <TheftChip tone="muted" className="px-3 py-1">
                Objective
              </TheftChip>
              <span className="truncate">{companyName}</span>
              {stage ? <span>{stage}</span> : null}
            </div>
            <h1 className="mt-3 max-w-5xl break-words text-2xl font-medium leading-tight tracking-normal text-foreground md:text-3xl">
              {objective}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{detail}</p>
          </div>
        </div>
        <div className="theft-department-stat-grid grid w-full min-w-0 grid-cols-3 gap-2 lg:w-auto">
          <TheftStat
            value={activeDepartments}
            label="departments"
            surfaceTone="muted"
            className="px-4 py-3 text-center"
          />
          <TheftStat
            value={reviewCount}
            label="review"
            surfaceTone="muted"
            className="px-4 py-3 text-center"
          />
          <TheftStat
            value={outcomeCount}
            label="outcomes"
            surfaceTone="muted"
            className="px-4 py-3 text-center"
          />
        </div>
      </div>
    </MissionControlPanel>
  );
}

export function FreshCompanyPanel({ onAskOperator }: { onAskOperator: () => void }) {
  return (
    <MissionControlPanel className="theft-fresh-company-grid grid gap-5 p-5 md:p-6">
      <div className="min-w-0">
        <TheftSectionHeader
          eyebrow="Fresh company"
          title="No execution history yet"
          description="Start by asking Operator for the first concrete task. THEFT will route it to a department, capture the output, and save the result into Library."
        />
      </div>
      <div className="grid gap-2">
        <Button onClick={onAskOperator}>
          <Sparkles className="h-4 w-4" />
          Ask Operator for first move
        </Button>
        <Link
          to="/goals"
          className="border border-border bg-secondary px-4 py-2 text-center text-sm text-foreground no-underline hover:bg-accent"
        >
          Open Tech Tree
        </Link>
      </div>
    </MissionControlPanel>
  );
}
