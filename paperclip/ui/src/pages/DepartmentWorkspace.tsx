import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "@/lib/router";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Inbox,
  Library,
  ListChecks,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
} from "lucide-react";
import { agentsApi } from "../api/agents";
import { issuesApi } from "../api/issues";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TheftSurface, TheftWorkbenchTemplate } from "@/components/theft";
import {
  DepartmentFocusCard,
  DepartmentStat,
  InfoRow,
  WorkPanel,
  issuePath,
  skillLabel,
} from "@/components/department-workspace/DepartmentWorkspacePanels";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import { DEPARTMENT_SEED_SPECS } from "../lib/onboarding-seed";
import { buildDepartmentCanvasRows } from "../lib/theft-canvas";

export function DepartmentWorkspace() {
  const { departmentKey } = useParams<{ departmentKey?: string }>();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const selectedSpec = DEPARTMENT_SEED_SPECS.find((department) => department.key === departmentKey);

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: issues, isLoading: issuesLoading } = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!, { includeBlockedBy: true }),
    enabled: !!selectedCompanyId,
  });

  const departmentRows = useMemo(
    () => buildDepartmentCanvasRows(agents ?? [], issues ?? []),
    [agents, issues],
  );
  const department = selectedSpec
    ? departmentRows.find((row) => row.key === selectedSpec.key) ?? null
    : null;
  const activeWork = department?.activeIssues ?? [];
  const reviewReady = department?.reviewIssues ?? [];
  const blockedWork = department?.blockedIssues ?? [];
  const recentOutputs = department?.doneIssues.slice(0, 5) ?? [];
  const libraryCandidates = department?.issues.slice(0, 8) ?? [];
  const objectiveContribution = department?.nextIssue
    ? `Move ${department.nextIssue.title}`
    : `Keep ${selectedSpec?.title ?? "department"} ready for the next company objective`;
  const currentConstraint = department?.blockedCount
    ? `${department.blockedCount} blocked item${department.blockedCount === 1 ? "" : "s"} need attention`
    : department?.reviewCount
      ? `${department.reviewCount} output${department.reviewCount === 1 ? "" : "s"} waiting for review`
      : department?.activeCount
        ? "No major constraint; active work is moving"
        : "No active constraint";

  const libraryQueries = useQueries({
    queries: libraryCandidates.map((issue) => ({
      queryKey: queryKeys.issues.documents(issue.id),
      queryFn: () => issuesApi.listDocuments(issue.id),
      enabled: !!selectedCompanyId,
    })),
  });
  const libraryDocuments = useMemo(
    () =>
      libraryCandidates
        .flatMap((issue, index) =>
          (libraryQueries[index]?.data ?? []).map((document) => ({ issue, document })),
        )
        .sort((a, b) => new Date(b.document.updatedAt).getTime() - new Date(a.document.updatedAt).getTime())
        .slice(0, 6),
    [libraryCandidates, libraryQueries],
  );

  useEffect(() => {
    setBreadcrumbs([
      { label: "Departments", href: "/dashboard" },
      { label: selectedSpec?.title ?? "Department" },
    ]);
  }, [selectedSpec?.title, setBreadcrumbs]);

  if (!selectedCompanyId) {
    return <EmptyState icon={UserRoundCog} message="Select a company to view department workspaces." />;
  }

  if (!selectedSpec) {
    return <Navigate to="/dashboard" replace />;
  }

  if (agentsLoading || issuesLoading || !department) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <TheftWorkbenchTemplate contentClassName="block max-w-7xl space-y-5">
      <TheftSurface tone="panel" padding="lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="theft-chip theft-chip-muted theft-label-compact">
                <Sparkles className="h-3.5 w-3.5" />
                Execution lane
              </p>
              <Badge variant={department.activeCount > 0 ? "default" : "outline"}>
                {department.activeCount} open
              </Badge>
              {department.blockedCount > 0 ? (
                <Badge variant="destructive">{department.blockedCount} blocked</Badge>
              ) : null}
            </div>
            <h1 className="theft-heading mt-2 text-2xl md:text-3xl">{department.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Department-owned work lane for mission, current contribution, blockers, review-ready outputs, and Library evidence.
            </p>
          </div>
          <div className="theft-department-stat-grid grid grid-cols-3 gap-2 text-center">
            <DepartmentStat label="review" value={department.reviewCount} />
            <DepartmentStat label="done" value={department.doneCount} />
            <DepartmentStat label="Library" value={libraryDocuments.length} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <DepartmentFocusCard label="Mission" value={selectedSpec.taskDescriptionByStage.building} />
          <DepartmentFocusCard label="Objective contribution" value={objectiveContribution} />
          <DepartmentFocusCard label="Current constraint" value={currentConstraint} />
        </div>
      </TheftSurface>

      <section className="theft-department-workspace-grid grid min-w-0 gap-5">
        <div className="min-w-0 space-y-5">
          <WorkPanel
            title="Now Moving"
            description="Work this department should move next."
            icon={Inbox}
            issues={activeWork}
            empty="No active work assigned to this department."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <WorkPanel
              title="Blocked Items"
              description="Needs founder input, dependency resolution, or clearer handoff."
              icon={AlertTriangle}
              issues={blockedWork}
              empty="No blocked items."
              tone="attention"
            />
            <WorkPanel
              title="Review Ready"
              description="Outputs waiting for approval or next decision."
              icon={ShieldCheck}
              issues={reviewReady}
              empty="Nothing waiting for review."
            />
          </div>
          <WorkPanel
            title="Recent Outputs"
            description="Completed tasks that should feed company memory."
            icon={CheckCircle2}
            issues={recentOutputs}
            empty="No completed department output yet."
          />
        </div>

        <aside className="min-w-0 space-y-5">
          <TheftSurface padding="md">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full border border-border bg-background p-2 text-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Operator brief</h2>
                <p className="mt-1 text-sm text-muted-foreground">What this department should do next.</p>
              </div>
            </div>
            <div className="theft-inset-surface mt-4 p-3">
              <p className="theft-label-compact">Recommended action</p>
              <p className="mt-2 min-w-0 break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
                {department.nextIssue?.title ?? `Route the next ${department.title} task when the company objective is ready.`}
              </p>
            </div>
            <div className="mt-3 grid gap-2">
              {department.nextIssue ? (
                <Button asChild size="sm" className="w-full">
                  <Link to={issuePath(department.nextIssue)}>
                    Open next task
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/dashboard">Ask Operator to route work</Link>
              </Button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Lead" value={department.agent ? department.agent.name : "No lead assigned"} />
              <InfoRow label="Role" value={selectedSpec.role} />
              {department.agent ? (
                <Link
                  to={`/agents/${department.agent.urlKey || department.agent.id}`}
                  className="block text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Open runtime diagnostics
                </Link>
              ) : null}
            </div>
          </TheftSurface>

          <TheftSurface padding="md">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-muted p-2 text-foreground">
                <Library className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Related Library Files</h2>
                <p className="mt-1 text-sm text-muted-foreground">Documents this department has published.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {libraryDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Library files yet.</p>
              ) : (
                libraryDocuments.map(({ issue, document }) => (
                  <Link
                    key={`${issue.id}:${document.key}`}
                    to={`/library?issue=${encodeURIComponent(issue.id)}`}
                    className="theft-surface-plain block p-3 text-inherit no-underline transition-colors hover:border-primary/70 hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{document.title || document.key}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{issue.identifier ?? issue.title}</p>
                  </Link>
                ))
              )}
            </div>
          </TheftSurface>

          <TheftSurface padding="md">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-muted p-2 text-foreground">
                <ListChecks className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Capabilities</h2>
                <p className="mt-1 text-sm text-muted-foreground">Secondary runtime context, not the main workspace.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSpec.desiredSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="capitalize">
                  {skillLabel(skill)}
                </Badge>
              ))}
            </div>
          </TheftSurface>
        </aside>
      </section>
    </TheftWorkbenchTemplate>
  );
}
