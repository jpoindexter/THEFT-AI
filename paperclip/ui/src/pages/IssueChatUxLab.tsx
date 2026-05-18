import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IssueChatThread } from "../components/IssueChatThread";
import {
  issueChatUxAgentMap,
  issueChatUxFeedbackVotes,
  issueChatUxLinkedRuns,
  issueChatUxLiveComments,
  issueChatUxLiveEvents,
  issueChatUxLiveRuns,
  issueChatUxMentions,
  issueChatUxReassignOptions,
  issueChatUxReviewComments,
  issueChatUxReviewEvents,
  issueChatUxSubmittingComments,
  issueChatUxTranscriptsByRunId,
} from "../fixtures/issueChatUxFixtures";
import { Bot, FlaskConical, Loader2, MessagesSquare, Route, Sparkles, WandSparkles } from "lucide-react";
import { LabSection, RotatingReasoningDemo } from "./issue-chat-ux-lab/IssueChatUxLabParts";

const noop = async () => {};

const highlights = [
  "Running assistant replies with streamed text, reasoning, tool cards, and background status notes",
  "Historical issue events and linked runs rendered inline with the chat timeline",
  "Queued user messages, settled assistant comments, and feedback controls",
  "Submitting (pending) message bubble with Sending... label and reduced opacity",
  "Empty and disabled-composer states without relying on live backend data",
];

