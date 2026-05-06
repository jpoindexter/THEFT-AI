import { Copy, Gift } from "lucide-react";

export default function ReferralsPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-gradient-to-br from-amber-200 via-rose-200 to-sky-200 inline-flex items-center justify-center">
            <Gift className="size-5 text-stone-700" />
          </div>
          <div>
            <h1 className="text-xl tracking-tight">Referrals</h1>
            <p className="text-[13px] text-stone-500">
              Share THEFT with founders and earn credits when they upgrade.
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
            Your referral link
          </div>
          <div className="flex items-center gap-2 rounded-md border border-stone-200/70 bg-stone-50 px-3 py-2 text-[12px]">
            <span className="flex-1 truncate font-mono">
              theft.ai/?ref=jpoindexter
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] rounded-md border border-stone-200 bg-white px-2 py-0.5 hover:border-stone-400"
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
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200/70 bg-white p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 mb-0.5">
        {label}
      </div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
    </div>
  );
}
