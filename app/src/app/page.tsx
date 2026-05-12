import Link from "next/link";
import { db } from "@/lib/db/store";

const DEPTS = [
  { name: "Engineering", desc: "Ships product" },
  { name: "Design",      desc: "Brand + UI" },
  { name: "Marketing",   desc: "Site + copy" },
  { name: "Sales",       desc: "Outbound + close" },
  { name: "Operations",  desc: "Pipeline + ops" },
  { name: "Finance",     desc: "Books + runway" },
  { name: "Legal",       desc: "MSA + IP" },
  { name: "Support",     desc: "Client comms" },
];

const AGENTS = [
  { name: "Engineering", desc: "Tests locally, opens PRs, runs migrations, ships features end-to-end." },
  { name: "Design",      desc: "Brand system, logos, components, UI kits, decks." },
  { name: "Marketing",   desc: "Campaigns, landing pages, copy, outbound sequences." },
  { name: "Sales",       desc: "ICP from market research, qualified accounts, email sequences." },
];

const HOW = [
  { n: "01", t: "Describe", d: "Tell it what you're building. The platform generates a roadmap of ~30 capabilities across 8 departments." },
  { n: "02", t: "Assign",   d: "Pick the next move. The relevant department agent does it — code, copy, outreach, legal, all of it." },
  { n: "03", t: "Ship",     d: "Approve, redirect, or skip. You stay in control. Agents execute." },
];

const root: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  background: "var(--t-canvas)",
  color: "var(--t-ink)",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  letterSpacing: "-0.02em",
  fontSize: 13,
};

export default async function Home() {
  const orgs = await db.listOrgs();
  const continueHref = orgs.length > 0 ? `/${orgs[0].slug}` : "/onboarding";

  return (
    <div style={root}>
      <header style={{ height: 52, background: "var(--t-canvas)", borderBottom: "1px solid var(--t-line)", display: "flex", alignItems: "center", padding: "0 24px", position: "sticky", top: 0, zIndex: 30 }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0 }}>
          THEFT<span style={{ color: "var(--t-ink-muted)", fontWeight: 400, marginLeft: 2 }}>&amp;</span>
        </span>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/signin" style={{ fontSize: 12, color: "var(--t-ink-muted)", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--t-ink-soft)" }}>
          AGENT PLATFORM · PRIVATE BETA
        </span>
        <h1 style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.03em", margin: 0, color: "var(--t-ink)" }}>
          Run a real company<br />with AI agents.
        </h1>
        <p style={{ fontSize: 13, color: "var(--t-ink-muted)", lineHeight: 1.55, margin: 0, maxWidth: "52ch" }}>
          Eight departments. One roadmap. You decide what ships next; the agents execute it.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Link href={continueHref} style={{ height: 36, padding: "0 16px", borderRadius: 6, background: "var(--t-ink)", color: "var(--t-paper)", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Get started →
          </Link>
          <a href="#how" style={{ height: 36, padding: "0 16px", borderRadius: 6, background: "var(--t-paper)", border: "1px solid var(--t-line)", color: "var(--t-ink)", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            See how it works
          </a>
        </div>
      </section>

      <section style={{ borderTop: "1px solid var(--t-line)", borderBottom: "1px solid var(--t-line)", background: "var(--t-canvas)", overflow: "hidden", padding: 24 }}>
        <div style={{ display: "flex", gap: 8, width: "max-content", margin: "0 auto" }}>
          {DEPTS.map((d) => (
            <div key={d.name} style={{ width: 140, padding: 14, background: "var(--t-paper)", border: "1px solid var(--t-line)", borderRadius: 6, display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-ink)" }}>{d.name}</span>
              <span style={{ fontSize: 11, color: "var(--t-ink-muted)", lineHeight: 1.5 }}>{d.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how" style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <hr style={{ border: "none", borderTop: "1px dashed var(--t-line-strong)", margin: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--t-ink-soft)" }}>
          HOW IT WORKS
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {HOW.map((s) => (
            <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>{s.n}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-ink)" }}>{s.t}</span>
              <span style={{ fontSize: 12, color: "var(--t-ink-muted)", lineHeight: 1.55 }}>{s.d}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 64px", display: "flex", flexDirection: "column", gap: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--t-ink-soft)" }}>
          DEPARTMENT AGENTS
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {AGENTS.map((a) => (
            <div key={a.name} style={{ background: "var(--t-paper)", border: "1px solid var(--t-line)", borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-ink)" }}>{a.name}</span>
              <span style={{ fontSize: 12, color: "var(--t-ink-muted)", lineHeight: 1.55 }}>{a.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--t-ink)", color: "var(--t-paper)", padding: "56px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, maxWidth: 520 }}>
          Run a real company with AI agents.
        </div>
        <Link href={continueHref} style={{ height: 36, padding: "0 16px", borderRadius: 6, background: "var(--t-paper)", color: "var(--t-ink)", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          Get started →
        </Link>
      </section>

      <footer style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--t-line)", fontSize: 12, color: "var(--t-ink-soft)" }}>
        <span>© THEFT AI</span>
        <span>Private beta</span>
      </footer>
    </div>
  );
}
