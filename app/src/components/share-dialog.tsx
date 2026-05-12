"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, Globe, Lock, X } from "lucide-react";
import { Eyebrow, Hint, Pill } from "@/components/ui/primitives";

const ROLES = ["viewer", "editor", "admin"] as const;
type Role = (typeof ROLES)[number];

type Member = { email: string; role: Role; pending?: boolean };

const SEED: Member[] = [
  { email: "jason@theft.studio", role: "admin" },
  { email: "ana@partner.io", role: "editor" },
  { email: "kim@encompass.com", role: "viewer", pending: true },
];

export default function ShareDialog({
  orgSlug,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [linkVisibility, setLinkVisibility] = useState<"private" | "link">("private");
  const [members, setMembers] = useState<Member[]>(SEED);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/${orgSlug}` : "";

  useEffect(() => {
    if (!open) {
      setEmail("");
    }
  }, [open]);

  function copy() {
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function invite() {
    if (!email.trim() || !email.includes("@")) return;
    setMembers((cur) => [...cur, { email, role, pending: true }]);
    setEmail("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-paper">
        <DialogHeader className="px-4 py-3 border-b border-line/70">
          <DialogTitle className="text-md font-medium tracking-tight">
            Share workspace
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <Visibility v={linkVisibility} onChange={setLinkVisibility} />

          {linkVisibility === "link" && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2 text-xs">
              <span className="flex-1 truncate font-mono">{link}</span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong"
              >
                {copied ? <Check className="size-3 text-sage-ink" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          <InviteRow
            email={email}
            role={role}
            onEmail={setEmail}
            onRole={setRole}
            onInvite={invite}
          />

          <div>
            <Eyebrow>Members</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {members.map((m) => (
                <MemberRow
                  key={m.email}
                  m={m}
                  onChange={(role) =>
                    setMembers((cur) =>
                      cur.map((c) => (c.email === m.email ? { ...c, role } : c)),
                    )
                  }
                  onRemove={() =>
                    setMembers((cur) => cur.filter((c) => c.email !== m.email))
                  }
                />
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Visibility({
  v,
  onChange,
}: {
  v: "private" | "link";
  onChange: (v: "private" | "link") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <VisibilityButton
        on={v === "private"}
        onClick={() => onChange("private")}
        Icon={Lock}
        title="Private"
        body="Only invited people can access this workspace."
      />
      <VisibilityButton
        on={v === "link"}
        onClick={() => onChange("link")}
        Icon={Globe}
        title="Anyone with the link"
        body="Read-only viewers via shareable URL."
      />
    </div>
  );
}

function VisibilityButton({
  on,
  onClick,
  Icon,
  title,
  body,
}: {
  on: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-md border px-3 py-2 transition-colors ${
        on ? "border-ink bg-cream" : "border-line hover:border-line-strong"
      }`}
    >
      <div className="text-sm font-medium tracking-tight inline-flex items-center gap-1.5">
        <Icon className="size-3.5 text-ink-muted" /> {title}
      </div>
      <Hint>{body}</Hint>
    </button>
  );
}

function InviteRow({
  email,
  role,
  onEmail,
  onRole,
  onInvite,
}: {
  email: string;
  role: Role;
  onEmail: (s: string) => void;
  onRole: (r: Role) => void;
  onInvite: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
        placeholder="teammate@company.com"
        className="flex-1 h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
      />
      <select
        value={role}
        onChange={(e) => onRole(e.target.value as Role)}
        className="h-9 rounded-md border border-line bg-paper px-2 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r[0].toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onInvite}
        disabled={!email.includes("@")}
        className="h-9 rounded-md bg-ink text-paper px-3 text-sm disabled:opacity-40"
      >
        Invite
      </button>
    </div>
  );
}

function MemberRow({
  m,
  onChange,
  onRemove,
}: {
  m: Member;
  onChange: (r: Role) => void;
  onRemove: () => void;
}) {
  return (
    <li className="py-2 flex items-center justify-between gap-2 text-sm">
      <span className="truncate flex items-center gap-2">
        <span className="font-mono">{m.email}</span>
        {m.pending && <Pill tone="mustard">Pending</Pill>}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        <select
          value={m.role}
          onChange={(e) => onChange(e.target.value as Role)}
          className="h-7 rounded-md border border-line bg-paper px-2 text-xs"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r[0].toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="size-7 rounded-md inline-flex items-center justify-center text-brick-ink hover:bg-brick/10"
        >
          <X className="size-3" />
        </button>
      </span>
    </li>
  );
}
