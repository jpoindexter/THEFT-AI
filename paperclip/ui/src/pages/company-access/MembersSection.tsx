import { HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS } from "@paperclipai/shared";
import { Trash2, Users } from "lucide-react";
import type { CompanyMember } from "@/api/access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatGrantSummary } from "./accessModel";
import { PendingJoinRequestsSection } from "./PendingJoinRequestsSection";

type MembersSectionProps = {
  members: CompanyMember[];
  canApproveJoinRequests: boolean;
  pendingHumanJoinRequests: Parameters<typeof PendingJoinRequestsSection>[0]["requests"];
  joinRequestActionPending: boolean;
  onApproveJoin: (requestId: string) => void;
  onRejectJoin: (requestId: string) => void;
  onEditMember: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
};

export function MembersSection({
  members,
  canApproveJoinRequests,
  pendingHumanJoinRequests,
  joinRequestActionPending,
  onApproveJoin,
  onRejectJoin,
  onEditMember,
  onRemoveMember,
}: MembersSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Humans</h2>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Manage human company memberships, status, and grants here.
        </p>
      </div>
      {canApproveJoinRequests ? (
        <PendingJoinRequestsSection
          requests={pendingHumanJoinRequests}
          disabled={joinRequestActionPending}
          onApprove={onApproveJoin}
          onReject={onRejectJoin}
        />
      ) : null}
      <div className="overflow-hidden rounded-md border border-border">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-5 gap-3 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div>User account</div>
            <div>Role</div>
            <div>Status</div>
            <div>Grants</div>
            <div className="text-right">Action</div>
          </div>
          {members.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">No user memberships found for this company yet.</div>
          ) : (
            members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onEdit={() => onEditMember(member.id)}
                onRemove={() => onRemoveMember(member.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function MemberRow({
  member,
  onEdit,
  onRemove,
}: {
  member: CompanyMember;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const removalReason = member.removal?.reason ?? null;
  const canArchive = member.removal?.canArchive ?? true;

  return (
    <div className="grid grid-cols-5 gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="truncate font-medium">{member.user?.name?.trim() || member.user?.email || member.principalId}</div>
        <div className="truncate text-xs text-muted-foreground">{member.user?.email || member.principalId}</div>
      </div>
      <div className="text-sm">
        {member.membershipRole ? HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS[member.membershipRole] : "Unset"}
      </div>
      <div>
        <Badge variant={member.status === "active" ? "secondary" : member.status === "suspended" ? "destructive" : "outline"}>
          {member.status.replace("_", " ")}
        </Badge>
      </div>
      <div className="min-w-0 text-sm text-muted-foreground">{formatGrantSummary(member)}</div>
      <div className="space-y-1 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="outline" onClick={onRemove} disabled={!canArchive} title={removalReason ?? undefined}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
        {removalReason ? <div className="text-xs text-muted-foreground">{removalReason}</div> : null}
      </div>
    </div>
  );
}
