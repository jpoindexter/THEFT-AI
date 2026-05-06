import Link from "next/link";
import { db } from "@/lib/db/store";

export default async function Home() {
  const orgs = await db.listOrgs();
  const continueHref = orgs.length > 0 ? `/${orgs[0].slug}` : "/onboarding";

  return (
    <div className="min-h-screen bg-[#f3f1ec] text-stone-900 flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,#a3d9f5 0%,#a3d9f5 50%,#7fb37e 50%,#5e8e58 100%)",
            }}
          />
          <PixelLandscape />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32">
          <header className="flex items-center justify-between text-[13px]">
            <div className="font-medium tracking-tight">THEFT</div>
            <nav className="flex items-center gap-4 text-stone-700">
              <Link href="#how">How it works</Link>
              <Link href="#agents">Agents</Link>
              <Link href={continueHref}>Sign in</Link>
            </nav>
          </header>
          <div className="mt-32 max-w-2xl space-y-6">
            <h1 className="text-5xl tracking-tight font-medium leading-tight">
              Run an entire company with AI agents.
            </h1>
            <p className="text-[15px] text-stone-700 leading-relaxed">
              THEFT is an agent-orchestration platform — designed to help you
              run an entire business. Departments, agents, tasks, library, all
              in one place.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Link
                href={continueHref}
                className="rounded-md bg-stone-900 text-white px-4 py-2 text-[13px] hover:bg-stone-800"
              >
                Get started
              </Link>
              <Link
                href="#how"
                className="rounded-md bg-white border border-stone-200 px-4 py-2 text-[13px] hover:border-stone-400"
              >
                Watch demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Run a company */}
      <section id="how" className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl tracking-tight font-medium">
            Cofounder lets you run an entire company with agents.
          </h2>
          <p className="text-[14px] text-stone-600 max-w-xl mx-auto">
            Designed to help you run an entire business — Engineering, Design,
            Marketing, Sales, Operations, Finance, Legal, Support — without
            hiring a team.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-8">
            <ScreenshotMock kind="canvas" />
            <ScreenshotMock kind="brief" />
          </div>
        </div>
      </section>

      {/* Learn how to start a company */}
      <section className="px-6 py-16 bg-white border-y border-stone-200/70">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl tracking-tight font-medium mb-8 text-center">
            Learn how to start a company.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { tone: "from-rose-300 to-orange-200", title: "Pick a name" },
              { tone: "from-amber-200 to-yellow-200", title: "Build the app" },
              { tone: "from-sky-200 to-emerald-200", title: "Brand identity" },
              { tone: "from-emerald-200 to-lime-200", title: "Public launch" },
            ].map((c, i) => (
              <article
                key={i}
                className="rounded-lg border border-stone-200/70 overflow-hidden bg-white"
              >
                <div
                  className={`aspect-[16/10] bg-gradient-to-br ${c.tone}`}
                />
                <div className="p-3">
                  <div className="text-[13px] font-medium">{c.title}</div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    Walkthrough · 8 min read
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Build with specialized agents */}
      <section id="agents" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl tracking-tight font-medium text-center mb-12">
            Build an entire company with the help of specialized agents.
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                tag: "01",
                title: "Engineer agent",
                body: "Tests changes locally, opens PRs with previews, runs migrations, ships features end-to-end.",
              },
              {
                tag: "02",
                title: "Design agent",
                body: "Picks brand vibes, lays out a board, generates logos, decks, components, UI kits.",
              },
              {
                tag: "03",
                title: "Marketing agent",
                body: "Generates HTML decks, images, videos, campaign briefs, saves outputs to the library.",
              },
              {
                tag: "04",
                title: "Sales agent",
                body: "Defines ICP from market research, finds qualified accounts, runs outbound sequences.",
              },
            ].map((f) => (
              <div key={f.tag} className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  {f.tag}
                </div>
                <h3 className="text-xl tracking-tight font-medium">
                  {f.title}
                </h3>
                <p className="text-[13px] text-stone-600 leading-relaxed">
                  {f.body}
                </p>
                <ScreenshotMock kind="agent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All the tools and systems */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,#a3d9f5 0%,#a3d9f5 60%,#7fb37e 60%,#5e8e58 100%)",
            }}
          />
          <PixelLandscape />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl tracking-tight font-medium">
            All the tools and systems your company needs.
          </h2>
          <p className="text-[14px] text-stone-700">
            GitHub, Vercel, Supabase, Postmark, Stripe — auto-provisioned
            during onboarding so your agents have everything they need on day
            one.
          </p>
          <ScreenshotMock kind="dashboard" />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-stone-900 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl tracking-tight">
            Run an entire company with AI agents.
          </h2>
          <Link
            href={continueHref}
            className="inline-block rounded-md bg-white text-stone-900 px-5 py-2 text-[13px]"
          >
            Get started
          </Link>
        </div>
      </section>
      <footer className="px-6 py-6 text-[11px] text-stone-500 flex items-center justify-between">
        <span>© THEFT AI</span>
        <span>Built with agents</span>
      </footer>
    </div>
  );
}

