import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function MagicSentPage() {
  return (
    <div className="min-h-screen bg-cream text-ink grid place-items-center px-4">
      <div className="max-w-sm w-full text-center space-y-3">
        <div className="size-12 rounded-full bg-paper border border-line/70 inline-flex items-center justify-center text-ink-muted mx-auto">
          <MailCheck className="size-5" />
        </div>
        <h1 className="text-xl tracking-tight">Check your email</h1>
        <p className="text-sm text-ink-muted">
          We sent a sign-in link. It expires in 10 minutes. You can close this
          tab — the link works in any browser.
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Use a different email
        </Link>
      </div>
    </div>
  );
}
