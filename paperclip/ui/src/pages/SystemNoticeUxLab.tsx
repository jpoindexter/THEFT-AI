import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SystemNotice } from "@/components/SystemNotice";
import { systemNoticeFixtures } from "@/fixtures/systemNoticeFixtures";
import { FlaskConical, Layers, ListChecks, Sparkles } from "lucide-react";
import { FixtureFrame, LabSection, MockAgentBubble, MockUserBubble } from "./system-notice-ux-lab/SystemNoticeUxLabParts";

const checklist = [
  "One container per system notice — no nested chat bubble",
  "Tone communicated by icon + label, never color alone",
  "Operational evidence hidden behind Details, expanded only on demand",
  "Issue, agent, and run metadata render as typed link rows, not raw markdown",
  "Hierarchy visibly distinct from user (right-aligned) and agent (left-aligned) bubbles",
];

export function SystemNoticeUxLab() {
  const fixtureById = new Map(systemNoticeFixtures.map((f) => [f.id, f] as const));

  const warningCollapsed = fixtureById.get("warning-collapsed")!;
  const warningExpanded = fixtureById.get("warning-expanded")!;
  const dangerCollapsed = fixtureById.get("danger-collapsed")!;
  const dangerExpanded = fixtureById.get("danger-expanded")!;
  const neutralCollapsed = fixtureById.get("neutral-collapsed")!;
  const neutralExpanded = fixtureById.get("neutral-expanded")!;
  const warningNoDetails = fixtureById.get("warning-no-details")!;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/30">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="p-6 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border  px-3 py-1 theft-label-nano font-semibold text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" />
              System Notice Lab
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              First-class system notice treatment
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Replaces the current pattern where a Paperclip-authored warning renders inside a user-style
              chat bubble. The notice is one container, system-styled, with hidden-by-default operational
              metadata. Tone is conveyed by icon, label, and color together so it stays accessible.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-nano">
                PAP-3525 plan
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-nano">
                phase 1 — UX
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-nano">
                tones: warning · danger · neutral
              </Badge>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-background/70 p-6 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center gap-2 theft-label-compact font-semibold text-muted-foreground">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              What this lab proves
            </div>
            <div className="space-y-3">
              {checklist.map((line) => (
                <div
                  key={line}
                  className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
                >
                  {line}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <LabSection
        id="tones"
        eyebrow="Tone matrix"
        title="Three tones, two states"
        description="Each tone pairs a unique icon and tone label so the notice is recognizable without color. Collapsed is the default; the Details affordance reveals operational metadata only when reviewers ask for it."
        accentClassName="bg-background"
      >
        <div className="space-y-5">
          <FixtureFrame caption={warningCollapsed.caption}>
            <SystemNotice {...warningCollapsed} />
          </FixtureFrame>
          <FixtureFrame caption={warningExpanded.caption}>
            <SystemNotice {...warningExpanded} />
          </FixtureFrame>
          <FixtureFrame caption={dangerCollapsed.caption}>
            <SystemNotice {...dangerCollapsed} />
          </FixtureFrame>
          <FixtureFrame caption={dangerExpanded.caption}>
            <SystemNotice {...dangerExpanded} />
          </FixtureFrame>
          <FixtureFrame caption={neutralCollapsed.caption}>
            <SystemNotice {...neutralCollapsed} />
          </FixtureFrame>
          <FixtureFrame caption={neutralExpanded.caption}>
            <SystemNotice {...neutralExpanded} />
          </FixtureFrame>
          <FixtureFrame caption={warningNoDetails.caption}>
            <SystemNotice {...warningNoDetails} />
          </FixtureFrame>
        </div>
      </LabSection>

      <LabSection
        id="hierarchy"
        eyebrow="Hierarchy in thread"
        title="Distinct from user and agent comments"
        description="Side-by-side with adjacent comment types so reviewers can confirm the system row reads as a system row — full width, no avatar gutter, no chat bubble — while user and agent comments keep their existing rounded bubbles."
        accentClassName="bg-background"
      >
        <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
          <MockUserBubble
            authorName="Riley Board"
            body="Why does this issue keep waking back up without a clear next step?"
            alignEnd
          />
          <MockAgentBubble
            agentName="CodexCoder"
            body="The previous run completed without picking a disposition. I'll wait for the new system notice to surface so the recovery owner is unambiguous."
          />
          <SystemNotice
            tone="danger"
            label="System alert"
            source={{ label: "Paperclip", href: "/PAP/agents" }}
            timestamp="2026-05-04T16:48:00.000Z"
            body="Paperclip could not resolve this issue's missing disposition automatically. The issue is blocked on a recovery owner."
            metadata={[
              {
                title: "Recovery owner",
                rows: [
                  {
                    kind: "issue",
                    label: "Recovery issue",
                    identifier: "PAP-3440",
                    href: "/PAP/issues/PAP-3440",
                    title: "Successful run handoff missing disposition",
                  },
                  {
                    kind: "agent",
                    label: "Owner",
                    name: "CTO",
                    href: "/PAP/agents/cto",
                  },
                ],
              },
              {
                title: "Run evidence",
                rows: [
                  {
                    kind: "run",
                    label: "Source run",
                    runId: "9cdba892-c7ca-4d93-8604-4843873b127c",
                    href: "/PAP/agents/codexcoder/runs/9cdba892-c7ca-4d93-8604-4843873b127c",
                    status: "succeeded",
                  },
                ],
              },
            ]}
          />
          <MockUserBubble
            authorName="Riley Board"
            body="Thanks — assigning the recovery owner now."
            alignEnd
          />
        </div>
      </LabSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <LabSection
          eyebrow="Before"
          title="Today's nested treatment"
          description="The same content rendered through the existing user-bubble + warning-callout path. Two containers, same gray background as user comments, and the warning icon is forced inside a chat row."
          accentClassName="bg-background"
        >
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-start gap-2.5">
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 max-w-xl flex-col">
                <div className="mb-1 px-1 text-sm font-medium text-foreground">You</div>
                <div className="min-w-0 max-w-full rounded-2xl bg-muted px-4 py-2.5 text-sm leading-6 text-foreground">
                  <div className="rounded-md border border-red-500/35 bg-red-500/10 px-3 py-2.5 text-sm text-red-950 dark:text-red-100">
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-1 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
                      <div className="min-w-0">
                        <p className="m-0 font-semibold">Successful run handoff missing</p>
                        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm leading-5">
                          <li>Source issue: PAP-3440</li>
                          <li>Source run: 9cdba892-c7ca-4d93-8604-4843873b127c</li>
                          <li>Recovery run: 61fdb79b-8012-4676-ac71-2971830e126a</li>
                          <li>Status before: in_progress</li>
                          <li>Normalized cause: Run completed without disposition</li>
                          <li>Recovery owner: CTO</li>
                          <li>Suggested action: Reassign to recovery agent</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="px-1 text-xs text-muted-foreground">
              Author reads as <span className="font-medium text-foreground">You</span> even though the
              author is the Paperclip system. Two containers stack the warning inside a user-style
              bubble, and operational evidence is always visible.
            </p>
          </div>
        </LabSection>

        <LabSection
          eyebrow="After"
          title="System notice replacement"
          description="One container, system-authored label, hidden details. The chat surface keeps user and agent bubbles unchanged."
          accentClassName="bg-background"
        >
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
            <SystemNotice {...dangerCollapsed} />
            <p className="px-1 text-xs text-muted-foreground">
              Same content. The visible body is one short system sentence; reviewers expand{" "}
              <span className="font-medium text-foreground">Details</span> only when they need run
              evidence. Tone is reinforced by the octagon icon and the &quot;System alert&quot; label,
              not just red.
            </p>
          </div>
        </LabSection>
      </div>

      <Card className="gap-4 border-border/70 bg-background/85 py-0">
        <CardHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 theft-label-compact font-semibold text-muted-foreground">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Implementation notes
          </div>
          <CardTitle className="text-lg">Handoff to engineering</CardTitle>
          <CardDescription>
            What the Phase 4 UI implementation should preserve from this design.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5 pt-0 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">Component</div>
            Use <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{`<SystemNotice />`}</code>{" "}
            from <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">@/components/SystemNotice</code>.
            It accepts <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">tone</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">label</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">body</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">metadata</code>, and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">detailsDefaultOpen</code>.
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">Routing in IssueChatThread</div>
            Comments where{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">authorType === &quot;system&quot;</code>{" "}
            or{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">presentation.kind === &quot;system_notice&quot;</code>{" "}
            should render as a SystemNotice row at full content width — never inside an{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">IssueChatUserMessage</code>{" "}
            or assistant bubble.
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">Accessibility</div>
            The Details button has{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">aria-expanded</code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">aria-controls</code>{" "}
            wired to the panel id. The container exposes{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">role=&quot;status&quot;</code>{" "}
            and an{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">aria-label</code>{" "}
            equal to the visible tone label so screen readers announce tone with text.
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">Legacy fallback</div>
            Existing comments without{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">presentation</code>{" "}
            keep rendering through the current{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">SuccessfulRunHandoffCommentCallout</code>{" "}
            string-detector. The new contract is opt-in for the system generators in Phase 5.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
