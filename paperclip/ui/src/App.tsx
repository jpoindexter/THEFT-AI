import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Layout } from "./components/Layout";
import { CloudAccessGate } from "./components/CloudAccessGate";
import { useCompany } from "./context/CompanyContext";
import { useDialogActions, useDialogState } from "./context/DialogContext";
import { loadLastInboxTab } from "./lib/inbox";
import { shouldRedirectCompanylessRouteToOnboarding } from "./lib/onboarding-route";
import { NotFoundPage } from "./pages/NotFound";

function lazyPage<TModule extends Record<string, unknown>, TExport extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TExport,
) {
  return lazy(async () => ({ default: (await loader())[exportName] as ComponentType<any> }));
}

const Dashboard = lazyPage(() => import("./pages/Dashboard"), "Dashboard");
const DashboardLive = lazyPage(() => import("./pages/DashboardLive"), "DashboardLive");
const DepartmentWorkspace = lazyPage(() => import("./pages/DepartmentWorkspace"), "DepartmentWorkspace");
const Companies = lazyPage(() => import("./pages/Companies"), "Companies");
const Agents = lazyPage(() => import("./pages/Agents"), "Agents");
const AgentDetail = lazyPage(() => import("./pages/AgentDetail"), "AgentDetail");
const Projects = lazyPage(() => import("./pages/Projects"), "Projects");
const ProjectDetail = lazyPage(() => import("./pages/ProjectDetail"), "ProjectDetail");
const ProjectWorkspaceDetail = lazyPage(() => import("./pages/ProjectWorkspaceDetail"), "ProjectWorkspaceDetail");
const Workspaces = lazyPage(() => import("./pages/Workspaces"), "Workspaces");
const Issues = lazyPage(() => import("./pages/Issues"), "Issues");
const Library = lazyPage(() => import("./pages/Library"), "Library");
const Search = lazyPage(() => import("./pages/Search"), "Search");
const IssueDetail = lazyPage(() => import("./pages/IssueDetail"), "IssueDetail");
const IssueChatLongThreadPerf = lazyPage(() => import("./pages/IssueChatLongThreadPerf"), "IssueChatLongThreadPerf");
const Routines = lazyPage(() => import("./pages/Routines"), "Routines");
const RoutineDetail = lazyPage(() => import("./pages/RoutineDetail"), "RoutineDetail");
const UserProfile = lazyPage(() => import("./pages/UserProfile"), "UserProfile");
const ExecutionWorkspaceDetail = lazyPage(() => import("./pages/ExecutionWorkspaceDetail"), "ExecutionWorkspaceDetail");
const Goals = lazyPage(() => import("./pages/Goals"), "Goals");
const GoalDetail = lazyPage(() => import("./pages/GoalDetail"), "GoalDetail");
const Approvals = lazyPage(() => import("./pages/Approvals"), "Approvals");
const ApprovalDetail = lazyPage(() => import("./pages/ApprovalDetail"), "ApprovalDetail");
const RuntimeUsage = lazyPage(() => import("./pages/Costs"), "RuntimeUsage");
const Activity = lazyPage(() => import("./pages/Activity"), "Activity");
const Inbox = lazyPage(() => import("./pages/Inbox"), "Inbox");
const CompanySettings = lazyPage(() => import("./pages/CompanySettings"), "CompanySettings");
const CompanyEnvironments = lazyPage(() => import("./pages/CompanyEnvironments"), "CompanyEnvironments");
const CompanyAccess = lazyPage(() => import("./pages/CompanyAccess"), "CompanyAccess");
const CompanyInvites = lazyPage(() => import("./pages/CompanyInvites"), "CompanyInvites");
const CompanySkills = lazyPage(() => import("./pages/CompanySkills"), "CompanySkills");
const CompanyExport = lazyPage(() => import("./pages/CompanyExport"), "CompanyExport");
const CompanyImport = lazyPage(() => import("./pages/CompanyImport"), "CompanyImport");
const DesignGuide = lazyPage(() => import("./pages/DesignGuide"), "DesignGuide");
const InstanceGeneralSettings = lazyPage(() => import("./pages/InstanceGeneralSettings"), "InstanceGeneralSettings");
const InstanceAccess = lazyPage(() => import("./pages/InstanceAccess"), "InstanceAccess");
const InstanceSettings = lazyPage(() => import("./pages/InstanceSettings"), "InstanceSettings");
const InstanceExperimentalSettings = lazyPage(() => import("./pages/InstanceExperimentalSettings"), "InstanceExperimentalSettings");
const ProfileSettings = lazyPage(() => import("./pages/ProfileSettings"), "ProfileSettings");
const PluginManager = lazyPage(() => import("./pages/PluginManager"), "PluginManager");
const PluginSettings = lazyPage(() => import("./pages/PluginSettings"), "PluginSettings");
const AdapterManager = lazyPage(() => import("./pages/AdapterManager"), "AdapterManager");
const PluginPage = lazyPage(() => import("./pages/PluginPage"), "PluginPage");
const OrgChart = lazyPage(() => import("./pages/OrgChart"), "OrgChart");
const NewAgent = lazyPage(() => import("./pages/NewAgent"), "NewAgent");
const AuthPage = lazyPage(() => import("./pages/Auth"), "AuthPage");
const BoardClaimPage = lazyPage(() => import("./pages/BoardClaim"), "BoardClaimPage");
const CliAuthPage = lazyPage(() => import("./pages/CliAuth"), "CliAuthPage");
const InviteLandingPage = lazyPage(() => import("./pages/InviteLanding"), "InviteLandingPage");
const JoinRequestQueue = lazyPage(() => import("./pages/JoinRequestQueue"), "JoinRequestQueue");
const OnboardingWizard = lazyPage(() => import("./components/OnboardingWizard"), "OnboardingWizard");

