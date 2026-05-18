import { useEffect } from "react";
import { useParams } from "@/lib/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentsApi } from "../api/agents";
import { goalsApi } from "../api/goals";
import { projectsApi } from "../api/projects";
import { assetsApi } from "../api/assets";
import { issuesApi } from "../api/issues";
import { usePanel } from "../context/PanelContext";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { GoalProperties } from "../components/GoalProperties";
import { StatusBadge } from "../components/StatusBadge";
import { InlineEditor } from "../components/InlineEditor";
import { EntityRow } from "../components/EntityRow";
import { PageSkeleton } from "../components/PageSkeleton";
import { TechTreeEvidenceGate, TechTreeLinkRow, TechTreeMetric, TheftWorkbenchTemplate } from "@/components/theft";
import { buildTechTreeNodeViews } from "../lib/techTree";
import { projectUrl } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, FileText, GitBranch, Plus, Route, Users } from "lucide-react";
import { GoalPropertiesToggleButton } from "./goal-detail/GoalPropertiesToggleButton";
import { getGoalLinkedIssues, getGoalLinkedProjects } from "./goal-detail/goalDetailLinks";

export { GoalPropertiesToggleButton } from "./goal-detail/GoalPropertiesToggleButton";
export { getGoalLinkedIssues, getGoalLinkedProjects } from "./goal-detail/goalDetailLinks";

