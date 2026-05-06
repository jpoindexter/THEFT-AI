import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { Plus, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

const DOMAINS = [
  {
    slug: "theft-ai",
    domain: "theft.ai",
    target: "Marketing site",
    status: "verified" as const,
  },
  {
    slug: "app-theft-ai",
    domain: "app.theft.ai",
    target: "App",
    status: "pending" as const,
  },
];

export default async function Domains({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <>
      <SectionHeader
        title="Domains"
        description="Manage which domains your app and marketing site live on, and how email is routed."
      />
      <SettingsCard title="Domains">
        {DOMAINS.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 p-8 text-center text-[12px] text-stone-500 flex flex-col items-center gap-2">
            <Globe className="size-5" />
            No domains added yet.
            <button className="inline-flex items-center gap-1 rounded-md bg-stone-900 text-white px-3 py-1.5 text-[12px]">
              <Plus className="size-3" />
              Add or buy a domain
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 -mx-1">
            {DOMAINS.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/${org}/settings/domains/${d.slug}`}
                  className="flex items-center justify-between px-1 py-2.5 hover:bg-stone-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`size-2 rounded-full ${
                        d.status === "verified"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="text-[13px] font-mono">{d.domain}</span>
                    <span className="text-[11px] text-stone-500">
                      {d.target}
                    </span>
                  </div>
                  <ArrowRight className="size-3 text-stone-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end pt-1">
          <button className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-[11px] hover:border-stone-400">
            <Plus className="size-3" />
            Add or buy a domain
          </button>
        </div>
        <p className="text-[11px] text-stone-500">
          Propagation can take up to 24 hours. Buying through Cofounder runs
          DNS, nameserver, and Postmark setup automatically.
        </p>
      </SettingsCard>
      <SettingsCard
        title="Inbox domains"
        description="Once a domain is verified for inbound email, you can route it to specific agents in Settings → Inbox."
      >
        <p className="text-[12px] text-stone-500">
          {DOMAINS.filter((d) => d.status === "verified").length} verified
          domain(s) available for inbound routing.
        </p>
      </SettingsCard>
    </>
  );
}
