"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
  ButtonGhost,
} from "@/components/ui/primitives";
import { KeyRound, Plus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "@/components/toast-host";

type Scope = "read" | "write" | "admin";
const SCOPES: Scope[] = ["read", "write", "admin"];

type KeyView = {
  id: string;
  name: string;
  prefix: string;
  scope: Scope;
  created_at: string;
  last_used_at: string | null;
  revoked_at?: string | null;
};

export default function ApiKeysPage() {
  const params = useParams<{ org: string }>();
  const [keys, setKeys] = useState<KeyView[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<Scope>("read");
  const [reveal, setReveal] = useState<{ id: string; full: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/${params.org}/api-keys`)
      .then((r) => r.json())
      .then((j: { keys: KeyView[] }) => {
        setKeys(j.keys.filter((k) => !k.revoked_at));
        setLoading(false);
      });
  }, [params.org]);

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await fetch(`/api/${params.org}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scope }),
    });
    setBusy(false);
    if (!res.ok) {
      toast("Failed to create key", "warn");
      return;
    }
    const j = (await res.json()) as { key: KeyView; secret: string };
    setKeys((cur) => [j.key, ...cur]);
    setReveal({ id: j.key.id, full: j.secret });
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

  async function destroy(id: string) {
    setKeys((cur) => cur.filter((k) => k.id !== id));
    await fetch(`/api/${params.org}/api-keys/${id}`, { method: "DELETE" });
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
                <ButtonGhost
                  size="sm"
                  onClick={() => {
                    setDrafting(false);
                    setName("");
                  }}
                >
                  Cancel
                </ButtonGhost>
                <ButtonPrimary
                  onClick={create}
                  disabled={!name.trim() || busy}
                  size="sm"
                >
                  {busy ? "Creating…" : "Create"}
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
                <ButtonGhost size="sm" onClick={copy}>
                  {copied ? (
                    <Check className="size-3 text-sage-ink" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </ButtonGhost>
              </div>
              <Hint className="text-mustard-ink/80">
                We hash the secret on the server. After you close this card
                you&apos;ll only see the prefix.
              </Hint>
              <div className="flex justify-end mt-2">
                <ButtonPrimary size="sm" onClick={() => setReveal(null)}>
                  Done
                </ButtonPrimary>
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <Eyebrow>Keys ({keys.length})</Eyebrow>
            {loading ? (
              <Hint>Loading…</Hint>
            ) : keys.length === 0 ? (
              <Hint>No keys yet. Mint one above.</Hint>
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

function KeyRow({ k, onRevoke }: { k: KeyView; onRevoke: () => void }) {
  return (
    <li className="py-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium tracking-tight">{k.name}</div>
        <div className="text-xs text-ink-muted font-mono">{k.prefix}…</div>
        <div className="text-2xs text-ink-soft mt-0.5">
          created {k.created_at.slice(0, 10)} · last used{" "}
          {k.last_used_at ? k.last_used_at.slice(0, 16) : "never"}
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