export function GoalDetail() {
  const { goalId } = useParams<{ goalId: string }>();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { openNewGoal, openNewIssue } = useDialogActions();
  const { openPanel, closePanel, panelVisible, setPanelVisible } = usePanel();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();

  const {
    data: goal,
    isLoading,
    error
  } = useQuery({
    queryKey: queryKeys.goals.detail(goalId!),
    queryFn: () => goalsApi.get(goalId!),
    enabled: !!goalId
  });
  const resolvedCompanyId = goal?.companyId ?? selectedCompanyId;

  const { data: allGoals } = useQuery({
    queryKey: queryKeys.goals.list(resolvedCompanyId!),
    queryFn: () => goalsApi.list(resolvedCompanyId!),
    enabled: !!resolvedCompanyId
  });

  const { data: allProjects } = useQuery({
    queryKey: queryKeys.projects.list(resolvedCompanyId!),
    queryFn: () => projectsApi.list(resolvedCompanyId!),
    enabled: !!resolvedCompanyId
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(resolvedCompanyId!),
    queryFn: () => agentsApi.list(resolvedCompanyId!),
    enabled: !!resolvedCompanyId
  });

  const { data: allIssues } = useQuery({
    queryKey: queryKeys.issues.list(resolvedCompanyId!),
    queryFn: () => issuesApi.list(resolvedCompanyId!),
    enabled: !!resolvedCompanyId
  });

  useEffect(() => {
    if (!goal?.companyId || goal.companyId === selectedCompanyId) return;
    setSelectedCompanyId(goal.companyId, { source: "route_sync" });
  }, [goal?.companyId, selectedCompanyId, setSelectedCompanyId]);

  const updateGoal = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      goalsApi.update(goalId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.detail(goalId!)
      });
      if (resolvedCompanyId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.list(resolvedCompanyId)
        });
      }
    }
  });

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      if (!resolvedCompanyId) throw new Error("No company selected");
      return assetsApi.uploadImage(
        resolvedCompanyId,
        file,
        `goals/${goalId ?? "draft"}`
      );
    }
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Tech Tree", href: "/goals" },
      { label: goal?.title ?? goalId ?? "Node" }
    ]);
  }, [setBreadcrumbs, goal, goalId]);

  useEffect(() => {
    if (goal) {
      openPanel(
        <GoalProperties
          goal={goal}
          onUpdate={(data) => updateGoal.mutate(data)}
        />
      );
    }
    return () => closePanel();
  }, [goal]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <PageSkeleton variant="detail" />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!goal) return null;

  const childGoals = (allGoals ?? []).filter((g) => g.parentId === goalId);
  const linkedProjects = goalId ? getGoalLinkedProjects(goalId, allProjects ?? []) : [];
  const linkedIssues = goalId ? getGoalLinkedIssues(goalId, allIssues ?? []) : [];
  const nodeView = buildTechTreeNodeViews({
    goals: allGoals ?? [goal],
    agents: agents ?? [],
    projects: allProjects ?? [],
    issues: allIssues ?? [],
  }).find((node) => node.goal.id === goalId);
  const doneIssueCount = linkedIssues.filter((issue) => issue.status === "done").length;
  const openIssueCount = linkedIssues.filter((issue) => !["done", "cancelled"].includes(issue.status)).length;

  return (
    <TheftWorkbenchTemplate contentClassName="block space-y-6">
      <section className="theft-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border bg-card/75 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Tech Tree node
              </span>
              <span className="text-xs uppercase text-muted-foreground">{goal.level}</span>
              <StatusBadge status={goal.status} />
            </div>

            <InlineEditor
              value={goal.title}
              onSave={(title) => updateGoal.mutate({ title })}
              as="h1"
              className="mt-3 text-2xl font-semibold tracking-normal text-foreground"
            />

            <InlineEditor
              value={goal.description ?? ""}
              onSave={(description) => updateGoal.mutate({ description })}
              as="p"
              className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground"
              placeholder="Add the business outcome, acceptance evidence, and any dependency notes..."
              multiline
              imageUploadHandler={async (file) => {
                const asset = await uploadImage.mutateAsync(file);
                return asset.contentPath;
              }}
            />
          </div>
          <div className="flex items-start gap-2">
            <Button
              size="sm"
              onClick={() => openNewIssue({
                goalId: goal.id,
                title: nodeView?.startWorkTitle ?? `Advance ${goal.title}`,
                description: `Advance Tech Tree node: ${goal.title}`,
              })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Start work
            </Button>
            <GoalPropertiesToggleButton
              panelVisible={panelVisible}
              onShowProperties={() => setPanelVisible(true)}
            />
          </div>
        </div>

        <div className="theft-tech-tree-detail-grid grid gap-3 p-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TechTreeMetric icon={Users} label="Owner" value={nodeView?.owner ?? "Operator"} />
            <TechTreeMetric icon={GitBranch} label="Dependency" value={nodeView?.dependency ?? "Root roadmap node"} />
            <TechTreeMetric icon={FileText} label="Evidence" value={nodeView?.evidence ?? "No evidence linked yet"} />
            <TechTreeMetric icon={Route} label="Next action" value={nodeView?.nextAction ?? "Create first department task"} />
          </div>
          <TechTreeEvidenceGate
            childrenCount={childGoals.length}
            projectCount={linkedProjects.length}
            taskCount={linkedIssues.length}
          />
        </div>
      </section>

      <Tabs defaultValue="children">
        <TabsList>
          <TabsTrigger value="children">
            Child Nodes ({childGoals.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({linkedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({linkedIssues.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="mt-4 space-y-3">
          <div className="flex items-center justify-start">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openNewGoal({ parentId: goalId })}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Child Node
            </Button>
          </div>
          {childGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No child nodes yet.</p>
          ) : (
            <div className="space-y-2">
              {childGoals.map((child) => (
                <TechTreeLinkRow key={child.id} title={child.title} subtitle={`${child.level} node`} to={`/goals/${child.id}`}>
                  <StatusBadge status={child.status} />
                </TechTreeLinkRow>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          {linkedProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked projects.</p>
          ) : (
            <div className="border border-border">
              {linkedProjects.map((project) => (
                <EntityRow
                  key={project.id}
                  title={project.name}
                  subtitle={project.description ?? undefined}
                  to={projectUrl(project)}
                  trailing={<StatusBadge status={project.status} />}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-3">
          {linkedIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks linked to this node.</p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <TechTreeMetric icon={CheckCircle2} label="Completed tasks" value={`${doneIssueCount}/${linkedIssues.length}`} />
                <TechTreeMetric icon={Route} label="Open tasks" value={`${openIssueCount}`} />
              </div>
              <div className="space-y-2">
                {linkedIssues.map((issue) => (
                  <TechTreeLinkRow
                    key={issue.id}
                    title={issue.title}
                    subtitle={issue.identifier ?? issue.id.slice(0, 8)}
                    to={`/issues/${issue.identifier ?? issue.id}`}
                  >
                    <StatusBadge status={issue.status} />
                  </TechTreeLinkRow>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </TheftWorkbenchTemplate>
  );
}