function PixelLandscape() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 w-full"
      viewBox="0 0 1200 360"
      preserveAspectRatio="xMidYEnd slice"
      aria-hidden
    >
      {/* sun */}
      <circle cx="980" cy="80" r="44" fill="#ffe28a" opacity="0.9" />
      {/* clouds */}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={120 + i * 320}
          cy={70 + i * 18}
          rx="52"
          ry="14"
          fill="#ffffff"
          opacity="0.85"
        />
      ))}
      {/* hills */}
      <path
        d="M 0 240 Q 200 160 400 220 T 800 200 T 1200 230 L 1200 360 L 0 360 Z"
        fill="#7fb37e"
      />
      {/* foreground hill */}
      <path
        d="M 0 290 Q 220 230 480 270 T 960 260 T 1200 290 L 1200 360 L 0 360 Z"
        fill="#5e8e58"
      />
      {/* trees (cross-stitch dots) */}
      {[120, 320, 540, 720, 900, 1080].map((x, i) => (
        <g key={x}>
          <rect x={x - 3} y={250 - (i % 2) * 8} width="6" height="20" fill="#5b3a1a" />
          <circle cx={x} cy={245 - (i % 2) * 8} r="14" fill="#3f6b3a" />
        </g>
      ))}
    </svg>
  );
}

function ScreenshotMock({
  kind,
}: {
  kind: "canvas" | "brief" | "agent" | "dashboard";
}) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.18)] overflow-hidden">
      <div className="bg-stone-100 border-b border-stone-200/70 px-2 py-1 flex items-center gap-1.5">
        <div className="flex gap-1">
          <span className="size-1.5 rounded-full bg-rose-300" />
          <span className="size-1.5 rounded-full bg-amber-300" />
          <span className="size-1.5 rounded-full bg-emerald-300" />
        </div>
      </div>
      <div className="aspect-[16/10] p-4">
        {kind === "canvas" && <CanvasMock />}
        {kind === "brief" && <BriefMock />}
        {kind === "agent" && <AgentMock />}
        {kind === "dashboard" && <DashboardMock />}
      </div>
    </div>
  );
}

function CanvasMock() {
  return (
    <div className="relative size-full">
      <svg viewBox="0 0 200 120" className="absolute inset-0">
        <circle
          cx="100"
          cy="60"
          r="42"
          fill="none"
          stroke="#d6d3d1"
          strokeWidth="0.4"
          strokeDasharray="0.8 2"
        />
      </svg>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] tracking-tight">
        Cofounder
      </span>
      {["Engineering", "Design", "Marketing", "Sales"].map((d, i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(a) * 32;
        const y = 50 + Math.sin(a) * 32;
        return (
          <span
            key={d}
            className="absolute text-[7px] bg-white border border-stone-200 rounded-full px-1.5 py-0.5"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
}

function BriefMock() {
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-24 rounded bg-stone-200" />
      <div className="h-1.5 w-40 rounded bg-stone-100" />
      <div className="h-6 mt-2 rounded-md bg-stone-100" />
      <div className="h-6 rounded-md bg-stone-100" />
      <div className="h-6 rounded-md bg-stone-50 ring-1 ring-stone-200" />
      <div className="flex justify-end pt-2">
        <div className="h-3 w-16 rounded bg-stone-900" />
      </div>
    </div>
  );
}

function AgentMock() {
  return (
    <div className="space-y-1">
      <div className="h-2 w-16 rounded bg-amber-200" />
      <div className="h-1.5 w-full rounded bg-amber-50" />
      <div className="h-1.5 w-3/4 rounded bg-amber-50" />
      <div className="h-1.5 w-2/3 rounded bg-amber-50" />
      <div className="h-3 mt-2 rounded bg-stone-100" />
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {[
        "GitHub",
        "Vercel",
        "Supabase",
        "Stripe",
        "Postmark",
        "Linear",
      ].map((s) => (
        <div
          key={s}
          className="rounded-md border border-stone-200/70 bg-white p-2 text-[7px]"
        >
          <div className="size-2 rounded-sm bg-stone-200 mb-0.5" />
          {s}
        </div>
      ))}
    </div>
  );
}
