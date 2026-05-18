import { type Agent, type PermissionKey } from "@paperclipai/shared";
import type { CompanyMember } from "@/api/access";

export const permissionLabels: Record<PermissionKey, string> = {
  "agents:create": "Create agents",
  "users:invite": "Invite humans and agents",
  "users:manage_permissions": "Manage members and grants",
  "tasks:assign": "Assign tasks",
  "tasks:assign_scope": "Assign scoped tasks",
  "tasks:manage_active_checkouts": "Manage active task checkouts",
  "joins:approve": "Approve join requests",
  "environments:manage": "Manage environments",
};

export const reassignmentIssueStatuses = "backlog,todo,in_progress,in_review,blocked,failed,timed_out";

export type EditableMemberStatus = "pending" | "active" | "suspended";

const implicitRoleGrantMap: Record<NonNullable<CompanyMember["membershipRole"]>, PermissionKey[]> = {
  owner: ["agents:create", "users:invite", "users:manage_permissions", "tasks:assign", "joins:approve"],
  admin: ["agents:create", "users:invite", "tasks:assign", "joins:approve"],
  operator: ["tasks:assign"],
  viewer: [],
};

export function formatGrantSummary(member: CompanyMember) {
  if (member.grants.length === 0) return "No explicit grants";
  return member.grants.map((grant) => permissionLabels[grant.permissionKey]).join(", ");
}

export function getImplicitGrantKeys(role: CompanyMember["membershipRole"]) {
  return role ? implicitRoleGrantMap[role] : [];
}

export function memberDisplayName(member: CompanyMember | null) {
  if (!member) return "this member";
  return member.user?.name?.trim() || member.user?.email || member.principalId;
}

export function isAssignableAgent(agent: Agent) {
  return agent.status !== "terminated" && agent.status !== "pending_approval";
}

export function isEditableMemberStatus(status: CompanyMember["status"]): status is EditableMemberStatus {
  return status === "pending" || status === "active" || status === "suspended";
}
