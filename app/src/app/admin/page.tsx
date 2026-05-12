import Link from "next/link";
import { db } from "@/lib/db/store";
import { Card, CardBody, Eyebrow, Hint, PageTitle, StatCard } from "@/components/ui/primitives";
import { Building2, ExternalLink } from "lucide-react";

export default async function AdminWorkspacesPage() {
  const orgs = await db.listOrgs();
  const enriched = await Promise.all(
    orgs.map(async (o) => {
      const [agents, tasks, departments] = await Promise.all([
        db.listAgents(o.id),
        db.listTasks(o.id),
        db.listDepartments(o.id),
      ]);
      return { org: o, agentCount: agents.length, taskCount: tasks.length, deptCount: departments.length };
    }),
  );

  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Internal</Eyebrow>
        <PageTitle className="inline-flex items-center gap-2">
          <Building2 className="size-5 text-ink-muted" /> Workspaces
        </PageTitle>
        <Hint>
          Every workspace on this instance. Click through to inspect, suspend,
          or impersonate (audit-logged).
        </Hint>
      </header>

      <Card>
        <CardBody className="p-0">
          <div className="grid grid-cols-12 text-2xs uppercase tracking-wider text-ink-soft border-b border-line/60 px-4 py-2">
            <div className="col-span-4">Workspace</div>
            <div className="col-span-2">Slug</div>
            <div className="col-span-1 text-right">Depts</div>
            <div className="col-span-1 text-right">Agents</div>
            <div className="col-span-1 text-right">Tasks</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1 text-right">Open</div>
          </div>
          <ul className="divide-y divide-line/60">
            {enriched.map(({ org, agentCount, taskCount, deptCount }) => (
              <li
                key={org.id}
                className="grid grid-cols-12 items-center px-4 py-2.5 text-sm hover:bg-cream/40"
              >
                <div className="col-span-4 truncate font-medium">{org.name}</div>
                <div className="col-span-2 font-mono text-xs text-ink-muted truncate">
                  {org.slug}
                </div>
                <div className="col-span-1 text-right text-xs text-ink-muted">
                  {deptCount}
                </div>
                <div className="col-span-1 text-right text-xs text-ink-muted">
                  {agentCount}
                </div>
                <div className="col-span-1 text-right text-xs text-ink-muted">
                  {taskCount}
                </div>
                <div className="col-span-2 text-2xs text-ink-soft">
                  {new Date(org.created_at).toLocaleDateString()}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Link
                    href={`/${org.slug}`}
                    className="inline-flex items-center gap-1 text-2xs rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong"
                  >
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </li>
            ))}
            {enriched.length === 0 && (
              <li className="px-4 py-6 text-xs text-ink-muted text-center">
                No workspaces yet.
              </li>
            )}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Eyebrow>Health</Eyebrow>
          <div className="grid grid-cols-4 gap-3 mt-2">
            <StatCard label="Workspaces" value={String(enriched.length)} />
            <StatCard
              label="Active agents"
              value={String(enriched.reduce((s, e) => s + e.agentCount, 0))}
            />
            <StatCard
              label="Total tasks"
              value={String(enriched.reduce((s, e) => s + e.taskCount, 0))}
            />
            <StatCard label="Region" value="us-east-1" tone="sage" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
