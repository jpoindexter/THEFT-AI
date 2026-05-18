import type { UserProfileResponse, UserProfileWindowStats } from "@paperclipai/shared";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { formatCents, formatDate, formatNumber, formatTokens } from "../../lib/utils";
import { completionRate, initials, totalTokens } from "./model";

function HeroStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</div>
      <div className="theft-label-compact mt-1 font-medium text-muted-foreground">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground/70">{hint}</div> : null}
    </div>
  );
}

export function ProfileOverview({
  data,
  displayName,
  allTime,
  last7,
}: {
  data: UserProfileResponse;
  displayName: string;
  allTime?: UserProfileWindowStats;
  last7?: UserProfileWindowStats;
}) {
  const allTimeTokens = allTime ? totalTokens(allTime) : 0;
  const metaParts = [
    data.user.membershipRole ?? "member",
    data.user.membershipStatus,
    `joined ${formatDate(data.user.joinedAt)}`,
  ];

  return (
    <section className="flex flex-col gap-7 border-b border-border pb-8">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar className="size-16 border border-border" size="lg">
          {data.user.image ? <AvatarImage src={data.user.image} alt={displayName} /> : null}
          <AvatarFallback className="text-lg font-semibold">{initials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="truncate text-2xl font-semibold">{displayName}</h1>
            <span className="text-sm text-muted-foreground">@{data.user.slug}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {data.user.email ? <span className="truncate">{data.user.email}</span> : null}
            {data.user.email ? <span aria-hidden>·</span> : null}
            <span>{metaParts.join(" · ")}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <HeroStat label="All-time tokens" value={formatTokens(allTimeTokens)} hint={`${formatCents(allTime?.costCents ?? 0)} spent`} />
        <HeroStat label="Completed" value={formatNumber(allTime?.completedIssues ?? 0)} hint={allTime ? `${completionRate(allTime)} rate` : undefined} />
        <HeroStat label="Open assigned" value={formatNumber(allTime?.assignedOpenIssues ?? 0)} hint={`${formatNumber(allTime?.createdIssues ?? 0)} created`} />
        <HeroStat label="7-day actions" value={formatNumber(last7?.activityCount ?? 0)} hint={`${formatNumber(last7?.commentCount ?? 0)} comments`} />
      </div>
    </section>
  );
}
