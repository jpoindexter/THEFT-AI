import Link from "next/link";

export default async function MagicSentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const email = params.email ?? "";

  return (
    <div style={{ fontFamily: "var(--font-geist-mono)", background: "var(--t-canvas)", color: "var(--t-ink)", minHeight: "100vh", display: "flex", flexDirection: "column", letterSpacing: "-0.02em", fontSize: 13 }}>
      <header style={{ height: 52, background: "var(--t-canvas)", borderBottom: "1px solid var(--t-line)", display: "flex", alignItems: "center", padding: "0 24px" }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0, color: "var(--t-ink)", textDecoration: "none" }}>
          THEFT<span style={{ color: "var(--t-ink-muted)", fontWeight: 400, marginLeft: 2 }}>&amp;</span>
        </Link>
      </header>

      <main style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "96px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--t-ink)" }}>
            Email sent
          </h1>
          <p style={{ fontSize: 13, color: "var(--t-ink-muted)", margin: 0, lineHeight: 1.55 }}>
            Check your inbox for a sign-in link. It expires in 10 minutes.
          </p>

          {email && (
            <div style={{ background: "var(--t-paper)", border: "1px solid var(--t-line)", borderRadius: 6, padding: "10px 12px", fontSize: 13, color: "var(--t-ink)", display: "flex", alignItems: "center", gap: 8 }}>
              <MailIcon />
              <span>{email}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            <Link href="/signin" style={{ fontSize: 12, color: "var(--t-ink-soft)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Didn&apos;t get it? Resend
            </Link>
            <Link href="/signin" style={{ fontSize: 12, color: "var(--t-ink-muted)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: "var(--t-ink-muted)", flexShrink: 0 }}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
