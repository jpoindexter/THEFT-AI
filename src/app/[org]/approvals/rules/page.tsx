"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
  StatCard,
} from "@/components/ui/primitives";
import {
  ShieldCheck,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "@/components/toast-host";

type Action = "auto-approve" | "auto-decline" | "require-human";
type Scope = "engineer" | "marketing" | "finance" | "any";

type Rule = {
  id: string;
  name: string;
  scope: Scope;
  pattern: string;
  cap: number;
  action: Action;
  enabled: boolean;
  hits: number;
};

const SEED: Rule[] = [
  {
    id: "r1",
    name: "Reversible doc edits",
    scope: "marketing",
    pattern: "kind:artifact AND name~='draft' AND mode=execute",
    cap: 5,
    action: "auto-approve",
    enabled: true,
    hits: 18,
  },
  {
    id: "r2",
    name: "Block destructive SQL",
    scope: "engineer",
    pattern: "tool:run_sql AND query~='drop table|truncate'",
    cap: 0,
    action: "auto-decline",
    enabled: true,
    hits: 2,
  },
  {
    id: "r3",
    name: "Always-human · finance > $500",
    scope: "finance",
    pattern: "amount>500",
    cap: 0,
    action: "require-human",
    enabled: true,
    hits: 7,
  },
];

const ACTION_TONE: Record<Action, "sage" | "brick" | "mustard"> = {
  "auto-approve": "sage",
  "auto-decline": "brick",
  "require-human": "mustard",
};

export default function ApprovalRulesPage() {
  const params = useParams<{ org: string }>();
  const [rules, setRules] = useState<Rule[]>(SEED);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${params.org}/approvals`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to approvals
        </Link>

        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Approvals</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <ShieldCheck className="size-5 text-ink-muted" /> Auto-rules
            </PageTitle>
            <Hint>
              Rules evaluated on every approval request, top to bottom. First
              match wins. Rules are scoped to an agent and run before a human
              ever sees the request.
            </Hint>
          </div>
          <ButtonPrimary
            onClick={() =>
              setRules((c) => [
                ...c,
                {
                  id: `r${Date.now()}`,
                  name: "New rule",
                  scope: "any",
                  pattern: "",
                  cap: 1,
                  action: "auto-approve",
                  enabled: false,
                  hits: 0,
                },
              ])
            }
            className="inline-flex items-center gap-1"
          >
            <Plus className="size-3.5" /> New rule
          </ButtonPrimary>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>Activity (24h)</Eyebrow>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <StatCard
                label="Auto-approved"
                value={String(
                  rules
                    .filter((r) => r.enabled && r.action === "auto-approve")
                    .reduce((s, r) => s + r.hits, 0),
                )}
                tone="sage"
                Icon={CheckCircle2}
              />
              <StatCard
                label="Auto-declined"
                value={String(
                  rules
                    .filter((r) => r.enabled && r.action === "auto-decline")
                    .reduce((s, r) => s + r.hits, 0),
                )}
                tone="brick"
                Icon={XCircle}
              />
              <StatCard
                label="Routed to human"
                value={String(
                  rules
                    .filter((r) => r.enabled && r.action === "require-human")
                    .reduce((s, r) => s + r.hits, 0),
                )}
                tone="mustard"
                Icon={ShieldCheck}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-line/60">
              {rules.map((r, i) => (
                <RuleRow
                  key={r.id}
                  r={r}
                  position={i + 1}
                  onChange={(patch) =>
                    setRules((c) =>
                      c.map((x) => (x.id === r.id ? { ...x, ...patch } : x)),
                    )
                  }
                  onDelete={() => {
                    setRules((c) => c.filter((x) => x.id !== r.id));
                    toast(`Rule "${r.name}" removed`, "warn");
                  }}
                />
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Pattern syntax</Eyebrow>
            <Hint>
              Patterns combine field=value, regex (~=), and AND/OR. Available
              fields: <code className="font-mono">kind</code>,{" "}
              <code className="font-mono">tool</code>,{" "}
              <code className="font-mono">amount</code>,{" "}
              <code className="font-mono">mode</code>,{" "}
              <code className="font-mono">name</code>. Empty pattern matches
              everything in scope.
            </Hint>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function RuleRow({
  r,
  position,
  onChange,
  onDelete,
}: {
  r: Rule;
  position: number;
  onChange: (p: Partial<Rule>) => void;
  onDelete: () => void;
}) {
  return (
    <li className="px-4 py-3 grid grid-cols-12 items-start gap-2">
      <div className="col-span-1 text-2xs font-mono text-ink-soft mt-1">
        #{position}
      </div>
      <div className="col-span-7 min-w-0 space-y-1">
        <input
          value={r.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full bg-transparent text-sm font-medium tracking-tight focus:outline-none"
        />
        <input
          value={r.pattern}
          onChange={(e) => onChange({ pattern: e.target.value })}
          placeholder="empty = match anything in scope"
          className="w-full bg-transparent text-2xs font-mono text-ink-muted focus:outline-none"
        />
        <div className="flex items-center gap-1">
          <select
            value={r.scope}
            onChange={(e) => onChange({ scope: e.target.value as Scope })}
            className="h-6 rounded-md border border-line bg-paper px-1 text-2xs"
          >
            <option value="any">Any agent</option>
            <option value="engineer">Engineer</option>
            <option value="marketing">Marketing</option>
            <option value="finance">Finance</option>
          </select>
          <select
            value={r.action}
            onChange={(e) => onChange({ action: e.target.value as Action })}
            className="h-6 rounded-md border border-line bg-paper px-1 text-2xs"
          >
            <option value="auto-approve">Auto-approve</option>
            <option value="auto-decline">Auto-decline</option>
            <option value="require-human">Require human</option>
          </select>
          <Pill tone={ACTION_TONE[r.action]}>{r.hits} hits</Pill>
        </div>
      </div>
      <div className="col-span-3 text-2xs text-ink-soft mt-1">
        cap {r.cap}/day
      </div>
      <div className="col-span-1 flex items-center justify-end gap-1">
        <input
          type="checkbox"
          checked={r.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          title={r.enabled ? "Disable" : "Enable"}
        />
        <button
          onClick={onDelete}
          title="Delete"
          className="size-7 rounded-md inline-flex items-center justify-center text-brick-ink hover:bg-brick/10"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </li>
  );
}
