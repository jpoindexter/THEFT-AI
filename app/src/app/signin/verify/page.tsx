"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type Status = "verifying" | "ok" | "expired" | "missing" | "used";

export default function VerifyPage() {
  return (
    <Suspense fallback={<Shell status="verifying" />}>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      return;
    }
    const t = window.setTimeout(() => {
      // Local stub: tokens longer than 10 chars look real, others fall to test cases.
      if (token.length < 6) setStatus("expired");
      else if (token === "used") setStatus("used");
      else setStatus("ok");
    }, 600);
    return () => window.clearTimeout(t);
  }, [token]);

  useEffect(() => {
    if (status === "ok") {
      const t = window.setTimeout(() => {
        void (async () => {
          try {
            const res = await fetch("/api/dev-login", { method: "POST" });
            const j = (await res.json()) as { redirect?: string };
            router.replace(j.redirect ?? "/");
          } catch {
            router.replace("/");
          }
        })();
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [status, router]);

  return <Shell status={status} />;
}

function Shell({ status }: { status: Status }) {
  return (
    <div className="min-h-screen bg-cream text-ink grid place-items-center px-4">
      <div className="max-w-sm w-full text-center space-y-3">
        <Spinner status={status} />
        <Title status={status} />
        <Body status={status} />
        <Footer status={status} />
      </div>
    </div>
  );
}

function Spinner({ status }: { status: Status }) {
  if (status === "verifying") {
    return (
      <div className="size-12 rounded-full bg-paper border border-line/70 inline-flex items-center justify-center text-ink-muted mx-auto animate-pulse">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (status === "ok") {
    return (
      <div className="size-12 rounded-full bg-sage/20 border border-sage/60 inline-flex items-center justify-center text-sage-ink mx-auto">
        <CheckCircle2 className="size-5" />
      </div>
    );
  }
  return (
    <div className="size-12 rounded-full bg-mustard/20 border border-mustard/60 inline-flex items-center justify-center text-mustard-ink mx-auto">
      <AlertTriangle className="size-5" />
    </div>
  );
}

function Title({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    verifying: "Verifying your link…",
    ok: "Signed in",
    expired: "This link has expired",
    used: "This link was already used",
    missing: "No token in URL",
  };
  return <h1 className="text-xl tracking-tight">{map[status]}</h1>;
}

function Body({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    verifying: "Hold tight — we're confirming your magic link.",
    ok: "Redirecting you to your workspace.",
    expired: "Magic links work for 10 minutes. Request a new one.",
    used: "Each link only works once. Request a fresh one.",
    missing: "We couldn't find a token in this URL.",
  };
  return <p className="text-sm text-ink-muted">{map[status]}</p>;
}

function Footer({ status }: { status: Status }) {
  if (status === "ok" || status === "verifying") return null;
  return (
    <Link
      href="/signin"
      className="inline-block text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 mt-2"
    >
      Send me a new link
    </Link>
  );
}
