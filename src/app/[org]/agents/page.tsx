import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { Plus } from "lucide-react";
import StatusDot from "@/components/status-dot";
import EmptyState from "@/components/empty-state";

const STATUS_TONE: Record<string, string> = {
  idle: "bg-cream text-ink-muted",
  running: "bg-sage/30 text-sage-ink",
  paused: "bg-mustard/30 text-mustard-ink",
  error: "bg-brick/15 text-brick-ink",
  terminated: "bg-line text-ink-muted",
};

export default async function AgentsIndexPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const agents = await db.listAgents(organization.id);
  const departments = await db.listDepartments(organization.id);
  const deptName = new Map(departments.map((d) => [d.id, d.name]));

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Agents</h1>
            <p className="text-sm text-ink-muted">
              Every employee in this workspace. Click one to inspect its skills,
              tasks, and configuration.
            </p>
          </div>
          <Link
            href={`/${orgSlug}/agents/new`}
            className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-sm"
          >
            <Plus className="size-3.5" /> New agent
          </Link>
        </header>

        {agents.length === 0 ? (
          <EmptyState
            Icon={Plus}
            title="No agents yet"
            body="Onboarding usually seeds one per department. You can also hire a custom one for narrow work."
            actions={[
              { label: "New agent", href: `/${orgSlug}/agents/new`, primary: true },
              { label: "Restart onboarding", href: "/onboarding" },
            ]}
          />
        ) : (
          <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
            {agents.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/${orgSlug}/agents/${a.slug ?? a.id}`}
                  className="px-4 py-3 flex items-center justify-between hover:bg-canvas"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <span className="mt-1.5 shrink-0">
                      <StatusDot
                        tone={
                          a.status === "running"
                            ? "sage"
                            : a.status === "paused"
                              ? "mustard"
                              : a.status === "error"
                                ? "brick"
                                : "neutral"
                        }
                        pulsing={a.status === "running"}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="text-base font-medium tracking-tight">
                        {a.name}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {a.title ?? a.role}
                        {a.department_id &&
                          ` · ${deptName.get(a.department_id) ?? ""}`}
                        {a.attached_skills.length > 0 &&
                          ` · ${a.attached_skills.length} skill${a.attached_skills.length === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-2xs uppercase rounded px-1.5 py-0.5 shrink-0 ${
                      STATUS_TONE[a.status] ?? "bg-cream text-ink-muted"
                    }`}
                  >
                    {a.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
