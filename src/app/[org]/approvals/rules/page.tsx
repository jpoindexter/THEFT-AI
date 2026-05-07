"use client";

import { useEffect, useState } from "react";
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
  organization_id: string;
  name: string;
  scope: Scope;
  pattern: string;
  cap_per_day: number;
  action: Action;
  enabled: boolean;
  hits: number;
  position: number;
  created_at: string;
};

const ACTION_TONE: Record<Action, "sage" | "brick" | "mustard"> = {
  "auto-approve": "sage",
  "auto-decline": "brick",
  "require-human": "mustard",
};

export default function ApprovalRulesPage() {
  const params = useParams<{ org: string }>();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/${params.org}/approvals/rules`)
      .then((r) => r.json())
      .then((j: { rules: Rule[] }) => {
        setRules(j.rules);
        setLoading(false);
      });
  }, [params.org]);

  async function persist(r: Rule) {
    const res = await fetch(`/api/${params.org}/approvals/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: r.id,
        name: r.name,
        scope: r.scope,
        pattern: r.pattern,
        cap_per_day: r.cap_per_day,
        action: r.action,
        enabled: r.enabled,
        position: r.position,
      }),
    });
    if (!res.ok) toast("Save failed", "warn");
  }

  function patch(id: string, p: Partial<Rule>) {
    setRules((c) => {
      const next = c.map((x) => (x.id === id ? { ...x, ...p } : x));
      const updated = next.find((x) => x.id === id);
      if (updated) void persist(updated);
      return next;
    });
  }

  async function remove(r: Rule) {
    setRules((c) => c.filter((x) => x.id !== r.id));
    await fetch(`/api/${params.org}/approvals/rules/${r.id}`, {
      method: "DELETE",
    });
    toast(`Rule "${r.name}" removed`, "warn");
  }

  async function add() {
    const position = rules.length;
    const res = await fetch(`/api/${params.org}/approvals/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New rule",
        scope: "any",
        pattern: "",
        cap_per_day: 1,
        action: "auto-approve",
        enabled: false,
        position,
      }),
    });
    const j = (await res.json()) as { rule: Rule };
    setRules((c) => [...c, j.rule]);
  }

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
          <ButtonPrimary onClick={add} className="inline-flex items-center gap-1">
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
              {loading && (
                <li className="px-4 py-6 text-sm text-ink-muted text-center">
                  Loading…
                </li>
              )}
              {!loading && rules.length === 0 && (
                <li className="px-4 py-6 text-sm text-ink-muted text-center">
                  No rules yet. Add one to start auto-resolving approvals.
                </li>
              )}
              {rules.map((r, i) => (
                <RuleRow
                  key={r.id}
                  r={r}
                  position={i + 1}
                  onChange={(p) => patch(r.id, p)}
                  onDelete={() => remove(r)}
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
            onChange={(e) => onChange({ scope: e.target.value as Rule["scope"] })}
            className="h-6 rounded-md border border-line bg-paper px-1 text-2xs"
          >
            <option value="any">Any agent</option>
            <option value="engineer">Engineer</option>
            <option value="marketing">Marketing</option>
            <option value="finance">Finance</option>
          </select>
          <select
            value={r.action}
            onChange={(e) =>
              onChange({ action: e.target.value as Rule["action"] })
            }
            className="h-6 rounded-md border border-line bg-paper px-1 text-2xs"
          >
            <option value="auto-approve">Auto-approve</option>
            <option value="auto-decline">Auto-decline</option>
            <option value="require-human">Require human</option>
          </select>
          <Pill tone={ACTION_TONE[r.action]}>{r.hits} hits</Pill>
        </div>
      </div>
      <div className="col-span-3 inline-flex items-center gap-1 text-2xs text-ink-soft mt-1">
        <span>cap</span>
        <input
          type="number"
          value={r.cap_per_day}
          onChange={(e) =>
            onChange({ cap_per_day: Number(e.target.value) || 0 })
          }
          className="w-14 h-6 rounded-md border border-line bg-paper px-1 text-2xs"
        />
        <span>/day</span>
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
