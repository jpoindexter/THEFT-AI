import Link from "next/link";
import { Home } from "lucide-react";

const RELEASES = [
  {
    version: "v1.0.1",
    date: "May 7, 2026",
    sections: [
      {
        title: "More Reliable Infrastructure",
        body: "Cofounder now handles local development, previews, and longer-running agent work more reliably, with fewer interruptions during active tasks.",
      },
      {
        title: "Stronger Coding Agents",
        body: "Coding agents are better at understanding the repo, making code changes, following existing patterns, and verifying work before handing it back.",
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "May 4, 2026",
    sections: [
      {
        title: "Cofounder 2: Run an Entire Company with Agents",
        body: "Announcing Cofounder 2: The infrastructure for the one-person billion-dollar company — orchestrating agents across engineering, sales, marketing, ops, and design.",
      },
      {
        title: "Agents on an Org Chart",
        body: "Cofounder puts your agents on an org chart, enabling massive parallel work. Each agent gets a specialized workspace tailored to its function. At the highest level, Cofounder manages it all — kicking off tasks, monitoring work, and executing long-term strategy.",
      },
      {
        title: "A Roadmap for the Whole Company",
        body: "There's a ton to do when starting a business, so we took inspiration from RTS games like Civ and built in a roadmap of an entire company. Kick off the next step while maintaining full business context.",
      },
      {
        title: "Departments That Actually Run",
        body: "Cofounder orchestrates departments like marketing, sales, and engineering. Watch the sales department prospect for leads, the marketing team draft and distribute content, and engineering ship features — all in parallel.",
      },
    ],
  },
  {
    version: "v0.9.2",
    date: "May 2, 2026",
    sections: [
      {
        title: "Plan Mode",
        body: "Turn on plan mode by clicking the plus icon in the input box. The agent will create a structured plan before executing — letting you review and adjust the approach before any work starts.",
      },
    ],
  },
];

export default async function ReleaseNotesPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="flex">
        {/* Left sidebar */}
        <div className="w-14 shrink-0 flex flex-col items-center pt-4 gap-6">
          <Link
            href={`/${org}/canvas`}
            className="size-8 rounded-md flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href={`/${org}/canvas`}
            className="size-8 rounded-md flex items-center justify-center text-white/40 hover:text-white/70 transition-colors mt-auto mb-4"
            aria-label="Home"
          >
            <Home className="size-4" />
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-8 max-w-2xl">
          <h1 className="text-2xl font-semibold text-white mb-8">Release Notes</h1>

          <div className="space-y-12">
            {RELEASES.map((release) => (
              <div key={release.version}>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-xl font-semibold text-white">{release.version}</span>
                  <span className="text-sm text-white/40">{release.date}</span>
                </div>
                <div className="space-y-0">
                  {release.sections.map((section, i) => (
                    <div key={i}>
                      <div className="py-4">
                        <h3 className="text-sm font-semibold text-white mb-1.5">{section.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed">{section.body}</p>
                      </div>
                      {i < release.sections.length - 1 && (
                        <div className="border-t border-white/10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
