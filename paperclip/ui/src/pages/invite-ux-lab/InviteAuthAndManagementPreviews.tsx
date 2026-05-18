import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ExternalLink, FlaskConical, MailPlus } from "lucide-react";
import { inviteHistory, inviteRoleOptions } from "./inviteUxLabData";

export function AuthPreviewSet() {
  return (
    <div className="space-y-5">
      <AuthScreenPreview mode="sign_in" error="Invalid email or password" />
      <AuthScreenPreview mode="sign_up" />
    </div>
  );
}

function AuthScreenPreview({ mode, error }: { mode: "sign_in" | "sign_up"; error?: string }) {
  return (
    <Card>
      <CardContent className="grid gap-6 p-6 md:grid-cols-2">
        <div className="flex min-h-96 flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Paperclip</span>
            </div>
            <h3 className="text-xl font-semibold">
              {mode === "sign_in" ? "Sign in to Paperclip" : "Create your Paperclip account"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "sign_in"
                ? "Use your email and password to access this instance."
                : "Create an account for this instance. Email confirmation is not required in v1."}
            </p>
            <div className="mt-6 space-y-4">
              {mode === "sign_up" ? <PreviewInput label="Name" value="Jane Example" /> : null}
              <PreviewInput label="Email" value="jane@example.com" type="email" />
              <PreviewInput label="Password" value="supersecret" type="password" />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <Button type="button" className="w-full">
                {mode === "sign_in" ? "Sign In" : "Create Account"}
              </Button>
            </div>
            <div className="mt-5 text-sm text-muted-foreground">
              {mode === "sign_in" ? "Need an account?" : "Already have an account?"}{" "}
              <span className="font-medium text-foreground underline underline-offset-2">
                {mode === "sign_in" ? "Create one" : "Sign in"}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden min-h-96 items-center justify-center rounded-md border border-border bg-muted px-8 py-10 md:flex">
          <div className="max-w-sm space-y-4">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs uppercase text-muted-foreground">
              Auth preview
            </div>
            <div className="text-2xl font-semibold">Side-by-side signup styling review</div>
            <p className="text-sm leading-6 text-muted-foreground">
              This frame mirrors the production auth surface so spacing, label density, button treatments, and desktop composition are easy to compare.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompanyInvitesPreview() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <CreateInvitePreview />
      <InviteHistoryPreview />
    </div>
  );
}

function CreateInvitePreview() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MailPlus className="h-4 w-4" />
          Company Invites
        </div>
        <div>
          <CardTitle>Create invite</CardTitle>
          <CardDescription className="mt-2">
            Generate a human invite link and choose the default access it should request.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RoleOptionsPreview />
        <div className="rounded-md border border-border px-4 py-3 text-sm text-muted-foreground">
          Each invite link is single-use. The first successful use consumes the link and creates or reuses the matching join request before approval.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button">Create invite</Button>
          <span className="text-sm text-muted-foreground">Invite history below keeps the audit trail.</span>
        </div>
        <CopiedInviteLink />
      </CardContent>
    </Card>
  );
}

function RoleOptionsPreview() {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Choose a role</div>
      <div className="rounded-md border border-border">
        {inviteRoleOptions.map((option) => (
          <div key={option.value} className="flex gap-3 border-b border-border px-4 py-4 last:border-b-0">
            <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-md border border-border">
              {option.value === "operator" ? <span className="h-2 w-2 rounded-sm bg-foreground" /> : null}
            </span>
            <span className="min-w-0 space-y-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{option.label}</span>
                {option.value === "operator" ? (
                  <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">Default</span>
                ) : null}
              </span>
              <span className="block max-w-2xl text-sm text-muted-foreground">{option.description}</span>
              <span className="block text-sm text-foreground">{option.gets}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopiedInviteLink() {
  return (
    <div className="space-y-3 rounded-md border border-border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Latest invite link</div>
          <div className="text-sm text-muted-foreground">
            This URL includes the current Paperclip domain returned by the server.
          </div>
        </div>
        <div className="inline-flex items-center gap-1 text-xs font-medium">
          <Check className="h-3.5 w-3.5" />
          Copied
        </div>
      </div>
      <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm break-all">
        https://paperclip.local/invite/new-token
      </div>
      <Button type="button" size="sm" variant="outline">
        <ExternalLink className="h-4 w-4" />
        Open invite
      </Button>
    </div>
  );
}

function InviteHistoryPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite history</CardTitle>
        <CardDescription className="mt-2">
          Review invite status, role, inviter, and any linked join request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border border-border">
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
                  <td className="px-5 py-3 align-top"><span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">{invite.state}</span></td>
                  <td className="px-5 py-3 align-top">{invite.humanRole}</td>
                  <td className="px-5 py-3 align-top"><div>{invite.invitedBy}</div><div className="text-xs text-muted-foreground">{invite.email}</div></td>
                  <td className="px-5 py-3 align-top text-muted-foreground">{invite.createdAt}</td>
                  <td className="px-5 py-3 align-top">{invite.relatedLabel === "Review request" ? <a href="/inbox/requests" className="underline underline-offset-4">{invite.relatedLabel}</a> : <span className="text-muted-foreground">{invite.relatedLabel}</span>}</td>
                  <td className="px-5 py-3 text-right align-top">{invite.action === "Revoke" ? <Button type="button" size="sm" variant="outline">Revoke</Button> : <span className="text-xs text-muted-foreground">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border p-4">
            <div className="text-sm font-medium">Empty history state</div>
            <div className="mt-2 text-sm text-muted-foreground">No invites have been created for this company yet.</div>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <div className="text-sm font-medium">Permission error</div>
            <div className="mt-2 text-sm text-muted-foreground">You do not have permission to manage company invites.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewInput({ label, type = "text", value }: { label: string; type?: string; value: string }) {
  return (
    <Label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input type={type} defaultValue={value} readOnly />
    </Label>
  );
}
