import Link from "next/link";
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import { SectionHeader, SettingsCard } from "@/components/settings/section";

const DOMAINS: Record<
  string,
  {
    domain: string;
    status: "pending" | "verified" | "failed";
    target: string;
    records: { kind: string; host: string; value: string; ok: boolean }[];
  }
> = {
  "theft-ai": {
    domain: "theft.ai",
    status: "verified",
    target: "marketing site",
    records: [
      {
        kind: "A",
        host: "@",
        value: "76.76.21.21",
        ok: true,
      },
      {
        kind: "CNAME",
        host: "www",
        value: "cname.vercel-dns.com",
        ok: true,
      },
      {
        kind: "TXT",
        host: "_postmark",
        value: "p=BCB7…",
        ok: true,
      },
    ],
  },
  "app-theft-ai": {
    domain: "app.theft.ai",
    status: "pending",
    target: "app",
    records: [
      {
        kind: "CNAME",
        host: "app",
        value: "cname.vercel-dns.com",
        ok: false,
      },
    ],
  },
};

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ org: string; domain: string }>;
}) {
  const { org, domain } = await params;
  const d = DOMAINS[domain] ?? DOMAINS["theft-ai"];
  return (
    <>
      <Link
        href={`/${org}/settings/domains`}
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-3"
      >
        <ArrowLeft className="size-3" /> Back to domains
      </Link>

      <SectionHeader
        title={d.domain}
        description={`Routes to the ${d.target}.`}
      />

      <SettingsCard title="Status">
        <div className="flex items-center gap-2 text-base">
          <span
            className={`size-2 rounded-full ${
              d.status === "verified"
                ? "bg-sage"
                : d.status === "pending"
                  ? "bg-mustard/150"
                  : "bg-brick/100"
            }`}
          />
          <span className="capitalize">{d.status}</span>
          {d.status === "pending" && (
            <span className="text-xs text-ink-muted">
              · waiting for DNS propagation
            </span>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        title="DNS records"
        description="Add these to your DNS provider. We re-check every 5 minutes."
      >
        <ul className="divide-y divide-line/60">
          {d.records.map((r, i) => (
            <li key={i} className="py-2 grid grid-cols-[40px_80px_1fr_auto] gap-3 items-center text-sm">
              <span className="font-mono text-2xs uppercase rounded bg-cream px-1.5 py-0.5 text-ink inline-block w-fit">
                {r.kind}
              </span>
              <span className="font-mono text-ink truncate">{r.host}</span>
              <span className="font-mono text-ink truncate">{r.value}</span>
              <span className="flex items-center gap-2">
                {r.ok && <CheckCircle2 className="size-3.5 text-sage-ink" />}
                <button
                  type="button"
                  className="text-2xs inline-flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 hover:border-line-strong"
                >
                  <Copy className="size-3" /> Copy
                </button>
              </span>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Connected services"
        description="Domains can be wired to multiple services."
      >
        <ul className="space-y-1.5 text-sm">
          <li className="flex justify-between rounded-md border border-line/70 px-3 py-2">
            <span>Vercel deployment</span>
            <span className="text-ink-muted">app.theft.ai → theft-app</span>
          </li>
          <li className="flex justify-between rounded-md border border-line/70 px-3 py-2">
            <span>Postmark inbound</span>
            <span className="text-ink-muted">verified</span>
          </li>
        </ul>
      </SettingsCard>
    </>
  );
}
