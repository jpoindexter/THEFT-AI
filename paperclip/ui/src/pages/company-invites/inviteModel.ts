import type { accessApi } from "@/api/access";

export type InviteRole = "owner" | "admin" | "operator" | "viewer";
export type InviteHistoryRow = Awaited<ReturnType<typeof accessApi.listInvites>>["invites"][number];

export const INVITE_HISTORY_PAGE_SIZE = 5;

export const inviteRoleOptions = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Can view company work and follow along without operational permissions.",
    gets: "No built-in grants.",
  },
  {
    value: "operator",
    label: "Operator",
    description: "Recommended for people who need to help run work without managing access.",
    gets: "Can assign tasks.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Recommended for operators who need to invite people, create agents, and approve joins.",
    gets: "Can create agents, invite users, assign tasks, and approve join requests.",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Full company access, including membership and permission management.",
    gets: "Everything in Admin, plus managing members and permission grants.",
  },
] as const;

export function isInviteHistoryRow(value: unknown): value is InviteHistoryRow {
  if (!value || typeof value !== "object") return false;
  return "id" in value && "state" in value && "createdAt" in value;
}

export function formatInviteState(state: "active" | "accepted" | "expired" | "revoked") {
  return state.charAt(0).toUpperCase() + state.slice(1);
}
