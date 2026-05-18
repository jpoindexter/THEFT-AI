import type { Dispatch, SetStateAction } from "react";
import type { AgentAdapterType } from "@paperclipai/shared";

import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { InviteSummary } from "@/api/access-types";

import { type AuthFeedback, type AuthMode } from "./inviteLandingModel";
import { AcceptInvitePanel, AgentJoinForm, InviteAuthForm } from "./InviteLandingForms";
import { InviteCompanyLogo, type InviteCompanyIdentity } from "./InviteLandingPanels";

type MutationState = {
  isPending: boolean;
  mutate: () => void;
};

export type InviteLandingContentProps = InviteCompanyIdentity & {
  acceptMutation: MutationState;
  adapterType: AgentAdapterType;
  agentName: string;
  authCanSubmit: boolean;
  authFeedback: AuthFeedback | null;
  authMode: AuthMode;
  authMutation: MutationState;
  capabilities: string;
  companyDisplayName: string;
  email: string;
  error: string | null;
  invite: InviteSummary;
  inviteMessage: string | null;
  invitedByUserName: string | null;
  isCurrentMember: boolean;
  joinButtonLabel: string;
  name: string;
  password: string;
  requestedHumanRole: string | null;
  requiresHumanAccount: boolean;
  session: { user?: { name?: string | null; email?: string | null }; session?: { userId?: string | null } } | null | undefined;
  sessionLabel: string;
  setAdapterType: Dispatch<SetStateAction<AgentAdapterType>>;
  setAgentName: Dispatch<SetStateAction<string>>;
  setAuthFeedback: Dispatch<SetStateAction<AuthFeedback | null>>;
  setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  setCapabilities: Dispatch<SetStateAction<string>>;
  setEmail: Dispatch<SetStateAction<string>>;
  setName: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
  shouldAutoAcceptHumanInvite: boolean;
  showsAgentForm: boolean;
};

export function InviteLandingContent(props: InviteLandingContentProps) {
  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-2">
          <InviteSummaryCard {...props} />
          <Card className="h-fit">
            <CardContent className="p-6">
              {props.showsAgentForm ? (
                <AgentJoinForm {...props} />
              ) : props.requiresHumanAccount ? (
                <InviteAuthForm {...props} />
              ) : (
                <AcceptInvitePanel {...props} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InviteSummaryCard({
  companyDisplayName,
  companyLogoUrl,
  companyBrandColor,
  invite,
  inviteMessage,
  invitedByUserName,
  requestedHumanRole,
  requiresHumanAccount,
  session,
  sessionLabel,
  showsAgentForm,
}: InviteLandingContentProps) {
  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start gap-4">
          <InviteCompanyLogo
            companyDisplayName={companyDisplayName}
            companyLogoUrl={companyLogoUrl}
            companyBrandColor={companyBrandColor}
            className="h-16 w-16 rounded-md border border-border"
          />
          <div className="min-w-0">
            <p className="theft-label text-muted-foreground">You&apos;ve been invited to join THEFT</p>
            <h1 className="mt-2 text-2xl font-semibold">
              {invite.inviteType === "bootstrap_ceo" ? "Set up THEFT" : `Join ${companyDisplayName}`}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {showsAgentForm
                ? "Review the invite details, then submit the agent information below to start the join request."
                : requiresHumanAccount
                  ? "Create your THEFT account first. If you already have one, switch to sign in and continue the invite with the same email."
                  : "Your account is ready. Review the invite details, then accept it to continue."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InviteFact label="Company" value={companyDisplayName} />
          <InviteFact label="Invited by" value={invitedByUserName ?? "THEFT board"} />
          <InviteFact label="Requested access" value={showsAgentForm ? "Agent join request" : requestedHumanRole ?? "Company access"} />
          <InviteFact label="Invite expires" value={formatDate(invite.expiresAt)} />
        </div>

        {inviteMessage ? (
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <div className="theft-label-compact text-muted-foreground">Message from inviter</div>
            <p className="mt-2 text-sm leading-6 text-foreground">{inviteMessage}</p>
          </div>
        ) : null}

        {session ? (
          <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{sessionLabel}</span>.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InviteFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="theft-label-compact text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}
