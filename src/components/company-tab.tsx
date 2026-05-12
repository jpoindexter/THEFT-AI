"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type OrgData = {
  name: string;
  goal: string | null;
  business_plan: unknown;
};

type Stack = {
  github: { repo: string | null; status: "ready" | "missing" };
  vercel: { project: string | null; status: "ready" | "missing" };
  supabase: { project: string | null; status: "ready" | "missing" };
  postmark: { server: string | null; status: "ready" | "missing" };
};

export default function CompanyTab({
  organization,
}: {
  organization: { id: string; slug: string };
}) {
  const [org, setOrg] = useState<OrgData | null>(null);
  const [stack, setStack] = useState<Stack | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/${organization.slug}`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/company`).then((r) => r.json()),
    ]).then(([od, cd]) => {
      setOrg(od.org ?? null);
      setStack(cd.stack ?? null);
    });
  }, [organization.slug]);

  const description =
    org?.goal ??
    ((org?.business_plan as Record<string, unknown> | null)?.description as string | null) ??
    null;

  const stackRows = [
    { label: "Domain", value: null, status: "missing" as const },
    { label: "Email", value: null, status: "missing" as const },
    { label: "Payment", value: null, status: "missing" as const },
    {
      label: "Hosting",
      value: stack?.vercel.status === "ready" ? "Vercel" : null,
      status: stack?.vercel.status ?? "missing",
    },
  ];

  const linkRows: { label: string; href: string | null }[] = [
    { label: "App", href: null },
    { label: "Production", href: null },
    { label: "Staging", href: null },
    {
      label: "Repository",
      href: stack?.github.repo ?? null,
    },
    {
      label: "Vercel",
      href: stack?.vercel.project ?? null,
    },
  ];

  const marketingLinkRows: { label: string; href: string | null }[] = [
    { label: "App", href: null },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-base">
      {org && (
        <>
          <div>
            <h2 className="text-base font-medium tracking-tight text-ink">
              {org.name}
            </h2>
            {description && (
              <p className="text-xs text-ink-muted mt-1 leading-snug">
                {description}
              </p>
            )}
          </div>

          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-1.5">
              Stack
            </div>
            <div className="space-y-0.5">
              {stackRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm"
                >
                  <span className="text-ink">{row.label}</span>
                  <span
                    className={`text-xs ${
                      row.status === "ready"
                        ? "text-ink"
                        : "text-ink-muted"
                    }`}
                  >
                    {row.value ?? "Requires setup"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-1.5">
              Links
            </div>
            <div className="space-y-0.5">
              {linkRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm"
                >
                  <span className="text-ink">{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1 max-w-[160px] truncate"
                    >
                      <span className="truncate">{row.href}</span>
                      <ExternalLink className="size-2.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-ink-soft">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-1.5">
              Marketing Website
            </div>
            <div className="space-y-0.5">
              {marketingLinkRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm"
                >
                  <span className="text-ink">{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1 max-w-[160px] truncate"
                    >
                      <span className="truncate">{row.href}</span>
                      <ExternalLink className="size-2.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-ink-soft">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-1.5">
              Ideal Customer Profile
            </div>
            <div className="space-y-0.5">
              {[
                { label: "Company size",    value: "5–50 employees" },
                { label: "Industry",        value: "B2B SaaS, Agencies, DTC" },
                { label: "Growth stage",    value: "Seed → Series A" },
                { label: "Geography",       value: "US, UK, CA" },
                { label: "Trigger event",   value: "Hiring ops / RevOps role, Series A, compliance change" },
                { label: "Budget",          value: "$500–$3,000 / mo" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm gap-2"
                >
                  <span className="text-ink-muted shrink-0 text-xs">{row.label}</span>
                  <span className="text-xs text-ink text-right leading-snug">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
