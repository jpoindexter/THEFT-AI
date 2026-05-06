import { Users, Plus } from "lucide-react";

const USERS = [
  {
    email: "ana@partner.io",
    provider: "email",
    last_seen: "2m",
    confirmed: true,
  },
  {
    email: "kim@encompass.com",
    provider: "google",
    last_seen: "1h",
    confirmed: true,
  },
  {
    email: "mark@vendor.dev",
    provider: "github",
    last_seen: "3d",
    confirmed: true,
  },
  {
    email: "sam@new.signup",
    provider: "magic",
    last_seen: "—",
    confirmed: false,
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight inline-flex items-center gap-2">
            <Users className="size-4 text-stone-500" /> Users
          </h1>
          <p className="text-[12px] text-stone-500">
            Authenticated users in this project.
          </p>
        </div>
        <button className="inline-flex items-center gap-1 rounded-md bg-stone-900 text-white px-3 py-1.5 text-[12px]">
          <Plus className="size-3.5" /> Invite user
        </button>
      </header>

      <table className="w-full text-[12px] rounded-lg border border-stone-200/70 bg-white">
        <thead className="border-b border-stone-200/70">
          <tr className="text-left text-[10px] uppercase tracking-wider text-stone-400">
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Provider</th>
            <th className="px-3 py-2">Last seen</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {USERS.map((u) => (
            <tr key={u.email}>
              <td className="px-3 py-2 font-mono">{u.email}</td>
              <td className="px-3 py-2">{u.provider}</td>
              <td className="px-3 py-2 font-mono text-stone-500">
                {u.last_seen}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`text-[10px] uppercase rounded px-1.5 py-0.5 ${
                    u.confirmed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {u.confirmed ? "Confirmed" : "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
