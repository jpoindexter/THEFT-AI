import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "@/lib/router";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Inbox,
  Library,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";
import { agentsApi } from "../api/agents";
import { issuesApi } from "../api/issues";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusIcon } from "../components/StatusIcon";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import { DEPARTMENT_SEED_SPECS } from "../lib/onboarding-seed";
import { buildDepartmentCanvasRows } from "../lib/theft-canvas";

function issuePath(issue: Issue) {
  return `/issues/${issue.identifier ?? issue.id}`;
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function skillLabel(skill: string) {
  return skill.split("/").pop()?.replace(/-/g, " ") ?? skill;
}

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
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="border border-border bg-card p-5  ">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Department workspace</p>
              <Badge variant={department.activeCount > 0 ? "default" : "outline"} className="rounded-md">
                {department.activeCount} open
              </Badge>
              {department.blockedCount > 0 ? (
                <Badge variant="destructive" className="rounded-md">{department.blockedCount} blocked</Badge>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal">{department.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {selectedSpec.taskDescriptionByStage.building} Mission, work lanes, blockers, review-ready outputs, and Library files stay in one department-owned surface.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center">
            <DepartmentStat label="review" value={department.reviewCount} />
            <DepartmentStat label="done" value={department.doneCount} />
            <DepartmentStat label="Library" value={libraryDocuments.length} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <WorkPanel
            title="Active Work"
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

        <aside className="space-y-5">
          <div className="border border-border bg-card p-4  ">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                <UserRoundCog className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Lead</h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {department.agent ? `${department.agent.name} - ${department.agent.status}` : "No lead assigned"}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Role" value={selectedSpec.role} />
              <InfoRow label="Next task" value={department.nextIssue?.title ?? "No task queued"} />
              {department.agent ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/agents/${department.agent.urlKey || department.agent.id}`}>Open diagnostics</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="border border-border bg-card p-4  ">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
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
                    className="block border border-border bg-card/80 p-3 text-inherit no-underline transition-colors hover:border-primary/70 hover:bg-accent/40"
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
          </div>

          <div className="border border-border bg-card p-4  ">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Skills</h2>
                <p className="mt-1 text-sm text-muted-foreground">Secondary runtime context, not the main workspace.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSpec.desiredSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="rounded-md capitalize">
                  {skillLabel(skill)}
                </Badge>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function DepartmentStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-card/70 p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs uppercase tracking-normal text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

function WorkPanel({
  title,
  description,
  icon: Icon,
  issues,
  empty,
  tone = "default",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  issues: Issue[];
  empty: string;
  tone?: "default" | "attention";
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 rounded-md p-2", tone === "attention" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-md">{issues.length}</Badge>
      </div>
      <div className="mt-4 divide-y divide-border border border-border">
        {issues.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">{empty}</p>
        ) : (
          issues.map((issue) => (
            <Link
              key={issue.id}
              to={issuePath(issue)}
              className="flex items-center justify-between gap-3 p-3 text-inherit no-underline transition-colors hover:bg-accent/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <StatusIcon status={issue.status} blockerAttention={issue.blockerAttention} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{issue.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {issue.identifier ?? statusLabel(issue.status)} - Updated {timeAgo(issue.updatedAt)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