function boardRoutes() {
  return (
    <>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="dashboard/live" element={<DashboardLive />} />
      <Route path="departments" element={<Navigate to="/departments/engineering" replace />} />
      <Route path="departments/:departmentKey" element={<DepartmentWorkspace />} />
      <Route path="onboarding" element={<OnboardingRoutePage />} />
      <Route path="companies" element={<Companies />} />
      <Route path="company/settings" element={<CompanySettings />} />
      <Route path="company/settings/environments" element={<CompanyEnvironments />} />
      <Route path="company/settings/access" element={<CompanyAccess />} />
      <Route path="company/settings/invites" element={<CompanyInvites />} />
      <Route path="company/export/*" element={<CompanyExport />} />
      <Route path="company/import" element={<CompanyImport />} />
      <Route path="skills/*" element={<CompanySkills />} />
      <Route path="settings" element={<LegacySettingsRedirect />} />
      <Route path="settings/*" element={<LegacySettingsRedirect />} />
      <Route path="plugins/:pluginId" element={<PluginPage />} />
      <Route path="org" element={<OrgChart />} />
      <Route path="agents" element={<Navigate to="/agents/all" replace />} />
      <Route path="agents/all" element={<Agents />} />
      <Route path="agents/active" element={<Agents />} />
      <Route path="agents/paused" element={<Agents />} />
      <Route path="agents/error" element={<Agents />} />
      <Route path="agents/new" element={<NewAgent />} />
      <Route path="agents/:agentId" element={<AgentDetail />} />
      <Route path="agents/:agentId/:tab" element={<AgentDetail />} />
      <Route path="agents/:agentId/runs/:runId" element={<AgentDetail />} />
      <Route path="projects" element={<Projects />} />
      <Route path="projects/:projectId" element={<ProjectDetail />} />
      <Route path="projects/:projectId/overview" element={<ProjectDetail />} />
      <Route path="projects/:projectId/issues" element={<ProjectDetail />} />
      <Route path="projects/:projectId/issues/:filter" element={<ProjectDetail />} />
      <Route path="projects/:projectId/workspaces/:workspaceId" element={<ProjectWorkspaceDetail />} />
      <Route path="projects/:projectId/workspaces" element={<ProjectDetail />} />
      <Route path="projects/:projectId/configuration" element={<ProjectDetail />} />
      <Route path="projects/:projectId/budget" element={<ProjectDetail />} />
      <Route path="workspaces" element={<Workspaces />} />
      <Route path="issues" element={<Issues />} />
      <Route path="library" element={<Library />} />
      <Route path="search" element={<Search />} />
      <Route path="issues/all" element={<Navigate to="/issues" replace />} />
      <Route path="issues/active" element={<Navigate to="/issues" replace />} />
      <Route path="issues/backlog" element={<Navigate to="/issues" replace />} />
      <Route path="issues/done" element={<Navigate to="/issues" replace />} />
      <Route path="issues/recent" element={<Navigate to="/issues" replace />} />
      <Route path="issues/:issueId" element={<IssueDetail />} />
      {import.meta.env.DEV ? (
        <Route path="tests/perf/long-thread" element={<IssueChatLongThreadPerf />} />
      ) : null}
      <Route path="routines" element={<Routines />} />
      <Route path="routines/:routineId" element={<RoutineDetail />} />
      <Route path="execution-workspaces/:workspaceId" element={<ExecutionWorkspaceDetail />} />
      <Route path="execution-workspaces/:workspaceId/services" element={<ExecutionWorkspaceDetail />} />
      <Route path="execution-workspaces/:workspaceId/configuration" element={<ExecutionWorkspaceDetail />} />
      <Route path="execution-workspaces/:workspaceId/runtime-logs" element={<ExecutionWorkspaceDetail />} />
      <Route path="execution-workspaces/:workspaceId/issues" element={<ExecutionWorkspaceDetail />} />
      <Route path="execution-workspaces/:workspaceId/routines" element={<ExecutionWorkspaceDetail />} />
      <Route path="goals" element={<Goals />} />
      <Route path="goals/:goalId" element={<GoalDetail />} />
      <Route path="approvals" element={<Navigate to="/approvals/pending" replace />} />
      <Route path="approvals/pending" element={<Approvals />} />
      <Route path="approvals/all" element={<Approvals />} />
      <Route path="approvals/:approvalId" element={<ApprovalDetail />} />
      <Route path="costs" element={<RuntimeUsage />} />
      <Route path="activity" element={<Activity />} />
      <Route path="inbox" element={<InboxRootRedirect />} />
      <Route path="inbox/mine" element={<Inbox />} />
      <Route path="inbox/recent" element={<Inbox />} />
      <Route path="inbox/unread" element={<Inbox />} />
      <Route path="inbox/all" element={<Inbox />} />
      <Route path="inbox/requests" element={<JoinRequestQueue />} />
      <Route path="inbox/new" element={<Navigate to="/inbox/mine" replace />} />
      <Route path="u/:userSlug" element={<UserProfile />} />
      <Route path="design-guide" element={<DesignGuide />} />
      <Route path="instance/settings/adapters" element={<AdapterManager />} />
      <Route path=":pluginRoutePath/*" element={<PluginPage />} />
      <Route path="*" element={<NotFoundPage scope="board" />} />
    </>
  );
}

