import {
  ArrowRight,
  Check,
  Clock3,
  KeyRound,
  Link2,
  Loader2,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

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

export const inviteHistory = [
  {
    id: "invite-active",
    state: "Active",
    humanRole: "operator",
    invitedBy: "Board User 25",
    email: "board25@paperclip.local",
    createdAt: "Apr 25, 2026, 9:00 AM",
    action: "Revoke",
    relatedLabel: "Review request",
  },
  {
    id: "invite-accepted",
    state: "Accepted",
    humanRole: "viewer",
    invitedBy: "Board User 24",
    email: "board24@paperclip.local",
    createdAt: "Apr 24, 2026, 8:15 AM",
    action: "Inactive",
    relatedLabel: "—",
  },
  {
    id: "invite-revoked",
    state: "Revoked",
    humanRole: "admin",
    invitedBy: "Board User 20",
    email: "board20@paperclip.local",
    createdAt: "Apr 20, 2026, 2:45 PM",
    action: "Inactive",
    relatedLabel: "—",
  },
  {
    id: "invite-expired",
    state: "Expired",
    humanRole: "owner",
    invitedBy: "Board User 19",
    email: "board19@paperclip.local",
    createdAt: "Apr 19, 2026, 7:10 PM",
    action: "Inactive",
    relatedLabel: "—",
  },
] as const;

export const labHighlights = [
  "Invite loading, access-check, missing-token, and unavailable states",
  "Inline account creation and sign-in variants, including feedback/error copy",
  "Human accept, agent request, and auto-accept transitions",
  "Pending approval, joined-now, claim secret, and onboarding result screens",
  "Company invite creation, copied-link, history, empty, and permission-error states",
] as const;

export type StatusFixture = {
  icon: LucideIcon;
  title: string;
  body: string;
  tone?: "default" | "warn" | "success" | "error";
  spin?: boolean;
};

export const statusFixtures: StatusFixture[] = [
  {
    icon: Loader2,
    title: "Loading invite",
    body: "Shown while invite summary, deployment mode, or auth session data is still loading.",
    spin: true,
  },
  {
    icon: Clock3,
    title: "Checking your access",
    body: "Shown after sign-in while the app verifies whether the current user already belongs to the invited company.",
  },
  {
    icon: KeyRound,
    title: "Invalid invite token",
    body: "The token is missing entirely, so the page short-circuits before any invite lookup.",
    tone: "error",
  },
  {
    icon: Link2,
    title: "Invite not available",
    body: "Used for expired, revoked, already-consumed, or otherwise missing invites.",
    tone: "warn",
  },
  {
    icon: ShieldCheck,
    title: "Bootstrap complete",
    body: "Result screen for bootstrap CEO invites after setup has been accepted successfully.",
    tone: "success",
  },
  {
    icon: ArrowRight,
    title: "Auto-accept in progress",
    body: "Signed-in human users skip the extra button click and move straight into join submission.",
  },
  {
    icon: Users,
    title: "Already a member",
    body: "Acceptance stays disabled and the page redirects into the company once membership is confirmed.",
  },
  {
    icon: UserPlus,
    title: "Invite result surfaces",
    body: "Both pending-approval and joined-now confirmations are included below with claim and onboarding extras.",
    tone: "success",
  },
  {
    icon: Check,
    title: "Copied invite link",
    body: "The settings preview includes the copied-link confirmation used after invite creation.",
    tone: "success",
  },
];
