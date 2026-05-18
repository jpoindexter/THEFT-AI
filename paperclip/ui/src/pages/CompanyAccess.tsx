import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { type PermissionKey } from "@paperclipai/shared";
import { ShieldCheck } from "lucide-react";
import { accessApi, type CompanyMember } from "@/api/access";
import { agentsApi } from "@/api/agents";
import { ApiError } from "@/api/client";
import { issuesApi } from "@/api/issues";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  isAssignableAgent,
  isEditableMemberStatus,
  reassignmentIssueStatuses,
  type EditableMemberStatus,
} from "./company-access/accessModel";
import { EditMemberDialog } from "./company-access/EditMemberDialog";
import { MembersSection } from "./company-access/MembersSection";
import { RemoveMemberDialog } from "./company-access/RemoveMemberDialog";

export function CompanyAccess() {
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [reassignmentTarget, setReassignmentTarget] = useState("__unassigned");
  const [draftRole, setDraftRole] = useState<CompanyMember["membershipRole"]>(null);
  const [draftStatus, setDraftStatus] = useState<EditableMemberStatus>("active");
  const [draftGrants, setDraftGrants] = useState<Set<PermissionKey>>(new Set());

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: "Settings", href: "/company/settings" },
      { label: "Access" },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs]);

  const membersQuery = useQuery({
    queryKey: queryKeys.access.companyMembers(selectedCompanyId ?? ""),
    queryFn: () => accessApi.listMembers(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const agentsQuery = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId ?? ""),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const joinRequestsQuery = useQuery({
    queryKey: queryKeys.access.joinRequests(selectedCompanyId ?? "", "pending_approval"),
    queryFn: () => accessApi.listJoinRequests(selectedCompanyId!, "pending_approval"),
    enabled: !!selectedCompanyId && !!membersQuery.data?.access.canApproveJoinRequests,
  });

  const refreshAccessData = async () => {
    if (!selectedCompanyId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyMembers(selectedCompanyId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId, "pending_approval") });
  };

  const updateMemberMutation = useMutation({
    mutationFn: (input: { memberId: string; membershipRole: CompanyMember["membershipRole"]; status: EditableMemberStatus; grants: PermissionKey[] }) =>
      accessApi.updateMemberAccess(selectedCompanyId!, input.memberId, {
        membershipRole: input.membershipRole,
        status: input.status,
        grants: input.grants.map((permissionKey) => ({ permissionKey })),
      }),
    onSuccess: async () => {
      setEditingMemberId(null);
      await refreshAccessData();
      pushToast({ title: "Member updated", tone: "success" });
    },
    onError: (error) => pushToast(toastError("Failed to update member", error)),
  });

  const approveJoinRequestMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.approveJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await refreshAccessData();
      pushToast({ title: "Join request approved", tone: "success" });
    },
    onError: (error) => pushToast(toastError("Failed to approve join request", error)),
  });

  const rejectJoinRequestMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.rejectJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await refreshAccessData();
      pushToast({ title: "Join request rejected", tone: "success" });
    },
    onError: (error) => pushToast(toastError("Failed to reject join request", error)),
  });

  const members = membersQuery.data?.members ?? [];
  const editingMember = useMemo(() => members.find((member) => member.id === editingMemberId) ?? null, [editingMemberId, members]);
  const removingMember = useMemo(() => members.find((member) => member.id === removingMemberId) ?? null, [removingMemberId, members]);

  const assignedIssuesQuery = useQuery({
    queryKey: ["access", "member-assigned-issues", selectedCompanyId ?? "", removingMember?.principalId ?? ""],
    queryFn: () =>
      issuesApi.list(selectedCompanyId!, {
        assigneeUserId: removingMember!.principalId,
        status: reassignmentIssueStatuses,
      }),
    enabled: !!selectedCompanyId && !!removingMember,
  });

  const archiveMemberMutation = useMutation({
    mutationFn: (input: { memberId: string; target: string }) =>
      accessApi.archiveMember(selectedCompanyId!, input.memberId, { reassignment: buildReassignment(input.target) }),
    onSuccess: async (result) => {
      setRemovingMemberId(null);
      setReassignmentTarget("__unassigned");
      await refreshAccessData();
      await invalidateIssueLists(queryClient, selectedCompanyId);
      pushToast({
        title: "Member removed",
        body: result.reassignedIssueCount > 0 ? `${result.reassignedIssueCount} assigned issue${result.reassignedIssueCount === 1 ? "" : "s"} cleaned up.` : undefined,
        tone: "success",
      });
    },
    onError: (error) => pushToast(toastError("Failed to remove member", error)),
  });

  useEffect(() => {
    if (!editingMember) return;
    setDraftRole(editingMember.membershipRole);
    setDraftStatus(isEditableMemberStatus(editingMember.status) ? editingMember.status : "suspended");
    setDraftGrants(new Set(editingMember.grants.map((grant) => grant.permissionKey)));
  }, [editingMember]);

  useEffect(() => {
    if (removingMember) setReassignmentTarget("__unassigned");
  }, [removingMember]);

  if (!selectedCompanyId) return <div className="text-sm text-muted-foreground">Select a company to manage access.</div>;
  if (membersQuery.isLoading) return <div className="text-sm text-muted-foreground">Loading company access...</div>;
  if (membersQuery.error) return <div className="text-sm text-destructive">{memberQueryErrorMessage(membersQuery.error)}</div>;

  const access = membersQuery.data?.access;
  const pendingHumanJoinRequests = joinRequestsQuery.data?.filter((request) => request.requestType === "human") ?? [];
  const activeReassignmentUsers = members.filter((member) => member.status === "active" && member.principalType === "user" && member.id !== removingMemberId);
  const activeReassignmentAgents = (agentsQuery.data ?? []).filter(isAssignableAgent);
  const assignedIssues = assignedIssuesQuery.data ?? [];

  return (
    <div className="max-w-6xl space-y-8">
      <CompanyAccessHeader companyName={selectedCompany?.name} />
      {access && !access.currentUserRole ? <InstanceAdminNotice /> : null}
      <MembersSection
        members={members}
        canApproveJoinRequests={Boolean(access?.canApproveJoinRequests)}
        pendingHumanJoinRequests={pendingHumanJoinRequests}
        joinRequestActionPending={approveJoinRequestMutation.isPending || rejectJoinRequestMutation.isPending}
        onApproveJoin={(requestId) => approveJoinRequestMutation.mutate(requestId)}
        onRejectJoin={(requestId) => rejectJoinRequestMutation.mutate(requestId)}
        onEditMember={setEditingMemberId}
        onRemoveMember={setRemovingMemberId}
      />
      <EditMemberDialog
        member={editingMember}
        draftRole={draftRole}
        draftStatus={draftStatus}
        draftGrants={draftGrants}
        isSaving={updateMemberMutation.isPending}
        onOpenChange={(open) => !open && setEditingMemberId(null)}
        onDraftRoleChange={setDraftRole}
        onDraftStatusChange={setDraftStatus}
        onGrantToggle={toggleDraftGrant(setDraftGrants)}
        onSave={() => {
          if (!editingMember) return;
          updateMemberMutation.mutate({ memberId: editingMember.id, membershipRole: draftRole, status: draftStatus, grants: [...draftGrants] });
        }}
      />
      <RemoveMemberDialog
        member={removingMember}
        assignedIssues={assignedIssues}
        isCheckingIssues={assignedIssuesQuery.isLoading}
        isRemoving={archiveMemberMutation.isPending}
        reassignmentTarget={reassignmentTarget}
        activeReassignmentUsers={activeReassignmentUsers}
        activeReassignmentAgents={activeReassignmentAgents}
        onOpenChange={(open) => !open && setRemovingMemberId(null)}
        onReassignmentTargetChange={setReassignmentTarget}
        onRemove={() => {
          if (!removingMember) return;
          archiveMemberMutation.mutate({ memberId: removingMember.id, target: reassignmentTarget });
        }}
      />
    </div>
  );
}

