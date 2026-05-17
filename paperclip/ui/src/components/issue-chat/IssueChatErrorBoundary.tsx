import type { ThreadMessage } from "@assistant-ui/react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { MarkdownBody } from "@/components/MarkdownBody";
import { timeAgo } from "@/lib/timeAgo";
import { cn, formatShortDate } from "@/lib/utils";

type IssueChatErrorBoundaryProps = {
  resetKey: string;
  messages: readonly ThreadMessage[];
  emptyMessage: string;
  variant: "full" | "embedded";
  children: ReactNode;
};

type IssueChatErrorBoundaryState = {
  hasError: boolean;
};

export class IssueChatErrorBoundary extends Component<
  IssueChatErrorBoundaryProps,
  IssueChatErrorBoundaryState
> {
  override state: IssueChatErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): IssueChatErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Issue chat renderer failed; falling back to safe transcript view", {
      error,
      info: info.componentStack,
    });
  }

  override componentDidUpdate(prevProps: IssueChatErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <IssueChatFallbackThread
          messages={this.props.messages}
          emptyMessage={this.props.emptyMessage}
          variant={this.props.variant}
        />
      );
    }
    return this.props.children;
  }
}

function fallbackAuthorLabel(message: ThreadMessage) {
  const custom = message.metadata?.custom as Record<string, unknown> | undefined;
  if (typeof custom?.["authorName"] === "string") return custom["authorName"];
  if (typeof custom?.["runAgentName"] === "string") return custom["runAgentName"];
  if (message.role === "assistant") return "Agent";
  if (message.role === "user") return "You";
  return "System";
}

function fallbackTextParts(message: ThreadMessage) {
  const contentLines: string[] = [];
  for (const part of message.content) {
    if (part.type === "text" || part.type === "reasoning") {
      if (part.text.trim().length > 0) contentLines.push(part.text);
      continue;
    }
    if (part.type === "tool-call") {
      const lines = [`Tool: ${part.toolName}`];
      if (part.argsText?.trim()) lines.push(`Args:\n${part.argsText}`);
      if (typeof part.result === "string" && part.result.trim()) lines.push(`Result:\n${part.result}`);
      contentLines.push(lines.join("\n\n"));
    }
  }

  const custom = message.metadata?.custom as Record<string, unknown> | undefined;
  if (contentLines.length === 0 && typeof custom?.["waitingText"] === "string" && custom["waitingText"].trim()) {
    contentLines.push(custom["waitingText"]);
  }
  return contentLines;
}

function IssueChatFallbackThread({
  messages,
  emptyMessage,
  variant,
}: {
  messages: readonly ThreadMessage[];
  emptyMessage: string;
  variant: "full" | "embedded";
}) {
  return (
    <div className={cn(variant === "embedded" ? "space-y-3" : "space-y-4")}>
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Chat renderer hit an internal state error.</p>
            <p className="text-xs opacity-80">
              Showing a safe fallback transcript instead of crashing the issues page.
            </p>
          </div>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className={cn(
          "text-center text-sm text-muted-foreground",
          variant === "embedded"
            ? "rounded-xl border border-dashed border-border/70 bg-background/60 px-4 py-6"
            : "rounded-2xl border border-dashed border-border bg-card px-6 py-10",
        )}>
          {emptyMessage}
        </div>
      ) : (
        <div className={cn(variant === "embedded" ? "space-y-3" : "space-y-4")}>
          {messages.map((message) => {
            const lines = fallbackTextParts(message);
            return (
              <div key={message.id} className="rounded-xl border border-border/60 bg-card/70 px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{fallbackAuthorLabel(message)}</span>
                  {message.createdAt ? (
                    <span className="text-micro text-muted-foreground">
                      {commentDateLabel(message.createdAt)}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {lines.length > 0 ? lines.map((line, index) => (
                    <MarkdownBody key={`${message.id}:fallback:${index}`}>{line}</MarkdownBody>
                  )) : (
                    <p className="text-sm text-muted-foreground">No message content.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function commentDateLabel(date: Date | string | undefined): string {
  if (!date) return "";
  const then = new Date(date).getTime();
  if (Date.now() - then < WEEK_MS) return timeAgo(date);
  return formatShortDate(date);
}
