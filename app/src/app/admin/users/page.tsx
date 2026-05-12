import { Card, CardBody, Eyebrow, Hint, PageTitle, Pill } from "@/components/ui/primitives";
import { Users, Crown } from "lucide-react";

const SEED = [
  { email: "jason@theft.studio", workspaces: 3, role: "owner", last: "now" },
  { email: "ana@partner.io", workspaces: 1, role: "editor", last: "12m" },
  { email: "kim@encompass.com", workspaces: 1, role: "viewer", last: "2h" },
  { email: "ops@example.io", workspaces: 2, role: "admin", last: "1d" },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Internal</Eyebrow>
        <PageTitle className="inline-flex items-center gap-2">
          <Users className="size-5 text-ink-muted" /> Users
        </PageTitle>
        <Hint>
          Cross-workspace user directory. Suspend, reset MFA, or merge accounts.
        </Hint>
      </header>

      <Card>
        <CardBody className="p-0">
          <div className="grid grid-cols-12 text-2xs uppercase tracking-wider text-ink-soft border-b border-line/60 px-4 py-2">
            <div className="col-span-5">Email</div>
            <div className="col-span-2 text-right">Workspaces</div>
            <div className="col-span-2">Top role</div>
            <div className="col-span-2">Last seen</div>
            <div className="col-span-1" />
          </div>
          <ul className="divide-y divide-line/60">
            {SEED.map((u) => (
              <li
                key={u.email}
                className="grid grid-cols-12 items-center px-4 py-2.5 text-sm hover:bg-cream/40"
              >
                <div className="col-span-5 inline-flex items-center gap-2 min-w-0">
                  <span className="size-6 rounded-full bg-cream inline-flex items-center justify-center text-2xs font-medium text-ink-muted shrink-0">
                    {u.email[0].toUpperCase()}
                  </span>
                  <span className="font-mono text-xs truncate">{u.email}</span>
                  {u.role === "owner" && <Crown className="size-3 text-mustard-ink shrink-0" />}
                </div>
                <div className="col-span-2 text-right text-xs text-ink-muted">{u.workspaces}</div>
                <div className="col-span-2">
                  <Pill tone={u.role === "owner" ? "mustard" : "neutral"}>{u.role}</Pill>
                </div>
                <div className="col-span-2 text-2xs text-ink-soft">{u.last} ago</div>
                <div className="col-span-1 text-right">
                  <button className="text-2xs rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong">
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