export function IssueChatUxLab() {
  const [showComposer, setShowComposer] = useState(true);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/30">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="p-6 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border  px-3 py-1 theft-label-nano font-semibold text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" />
              Chat UX Lab
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Issue chat review surface</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              This page exercises the real assistant-ui issue chat with fixture-backed messages. Use it to review
              spacing, chronology, running states, tool rendering, activity rows, queueing, and composer behavior
              without needing a live issue in progress.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-nano">
                /tests/ux/chat
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-nano">
                assistant-ui thread
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 theft-label-nano">
                fixture-backed live run
              </Badge>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowComposer((value) => !value)}>
                {showComposer ? "Hide composer in primary preview" : "Show composer in primary preview"}
              </Button>
              <a
                href="#live-execution"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Route className="h-3.5 w-3.5" />
                Jump to live execution preview
              </a>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-background/70 p-6 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center gap-2 theft-label-compact font-semibold text-muted-foreground">
              <WandSparkles className="h-4 w-4 text-muted-foreground" />
              Covered states
            </div>
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <LabSection
        id="rotating-text"
        eyebrow="Animation demo"
        title="Rotating reasoning text"
        description="Isolated ticker that cycles sample reasoning lines on a timer. The outgoing line slides up and fades out while the incoming line slides up from below. Runs in a loop so you can tune timing and easing without needing a live stream."
        accentClassName="bg-background"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-2 theft-label-nano font-semibold text-muted-foreground">
              Default interval (2.2s)
            </div>
            <RotatingReasoningDemo />
          </div>
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-2 theft-label-nano font-semibold text-muted-foreground">
              Fast interval (1s) — stress test
            </div>
            <RotatingReasoningDemo intervalMs={1000} />
          </div>
        </div>
      </LabSection>

      <LabSection
        id="working-tokens"
        eyebrow="Status tokens"
        title="Working / Worked header verb"
        description='The "Working" token uses the shimmer-text gradient sweep to signal an active run. Once the run completes it becomes the static "Worked" token.'
        accentClassName="bg-background"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-3 theft-label-nano font-semibold text-muted-foreground">
              Active run — shimmer
            </div>
            <div className="flex items-center gap-2.5 rounded-lg px-1 py-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                <span className="shimmer-text">Working</span>
              </span>
              <span className="text-xs text-muted-foreground/60">for 12s</span>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-3 theft-label-nano font-semibold text-muted-foreground">
              Completed run — static
            </div>
            <div className="flex items-center gap-2.5 rounded-lg px-1 py-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
                </span>
                Worked
              </span>
              <span className="text-xs text-muted-foreground/60">for 1 min 24s</span>
            </div>
          </div>
        </div>
      </LabSection>

      <LabSection
        id="live-execution"
        eyebrow="Primary preview"
        title="Live execution thread"
        description="Shows the fully active state: timeline events, historical run marker, a running assistant reply with reasoning and tools, and a queued follow-up from the user."
        accentClassName="bg-background"
      >
        <IssueChatThread
          comments={issueChatUxLiveComments}
          linkedRuns={issueChatUxLinkedRuns.slice(0, 1)}
          timelineEvents={issueChatUxLiveEvents}
          liveRuns={issueChatUxLiveRuns}
          issueStatus="todo"
          agentMap={issueChatUxAgentMap}
          currentUserId="user-1"
          onAdd={noop}
          onVote={noop}
          onCancelRun={noop}
          onInterruptQueued={noop}
          draftKey="issue-chat-ux-lab-primary"
          enableReassign
          reassignOptions={issueChatUxReassignOptions}
          currentAssigneeValue="agent:agent-1"
          suggestedAssigneeValue="agent:agent-2"
          mentions={issueChatUxMentions}
          showComposer={showComposer}
          enableLiveTranscriptPolling={false}
          transcriptsByRunId={issueChatUxTranscriptsByRunId}
          hasOutputForRun={(runId) => issueChatUxTranscriptsByRunId.has(runId)}
        />
      </LabSection>

      <LabSection
        eyebrow="Submitting state"
        title="Pending message bubble"
        description='When a user sends a message, the bubble briefly shows a "Sending..." label at reduced opacity until the server confirms receipt. This preview renders that transient state.'
        accentClassName="bg-background"
      >
        <IssueChatThread
          comments={issueChatUxSubmittingComments}
          linkedRuns={[]}
          timelineEvents={[]}
          issueStatus="in_progress"
          agentMap={issueChatUxAgentMap}
          currentUserId="user-1"
          onAdd={noop}
          draftKey="issue-chat-ux-lab-submitting"
          showComposer={false}
          enableLiveTranscriptPolling={false}
        />
      </LabSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <LabSection
          eyebrow="Settled review"
          title="Durable comments and feedback"
          description="Shows the post-run state: assistant comment feedback controls, historical run context, and timeline reassignment without any active stream."
          accentClassName="bg-background"
        >
          <IssueChatThread
            comments={issueChatUxReviewComments}
            linkedRuns={issueChatUxLinkedRuns.slice(1)}
            timelineEvents={issueChatUxReviewEvents}
            feedbackVotes={issueChatUxFeedbackVotes}
            feedbackTermsUrl="/feedback-terms"
            issueStatus="in_review"
            agentMap={issueChatUxAgentMap}
            currentUserId="user-1"
            onAdd={noop}
            onVote={noop}
            draftKey="issue-chat-ux-lab-review"
            showComposer={false}
            enableLiveTranscriptPolling={false}
          />
        </LabSection>

        <div className="space-y-6">
          <LabSection
            eyebrow="Empty thread"
            title="Empty state and disabled composer"
            description="Keeps the message area visible even when there is no thread yet, and replaces the composer with an explicit warning when replies are blocked."
            accentClassName="bg-background"
          >
            <IssueChatThread
              comments={[]}
              linkedRuns={[]}
              timelineEvents={[]}
              issueStatus="done"
              agentMap={issueChatUxAgentMap}
              currentUserId="user-1"
              onAdd={noop}
              composerDisabledReason="This workspace is closed, so new chat replies are disabled until the issue is reopened."
              draftKey="issue-chat-ux-lab-empty"
              enableLiveTranscriptPolling={false}
            />
          </LabSection>

          <Card className="gap-4 border-border/70 bg-background/85 py-0">
            <CardHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center gap-2 theft-label-compact font-semibold text-muted-foreground">
                <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                Review checklist
              </div>
              <CardTitle className="text-lg">What to evaluate on this page</CardTitle>
              <CardDescription>
                This route should be the fastest way to inspect the chat system before or after tweaks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5 pt-0 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  Message hierarchy
                </div>
                Check that user, assistant, and system rows scan differently without feeling like separate products.
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Stream polish
                </div>
                Watch the live preview for reasoning density, tool expansion behavior, and queued follow-up readability.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
