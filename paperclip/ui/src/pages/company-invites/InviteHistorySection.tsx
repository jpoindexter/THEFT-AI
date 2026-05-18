import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";
import type { InviteHistoryRow } from "./inviteModel";
import { formatInviteState } from "./inviteModel";

type InviteHistorySectionProps = {
  inviteHistory: InviteHistoryRow[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  revokePending: boolean;
  onFetchNextPage: () => void;
  onRevoke: (inviteId: string) => void;
};

export function InviteHistorySection({
  inviteHistory,
  hasNextPage,
  isFetchingNextPage,
  revokePending,
  onFetchNextPage,
  onRevoke,
}: InviteHistorySectionProps) {
  return (
    <section className="rounded-xl border border-border">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Invite history</h2>
          <p className="text-sm text-muted-foreground">
            Review invite status, role, inviter, and any linked join request.
          </p>
        </div>
        <Link to="/inbox/requests" className="text-sm underline underline-offset-4">
          Open join request queue
        </Link>
      </div>

      {inviteHistory.length === 0 ? (
        <div className="border-t border-border px-5 py-8 text-sm text-muted-foreground">
          No invites have been created for this company yet.
        </div>
      ) : (
        <div className="border-t border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium text-muted-foreground">State</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Invited by</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Join request</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {inviteHistory.map((invite) => (
                  <tr key={invite.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-3 align-top">
                      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {formatInviteState(invite.state)}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-top">{invite.humanRole ?? "-"}</td>
                    <td className="px-5 py-3 align-top">
                      <div>{invite.invitedByUser?.name || invite.invitedByUser?.email || "Unknown inviter"}</div>
                      {invite.invitedByUser?.email && invite.invitedByUser.name ? (
                        <div className="text-xs text-muted-foreground">{invite.invitedByUser.email}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 align-top text-muted-foreground">
                      {new Date(invite.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 align-top">
                      {invite.relatedJoinRequestId ? (
                        <Link to="/inbox/requests" className="underline underline-offset-4">
                          Review request
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right align-top">
                      {invite.state === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRevoke(invite.id)}
                          disabled={revokePending}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage ? (
            <div className="flex justify-center border-t border-border px-5 py-4">
              <Button type="button" variant="outline" onClick={onFetchNextPage} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Loading more..." : "View more"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