function InboxRootRedirect() {
  return <Navigate to={`/inbox/${loadLastInboxTab()}`} replace />;
}

function LegacySettingsRedirect() {
  const location = useLocation();
  return <Navigate to={`/instance/settings/general${location.search}${location.hash}`} replace />;
}

function OnboardingRoutePage() {
  const { companies } = useCompany();
  const { openOnboarding } = useDialogActions();
  const { companyPrefix } = useParams<{ companyPrefix?: string }>();
  const matchedCompany = companyPrefix
    ? companies.find((company) => company.issuePrefix.toUpperCase() === companyPrefix.toUpperCase()) ?? null
    : null;

  const title = matchedCompany
    ? `Extend ${matchedCompany.name}`
    : companies.length > 0
      ? "Create another THEFT company"
      : "Create your THEFT company";
  const description = matchedCompany
    ? "Run staged setup again to add an Operator-led task or expand the department system."
    : companies.length > 0
      ? "Name the company, choose its stage, and seed Operator, departments, roadmap, and tasks."
      : "Name the company, choose its stage, and land on a working canvas with Operator and 8 departments.";

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4">
          <Button
            onClick={() =>
              matchedCompany
                ? openOnboarding({ initialStep: 2, companyId: matchedCompany.id })
                : openOnboarding()
            }
          >
            {matchedCompany ? "Open Setup" : "Start THEFT Setup"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompanyRootRedirect() {
  const { companies, selectedCompany, loading } = useCompany();
  const location = useLocation();

  if (loading) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">Loading...</div>;
  }

  const targetCompany = selectedCompany ?? companies[0] ?? null;
  if (!targetCompany) {
    if (
      shouldRedirectCompanylessRouteToOnboarding({
        pathname: location.pathname,
        hasCompanies: false,
      })
    ) {
      return <Navigate to="/onboarding" replace />;
    }
    return <NoCompaniesStartPage />;
  }

  return <Navigate to={`/${targetCompany.issuePrefix}/dashboard`} replace />;
}

function UnprefixedBoardRedirect() {
  const location = useLocation();
  const { companies, selectedCompany, loading } = useCompany();

  if (loading) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">Loading...</div>;
  }

  const targetCompany = selectedCompany ?? companies[0] ?? null;
  if (!targetCompany) {
    if (
      shouldRedirectCompanylessRouteToOnboarding({
        pathname: location.pathname,
        hasCompanies: false,
      })
    ) {
      return <Navigate to="/onboarding" replace />;
    }
    return <NoCompaniesStartPage />;
  }

  return (
    <Navigate
      to={`/${targetCompany.issuePrefix}${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
}

function NoCompaniesStartPage() {
  const { openOnboarding } = useDialogActions();

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Create your THEFT company</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start staged setup to seed Operator, 8 departments, roadmap tasks, and Library-ready work.
        </p>
        <div className="mt-4">
          <Button onClick={() => openOnboarding()}>Start THEFT Setup</Button>
        </div>
      </div>
    </div>
  );
}

function OnboardingWizardMount() {
  const { onboardingOpen } = useDialogState();
  const location = useLocation();
  const isOnboardingRoute = location.pathname.split("/").filter(Boolean).at(-1) === "onboarding";

  if (!onboardingOpen && !isOnboardingRoute) return null;

  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}

export function App() {
  return (
    <>
      <Suspense fallback={<div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">Loading...</div>}>
        <Routes>
          <Route path="auth" element={<AuthPage />} />
          <Route path="board-claim/:token" element={<BoardClaimPage />} />
          <Route path="cli-auth/:id" element={<CliAuthPage />} />
          <Route path="invite/:token" element={<InviteLandingPage />} />
          <Route path="tests/perf/long-thread" element={<IssueChatLongThreadPerf />} />

          <Route element={<CloudAccessGate />}>
            <Route index element={<CompanyRootRedirect />} />
            <Route path="onboarding" element={<OnboardingRoutePage />} />
            <Route path="instance" element={<Navigate to="/instance/settings/general" replace />} />
            <Route path="instance/settings" element={<Layout />}>
              <Route index element={<Navigate to="general" replace />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="general" element={<InstanceGeneralSettings />} />
              <Route path="access" element={<InstanceAccess />} />
              <Route path="heartbeats" element={<InstanceSettings />} />
              <Route path="experimental" element={<InstanceExperimentalSettings />} />
              <Route path="plugins" element={<PluginManager />} />
              <Route path="plugins/:pluginId" element={<PluginSettings />} />
              <Route path="adapters" element={<AdapterManager />} />
            </Route>
            <Route path="companies" element={<UnprefixedBoardRedirect />} />
            <Route path="issues" element={<UnprefixedBoardRedirect />} />
            <Route path="issues/:issueId" element={<UnprefixedBoardRedirect />} />
            <Route path="library" element={<UnprefixedBoardRedirect />} />
            <Route path="routines" element={<UnprefixedBoardRedirect />} />
            <Route path="routines/:routineId" element={<UnprefixedBoardRedirect />} />
            <Route path="u/:userSlug" element={<UnprefixedBoardRedirect />} />
            <Route path="skills/*" element={<UnprefixedBoardRedirect />} />
            <Route path="settings" element={<LegacySettingsRedirect />} />
            <Route path="settings/*" element={<LegacySettingsRedirect />} />
            <Route path="agents" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/new" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/:agentId" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/:agentId/:tab" element={<UnprefixedBoardRedirect />} />
            <Route path="agents/:agentId/runs/:runId" element={<UnprefixedBoardRedirect />} />
            <Route path="projects" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/overview" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/issues" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/issues/:filter" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/workspaces" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/workspaces/:workspaceId" element={<UnprefixedBoardRedirect />} />
            <Route path="projects/:projectId/configuration" element={<UnprefixedBoardRedirect />} />
            <Route path="workspaces" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/services" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/configuration" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/runtime-logs" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/issues" element={<UnprefixedBoardRedirect />} />
            <Route path="execution-workspaces/:workspaceId/routines" element={<UnprefixedBoardRedirect />} />
            <Route path=":companyPrefix" element={<Layout />}>
              {boardRoutes()}
            </Route>
            <Route path="*" element={<NotFoundPage scope="global" />} />
          </Route>
        </Routes>
      </Suspense>
      <OnboardingWizardMount />
    </>
  );
}
