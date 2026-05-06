import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Reply, Forward, Trash2 } from "lucide-react";

const THREADS: Record<
  string,
  {
    agent: string;
    address: string;
    subject: string;
    messages: { from: string; when: string; body: string }[];
    suggested: string;
  }
> = {
  marketing: {
    agent: "Marketing Agent",
    address: "marketing@theft.ai",
    subject: "RE: launch broadcast feedback",
    messages: [
      {
        from: "ana@partner.io",
        when: "12m ago",
        body: "Hey — saw the draft. The subject works but the second paragraph repeats the headline. Tighten?",
      },
      {
        from: "marketing@theft.ai",
        when: "10m ago",
        body: "Good call. I'll cut paragraph two and try a tighter version. Sending a revised draft in ~5min.",
      },
    ],
    suggested:
      "Reply to Ana with: 'Updated. Paragraph two is gone, the lead now reads as one beat. Subject unchanged. Sending the revision now.'",
  },
  sales: {
    agent: "Sales Agent",
    address: "sales@theft.ai",
    subject: "demo request — Encompass loan team",
    messages: [
      {
        from: "kim@encompass.com",
        when: "1h ago",
        body: "We loop closed-loan operations through 14 manual steps. Want to see your demo this week.",
      },
    ],
    suggested:
      "Reply offering 3 time slots Wed/Thu/Fri afternoon. Attach the 90-second product demo.",
  },
};

export default async function InboxThreadPage({
  params,
}: {
  params: Promise<{ org: string; thread: string }>;
}) {
  const { org, thread } = await params;
  const t = THREADS[thread];
  if (!t) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${org}/inbox`}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="size-3" /> Back to inbox
        </Link>

        <header>
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            {t.agent} · <code className="font-mono">{t.address}</code>
          </div>
          <h1 className="text-xl tracking-tight mt-0.5">{t.subject}</h1>
        </header>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-4">
          {t.messages.map((m, i) => (
            <article
              key={i}
              className="border-b last:border-0 border-stone-100 pb-3 last:pb-0"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-stone-700">{m.from}</span>
                <span className="text-stone-400">{m.when}</span>
              </div>
              <p className="text-[13px] text-stone-700 leading-relaxed mt-1 whitespace-pre-wrap">
                {m.body}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-amber-200/70 bg-amber-50 p-4">
          <div className="text-[10px] uppercase tracking-wider text-amber-800 mb-1">
            Agent draft (not sent)
          </div>
          <p className="text-[13px] text-stone-800 leading-relaxed">
            {t.suggested}
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <button className="text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400">
              Edit
            </button>
            <button className="text-[11px] rounded-md bg-stone-900 text-white px-3 py-1.5">
              Send reply
            </button>
          </div>
        </section>

        <div className="flex justify-end gap-1">
          <button className="inline-flex items-center gap-1 text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400">
            <Reply className="size-3" /> Reply
          </button>
          <button className="inline-flex items-center gap-1 text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400">
            <Forward className="size-3" /> Forward
          </button>
          <button className="inline-flex items-center gap-1 text-[11px] rounded-md border border-red-300 bg-white text-red-700 px-2 py-1 hover:bg-red-50">
            <Trash2 className="size-3" /> Archive
          </button>
        </div>
      </div>
    </div>
  );
}
