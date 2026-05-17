import type { Agent } from "@paperclipai/shared";
import { cn } from "../../lib/utils";
import { Field, DraftInput, help } from "../agent-config-primitives";
import { MarkdownEditor } from "../MarkdownEditor";
import { ReportsToPicker } from "../ReportsToPicker";

type AgentConfigGroup = "identity" | "adapterConfig";
type EffectiveValue = <T>(group: AgentConfigGroup, field: string, original: T) => T;
type MarkValue = (group: AgentConfigGroup, field: string, value: unknown) => void;

export function AgentIdentitySection({
  agent,
  cards,
  companyAgents,
  config,
  eff,
  hidePromptTemplate,
  inputClass,
  isLocal,
  mark,
  uploadImage,
}: {
  agent: Agent;
  cards: boolean;
  companyAgents: Agent[];
  config: Record<string, unknown>;
  eff: EffectiveValue;
  hidePromptTemplate: boolean;
  inputClass: string;
  isLocal: boolean;
  mark: MarkValue;
  uploadImage: (file: File, namespace: string) => Promise<string>;
}) {
  return (
    <div className={cn(!cards && "border-b border-border")}>
      {cards
        ? <h3 className="text-sm font-medium mb-3">Identity</h3>
        : <div className="px-4 py-2 text-xs font-medium text-muted-foreground">Identity</div>
      }
      <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
        <Field label="Name" hint={help.name}>
          <DraftInput
            value={eff("identity", "name", agent.name)}
            onCommit={(v) => mark("identity", "name", v)}
            immediate
            className={inputClass}
            placeholder="Agent name"
          />
        </Field>
        <Field label="Title" hint={help.title}>
          <DraftInput
            value={eff("identity", "title", agent.title ?? "")}
            onCommit={(v) => mark("identity", "title", v || null)}
            immediate
            className={inputClass}
            placeholder="e.g. VP of Engineering"
          />
        </Field>
        <Field label="Reports to" hint={help.reportsTo}>
          <ReportsToPicker
            agents={companyAgents}
            value={eff("identity", "reportsTo", agent.reportsTo ?? null)}
            onChange={(id) => mark("identity", "reportsTo", id)}
            excludeAgentIds={[agent.id]}
            chooseLabel="Choose manager…"
          />
        </Field>
        <Field label="Capabilities" hint={help.capabilities}>
          <MarkdownEditor
            value={eff("identity", "capabilities", agent.capabilities ?? "") ?? ""}
            onChange={(v) => mark("identity", "capabilities", v || null)}
            placeholder="Describe what this agent can do..."
            contentClassName="min-h-11 text-sm font-mono"
            imageUploadHandler={(file) => uploadImage(file, `agents/${agent.id}/capabilities`)}
          />
        </Field>
        {isLocal && !hidePromptTemplate && (
          <>
            <Field label="Prompt Template" hint={help.promptTemplate}>
              <MarkdownEditor
                value={eff(
                  "adapterConfig",
                  "promptTemplate",
                  String(config.promptTemplate ?? ""),
                )}
                onChange={(v) => mark("adapterConfig", "promptTemplate", v ?? "")}
                placeholder="You are agent {{ agent.name }}. Your role is {{ agent.role }}..."
                contentClassName="min-h-22 text-sm font-mono"
                imageUploadHandler={(file) => uploadImage(file, `agents/${agent.id}/prompt-template`)}
              />
            </Field>
            <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Prompt template is replayed on every heartbeat. Keep it compact and dynamic to avoid recurring token cost and cache churn.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
