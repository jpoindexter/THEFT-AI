import Link from "next/link";
import { Shield, Building2, Users, Activity, AlertTriangle, ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Workspaces", Icon: Building2 },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/activity", label: "Activity", Icon: Activity },
  { href: "/admin/incidents", label: "Incidents", Icon: AlertTriangle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="border-b border-line/70 bg-paper">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm">
            <Shield className="size-4 text-ink-muted" />
            <span className="font-medium tracking-tight">Admin</span>
            <span className="text-2xs text-ink-soft uppercase tracking-wider rounded bg-mustard/30 text-mustard-ink px-1.5 py-0.5">
              Internal
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-3" /> Back to app
          </Link>
        </div>
        <div className="max-w-6xl mx-auto px-6 -mb-px">
          <nav className="flex gap-4 text-xs">
            {NAV.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1 py-2 border-b border-transparent hover:border-line text-ink-muted hover:text-ink"
              >
                <Icon className="size-3" /> {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
    </div>
  );
}
