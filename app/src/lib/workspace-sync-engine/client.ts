export type WorkspaceSyncHealth = {
  status: "ok" | string;
  version?: string;
  deploymentMode?: string;
  deploymentExposure?: string;
  authReady?: boolean;
  features?: {
    companyDeletionEnabled?: boolean;
  };
};

export type WorkspaceSyncCompany = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "paused" | "archived";
};

export type WorkspaceSyncGoal = {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  level: "company" | "team" | "agent" | "task";
  status: "planned" | "active" | "done" | string;
};

export type WorkspaceSyncAgent = {
  id: string;
  companyId: string;
  name: string;
  role: string;
  title: string | null;
  adapterType: string;
  status: string;
};

export type WorkspaceSyncIssue = {
  id: string;
  companyId: string;
  goalId: string | null;
  title: string;
  description: string | null;
  status: string;
  assigneeAgentId: string | null;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export class WorkspaceSyncRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = "WorkspaceSyncRequestError";
  }
}

export function workspace_syncApiBaseUrl(): string {
  const raw =
    process.env.THEFT_PAPERCLIP_API_URL ??
    process.env.PAPERCLIP_API_URL ??
    "http://127.0.0.1:3100/api";
  return raw.replace(/\/+$/, "");
}

export function workspace_syncSyncEnabled(): boolean {
  const raw = process.env.THEFT_PAPERCLIP_SYNC;
  if (raw) return !["0", "false", "off", "no"].includes(raw.toLowerCase());
  return process.env.NODE_ENV !== "test";
}

export function createWorkspaceSyncClient(baseUrl = workspace_syncApiBaseUrl()) {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 1500),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      throw new WorkspaceSyncRequestError(
        `WorkspaceSync ${options.method ?? "GET"} ${path} failed with ${res.status}`,
        res.status,
        text,
      );
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  return {
    baseUrl,
    health: () => request<WorkspaceSyncHealth>("/health", { timeoutMs: 700 }),
    listCompanies: () => request<WorkspaceSyncCompany[]>("/companies"),
    getCompany: (companyId: string) => request<WorkspaceSyncCompany>(`/companies/${companyId}`),
    createCompany: (input: { name: string; description?: string | null }) =>
      request<WorkspaceSyncCompany>("/companies", { method: "POST", body: input }),
    createGoal: (
      companyId: string,
      input: {
        title: string;
        description?: string | null;
        level?: WorkspaceSyncGoal["level"];
        status?: string;
        ownerAgentId?: string | null;
      },
    ) => request<WorkspaceSyncGoal>(`/companies/${companyId}/goals`, { method: "POST", body: input }),
    listGoals: (companyId: string) => request<WorkspaceSyncGoal[]>(`/companies/${companyId}/goals`),
    listAgents: (companyId: string) => request<WorkspaceSyncAgent[]>(`/companies/${companyId}/agents`),
    createAgent: (
      companyId: string,
      input: {
        name: string;
        role: string;
        title?: string | null;
        reportsTo?: string | null;
        capabilities?: string | null;
        desiredSkills?: string[];
        adapterType: string;
        adapterConfig?: Record<string, unknown>;
        budgetMonthlyCents?: number;
        permissions?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      },
    ) => request<WorkspaceSyncAgent>(`/companies/${companyId}/agents`, { method: "POST", body: input }),
    listIssues: (companyId: string) => request<WorkspaceSyncIssue[]>(`/companies/${companyId}/issues`),
    createIssue: (
      companyId: string,
      input: {
        title: string;
        description?: string | null;
        status?: string;
        priority?: "critical" | "high" | "medium" | "low";
        goalId?: string | null;
        assigneeAgentId?: string | null;
      },
    ) => request<WorkspaceSyncIssue>(`/companies/${companyId}/issues`, { method: "POST", body: input }),
  };
}
