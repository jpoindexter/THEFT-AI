import type { AgentAdapterType, JoinRequest, PermissionKey } from "@paperclipai/shared";

export type HumanCompanyRole = "owner" | "admin" | "operator" | "viewer";

export type InviteSummary = {
  id: string;
  companyId: string | null;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  companyBrandColor?: string | null;
  inviteType: "company_join" | "bootstrap_ceo";
  allowedJoinTypes: "human" | "agent" | "both";
  humanRole?: HumanCompanyRole | null;
  expiresAt: string;
  onboardingPath?: string;
  onboardingUrl?: string;
  onboardingTextPath?: string;
  onboardingTextUrl?: string;
  skillIndexPath?: string;
  skillIndexUrl?: string;
  inviteMessage?: string | null;
  invitedByUserName?: string | null;
  joinRequestStatus?: JoinRequest["status"] | null;
  joinRequestType?: JoinRequest["requestType"] | null;
};

export type AcceptInviteInput =
  | { requestType: "human" }
  | {
    requestType: "agent";
    agentName: string;
    adapterType?: AgentAdapterType;
    capabilities?: string | null;
    agentDefaultsPayload?: Record<string, unknown> | null;
  };

export type AgentJoinRequestAccepted = JoinRequest & {
  claimSecret: string;
  claimApiKeyPath: string;
  onboarding?: Record<string, unknown>;
  diagnostics?: Array<{
    code: string;
    level: "info" | "warn";
    message: string;
    hint?: string;
  }>;
};

export type InviteOnboardingManifest = {
  invite: InviteSummary;
  onboarding: {
    inviteMessage?: string | null;
    connectivity?: {
      guidance?: string;
      connectionCandidates?: string[];
      testResolutionEndpoint?: {
        method?: string;
        path?: string;
        url?: string;
      };
    };
    textInstructions?: {
      url?: string;
    };
  };
};

export type BoardClaimStatus = {
  status: "available" | "claimed" | "expired";
  requiresSignIn: boolean;
  expiresAt: string | null;
  claimedByUserId: string | null;
};

export type CliAuthChallengeStatus = {
  id: string;
  status: "pending" | "approved" | "cancelled" | "expired";
  command: string;
  clientName: string | null;
  requestedAccess: "board" | "instance_admin_required";
  requestedCompanyId: string | null;
  requestedCompanyName: string | null;
  approvedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string;
  approvedByUser: { id: string; name: string; email: string } | null;
  requiresSignIn: boolean;
  canApprove: boolean;
  currentUserId: string | null;
};

export type CompanyInviteCreated = {
  id: string;
  token: string;
  inviteUrl: string;
  expiresAt: string;
  allowedJoinTypes: "human" | "agent" | "both";
  humanRole?: HumanCompanyRole | null;
  companyName?: string | null;
  onboardingTextPath?: string;
  onboardingTextUrl?: string;
  inviteMessage?: string | null;
};

export type CompanyMemberGrant = {
  id: string;
  companyId: string;
  principalType: "user";
  principalId: string;
  permissionKey: PermissionKey;
  scope: Record<string, unknown> | null;
  grantedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyMember = {
  id: string;
  companyId: string;
  principalType: "user";
  principalId: string;
  status: "pending" | "active" | "suspended" | "archived";
  membershipRole: HumanCompanyRole | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string | null; name: string | null; image: string | null } | null;
  grants: CompanyMemberGrant[];
  removal?: {
    canArchive: boolean;
    reason: string | null;
  };
};

export type ArchiveCompanyMemberResponse = {
  member: CompanyMember;
  reassignedIssueCount: number;
};

export type CompanyMembersResponse = {
  members: CompanyMember[];
  access: {
    currentUserRole: HumanCompanyRole | null;
    canManageMembers: boolean;
    canInviteUsers: boolean;
    canApproveJoinRequests: boolean;
  };
};

export type CompanyUserDirectoryEntry = {
  principalId: string;
  status: "active";
  user: { id: string; email: string | null; name: string | null; image: string | null } | null;
};

export type CompanyUserDirectoryResponse = {
  users: CompanyUserDirectoryEntry[];
};

export type CompanyInviteRecord = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  inviteType: "company_join" | "bootstrap_ceo";
  allowedJoinTypes: "human" | "agent" | "both";
  humanRole: HumanCompanyRole | null;
  defaultsPayload: Record<string, unknown> | null;
  expiresAt: string;
  invitedByUserId: string | null;
  revokedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  inviteMessage: string | null;
  state: "active" | "revoked" | "accepted" | "expired";
  invitedByUser: { id: string; email: string | null; name: string | null; image: string | null } | null;
  relatedJoinRequestId: string | null;
};

export type CompanyInviteListResponse = {
  invites: CompanyInviteRecord[];
  nextOffset: number | null;
};

export type CompanyJoinRequest = JoinRequest & {
  requesterUser: { id: string; email: string | null; name: string | null; image: string | null } | null;
  approvedByUser: { id: string; email: string | null; name: string | null; image: string | null } | null;
  rejectedByUser: { id: string; email: string | null; name: string | null; image: string | null } | null;
  invite: {
    id: string;
    inviteType: "company_join" | "bootstrap_ceo";
    allowedJoinTypes: "human" | "agent" | "both";
    humanRole: HumanCompanyRole | null;
    inviteMessage: string | null;
    createdAt: string;
    expiresAt: string;
    revokedAt: string | null;
    acceptedAt: string | null;
    invitedByUser: { id: string; email: string | null; name: string | null; image: string | null } | null;
  } | null;
};

export type AdminUserDirectoryEntry = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isInstanceAdmin: boolean;
  activeCompanyMembershipCount: number;
};

export type UserCompanyAccessEntry = {
  id: string;
  companyId: string;
  principalType: "user";
  principalId: string;
  status: "pending" | "active" | "suspended" | "archived";
  membershipRole: HumanCompanyRole | "member" | null;
  createdAt: string;
  updatedAt: string;
  companyName: string | null;
  companyStatus: "active" | "paused" | "archived" | null;
};

export type UserCompanyAccessResponse = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    isInstanceAdmin: boolean;
  } | null;
  companyAccess: UserCompanyAccessEntry[];
};

export type CurrentBoardAccess = {
  user: { id: string; email: string | null; name: string | null; image: string | null } | null;
  userId: string;
  isInstanceAdmin: boolean;
  companyIds: string[];
  memberships?: Array<{
    companyId: string;
    membershipRole: HumanCompanyRole | "member" | null;
    status: "pending" | "active" | "suspended" | "archived";
  }>;
  source: string;
  keyId: string | null;
};
