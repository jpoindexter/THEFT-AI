import { Users, Plus } from "lucide-react";
import {
  Card,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";

const USERS = [
  { email: "ana@partner.io", provider: "email", last: "2m", confirmed: true },
  { email: "kim@encompass.com", provider: "google", last: "1h", confirmed: true },
  { email: "mark@vendor.dev", provider: "github", last: "3d", confirmed: true },
  { email: "sam@new.signup", provider: "magic", last: "—", confirmed: false },
];

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <PageTitle className="text-md font-medium inline-flex items-center gap-2">
            <Users className="size-4 text-ink-muted" /> Users
          </PageTitle>
          <Hint>Authenticated users in this project.</Hint>
        </div>
        <ButtonPrimary className="inline-flex items-center gap-1">
          <Plus className="size-3.5" /> Invite user
        </ButtonPrimary>
      </header>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b border-line/60">
            <tr className="text-left text-2xs uppercase tracking-wider text-ink-soft">
              <Th>Email</Th>
              <Th>Provider</Th>
              <Th>Last seen</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {USERS.map((u) => (
              <tr key={u.email}>
                <Td className="font-mono">{u.email}</Td>
                <Td>{u.provider}</Td>
                <Td className="font-mono text-ink-muted">{u.last}</Td>
                <Td>
                  <Pill tone={u.confirmed ? "sage" : "mustard"}>
                    {u.confirmed ? "Confirmed" : "Pending"}
                  </Pill>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2">{children}</th>;
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 ${className ?? ""}`}>{children}</td>;
}
