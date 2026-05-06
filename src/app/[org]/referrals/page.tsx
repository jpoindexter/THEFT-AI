import { Copy, Gift, Mail, Share2, Send } from "lucide-react";

export default function ReferralsPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-gradient-to-br from-amber-200 via-rose-200 to-sky-200 inline-flex items-center justify-center">
            <Gift className="size-5 text-ink" />
          </div>
          <div>
            <h1 className="text-xl tracking-tight">Referrals</h1>
            <p className="text-[13px] text-ink-muted">
              Share THEFT with founders and earn credits when they upgrade.
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            Your referral link
          </div>
          <div className="flex items-center gap-2 rounded-md border border-line/70 bg-canvas px-3 py-2 text-[12px]">
            <span className="flex-1 truncate font-mono">
              theft.ai/?ref=jpoindexter
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong"
            >
              <Copy className="size-3" />
              Copy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Referred" value="0" />
          <Stat label="Activated" value="0" />
          <Stat label="Credits earned" value="$0" />
        </div>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            Share
          </div>
          <div className="flex gap-2">
            <ShareButton icon={<Mail className="size-3.5" />} label="Email" />
            <ShareButton icon={<Send className="size-3.5" />} label="X" />
            <ShareButton icon={<Share2 className="size-3.5" />} label="LinkedIn" />
          </div>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            Recent referrals
          </div>
          <p className="text-[12px] text-ink-muted">
            No referrals yet. Once a referred founder activates a workspace,
            you'll see them here.
          </p>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            How it works
          </div>
          <ul className="text-[12px] text-ink space-y-1 list-disc pl-4">
            <li>Friend signs up via your link.</li>
            <li>They activate by completing onboarding.</li>
            <li>You both get $20 in workspace credits when they upgrade.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function ShareButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 text-[12px] hover:border-line-strong"
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-paper p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft mb-0.5">
        {label}
      </div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
    </div>
  );
}
