"use client";

import { useState, useEffect } from "react";
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
import { Users, Plus, X, Crown } from "lucide-react";
import { toast } from "@/components/toast-host";

const ROLES = ["viewer", "editor", "admin"] as const;
type Role = (typeof ROLES)[number];

type Member = {
  id: string;
  email: string;
  role: Role;
  pending: boolean;
  founder: boolean;
};

export default function TeamPage() {
  const params = useParams<{ org: string }>();
  const org = params.org;
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");

  useEffect(() => {
    void fetch(`/api/${org}/team`)
      .then((r) => r.ok ? r.json() : { members: [] })
      .then((j: { members: Member[] }) => setMembers(j.members ?? []));
  }, [org]);

  async function invite() {
    if (!email.includes("@")) return;
    const res = await fetch(`/api/${org}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (res.ok) {
      const j = await res.json();
      setMembers((cur) => {
        if (cur.some((m) => m.email === email)) return cur;
        return [...cur, j.member];
      });
      toast(`Invite sent to ${email}`, "ok");
      setEmail("");
    }
  }

  async function changeRole(id: string, newRole: Role) {
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
    await fetch(`/api/${org}/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
  }

  async function remove(id: string) {
    setMembers((cur) => cur.filter((m) => m.id !== id));
    await fetch(`/api/${org}/team/${id}`, { method: "DELETE" });
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <Eyebrow>Workspace</Eyebrow>
          <PageTitle className="inline-flex items-center gap-2">
            <Users className="size-5 text-ink-muted" /> Team
          </PageTitle>
          <Hint>
            People who can see and act on this workspace. Founder is always admin.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>Invite by email</Eyebrow>
            <div className="flex items-center gap-2 mt-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && invite()}
                type="email"
                placeholder="teammate@company.com"
                className="flex-1 h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-9 rounded-md border border-line bg-paper px-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r[0].toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <ButtonPrimary
                onClick={invite}
                disabled={!email.includes("@")}
                className="inline-flex items-center gap-1"
              >
                <Plus className="size-3.5" /> Invite
              </ButtonPrimary>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Members ({members.length})</Eyebrow>
            {members.length === 0 ? (
              <p className="text-sm text-ink-muted mt-2">No members yet.</p>
            ) : (
              <ul className="divide-y divide-line/60 mt-2">
                {members.map((m) => (
                  <li key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <span className="size-7 rounded-full bg-cream inline-flex items-center justify-center text-2xs font-medium text-ink-muted shrink-0">
                        {m.email[0].toUpperCase()}
                      </span>
                      <span className="font-mono truncate">{m.email}</span>
                      {m.founder && (
                        <span title="Workspace founder" className="text-mustard-ink">
                          <Crown className="size-3" />
                        </span>
                      )}
                      {m.pending && <Pill tone="mustard">Pending</Pill>}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value as Role)}
                        disabled={m.founder}
                        className="h-7 rounded-md border border-line bg-paper px-2 text-xs disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r[0].toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                      {!m.founder && (
                        <button
                          type="button"
                          onClick={() => remove(m.id)}
                          title="Remove member"
                          className="size-7 rounded-md inline-flex items-center justify-center text-brick-ink hover:bg-brick/10"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>What roles can do</Eyebrow>
            <ul className="grid grid-cols-3 gap-2 text-xs mt-2">
              {(
                [
                  ["Viewer", "Read everything. Cannot start tasks or edit memory."],
                  ["Editor", "Start tasks, edit memory, approve agent runs."],
                  ["Admin", "Editor + billing, integrations, member management."],
                ] as const
              ).map(([title, body]) => (
                <li key={title} className="rounded-md border border-line/70 bg-paper p-3">
                  <div className="text-sm font-medium tracking-tight">{title}</div>
                  <Hint>{body}</Hint>
                </li>
              ))}
            </ul>
            <div className="text-2xs text-ink-soft mt-2">
              Workspace: <code className="font-mono">{org}</code>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
