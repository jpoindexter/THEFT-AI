import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { agentsApi } from "../api/agents";
import { goalsApi } from "../api/goals";
import { issuesApi } from "../api/issues";
import { projectsApi } from "../api/projects";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { TechTreeStrategyMap, TheftPageShell } from "@/components/theft";
import { Plus, Target } from "lucide-react";
import { buildTechTreeNodeViews, getNextTechTreeNode } from "../lib/techTree";

export function Goals() {
  const { selectedCompanyId } = useCompany();
  const { openNewGoal, openNewIssue } = useDialogActions();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "Tech Tree" }]);
  }, [setBreadcrumbs]);

  const { data: goals, isLoading, error } = useQuery({
    queryKey: queryKeys.goals.list(selectedCompanyId!),
    queryFn: () => goalsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: issues } = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const techTreeNodes = buildTechTreeNodeViews({
    goals: goals ?? [],
    agents: agents ?? [],
    projects: projects ?? [],
    issues: issues ?? [],
  });
  const nextNode = getNextTechTreeNode(techTreeNodes);

  if (!selectedCompanyId) {
    return <EmptyState icon={Target} message="Select a company to view the Tech Tree." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <TheftPageShell
      eyebrow="Strategy map / Tech Tree"
      title="Tech Tree"
      description="Company build order, dependencies, evidence, and next unlocks."
      actions={(
        <Button size="sm" variant="outline" onClick={() => openNewGoal()}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Node
        </Button>
      )}
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-destructive">{error.message}</p>}

        {goals && goals.length === 0 && (
          <EmptyState icon={Target} message="No Tech Tree nodes yet." action="Add Node" onAction={() => openNewGoal()} />
        )}

        {goals && goals.length > 0 && (
          <TechTreeStrategyMap
            goals={goals}
            nodes={techTreeNodes}
            selectedNode={nextNode}
            onStartWork={(node) => {
              openNewIssue({
                goalId: node.goal.id,
                title: node.startWorkTitle,
                description: `Advance Tech Tree node: ${node.goal.title}`,
              });
            }}
          />
        )}
      </div>
    </TheftPageShell>
  );
}