function CompanyAccessHeader({ companyName }: { companyName?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Company Access</h1>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Manage company user memberships, membership status, and explicit permission grants for {companyName}.
      </p>
    </div>
  );
}

function InstanceAdminNotice() {
  return (
    <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
      This account can manage access here through instance-admin privileges, but it does not currently hold an active company membership.
    </div>
  );
}

function toggleDraftGrant(setDraftGrants: Dispatch<SetStateAction<Set<PermissionKey>>>) {
  return (permissionKey: PermissionKey, checked: boolean) => {
    setDraftGrants((current) => {
      const next = new Set(current);
      if (checked) next.add(permissionKey);
      else next.delete(permissionKey);
      return next;
    });
  };
}

function buildReassignment(target: string) {
  if (target.startsWith("agent:")) return { assigneeAgentId: target.slice("agent:".length), assigneeUserId: null };
  if (target.startsWith("user:")) return { assigneeAgentId: null, assigneeUserId: target.slice("user:".length) };
  return null;
}

async function invalidateIssueLists(queryClient: QueryClient, selectedCompanyId: string | null) {
  if (!selectedCompanyId) return;
  await queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.issues.listAssignedToMe(selectedCompanyId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
}

function memberQueryErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) return "You do not have permission to manage company members.";
  return error instanceof Error ? error.message : "Failed to load company members.";
}

function toastError(title: string, error: unknown) {
  return {
    title,
    body: error instanceof Error ? error.message : "Unknown error",
    tone: "error" as const,
  };
}
