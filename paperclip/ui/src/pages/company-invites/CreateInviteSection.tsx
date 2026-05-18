import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InviteRole } from "./inviteModel";
import { inviteRoleOptions } from "./inviteModel";

type CreateInviteSectionProps = {
  humanRole: InviteRole;
  latestInviteUrl: string | null;
  latestInviteCopied: boolean;
  isCreating: boolean;
  onRoleChange: (role: InviteRole) => void;
  onCreateInvite: () => void;
  onCopyInvite: () => void;
};

export function CreateInviteSection({
  humanRole,
  latestInviteUrl,
  latestInviteCopied,
  isCreating,
  onRoleChange,
  onCreateInvite,
  onCopyInvite,
}: CreateInviteSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Create invite</h2>
        <p className="text-sm text-muted-foreground">
          Generate a human invite link and choose the default access it should request.
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Choose a role</div>
        <div className="grid gap-2">
          {inviteRoleOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={humanRole === option.value ? "default" : "outline"}
              className="h-auto justify-start px-4 py-3 text-left"
              onClick={() => onRoleChange(option.value)}
            >
              <span className="min-w-0 space-y-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.value === "operator" ? (
                    <span className="rounded-full border border-current px-2 py-0.5 text-xs opacity-80">Default</span>
                  ) : null}
                </span>
                <span className="block max-w-2xl text-sm font-normal opacity-80">{option.description}</span>
                <span className="block text-sm font-normal">{option.gets}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
        Each invite link is single-use. The first successful use consumes the link and creates or reuses the matching
        join request before approval.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onCreateInvite} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create invite"}
        </Button>
        <span className="text-sm text-muted-foreground">Invite history below keeps the audit trail.</span>
      </div>

      {latestInviteUrl ? (
        <div className="space-y-3 rounded-lg border border-border px-4 py-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Latest invite link</div>
              {latestInviteCopied ? (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </div>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              This URL includes the current Paperclip domain returned by the server.
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full justify-start px-3 py-2 text-left text-sm break-all"
            onClick={onCopyInvite}
          >
            {latestInviteUrl}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={latestInviteUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open invite
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
