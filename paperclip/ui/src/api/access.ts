import type { JoinRequest, PermissionKey } from "@paperclipai/shared";
import { api } from "./client";
import type {
  AcceptInviteInput,
  AdminUserDirectoryEntry,
  AgentJoinRequestAccepted,
  ArchiveCompanyMemberResponse,
  BoardClaimStatus,
  CliAuthChallengeStatus,
  CompanyInviteCreated,
  CompanyInviteListResponse,
  CompanyJoinRequest,
  CompanyMember,
  CompanyMembersResponse,
  CompanyUserDirectoryResponse,
  CurrentBoardAccess,
  HumanCompanyRole,
  InviteOnboardingManifest,
  InviteSummary,
  UserCompanyAccessResponse,
} from "./access-types";

export type * from "./access-types";

function buildInviteListQuery(options: {
  state?: "active" | "revoked" | "accepted" | "expired";
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (options.state) params.set("state", options.state);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const accessApi = {
  createCompanyInvite: (
    companyId: string,
    input: {
      allowedJoinTypes?: "human" | "agent" | "both";
      humanRole?: HumanCompanyRole | null;
      defaultsPayload?: Record<string, unknown> | null;
      agentMessage?: string | null;
    } = {},
  ) =>
    api.post<CompanyInviteCreated>(`/companies/${companyId}/invites`, input),

  createOpenClawInvitePrompt: (
    companyId: string,
    input: {
      agentMessage?: string | null;
    } = {},
  ) =>
    api.post<CompanyInviteCreated>(
      `/companies/${companyId}/openclaw/invite-prompt`,
      input,
    ),

  getInvite: (token: string) => api.get<InviteSummary>(`/invites/${token}`),
  getInviteOnboarding: (token: string) =>
    api.get<InviteOnboardingManifest>(`/invites/${token}/onboarding`),

  acceptInvite: (token: string, input: AcceptInviteInput) =>
    api.post<AgentJoinRequestAccepted | JoinRequest | { bootstrapAccepted: true; userId: string }>(
      `/invites/${token}/accept`,
      input,
    ),

  listInvites: (
    companyId: string,
    options: {
      state?: "active" | "revoked" | "accepted" | "expired";
      limit?: number;
      offset?: number;
    } = {},
  ) =>
    api.get<CompanyInviteListResponse>(
      `/companies/${companyId}/invites${buildInviteListQuery(options)}`,
    ),

  revokeInvite: (inviteId: string) => api.post(`/invites/${inviteId}/revoke`, {}),

  listJoinRequests: (
    companyId: string,
    status: "pending_approval" | "approved" | "rejected" = "pending_approval",
    requestType?: "human" | "agent",
  ) =>
    api.get<CompanyJoinRequest[]>(
      `/companies/${companyId}/join-requests?status=${status}${requestType ? `&requestType=${requestType}` : ""}`,
    ),

  listMembers: (companyId: string) =>
    api.get<CompanyMembersResponse>(`/companies/${companyId}/members`),

  listUserDirectory: (companyId: string) =>
    api.get<CompanyUserDirectoryResponse>(`/companies/${companyId}/user-directory`),

  updateMember: (
    companyId: string,
    memberId: string,
    input: {
      membershipRole?: HumanCompanyRole | null;
      status?: "pending" | "active" | "suspended";
    },
  ) => api.patch<CompanyMember>(`/companies/${companyId}/members/${memberId}`, input),

  updateMemberPermissions: (
    companyId: string,
    memberId: string,
    input: {
      grants: Array<{
        permissionKey: PermissionKey;
        scope?: Record<string, unknown> | null;
      }>;
    },
  ) => api.patch<CompanyMember>(`/companies/${companyId}/members/${memberId}/permissions`, input),

  updateMemberAccess: (
    companyId: string,
    memberId: string,
    input: {
      membershipRole?: HumanCompanyRole | null;
      status?: "pending" | "active" | "suspended";
      grants: Array<{
        permissionKey: PermissionKey;
        scope?: Record<string, unknown> | null;
      }>;
    },
  ) => api.patch<CompanyMember>(`/companies/${companyId}/members/${memberId}/role-and-grants`, input),

  archiveMember: (
    companyId: string,
    memberId: string,
    input: {
      reassignment?: {
        assigneeAgentId?: string | null;
        assigneeUserId?: string | null;
      } | null;
    } = {},
  ) => api.post<ArchiveCompanyMemberResponse>(`/companies/${companyId}/members/${memberId}/archive`, input),

  approveJoinRequest: (companyId: string, requestId: string) =>
    api.post<JoinRequest>(`/companies/${companyId}/join-requests/${requestId}/approve`, {}),

  rejectJoinRequest: (companyId: string, requestId: string) =>
    api.post<JoinRequest>(`/companies/${companyId}/join-requests/${requestId}/reject`, {}),

  claimJoinRequestApiKey: (requestId: string, claimSecret: string) =>
    api.post<{ keyId: string; token: string; agentId: string; createdAt: string }>(
      `/join-requests/${requestId}/claim-api-key`,
      { claimSecret },
    ),

  getBoardClaimStatus: (token: string, code: string) =>
    api.get<BoardClaimStatus>(`/board-claim/${token}?code=${encodeURIComponent(code)}`),

  claimBoard: (token: string, code: string) =>
    api.post<{ claimed: true; userId: string }>(`/board-claim/${token}/claim`, { code }),

  getCliAuthChallenge: (id: string, token: string) =>
    api.get<CliAuthChallengeStatus>(`/cli-auth/challenges/${id}?token=${encodeURIComponent(token)}`),

  approveCliAuthChallenge: (id: string, token: string) =>
    api.post<{ approved: boolean; status: string; userId: string; keyId: string | null; expiresAt: string }>(
      `/cli-auth/challenges/${id}/approve`,
      { token },
    ),

  cancelCliAuthChallenge: (id: string, token: string) =>
    api.post<{ cancelled: boolean; status: string }>(`/cli-auth/challenges/${id}/cancel`, { token }),

  searchAdminUsers: (query: string) =>
    api.get<AdminUserDirectoryEntry[]>(`/admin/users?query=${encodeURIComponent(query)}`),

  promoteInstanceAdmin: (userId: string) =>
    api.post(`/admin/users/${userId}/promote-instance-admin`, {}),

  demoteInstanceAdmin: (userId: string) =>
    api.post(`/admin/users/${userId}/demote-instance-admin`, {}),

  getUserCompanyAccess: (userId: string) =>
    api.get<UserCompanyAccessResponse>(`/admin/users/${userId}/company-access`),

  setUserCompanyAccess: (userId: string, companyIds: string[]) =>
    api.put<UserCompanyAccessResponse>(`/admin/users/${userId}/company-access`, { companyIds }),

  getCurrentBoardAccess: () =>
    api.get<CurrentBoardAccess>("/cli-auth/me"),
};
