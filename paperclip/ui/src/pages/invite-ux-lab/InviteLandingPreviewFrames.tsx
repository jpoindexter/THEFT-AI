import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CompanyPatternIcon } from "@/components/CompanyPatternIcon";

const demoCompany = "Acme Robotics";
const demoLogoUrl = "/api/invites/pcp_invite_test/logo";
const demoBrandColor = null;

export function InviteLandingPreviewSet() {
  return (
    <div className="space-y-5">
      <InviteLandingShell
        left={
          <InviteSummaryPanel
            title="Join Acme Robotics"
            description="Create your Paperclip account first. If you already have one, switch to sign in and continue the invite with the same email."
            inviteMessage="Welcome aboard."
            requestedAccess="Operator"
          />
        }
        right={<InlineAuthPreview mode="sign_up" />}
      />
      <InviteLandingShell
        left={
          <InviteSummaryPanel
            title="Join Acme Robotics"
            description="Create your Paperclip account first. If you already have one, switch to sign in and continue the invite with the same email."
            inviteMessage="Welcome aboard."
            requestedAccess="Operator"
          />
        }
        right={
          <InlineAuthPreview
            mode="sign_in"
            feedback="An account already exists for jane@example.com. Sign in below to continue with this invite."
          />
        }
      />
      <InviteLandingShell
        left={
          <InviteSummaryPanel
            title="Join Acme Robotics"
            description="Your account is ready. Review the invite details, then accept it to continue."
            inviteMessage="Welcome aboard."
            requestedAccess="Operator"
            signedInLabel="Jane Example"
          />
        }
        right={<AcceptInvitePreview autoAccept />}
      />
      <InviteLandingShell
        left={
          <InviteSummaryPanel
            title="Join Acme Robotics"
            description="Review the invite details, then submit the agent information below to start the join request."
            requestedAccess="Agent join request"
          />
        }
        right={<AgentRequestPreview />}
      />
      <InviteLandingShell
        left={
          <InviteSummaryPanel
            title="Join Acme Robotics"
            description="Your account is ready. Review the invite details, then accept it to continue."
            requestedAccess="Operator"
            signedInLabel="Jane Example"
          />
        }
        right={<AcceptInvitePreview error="This account already belongs to the company." isCurrentMember />}
      />
    </div>
  );
}

function InviteLandingShell({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-6">{left}</section>
        <section>{right}</section>
      </CardContent>
    </Card>
  );
}

function InviteSummaryPanel({
  title,
  description,
  inviteMessage,
  requestedAccess,
  signedInLabel,
}: {
  title: string;
  description: string;
  inviteMessage?: string;
  requestedAccess: string;
  signedInLabel?: string;
}) {
  return (
    <>
      <div className="flex items-start gap-4">
        <CompanyPatternIcon
          companyName={demoCompany}
          logoUrl={demoLogoUrl}
          brandColor={demoBrandColor}
          className="h-16 w-16 rounded-md border border-border"
        />
        <div className="min-w-0">
          <p className="theft-label text-muted-foreground">You&apos;ve been invited to join Paperclip</p>
          <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetaCard label="Company" value={demoCompany} />
        <MetaCard label="Invited by" value="Board User" />
        <MetaCard label="Requested access" value={requestedAccess} />
        <MetaCard label="Invite expires" value="Mar 7, 2027" />
      </div>
      {inviteMessage ? (
        <div className="rounded-md border border-border bg-muted/40 p-4">
          <div className="theft-label-compact text-muted-foreground">Message from inviter</div>
          <p className="mt-2 text-sm leading-6">{inviteMessage}</p>
        </div>
      ) : null}
      {signedInLabel ? (
        <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{signedInLabel}</span>.
        </div>
      ) : null}
    </>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="theft-label-compact text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function InlineAuthPreview({
  mode,
  feedback,
  working,
}: {
  mode: "sign_up" | "sign_in";
  feedback?: string;
  working?: boolean;
}) {
  return (
    <div className="space-y-5">
      <FormHeading
        title={mode === "sign_up" ? "Create your account" : "Sign in to continue"}
        description={mode === "sign_up"
          ? "Start with a Paperclip account. After that, you'll come right back here to accept the invite for Acme Robotics."
          : "Use the Paperclip account that already matches this invite. If you do not have one yet, switch back to create account."}
      />
      <div className="flex gap-2">
        <Button type="button" variant={mode === "sign_up" ? "secondary" : "outline"} className="flex-1">
          Create account
        </Button>
        <Button type="button" variant={mode === "sign_in" ? "secondary" : "outline"} className="flex-1">
          I already have an account
        </Button>
      </div>
      <form className="space-y-4">
        {mode === "sign_up" ? <PreviewInput label="Name" name="name" value="Jane Example" /> : null}
        <PreviewInput label="Email" name="email" type="email" value="jane@example.com" />
        <PreviewInput label="Password" name="password" type="password" value="supersecret" />
        {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}
        <Button type="button" className="w-full" disabled={working}>
          {working ? "Working..." : mode === "sign_in" ? "Sign in and continue" : "Create account and continue"}
        </Button>
      </form>
      <p className="text-xs leading-5 text-muted-foreground">
        {mode === "sign_up"
          ? "Already signed up before? Use the existing-account option instead so the invite lands on the right Paperclip user."
          : "No account yet? Switch back to create account so you can accept the invite with a new login."}
      </p>
    </div>
  );
}

function AgentRequestPreview() {
  return (
    <div className="space-y-4">
      <FormHeading title="Submit agent details" description="This invite will create an approval request for a new agent in Acme Robotics." />
      <PreviewInput label="Agent name" value="Acme Ops Agent" />
      <Label className="block space-y-1.5 text-sm">
        <span className="text-muted-foreground">Adapter type</span>
        <Select defaultValue="codex_local" disabled>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="codex_local">Codex</SelectItem>
            <SelectItem value="claude_local">Claude Code</SelectItem>
            <SelectItem value="cursor">Cursor</SelectItem>
          </SelectContent>
        </Select>
      </Label>
      <Label className="block space-y-1.5 text-sm">
        <span className="text-muted-foreground">Capabilities</span>
        <Textarea rows={4} defaultValue="Reviews invites, triages requests, and keeps the board queue moving." readOnly />
      </Label>
      <Button type="button" className="w-full">Submit request</Button>
    </div>
  );
}

function AcceptInvitePreview({ autoAccept, isCurrentMember, error }: { autoAccept?: boolean; isCurrentMember?: boolean; error?: string }) {
  return (
    <div className="space-y-4">
      <FormHeading
        title="Accept company invite"
        description={autoAccept
          ? "Submitting your join request for Acme Robotics."
          : isCurrentMember
            ? "This account already belongs to Acme Robotics."
            : "This will submit or complete your join request for Acme Robotics."}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {autoAccept ? (
        <div className="text-sm text-muted-foreground">Submitting request...</div>
      ) : (
        <Button type="button" className="w-full" disabled={isCurrentMember}>Accept invite</Button>
      )}
    </div>
  );
}

function PreviewInput({ label, name, type = "text", value }: { label: string; name?: string; type?: string; value: string }) {
  return (
    <Label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input name={name} type={type} defaultValue={value} readOnly />
    </Label>
  );
}

function FormHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
