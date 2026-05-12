"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const ORG_INTEGRATIONS = [
  {
    slug: "linear",
    name: "Linear",
    desc: "Manage Linear issues, projects, workflow states, and team collaboration",
    hasManage: true,
    color: "#5E6AD2",
    letter: "L",
  },
  {
    slug: "postiz",
    name: "Postiz",
    desc: "Connect a customer-owned Postiz workspace, review connected channels, and edit publishing defaults for the organization.",
    hasManage: true,
    color: "#8B5CF6",
    letter: "P",
  },
  {
    slug: "ramp",
    name: "Ramp",
    desc: "View Ramp cards, transactions, and business details to power finance automations.",
    hasManage: false,
    color: "#16A34A",
    letter: "R",
  },
];

const YOUR_INTEGRATIONS = [
  { slug: "airtable", name: "Airtable", desc: "Manage Airtable databases and records", color: "#F97316" },
  { slug: "attio", name: "Attio", desc: "Manage Attio records and notes", color: "#0EA5E9" },
  { slug: "calendar", name: "Calendar", desc: "Schedule and manage calendar events", color: "#3B82F6" },
  { slug: "datadog", name: "Datadog", desc: "Query Datadog dashboards, metrics, monitors, and logs", color: "#774AA4" },
  { slug: "doppler", name: "Doppler Secretops", desc: "Manage secrets with Doppler", color: "#6366F1" },
  { slug: "gmail", name: "Gmail", desc: "Manage emails and drafts", color: "#EA4335" },
  { slug: "google-docs", name: "Google Docs", desc: "Manage Google Docs documents and comments", color: "#4285F4" },
  { slug: "google-drive", name: "Google Drive", desc: "Search and access your Google Drive files", color: "#34A853" },
  { slug: "google-search-console", name: "Google Search Console", desc: "Analyze owned search performance and sitemap health in Google Search Console", color: "#4285F4" },
  { slug: "google-slides", name: "Google Slides", desc: "Manage Google Slides presentations and slides", color: "#FBBC04" },
  { slug: "intercom", name: "Intercom", desc: "Manage Intercom conversations and contacts", color: "#0057FF" },
  { slug: "launchdarkly", name: "LaunchDarkly", desc: "Manage LaunchDarkly feature flags and projects", color: "#405BFF" },
  { slug: "limitless", name: "Limitless", desc: "Read and search your Limitless Pendant lifelogs.", color: "#8B5CF6" },
  { slug: "logfire", name: "Logfire", desc: "Query Logfire traces, logs, and metrics", color: "#F97316" },
  { slug: "loops", name: "Loops", desc: "Manage email contacts, mailing lists, and send transactional emails", color: "#EC4899" },
  { slug: "metabase", name: "Metabase", desc: "Manage Metabase dashboards, run queries, and analyze data", color: "#509EE3" },
  { slug: "neon", name: "Neon", desc: "Manage Neon serverless Postgres databases", color: "#00E599" },
  { slug: "notion", name: "Notion", desc: "Manage Notion pages and databases", color: "#000000" },
  { slug: "pagerduty", name: "Pagerduty", desc: "Manage PagerDuty on-call schedules and incidents", color: "#06AC38" },
  { slug: "posthog", name: "Posthog", desc: "Analyze PostHog data and insights", color: "#F54E00" },
  { slug: "sentry", name: "Sentry", desc: "Monitor errors and manage issues in Sentry", color: "#362D59" },
  { slug: "sheets", name: "Sheets", desc: "Manage Google Sheets and data", color: "#34A853" },
  { slug: "supabase", name: "Supabase", desc: "Manage your Supabase database tables and data", color: "#3ECF8E" },
  { slug: "vercel", name: "Vercel", desc: "Manage Vercel deployments, projects, and DNS", color: "#000000" },
];

function IntegrationIcon({ color, letter, size = 24 }: { color: string; letter: string; size?: number }) {
  return (
    <div
      className="rounded-md flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.5 }}
    >
      {letter}
    </div>
  );
}

export default function IntegrationsPage() {
  const params = useParams<{ org: string }>();
  const org = params.org;
  const [connecting, setConnecting] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = query
    ? YOUR_INTEGRATIONS.filter(
        (i) =>
          i.name.toLowerCase().includes(query.toLowerCase()) ||
          i.desc.toLowerCase().includes(query.toLowerCase()),
      )
    : YOUR_INTEGRATIONS;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl tracking-tight">Integrations</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Let your agent handle more work for you. Connect integrations to automate your work.
        </p>
      </header>

      <section className="space-y-2">
        <div>
          <h2 className="text-base font-medium">Organization Integrations</h2>
          <p className="text-sm text-ink-muted">
            Shared across all organization members. Only org admins can manage these.
          </p>
        </div>
        <div className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
          {ORG_INTEGRATIONS.map((i) => (
            <div key={i.slug} className="px-4 py-3 flex items-center gap-3">
              <IntegrationIcon color={i.color} letter={i.letter} />
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium">{i.name}</div>
                <p className="text-sm text-ink-muted leading-snug">{i.desc}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {i.hasManage && (
                  <Link
                    href={`/${org}/integrations/${i.slug}`}
                    className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
                  >
                    Manage
                  </Link>
                )}
                {connecting === i.slug ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-muted border border-line rounded-md px-3 py-1.5 opacity-60">
                      Connecting...
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConnecting(i.slug)}
                    className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
          {connecting && (
            <div className="px-4 py-2 flex items-center gap-2 text-sm text-ink-muted bg-canvas/50">
              <span className="inline-block size-3 rounded-full border-2 border-ink-soft border-t-transparent animate-spin" />
              Opening {ORG_INTEGRATIONS.find((i) => i.slug === connecting)?.name}...
              <button
                type="button"
                onClick={() => setConnecting(null)}
                className="ml-auto text-sm hover:text-ink"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <h2 className="text-base font-medium">Your Integrations</h2>
          <p className="text-sm text-ink-muted">Personal integrations connected to your account.</p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations..."
            className="w-full h-9 rounded-md border border-line bg-paper pl-9 pr-3 text-base focus:outline-none focus:border-line-strong"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((i) => (
            <div
              key={i.slug}
              className="rounded-lg border border-line/70 bg-paper p-3 flex flex-col gap-1.5 hover:border-line-strong transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IntegrationIcon color={i.color} letter={i.name[0]} size={20} />
                  <span className="text-base font-medium">{i.name}</span>
                </div>
                <button
                  type="button"
                  className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong shrink-0"
                >
                  Connect
                </button>
              </div>
              <p className="text-xs text-ink-muted leading-snug">{i.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
