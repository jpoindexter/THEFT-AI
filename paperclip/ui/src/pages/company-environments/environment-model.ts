import {
  AGENT_ADAPTER_TYPES,
  getAdapterEnvironmentSupport,
  type Environment,
  type JsonSchema,
} from "@paperclipai/shared";

export type EnvironmentFormState = {
  name: string;
  description: string;
  driver: "local" | "ssh" | "sandbox";
  sshHost: string;
  sshPort: string;
  sshUsername: string;
  sshRemoteWorkspacePath: string;
  sshPrivateKey: string;
  sshPrivateKeySecretId: string;
  sshKnownHosts: string;
  sshStrictHostKeyChecking: boolean;
  sandboxProvider: string;
  sandboxConfig: Record<string, unknown>;
};

export const ENVIRONMENT_SUPPORT_ROWS = AGENT_ADAPTER_TYPES.map((adapterType) => ({
  adapterType,
  support: getAdapterEnvironmentSupport(adapterType),
}));

export function buildEnvironmentPayload(form: EnvironmentFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    driver: form.driver,
    config: buildEnvironmentConfig(form),
  } as const;
}

function buildEnvironmentConfig(form: EnvironmentFormState) {
  if (form.driver === "ssh") {
    return {
      host: form.sshHost.trim(),
      port: Number.parseInt(form.sshPort || "22", 10) || 22,
      username: form.sshUsername.trim(),
      remoteWorkspacePath: form.sshRemoteWorkspacePath.trim(),
      privateKey: form.sshPrivateKey.trim() || null,
      privateKeySecretRef:
        form.sshPrivateKey.trim().length > 0 || !form.sshPrivateKeySecretId
          ? null
          : { type: "secret_ref" as const, secretId: form.sshPrivateKeySecretId, version: "latest" as const },
      knownHosts: form.sshKnownHosts.trim() || null,
      strictHostKeyChecking: form.sshStrictHostKeyChecking,
    };
  }
  if (form.driver === "sandbox") return { provider: form.sandboxProvider.trim(), ...form.sandboxConfig };
  return {};
}

export function createEmptyEnvironmentForm(): EnvironmentFormState {
  return {
    name: "",
    description: "",
    driver: "ssh",
    sshHost: "",
    sshPort: "22",
    sshUsername: "",
    sshRemoteWorkspacePath: "",
    sshPrivateKey: "",
    sshPrivateKeySecretId: "",
    sshKnownHosts: "",
    sshStrictHostKeyChecking: true,
    sandboxProvider: "",
    sandboxConfig: {},
  };
}

export function readEnvironmentForm(environment: Environment): EnvironmentFormState {
  const base = createEmptyEnvironmentForm();
  if (environment.driver === "ssh") {
    const ssh = readSshConfig(environment);
    return { ...base, name: environment.name, description: environment.description ?? "", driver: "ssh", ...ssh };
  }
  if (environment.driver === "sandbox") {
    const sandbox = readSandboxConfig(environment);
    return {
      ...base,
      name: environment.name,
      description: environment.description ?? "",
      driver: "sandbox",
      sandboxProvider: sandbox.provider,
      sandboxConfig: sandbox.config,
    };
  }
  return { ...base, name: environment.name, description: environment.description ?? "", driver: "local" };
}

function readSshConfig(environment: Environment) {
  const config = environment.config ?? {};
  return {
    sshHost: typeof config.host === "string" ? config.host : "",
    sshPort: typeof config.port === "number" ? String(config.port) : typeof config.port === "string" ? config.port : "22",
    sshUsername: typeof config.username === "string" ? config.username : "",
    sshRemoteWorkspacePath: typeof config.remoteWorkspacePath === "string" ? config.remoteWorkspacePath : "",
    sshPrivateKey: "",
    sshPrivateKeySecretId: readSecretRef(config.privateKeySecretRef),
    sshKnownHosts: typeof config.knownHosts === "string" ? config.knownHosts : "",
    sshStrictHostKeyChecking: typeof config.strictHostKeyChecking === "boolean" ? config.strictHostKeyChecking : true,
  };
}

function readSecretRef(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) && typeof (value as { secretId?: unknown }).secretId === "string"
    ? String((value as { secretId: string }).secretId)
    : "";
}

function readSandboxConfig(environment: Environment) {
  const config = environment.config ?? {};
  const { provider: rawProvider, ...providerConfig } = config;
  return {
    provider: typeof rawProvider === "string" && rawProvider.trim().length > 0 ? rawProvider : "fake",
    config: providerConfig,
  };
}

export function normalizeJsonSchema(schema: unknown): JsonSchema | null {
  return schema && typeof schema === "object" && !Array.isArray(schema) ? schema as JsonSchema : null;
}

export function summarizeSandboxConfig(config: Record<string, unknown>): string | null {
  for (const key of ["template", "image", "region", "workspacePath"]) {
    const value = config[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}
