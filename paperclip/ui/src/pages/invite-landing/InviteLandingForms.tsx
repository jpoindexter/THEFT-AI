import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { AgentAdapterType } from "@paperclipai/shared";
import { getAdapterLabel } from "@/adapters/adapter-display-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ENABLED_INVITE_ADAPTERS,
  joinAdapterOptions,
  type AuthFeedback,
  type AuthMode,
} from "./inviteLandingModel";
import type { InviteLandingContentProps } from "./InviteLandingContent";

export function AgentJoinForm({
  acceptMutation,
  adapterType,
  agentName,
  capabilities,
  companyDisplayName,
  error,
  joinButtonLabel,
  setAdapterType,
  setAgentName,
  setCapabilities,
}: InviteLandingContentProps) {
  return (
    <div className="space-y-4">
      <FormHeading
        title="Submit agent details"
        description={`This invite will create an approval request for a new agent in ${companyDisplayName}.`}
      />
      <Field label="Agent name">
        <Input value={agentName} onChange={(event) => setAgentName(event.target.value)} />
      </Field>
      <Field label="Adapter type">
        <Select value={adapterType} onValueChange={(value) => setAdapterType(value as AgentAdapterType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {joinAdapterOptions.map((type) => (
              <SelectItem key={type} value={type} disabled={!ENABLED_INVITE_ADAPTERS.has(type)}>
                {getAdapterLabel(type)}{!ENABLED_INVITE_ADAPTERS.has(type) ? " (Coming soon)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Capabilities">
        <Textarea rows={4} value={capabilities} onChange={(event) => setCapabilities(event.target.value)} />
      </Field>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={acceptMutation.isPending || agentName.trim().length === 0} onClick={() => acceptMutation.mutate()}>
        {acceptMutation.isPending ? "Working..." : joinButtonLabel}
      </Button>
    </div>
  );
}

export function InviteAuthForm(props: InviteLandingContentProps) {
  const { authMode, companyDisplayName } = props;
  return (
    <div className="space-y-5">
      <FormHeading
        title={authMode === "sign_up" ? "Create your account" : "Sign in to continue"}
        description={authMode === "sign_up"
          ? `Start with a THEFT account. After that, you will come right back here to accept the invite for ${companyDisplayName}.`
          : "Use the THEFT account that already matches this invite. If you do not have one yet, switch back to create account."}
      />
      <AuthModeSwitch {...props} />
      <AuthFields {...props} />
      <p className="text-xs leading-5 text-muted-foreground">
        {authMode === "sign_up"
          ? "Already signed up before? Use the existing-account option instead so the invite lands on the right THEFT user."
          : "No account yet? Switch back to create account so you can accept the invite with a new login."}
      </p>
    </div>
  );
}

export function AcceptInvitePanel({
  acceptMutation,
  companyDisplayName,
  error,
  invite,
  isCurrentMember,
  joinButtonLabel,
  shouldAutoAcceptHumanInvite,
}: InviteLandingContentProps) {
  return (
    <div className="space-y-4">
      <FormHeading
        title={shouldAutoAcceptHumanInvite ? "Submitting join request" : invite.inviteType === "bootstrap_ceo" ? "Accept bootstrap invite" : "Accept company invite"}
        description={shouldAutoAcceptHumanInvite
          ? `Submitting your join request for ${companyDisplayName}.`
          : isCurrentMember
            ? `This account already belongs to ${companyDisplayName}.`
            : `This will ${invite.inviteType === "bootstrap_ceo" ? "finish setting up THEFT" : `submit or complete your join request for ${companyDisplayName}`}.`}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {shouldAutoAcceptHumanInvite ? (
        <div className="text-sm text-muted-foreground">
          {acceptMutation.isPending ? "Submitting request..." : "Finishing sign-in..."}
        </div>
      ) : (
        <Button className="w-full" disabled={acceptMutation.isPending || isCurrentMember} onClick={() => acceptMutation.mutate()}>
          {acceptMutation.isPending ? "Working..." : joinButtonLabel}
        </Button>
      )}
    </div>
  );
}

function AuthModeSwitch({ authMode, setAuthFeedback, setAuthMode }: InviteLandingContentProps) {
  return (
    <div className="flex gap-2">
      {[
        ["sign_up", "Create account"],
        ["sign_in", "I already have an account"],
      ].map(([mode, label]) => (
        <Button
          key={mode}
          type="button"
          variant={authMode === mode ? "secondary" : "outline"}
          className="flex-1"
          onClick={() => {
            setAuthFeedback(null);
            setAuthMode(mode as AuthMode);
          }}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function AuthFields({
  authCanSubmit,
  authFeedback,
  authMode,
  authMutation,
  email,
  name,
  password,
  setAuthFeedback,
  setEmail,
  setName,
  setPassword,
}: InviteLandingContentProps) {
  return (
    <form
      className="space-y-4"
      method="post"
      action={authMode === "sign_up" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email"}
      onSubmit={(event) => {
        event.preventDefault();
        if (authMutation.isPending) return;
        if (!authCanSubmit) {
          setAuthFeedback({ tone: "error", message: "Please fill in all required fields." });
          return;
        }
        authMutation.mutate();
      }}
      data-testid="invite-inline-auth"
    >
      {authMode === "sign_up" ? (
        <Field label="Name">
          <Input name="name" value={name} onChange={(event) => updateField(setName, setAuthFeedback, event.target.value)} autoComplete="name" autoFocus />
        </Field>
      ) : null}
      <Field label="Email">
        <Input name="email" type="email" value={email} onChange={(event) => updateField(setEmail, setAuthFeedback, event.target.value)} autoComplete="email" autoFocus={authMode === "sign_in"} />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" value={password} onChange={(event) => updateField(setPassword, setAuthFeedback, event.target.value)} autoComplete={authMode === "sign_in" ? "current-password" : "new-password"} />
      </Field>
      {authFeedback ? (
        <p className={`text-xs ${authFeedback.tone === "info" ? "text-muted-foreground" : "text-destructive"}`}>
          {authFeedback.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={authMutation.isPending} aria-disabled={!authCanSubmit || authMutation.isPending}>
        {authMutation.isPending ? "Working..." : authMode === "sign_in" ? "Sign in and continue" : "Create account and continue"}
      </Button>
    </form>
  );
}

function FormHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </Label>
  );
}

function updateField(
  setter: Dispatch<SetStateAction<string>>,
  setAuthFeedback: Dispatch<SetStateAction<AuthFeedback | null>>,
  value: string,
) {
  setter(value);
  setAuthFeedback(null);
}
