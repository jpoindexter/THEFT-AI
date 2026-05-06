"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";
import { KeyRound, Plus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "@/components/toast-host";

type Scope = "read" | "write" | "admin";

type Key = {
  id: string;
  name: string;
  prefix: string;
  scope: Scope;
  created: string;
  lastUsed: string | null;
};

const SCOPES: Scope[] = ["read", "write", "admin"];

const SEED: Key[] = [
  {
    id: "k_a01",
    name: "Vercel CI",
    prefix: "tk_live_a01b",
    scope: "write",
    created: "2026-04-12",
    lastUsed: "2m ago",
  },
  {
    id: "k_b29",
    name: "Local dev",
    prefix: "tk_live_b29f",
    scope: "admin",
    created: "2026-03-22",
    lastUsed: "1h ago",
  },
  {
    id: "k_c40",
    name: "Read-only audit export",
    prefix: "tk_live_c40e",
    scope: "read",
    created: "2026-02-08",
    lastUsed: null,
  },
];

export default function ApiKeysPage() {
  const params = useParams<{ org: string }>();
  const [keys, setKeys] = useState<Key[]>(SEED);
  const [drafting, setDrafting] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<Scope>("read");
  const [reveal, setReveal] = useState<{ id: string; full: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function create() {
    if (!name.trim()) return;
    const full = `tk_live_${Math.random().toString(36).slice(2, 18)}`;
    const k: Key = {
      id: full.slice(0, 8),
      name,
      prefix: full.slice(0, 12),
      scope,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: null,
    };
    setKeys((cur) => [k, ...cur]);
    setReveal({ id: k.id, full });
    setName("");
    setDrafting(false);
    toast(`API key created — copy it now, we won't show it again`, "warn");
  }

  function copy() {
    if (!reveal) return;
    void navigator.clipboard.writeText(reveal.full);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function destroy(id: string) {
    setKeys((cur) => cur.filter((k) => k.id !== id));
    toast("API key revoked", "warn");
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Workspace</Eyebrow>
            <PageTitle className="inline-flex items-center gap-2">
              <KeyRound className="size-5 text-ink-muted" /> API keys
            </PageTitle>
            <Hint>
              Mint workspace-scoped tokens for CI, the CLI, or anything that
              needs to call <code className="font-mono">/api/{params.org}</code>.
            </Hint>
          </div>
          <ButtonPrimary
            onClick={() => setDrafting((v) => !v)}
            className="inline-flex items-center gap-1"
          >
            <Plus className="size-3.5" /> New key
          </ButtonPrimary>
        </header>

        {drafting && (
          <Card>
            <CardBody>
              <Eyebrow>New key</Eyebrow>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vercel CI"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong mt-2"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SCOPES.map((s) => {
                  const on = scope === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScope(s)}
                      className={`text-xs rounded-md border px-2 py-1 ${
                        on
                          ? "border-ink bg-cream"
                          : "border-line bg-paper hover:border-line-strong"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <Hint>
                Read = list resources only. Write = create + update. Admin =
                all of write plus billing + members.
              </Hint>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setDrafting(false);
                    setName("");
                  }}
                  className="text-xs rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
                >
                  Cancel
                </button>
                <ButtonPrimary
                  onClick={create}
                  disabled={!name.trim()}
                  className="text-xs px-3 py-1.5"
                >
                  Create
                </ButtonPrimary>
              </div>
            </CardBody>
          </Card>
        )}

        {reveal && (
          <Card className="border-mustard/40 bg-mustard/15">
            <CardBody>
              <Eyebrow className="text-mustard-ink">
                Copy this key now
              </Eyebrow>
              <div className="flex items-center gap-2 mt-2 rounded-md border border-line bg-paper px-3 py-2">
                <code className="flex-1 font-mono text-xs truncate">
                  {reveal.full}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className="text-xs inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 hover:border-line-strong"
                >
                  {copied ? (
                    <Check className="size-3 text-sage-ink" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <Hint className="text-mustard-ink/80">
                We don't store the full token. After you close this card you'll
                only see the prefix.
              </Hint>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setReveal(null)}
                  className="text-xs rounded-md bg-ink text-paper px-3 py-1"
                >
                  Done
                </button>
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <Eyebrow>Keys ({keys.length})</Eyebrow>
            {keys.length === 0 ? (
              <Hint>No keys yet.</Hint>
            ) : (
              <ul className="divide-y divide-line/60 mt-2">
                {keys.map((k) => (
                  <KeyRow key={k.id} k={k} onRevoke={() => destroy(k.id)} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function KeyRow({ k, onRevoke }: { k: Key; onRevoke: () => void }) {
  return (
    <li className="py-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium tracking-tight">{k.name}</div>
        <div className="text-xs text-ink-muted font-mono">{k.prefix}…</div>
        <div className="text-2xs text-ink-soft mt-0.5">
          created {k.created} · last used {k.lastUsed ?? "never"}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Pill>{k.scope}</Pill>
        <button
          type="button"
          onClick={onRevoke}
          title="Revoke"
          className="size-7 rounded-md inline-flex items-center justify-center text-brick-ink hover:bg-brick/10"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
