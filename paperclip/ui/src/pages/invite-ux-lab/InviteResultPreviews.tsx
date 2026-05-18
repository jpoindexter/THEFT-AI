import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyPatternIcon } from "@/components/CompanyPatternIcon";

const demoCompany = "Acme Robotics";
const demoLogoUrl = "/api/invites/pcp_invite_test/logo";
const demoBrandColor = null;

export function InviteResultPreviewGrid() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <InviteResultPreview
        title="Request to join Acme Robotics"
        description="Board User must approve your request to join."
        claimSecret="pcp_claim_secret_demo"
        onboardingTextUrl="/api/invites/pcp_invite_test/onboarding.txt"
      />
      <InviteResultPreview
        title="You joined the company"
        description="Your account already matched the approved invite, so the board can be opened immediately."
        joinedNow
      />
      <InviteResultPreview
        title="Request to join Acme Robotics"
        description="Ask them to visit Company Settings → Access to approve your request."
      />
    </div>
  );
}

function InviteResultPreview({
  title,
  description,
  claimSecret,
  onboardingTextUrl,
  joinedNow = false,
}: {
  title: string;
  description: string;
  claimSecret?: string;
  onboardingTextUrl?: string;
  joinedNow?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <CompanyPatternIcon
            companyName={demoCompany}
            logoUrl={demoLogoUrl}
            brandColor={demoBrandColor}
            className="h-12 w-12 rounded-md border border-border"
          />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">{description}</p>
          {joinedNow ? (
            <Button type="button" className="w-full">Open board</Button>
          ) : (
            <>
              <div className="rounded-md border border-border p-3">
                <p className="mb-1 text-xs text-muted-foreground">Approval page</p>
                <a className="text-sm underline underline-offset-2" href="/company/settings/access">
                  Company Settings → Access
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Refresh this page after you&apos;ve been approved — you&apos;ll be redirected automatically.
              </p>
            </>
          )}
          {claimSecret ? (
            <div className="space-y-1 rounded-md border border-border p-3 text-xs text-muted-foreground">
              <div className="text-foreground">Claim secret</div>
              <div className="break-all font-mono">{claimSecret}</div>
              <div className="break-all font-mono">POST /api/agents/claim-api-key</div>
            </div>
          ) : null}
          {onboardingTextUrl ? (
            <div className="text-xs text-muted-foreground">
              Onboarding: <span className="break-all font-mono">{onboardingTextUrl}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
