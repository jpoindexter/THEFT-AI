import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PendingHumanJoinRequest = {
  id: string;
  requesterUser?: { name?: string | null; email?: string | null } | null;
  requestEmailSnapshot?: string | null;
  requestingUserId?: string | null;
  invite?: {
    allowedJoinTypes: string;
    humanRole?: string | null;
  } | null;
  createdAt: string | Date;
};

type PendingJoinRequestsSectionProps = {
  requests: PendingHumanJoinRequest[];
  disabled: boolean;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
};

export function PendingJoinRequestsSection({
  requests,
  disabled,
  onApprove,
  onReject,
}: PendingJoinRequestsSectionProps) {
  if (requests.length === 0) return null;

  return (
    <div className="space-y-3 rounded-md border border-border px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Pending human joins</h3>
          <p className="text-sm text-muted-foreground">
            Review human join requests before they become active company members.
          </p>
        </div>
        <Badge variant="outline">{requests.length} pending</Badge>
      </div>
      <div className="space-y-3">
        {requests.map((request) => (
          <PendingJoinRequestCard
            key={request.id}
            title={request.requesterUser?.name || request.requestEmailSnapshot || request.requestingUserId || "Unknown human requester"}
            subtitle={request.requesterUser?.email || request.requestEmailSnapshot || request.requestingUserId || "No email available"}
            context={
              request.invite
                ? `${request.invite.allowedJoinTypes} join invite${request.invite.humanRole ? ` - default role ${request.invite.humanRole}` : ""}`
                : "Invite metadata unavailable"
            }
            detail={`Submitted ${new Date(request.createdAt).toLocaleString()}`}
            disabled={disabled}
            onApprove={() => onApprove(request.id)}
            onReject={() => onReject(request.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PendingJoinRequestCard({
  title,
  subtitle,
  context,
  detail,
  disabled,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle: string;
  context: string;
  detail: string;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-md border border-border px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </div>
          <div className="text-sm text-muted-foreground">{context}</div>
          <div className="text-sm text-muted-foreground">{detail}</div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onReject} disabled={disabled}>Reject human</Button>
          <Button type="button" onClick={onApprove} disabled={disabled}>Approve human</Button>
        </div>
      </div>
    </div>
  );
}
