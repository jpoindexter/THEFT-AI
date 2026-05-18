import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, UserRound } from "lucide-react";
import { useParams } from "@/lib/router";
import { userProfilesApi } from "../api/userProfiles";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import {
  buildAgentUsageRows,
  buildProviderUsageRows,
  NO_COMPANY,
} from "./user-profile/model";
import { ProfileOverview } from "./user-profile/ProfileOverview";
import { StatsWindows } from "./user-profile/StatsWindows";
import { RecentActivity, RecentTasks } from "./user-profile/ActivitySections";
import { UsageChart, UsageList } from "./user-profile/UsageSections";

export function UserProfile() {
  const { userSlug = "" } = useParams<{ userSlug: string }>();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const companyId = selectedCompanyId ?? NO_COMPANY;

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.userProfile(companyId, userSlug),
    queryFn: () => userProfilesApi.get(companyId, userSlug),
    enabled: !!selectedCompanyId && !!userSlug,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: "Users" }, { label: data?.user.name ?? userSlug }]);
  }, [data?.user.name, setBreadcrumbs, userSlug]);

  const allTime = data?.stats.find((entry) => entry.key === "all");
  const last7 = data?.stats.find((entry) => entry.key === "last7");
  const displayName = data?.user.name?.trim() || data?.user.email?.split("@")[0] || "User";

  const agentUsageRows = useMemo(() => buildAgentUsageRows(data?.topAgents), [data?.topAgents]);
  const providerUsageRows = useMemo(() => buildProviderUsageRows(data?.topProviders), [data?.topProviders]);

  if (!selectedCompanyId) {
    return <EmptyState icon={UserRound} message="Select a company to view user profiles." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (error || !data) {
    return <EmptyState icon={AlertCircle} message="User profile not found for this company." />;
  }

  return (
    <div className="space-y-10 pb-10">
      <ProfileOverview data={data} displayName={displayName} allTime={allTime} last7={last7} />
      <StatsWindows stats={data.stats} />
      <UsageChart points={data.daily} />

      <div className="grid gap-10 pt-2 xl:grid-cols-2">
        <RecentTasks issues={data.recentIssues} />
        <RecentActivity events={data.recentActivity} />
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
        <UsageList title="Agent attribution" empty="No issue-linked token usage yet." rows={agentUsageRows} />
        <UsageList title="Provider mix" empty="No provider usage attributed yet." rows={providerUsageRows} />
      </div>
    </div>
  );
}
