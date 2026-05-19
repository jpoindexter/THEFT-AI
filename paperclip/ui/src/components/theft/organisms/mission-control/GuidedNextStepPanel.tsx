import { ArrowRight, Bot, Library, Route, Sparkles } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { TheftChip, TheftSectionHeader } from "@/components/theft";
import { MissionControlPanel } from "./MissionControlPanel";
import type { MissionControlNextStep, MissionControlPlanSummary } from "./missionControlNextStep";

export function GuidedNextStepPanel({
  nextStep,
  planSummary,
  onAskOperator,
}: {
  nextStep: MissionControlNextStep;
  planSummary: MissionControlPlanSummary;
  onAskOperator: () => void;
}) {
  const primaryAction = nextStep.actionHref ? (
    <Button asChild size="sm">
      <Link to={nextStep.actionHref}>
        {nextStep.actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  ) : (
    <Button size="sm" onClick={onAskOperator}>
      <Bot className="h-4 w-4" />
      {nextStep.actionLabel}
    </Button>
  );

  return (
    <MissionControlPanel className="space-y-4 p-4 md:p-5">
      <TheftSectionHeader
        eyebrow="Operator guide"
        title={nextStep.title}
        description={nextStep.description}
        actions={<TheftChip tone="info">{nextStep.eyebrow}</TheftChip>}
      />

      <div className="grid gap-3 md:flex md:items-end md:justify-between">
        <div className="grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-3">
          <WorkflowStep icon={<Sparkles />} title="Idea" detail="Founder context becomes company memory." />
          <WorkflowStep icon={<Route />} title="Departments" detail="Operator routes work to the right lead." />
          <WorkflowStep icon={<Library />} title="Library" detail="Finished output becomes reviewable artifact." />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {primaryAction}
          <Button variant="outline" size="sm" onClick={onAskOperator}>
            Explain this
          </Button>
        </div>
      </div>

      <div className="theft-surface-muted min-w-0 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TheftChip tone="muted">{planSummary.setupLabel}</TheftChip>
          <p className="min-w-0 break-words text-sm font-medium [overflow-wrap:anywhere]">
            {planSummary.title}
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{planSummary.detail}</p>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">{nextStep.secondaryLabel}</p>
    </MissionControlPanel>
  );
}

function WorkflowStep({
  icon,
  title,
  detail,
}: {
  icon: React.ReactElement;
  title: string;
  detail: string;
}) {
  return (
    <div className="theft-surface-plain min-w-0 p-3">
      <div className="flex items-center gap-2 text-foreground">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-2">{detail}</p>
    </div>
  );
}
