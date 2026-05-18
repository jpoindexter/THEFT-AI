import type { JoinRequest } from "@paperclipai/shared";
import {
  AwaitingJoinApprovalPanel,
  BootstrapCompletePanel,
  InviteErrorPanel,
  InviteLoadingMessage,
  JoinedCompanyPanel,
  type InviteCompanyIdentity,
} from "./InviteLandingPanels";
import { readNestedString } from "./inviteLandingModel";

export type InviteLandingResult = {
  kind: "bootstrap" | "join";
  payload: unknown;
} | null;

export type InviteLandingTerminalStateProps = InviteCompanyIdentity & {
  inviteJoinRequestStatus: string | null;
  inviteJoinRequestType: string | null;
  invitedByUserName: string | null;
  isCurrentMember: boolean;
  result: InviteLandingResult;
  showsAgentForm: boolean;
};

export function renderInviteLandingTerminalState({
  companyDisplayName,
  companyLogoUrl,
  companyBrandColor,
  inviteJoinRequestStatus,
  inviteJoinRequestType,
  invitedByUserName,
  isCurrentMember,
  result,
  showsAgentForm,
}: InviteLandingTerminalStateProps) {
  if (
    inviteJoinRequestStatus === "approved" &&
    inviteJoinRequestType === "human" &&
    isCurrentMember
  ) {
    return <InviteLoadingMessage message="Opening company..." />;
  }

  if (inviteJoinRequestStatus === "pending_approval") {
    return (
      <AwaitingJoinApprovalPanel
        companyDisplayName={companyDisplayName}
        companyLogoUrl={companyLogoUrl}
        companyBrandColor={companyBrandColor}
        invitedByUserName={invitedByUserName}
      />
    );
  }

  if (inviteJoinRequestStatus) {
    return (
      <InviteErrorPanel
        message={
          inviteJoinRequestStatus === "rejected"
            ? "This join request was not approved."
            : "This invite has already been used."
        }
      />
    );
  }

  if (result?.kind === "bootstrap") {
    return <BootstrapCompletePanel />;
  }

  if (result?.kind !== "join") {
    return null;
  }

  const payload = result.payload as JoinRequest & {
    claimSecret?: string;
    claimApiKeyPath?: string;
    onboarding?: Record<string, unknown>;
  };
  const claimSecret = typeof payload.claimSecret === "string" ? payload.claimSecret : null;
  const claimApiKeyPath = typeof payload.claimApiKeyPath === "string" ? payload.claimApiKeyPath : null;
  const onboardingTextUrl = readNestedString(payload.onboarding, ["textInstructions", "url"]);
  const joinedNow = !showsAgentForm && payload.status === "approved";

  return joinedNow ? (
    <JoinedCompanyPanel
      companyDisplayName={companyDisplayName}
      companyLogoUrl={companyLogoUrl}
      companyBrandColor={companyBrandColor}
    />
  ) : (
    <AwaitingJoinApprovalPanel
      companyDisplayName={companyDisplayName}
      companyLogoUrl={companyLogoUrl}
      companyBrandColor={companyBrandColor}
      invitedByUserName={invitedByUserName}
      claimSecret={claimSecret}
      claimApiKeyPath={claimApiKeyPath}
      onboardingTextUrl={onboardingTextUrl}
    />
  );
}
