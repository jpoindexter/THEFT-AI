import type { Dispatch, SetStateAction } from "react";

import { Field, ToggleField } from "@/components/agent-config-primitives";
import { JsonSchemaForm, getDefaultValues } from "@/components/JsonSchemaForm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { EnvironmentFormProps } from "./EnvironmentForm";
import type { EnvironmentFormState } from "./environment-model";

const NO_SECRET_VALUE = "__none__";

export function DriverField({
  environmentForm,
  sandboxCreationEnabled,
  pluginSandboxProviders,
  setEnvironmentForm,
}: Pick<EnvironmentFormProps, "environmentForm" | "sandboxCreationEnabled" | "pluginSandboxProviders" | "setEnvironmentForm">) {
  return (
    <Field label="Driver" hint="Local runs on this host. SSH stores a remote machine target. Sandbox stores plugin-backed provider config.">
      <Select value={environmentForm.driver} onValueChange={(value) => setEnvironmentForm((current) => ({
        ...current,
        driver: value === "local" ? "local" : value === "sandbox" ? "sandbox" : "ssh",
        sandboxProvider: value === "sandbox" ? current.sandboxProvider.trim() || pluginSandboxProviders[0]?.provider || "" : current.sandboxProvider,
        sandboxConfig: value === "sandbox" && current.driver !== "sandbox" && pluginSandboxProviders[0]?.configSchema
          ? getDefaultValues(pluginSandboxProviders[0].configSchema as any)
          : current.sandboxConfig,
      }))}>
        <SelectTrigger className="w-full" aria-label="Environment driver"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ssh">SSH</SelectItem>
          {sandboxCreationEnabled || environmentForm.driver === "sandbox" ? <SelectItem value="sandbox">Sandbox</SelectItem> : null}
          <SelectItem value="local">Local</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

export function SshFields({
  environmentForm,
  secrets,
  setEnvironmentForm,
}: Pick<EnvironmentFormProps, "environmentForm" | "secrets" | "setEnvironmentForm">) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Host" hint="DNS name or IP address for the remote machine.">
        <Input value={environmentForm.sshHost} onChange={(e) => updateForm(setEnvironmentForm, { sshHost: e.target.value })} />
      </Field>
      <Field label="Port" hint="Defaults to 22.">
        <Input type="number" min={1} max={65535} value={environmentForm.sshPort} onChange={(e) => updateForm(setEnvironmentForm, { sshPort: e.target.value })} />
      </Field>
      <Field label="Username" hint="SSH login user.">
        <Input value={environmentForm.sshUsername} onChange={(e) => updateForm(setEnvironmentForm, { sshUsername: e.target.value })} />
      </Field>
      <Field label="Remote workspace path" hint="Absolute path that Paperclip will verify during SSH connection tests.">
        <Input placeholder="/Users/paperclip/workspace" value={environmentForm.sshRemoteWorkspacePath} onChange={(e) => updateForm(setEnvironmentForm, { sshRemoteWorkspacePath: e.target.value })} />
      </Field>
      <Field label="Private key" hint="Optional PEM private key. Leave blank to rely on the server's SSH agent or default keychain.">
        <div className="space-y-2">
          <Select value={environmentForm.sshPrivateKeySecretId || NO_SECRET_VALUE} onValueChange={(value) => updateForm(setEnvironmentForm, { sshPrivateKeySecretId: value === NO_SECRET_VALUE ? "" : value, sshPrivateKey: value === NO_SECRET_VALUE ? environmentForm.sshPrivateKey : "" })}>
            <SelectTrigger className="w-full" aria-label="Private key secret"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SECRET_VALUE}>No saved secret</SelectItem>
              {(secrets ?? []).map((secret) => <SelectItem key={secret.id} value={secret.id}>{secret.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea className="h-32 font-mono text-xs" value={environmentForm.sshPrivateKey} disabled={!!environmentForm.sshPrivateKeySecretId} onChange={(e) => updateForm(setEnvironmentForm, { sshPrivateKey: e.target.value })} />
        </div>
      </Field>
      <Field label="Known hosts" hint="Optional known_hosts block used when strict host key checking is enabled.">
        <Textarea className="h-32 font-mono text-xs" value={environmentForm.sshKnownHosts} onChange={(e) => updateForm(setEnvironmentForm, { sshKnownHosts: e.target.value })} />
      </Field>
      <div className="md:col-span-2">
        <ToggleField label="Strict host key checking" hint="Keep this on unless you deliberately want probe-time host key acceptance disabled." checked={environmentForm.sshStrictHostKeyChecking} onChange={(checked) => updateForm(setEnvironmentForm, { sshStrictHostKeyChecking: checked })} />
      </div>
    </div>
  );
}

export function SandboxFields({
  environmentForm,
  pluginSandboxProviders,
  sandboxConfigErrors,
  selectedSandboxProvider,
  selectedSandboxSchema,
  setEnvironmentForm,
}: Pick<EnvironmentFormProps, "environmentForm" | "pluginSandboxProviders" | "sandboxConfigErrors" | "selectedSandboxProvider" | "selectedSandboxSchema" | "setEnvironmentForm">) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Provider" hint="Installed run-capable sandbox provider plugins appear here.">
        <Select value={environmentForm.sandboxProvider} onValueChange={(nextProviderKey) => {
          const nextProvider = pluginSandboxProviders.find((provider) => provider.provider === nextProviderKey) ?? null;
          setEnvironmentForm((current) => ({
            ...current,
            sandboxProvider: nextProviderKey,
            sandboxConfig: current.sandboxProvider === nextProviderKey ? current.sandboxConfig : nextProvider?.configSchema ? getDefaultValues(nextProvider.configSchema as any) : {},
          }));
        }}>
          <SelectTrigger className="w-full" aria-label="Sandbox provider"><SelectValue /></SelectTrigger>
          <SelectContent>
            {pluginSandboxProviders.map((provider) => <SelectItem key={provider.provider} value={provider.provider}>{provider.displayName}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div className="space-y-3 md:col-span-2">
        {selectedSandboxProvider?.description ? <div className="text-xs text-muted-foreground">{selectedSandboxProvider.description}</div> : null}
        {selectedSandboxSchema ? (
          <JsonSchemaForm schema={selectedSandboxSchema as any} values={environmentForm.sandboxConfig} onChange={(values) => updateForm(setEnvironmentForm, { sandboxConfig: values })} errors={sandboxConfigErrors} />
        ) : (
          <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            This provider does not declare additional configuration fields.
          </div>
        )}
      </div>
    </div>
  );
}

function updateForm(
  setEnvironmentForm: Dispatch<SetStateAction<EnvironmentFormState>>,
  patch: Partial<EnvironmentFormState>,
) {
  setEnvironmentForm((current) => ({ ...current, ...patch }));
}
