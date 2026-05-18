import { Link } from "@/lib/router";
import type { ReactNode } from "react";

import { CompanyPatternIcon } from "@/components/CompanyPatternIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type InviteCompanyIdentity = {
  companyDisplayName: string;
  companyLogoUrl: string | null;
  companyBrandColor: string | null;
};

export function InviteCompanyLogo({
  companyDisplayName,
  companyLogoUrl,
  companyBrandColor,
  className,
}: InviteCompanyIdentity & {
  className?: string;
}) {
  return (
    <CompanyPatternIcon
      companyName={companyDisplayName}
      logoUrl={companyLogoUrl}
      brandColor={companyBrandColor}
      logoFit="contain"
      className={className}
    />
  );
}

export function InviteMessagePage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}

export function InviteLoadingMessage({ message }: { message: string }) {
  return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">{message}</div>;
}

export function InviteErrorPanel({
  message = "This invite may be expired, revoked, or already used.",
}: {
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card data-testid="invite-error">
        <CardContent className="p-6">
          <h1 className="text-lg font-semibold">Invite not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function BootstrapCompletePanel() {
  return (
    <InviteMessagePage>
      <Card>
        <CardContent className="p-6">
          <h1 className="text-lg font-semibold">Bootstrap complete</h1>
          <div className="mt-4">
            <Button asChild>
              <Link to="/">Open board</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </InviteMessagePage>
  );
}

export function JoinedCompanyPanel({
  companyDisplayName,
  companyLogoUrl,
  companyBrandColor,
}: InviteCompanyIdentity) {
  return (
    <InviteMessagePage>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <InviteCompanyLogo
              companyDisplayName={companyDisplayName}
              companyLogoUrl={companyLogoUrl}
              companyBrandColor={companyBrandColor}
              className="h-12 w-12 rounded-md border border-border"
            />
            <h1 className="text-lg font-semibold">You joined the company</h1>
          </div>
          <div className="mt-4">
            <Button asChild className="w-full">
              <Link to="/">Open board</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </InviteMessagePage>
  );
}

export function AwaitingJoinApprovalPanel({
  companyDisplayName,
  companyLogoUrl,
  companyBrandColor,
  invitedByUserName,
  claimSecret = null,
  claimApiKeyPath = null,
  onboardingTextUrl = null,
}: InviteCompanyIdentity & {
  invitedByUserName: string | null;
  claimSecret?: string | null;
  claimApiKeyPath?: string | null;
  onboardingTextUrl?: string | null;
}) {
  const approvalUrl = `${window.location.origin}/company/settings/access`;
  const approverLabel = invitedByUserName ?? "A company admin";

  return (
    <InviteMessagePage>
      <Card data-testid="invite-pending-approval">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <InviteCompanyLogo
              companyDisplayName={companyDisplayName}
              companyLogoUrl={companyLogoUrl}
              companyBrandColor={companyBrandColor}
              className="h-12 w-12 rounded-md border border-border"
            />
            <h1 className="text-lg font-semibold">Request to join {companyDisplayName}</h1>
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Your request is still awaiting approval. {approverLabel} must approve your request to join.
            </p>
            <div className="rounded-md border border-border p-3">
              <p className="mb-1 text-xs text-muted-foreground">Approval page</p>
              <a href={approvalUrl} className="text-sm underline underline-offset-2">
                Company Settings → Access
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Ask them to visit{" "}
              <a href={approvalUrl} className="underline underline-offset-2">
                Company Settings → Access
              </a>{" "}
              to approve your request.
            </p>
            <p className="text-xs text-muted-foreground">
              Refresh this page after you have been approved. You will be redirected automatically.
            </p>
          </div>
          {claimSecret && claimApiKeyPath ? (
            <div className="mt-4 space-y-1 rounded-md border border-border p-3 text-xs text-muted-foreground">
              <div className="text-foreground">Claim secret</div>
              <div className="break-all font-mono">{claimSecret}</div>
              <div className="break-all font-mono">POST {claimApiKeyPath}</div>
            </div>
          ) : null}
          {onboardingTextUrl ? (
            <div className="mt-4 text-xs text-muted-foreground">
              Onboarding: <span className="break-all font-mono">{onboardingTextUrl}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </InviteMessagePage>
  );
}
