import Link from "next/link";
import { ArrowLeft, CreditCard, Receipt, AlertTriangle, HelpCircle, CalendarDays } from "lucide-react";
import { db } from "@/lib/db/store";
import { BillingTokenChart } from "@/components/billing-token-chart";

const PERIOD_ALLOWANCE = 15.0;
const BALANCE_LOW_THRESHOLD = 5.0;

export default async function BillingPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  const [usageRecords, agents, departments] = await Promise.all([
    db.listUsage(org),
    db.listAgents(org),
    db.listDepartments(org),
  ]);

  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const deptMap = new Map(departments.map((d) => [d.id, d]));

  const totalSpent = usageRecords.reduce((s, r) => s + r.cost_usd, 0);
  const balance = Math.max(0, PERIOD_ALLOWANCE - totalSpent);
  const isLow = balance < BALANCE_LOW_THRESHOLD;

  // Period: current month
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // USAGE CHARGES: group by agent_name
  const byAgentName = new Map<string, { cost: number; tokens: number }>();
  for (const r of usageRecords) {
    const key = r.agent_name ?? "Other";
    const existing = byAgentName.get(key) ?? { cost: 0, tokens: 0 };
    byAgentName.set(key, {
      cost: existing.cost + r.cost_usd,
      tokens: existing.tokens + r.input_tokens + r.output_tokens,
    });
  }
  const usageCharges = [...byAgentName.entries()]
    .map(([name, v]) => ({ name, ...v, pct: totalSpent > 0 ? (v.cost / totalSpent) * 100 : 0 }))
    .sort((a, b) => b.cost - a.cost);

  // DEPARTMENT ITEMIZATION
  type AgentRow = { name: string; cost: number; tokens: number };
  type DeptRow = { id: string; name: string; cost: number; tokens: number; agents: AgentRow[] };
  const byDept = new Map<string, DeptRow>();

  for (const r of usageRecords) {
    const agent = r.agent_id ? agentMap.get(r.agent_id) : null;
    const deptId = agent?.department_id ?? "unassigned";
    const deptName = agent?.department_id
      ? (deptMap.get(agent.department_id)?.name ?? "Unknown")
      : "Unassigned";
    const agentName = r.agent_name ?? "Other";
    const tokens = r.input_tokens + r.output_tokens;

    const dRow = byDept.get(deptId) ?? { id: deptId, name: deptName, cost: 0, tokens: 0, agents: [] };
    dRow.cost += r.cost_usd;
    dRow.tokens += tokens;
    const aIdx = dRow.agents.findIndex((a) => a.name === agentName);
    if (aIdx >= 0) {
      dRow.agents[aIdx].cost += r.cost_usd;
      dRow.agents[aIdx].tokens += tokens;
    } else {
      dRow.agents.push({ name: agentName, cost: r.cost_usd, tokens });
    }
    byDept.set(deptId, dRow);
  }
  const deptRows = [...byDept.values()].sort((a, b) => b.cost - a.cost);

  // AGENT ITEMIZATION: group by agent_name with dept
  type AgentItemRow = { name: string; dept: string; cost: number; tokens: number };
  const byAgent = new Map<string, AgentItemRow>();
  for (const r of usageRecords) {
    const agent = r.agent_id ? agentMap.get(r.agent_id) : null;
    const deptName = agent?.department_id
      ? (deptMap.get(agent.department_id)?.name ?? "Unknown")
      : "Unassigned";
    const key = r.agent_name ?? "Other";
    const existing = byAgent.get(key) ?? { name: key, dept: deptName, cost: 0, tokens: 0 };
    existing.cost += r.cost_usd;
    existing.tokens += r.input_tokens + r.output_tokens;
    byAgent.set(key, existing);
  }
  const agentRows = [...byAgent.values()].sort((a, b) => b.cost - a.cost);

  // Token chart: group by calendar date
  const tokensByDate = new Map<string, number>();
  for (const r of usageRecords) {
    const date = r.created_at.slice(0, 10);
    tokensByDate.set(date, (tokensByDate.get(date) ?? 0) + r.input_tokens + r.output_tokens);
  }
  const chartData = [...tokensByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tokens]) => ({ date, tokens }));

  // Transaction history: records sorted newest first with running balance
  const sortedRecords = [...usageRecords].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const transactions = sortedRecords.map((r, i) => {
    const runningBalance =
      balance + sortedRecords.slice(0, i).reduce((s, x) => s + x.cost_usd, 0);
    return { ...r, runningBalance };
  });

  function fmtUsd(n: number) {
    return n.toFixed(n < 0.01 && n > 0 ? 4 : 2);
  }

  function fmtTokens(n: number) {
    return n.toLocaleString();
  }

  function fmtTs(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function tokenType(r: (typeof usageRecords)[0]) {
    if (r.model.includes("cache")) return "Cache read tokens";
    return "Input/Output tokens";
  }

  return (
    <div className="min-h-full p-6 md:p-8 space-y-8 max-w-4xl">
      <div>
        <Link href={`/${org}`} className="inline-flex items-center text-ink-muted hover:text-ink mb-4">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Organization Billing</h1>
        <p className="text-sm text-ink-muted mt-1">
          Manage your organization&apos;s balance and view transaction history.
        </p>
      </div>

      {isLow && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-amber-800">Balance is running low</div>
              <div className="text-sm text-amber-700">
                Consider topping up to avoid service interruption.
              </div>
            </div>
          </div>
          <Link
            href={`/${org}/billing/upgrade`}
            className="flex items-center gap-1 shrink-0 text-sm rounded-md border border-amber-300 bg-white px-3 py-1.5 text-amber-800 hover:bg-amber-50 whitespace-nowrap"
          >
            Quick Top Up $25.00
            <ArrowLeft className="size-3 rotate-[225deg]" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line/70 bg-paper p-5">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <CreditCard className="size-4" />
            Available Balance
          </div>
          <div className="text-4xl font-semibold tracking-tight">${balance.toFixed(2)}</div>
        </div>

        <div className="rounded-lg border border-line/70 bg-paper p-5">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <CalendarDays className="size-4" />
            Subscription
          </div>
          <div className="text-3xl font-semibold tracking-tight mb-1">Trial</div>
          <div className="text-sm text-ink-muted mb-1">Active trial subscription</div>
          <div className="text-sm text-ink-muted mb-4">
            Trial balance expires on{" "}
            <span className="font-medium text-ink">May 15, 2026</span>
          </div>
          <button
            type="button"
            className="w-full rounded-md bg-ink text-paper text-sm py-2 hover:opacity-90"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Usage</h2>
          <p className="text-sm text-ink-muted">
            Monitor your usage, costs, and resource consumption across all services.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-line/70 bg-paper p-5">
            <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
              Spend Overview
              <HelpCircle className="size-3.5 text-ink-muted" />
            </div>
            <div className="text-xs text-ink-muted mb-4">
              {fmtDate(periodStart)} to {fmtDate(periodEnd)}
            </div>
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-semibold">${totalSpent.toFixed(2)}</div>
                <div className="text-xs text-ink-muted">spent</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">${balance.toFixed(2)}</div>
                <div className="text-xs text-ink-muted">remaining</div>
              </div>
            </div>
          </div>

          {isLow && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-amber-800">Approaching Limit</div>
                  <div className="text-sm text-amber-700 mt-1">
                    You&apos;re running low on balance. Consider topping up or upgrading your plan
                    to avoid interruptions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-line/70 bg-paper p-5">
          <div className="text-xs text-ink-muted mb-1 uppercase tracking-wide">Tokens</div>
          <BillingTokenChart data={chartData} />
        </div>
      </section>

      <section className="space-y-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Receipt className="size-4" />
          <h2 className="text-lg font-semibold tracking-tight">Billing Receipt</h2>
          <HelpCircle className="size-3.5 text-ink-muted" />
        </div>
        <div className="text-xs text-ink-muted mb-4">
          {fmtDate(now)} to {fmtDate(now)}
        </div>

        <div className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-medium">Period allowance</div>
              <div className="text-xs text-ink-muted">Amount included for this period</div>
            </div>
            <div className="text-sm font-medium text-green-700">
              +${PERIOD_ALLOWANCE.toFixed(2)}
            </div>
          </div>

          {usageCharges.length > 0 && (
            <>
              <div className="px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-widest text-ink-muted">
                  Usage Charges
                </span>
              </div>
              {usageCharges.map((uc) => (
                <div key={uc.name} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{uc.name}</div>
                    <div className="text-xs text-ink-muted">
                      {uc.pct.toFixed(1)}% of period usage
                    </div>
                  </div>
                  <div className="text-sm">-${fmtUsd(uc.cost)}</div>
                </div>
              ))}
            </>
          )}

          {deptRows.length > 0 && (
            <>
              <div className="px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-widest text-ink-muted">
                  Department Itemization
                </span>
              </div>
              {deptRows.map((dept) => (
                <div key={dept.id}>
                  <div className="flex items-start justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{dept.name}</div>
                      <div className="text-xs text-ink-muted">
                        {fmtTokens(dept.tokens)} tokens | {totalSpent > 0 ? ((dept.cost / totalSpent) * 100).toFixed(1) : "0.0"}% of period usage
                      </div>
                      {dept.agents.map((a) => (
                        <div key={a.name} className="flex items-center justify-between mt-1">
                          <span className="text-xs text-ink-muted">{a.name}</span>
                          <span className="text-xs text-ink-muted ml-8">
                            ${a.cost.toFixed(2)} | {fmtTokens(a.tokens)} tokens
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm shrink-0 ml-4">-${fmtUsd(dept.cost)}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {agentRows.length > 0 && (
            <>
              <div className="px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-widest text-ink-muted">
                  Agent Itemization
                </span>
              </div>
              {agentRows.map((a) => (
                <div key={a.name} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-ink-muted">
                      {a.dept} | {fmtTokens(a.tokens)} tokens |{" "}
                      {totalSpent > 0 ? ((a.cost / totalSpent) * 100).toFixed(1) : "0.0"}% of period usage
                    </div>
                  </div>
                  <div className="text-sm">-${fmtUsd(a.cost)}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="space-y-4 pb-8">
        <h2 className="text-lg font-semibold tracking-tight">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="text-sm text-ink-muted">No transactions yet.</div>
        ) : (
          <div className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <ArrowLeft className="size-3.5 text-red-500 rotate-[-45deg]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {t.input_tokens > 0 && t.output_tokens > 0
                      ? `Input/Output tokens: ${t.input_tokens + t.output_tokens}`
                      : t.input_tokens > 0
                        ? `Input tokens: ${t.input_tokens}`
                        : `Output tokens: ${t.output_tokens}`}{" "}
                    [{t.agent_name ?? "unknown"}]
                  </div>
                  <div className="text-xs text-ink-muted">{fmtTs(t.created_at)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-red-600">-${fmtUsd(t.cost_usd)}</div>
                  <div className="text-xs text-ink-muted">Balance: ${t.runningBalance.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
