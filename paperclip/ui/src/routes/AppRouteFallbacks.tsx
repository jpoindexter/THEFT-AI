import { type ComponentType } from "react";
import { ArrowRight, CheckCircle2, Clock3, Database, Monitor, Plus, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { TheftChip } from "@/components/theft/atoms/TheftChip";
import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import { TheftLauncherTemplate } from "@/components/theft/templates/TheftLauncherTemplate";
import { useCompany } from "@/context/CompanyContext";
import { useDialogActions } from "@/context/DialogContext";
import { loadLastInboxTab } from "@/lib/inbox";
import { shouldRedirectCompanylessRouteToOnboarding } from "@/lib/onboarding-route";
import { timeAgo } from "@/lib/timeAgo";

export function InboxRootRedirect() {
  return <Navigate to={`/inbox/${loadLastInboxTab()}`} replace />;
}

export function LegacySettingsRedirect() {
  const location = useLocation();
  return <Navigate to={`/instance/settings/general${location.search}${location.hash}`} replace />;
}

export function OnboardingRoutePage() {
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

export function CompanyRootRedirect() {
  const { loading } = useCompany();

  if (loading) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">Loading...</div>;
  }

  return <MissionLauncher />;
}

export function UnprefixedBoardRedirect() {
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
    return <MissionLauncher />;
  }

  return (
    <Navigate
      to={`/${targetCompany.issuePrefix}${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
}

function MissionLauncher() {
  const { companies, selectedCompany } = useCompany();
  const { openOnboarding } = useDialogActions();
  const navigate = useNavigate();
  const recentCompanies = [...companies]
    .filter((company) => company.status !== "archived")
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 4);
  const primaryCompany = selectedCompany ?? recentCompanies[0] ?? null;

  function openCompany(company = primaryCompany) {
    if (!company) {
      openOnboarding();
      return;
    }
    navigate(`/${company.issuePrefix}/dashboard`);
  }

  return (
    <TheftLauncherTemplate
      title="Open Mission Control"
      meta={
        <div className="space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-secondary text-foreground">
            <Monitor className="size-6" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">THEFT AI</p>
            <p className="mx-auto max-w-xl text-base leading-7">
              Build and operate a company from your local runtime.
            </p>
          </div>
        </div>
      }
      actions={
        <>
          <Button
            size="lg"
            className="h-14 w-full min-w-0 justify-between gap-3 px-5 text-base font-medium"
            onClick={() => openCompany()}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Monitor className="size-5" />
              <span className="truncate">
                {primaryCompany ? `Open ${primaryCompany.name}` : "Open local company"}
              </span>
            </span>
            <ArrowRight className="size-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 w-full min-w-0 justify-between gap-3 px-5 text-base font-medium"
            onClick={() => openOnboarding()}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Plus className="size-5" />
              <span className="truncate">Start new company</span>
            </span>
            <ArrowRight className="size-5" />
          </Button>
        </>
      }
      footer={
        <div className="space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            <RuntimeChip icon={Monitor} label="Local runtime ready" />
            <RuntimeChip icon={Database} label="Embedded Postgres" />
            <RuntimeChip icon={ShieldCheck} label="No cloud required" />
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="theft-label">Recent companies</p>
              {recentCompanies.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/companies")}
                >
                  View all
                </Button>
              ) : null}
            </div>
            <TheftSurface className="overflow-hidden" padding="none" tone="plain">
              {recentCompanies.length > 0 ? (
                recentCompanies.map((company) => (
                  <Button
                    key={company.id}
                    type="button"
                    variant="ghost"
                    onClick={() => openCompany(company)}
                    className="h-auto w-full justify-between gap-4 rounded-sm border-b border-border px-4 py-3 text-left last:border-b-0"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-medium">
                        {company.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{company.name}</span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="size-3" />
                          <span className="truncate">
                            Last opened {timeAgo(company.updatedAt ?? company.createdAt)}
                          </span>
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                ))
              ) : (
                <div className="flex items-center gap-3 px-4 py-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4" />
                  Start setup to create your first local company.
                </div>
              )}
            </TheftSurface>
          </section>
        </div>
      }
    />
  );
}

function RuntimeChip({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <TheftChip tone="muted" className="gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <span>{label}</span>
      <span className="size-1.5 rounded-full bg-signal" aria-hidden />
    </TheftChip>
  );
}
