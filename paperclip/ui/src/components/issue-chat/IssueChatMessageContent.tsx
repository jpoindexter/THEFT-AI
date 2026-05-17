import type {
  TextMessagePart,
  ThreadMessage,
} from "@assistant-ui/react";
import type { Agent } from "@paperclipai/shared";
import { memo, useContext, useMemo } from "react";
import { AlertTriangle, PauseCircle } from "lucide-react";

import { MarkdownBody } from "../MarkdownBody";
import type { CompanyUserProfile } from "../../lib/company-members";
import {
  isSuccessfulRunHandoffComment,
  isSuccessfulRunHandoffEscalationComment,
} from "../../lib/successful-run-handoff";
import { cn } from "../../lib/utils";
import { IssueChatChainOfThought, type IssueChatCoTPart } from "./ChainOfThoughtParts";
import { IssueChatCtx } from "./IssueChatMessageContext";

export function IssueAssigneePausedNotice({ agent }: { agent: Agent | null }) {
  if (!agent || agent.status !== "paused") return null;

  const pauseDetail =
    agent.pauseReason === "budget"
      ? "It was paused by a budget hard stop."
      : agent.pauseReason === "system"
        ? "It was paused by the system."
        : "It was paused manually.";

  return (
    <div className="mb-3 rounded-md border border-orange-300/70 bg-orange-50/90 px-3 py-2.5 text-sm text-orange-950 shadow-sm dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100">
      <div className="flex items-start gap-2">
        <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-300" />
        <p className="min-w-0 leading-5">
          <span className="font-medium">{agent.name}</span> is paused. New runs will not start until the agent is resumed. {pauseDetail}
        </p>
      </div>
    </div>
  );
}

const IssueChatTextPart = memo(function IssueChatTextPart({ text, recessed }: { text: string; recessed?: boolean }) {
  const { onImageClick } = useContext(IssueChatCtx);
  if (isSuccessfulRunHandoffComment(text)) {
    return <SuccessfulRunHandoffCommentCallout text={text} recessed={recessed} onImageClick={onImageClick} />;
  }
  return (
    <MarkdownBody
      className={cn("text-sm leading-6", recessed && "opacity-60")}
      softBreaks
      onImageClick={onImageClick}
    >
      {text}
    </MarkdownBody>
  );
});

export function SuccessfulRunHandoffCommentCallout({
  text,
  recessed,
  onImageClick,
}: {
  text: string;
  recessed?: boolean;
  onImageClick?: (src: string) => void;
}) {
  const escalated = isSuccessfulRunHandoffEscalationComment(text);
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5 text-sm shadow-sm",
        escalated
          ? "border-red-500/35 bg-red-500/10 text-red-950 dark:text-red-100"
          : "border-amber-300/70 bg-amber-50/90 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
        recessed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={cn(
            "mt-1 h-4 w-4 shrink-0",
            escalated ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300",
          )}
        />
        <MarkdownBody className="min-w-0 text-sm leading-6" softBreaks onImageClick={onImageClick}>
          {text}
        </MarkdownBody>
      </div>
    </div>
  );
}

export function resolveIssueChatHumanAuthor(args: {
  authorName?: string | null;
  authorUserId?: string | null;
  currentUserId?: string | null;
  userProfileMap?: ReadonlyMap<string, CompanyUserProfile> | null;
}) {
  const { authorName, authorUserId, currentUserId, userProfileMap } = args;
  const profile = authorUserId ? userProfileMap?.get(authorUserId) ?? null : null;
  const isCurrentUser = Boolean(authorUserId && currentUserId && authorUserId === currentUserId);
  const resolvedAuthorName = profile?.label?.trim()
    || authorName?.trim()
    || (authorUserId === "local-board" ? "Board" : (isCurrentUser ? "You" : "User"));

  return {
    isCurrentUser,
    authorName: resolvedAuthorName,
    avatarUrl: profile?.image ?? null,
  };
}

export function getThreadMessageCopyText(message: ThreadMessage) {
  return message.content
    .filter((part): part is TextMessagePart => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
}

export const IssueChatTextParts = memo(function IssueChatTextParts({
  message,
  recessed = false,
}: {
  message: ThreadMessage;
  recessed?: boolean;
}) {
  return (
    <>
      {message.content
        .filter((part): part is TextMessagePart => part.type === "text")
        .map((part, index) => (
          <IssueChatTextPart
            key={`${message.id}:text:${index}`}
            text={part.text}
            recessed={recessed}
          />
        ))}
    </>
  );
});

function groupAssistantParts(
  content: readonly ThreadMessage["content"][number][],
): Array<
  | { type: "text"; part: TextMessagePart; index: number }
  | { type: "cot"; parts: IssueChatCoTPart[]; startIndex: number }
> {
  const groups: Array<
    | { type: "text"; part: TextMessagePart; index: number }
    | { type: "cot"; parts: IssueChatCoTPart[]; startIndex: number }
  > = [];
  let pendingCoT: IssueChatCoTPart[] = [];
  let pendingStartIndex = -1;

  const flushCoT = () => {
    if (pendingCoT.length === 0) return;
    groups.push({ type: "cot", parts: pendingCoT, startIndex: pendingStartIndex });
    pendingCoT = [];
    pendingStartIndex = -1;
  };

  content.forEach((part, index) => {
    if (part.type === "reasoning" || part.type === "tool-call") {
      if (pendingCoT.length === 0) pendingStartIndex = index;
      pendingCoT.push(part);
      return;
    }
    flushCoT();
    if (part.type === "text") {
      groups.push({ type: "text", part, index });
    }
  });
  flushCoT();

  return groups;
}

export const IssueChatAssistantParts = memo(function IssueChatAssistantParts({
  message,
  hasCoT,
}: {
  message: ThreadMessage;
  hasCoT: boolean;
}) {
  const { agentMap } = useContext(IssueChatCtx);
  const groupedParts = useMemo(() => groupAssistantParts(message.content), [message.content]);
  return (
    <>
      {groupedParts.map((group) => {
        if (group.type === "text") {
          return (
            <IssueChatTextPart
              key={`${message.id}:text:${group.index}`}
              text={group.part.text}
              recessed={hasCoT}
            />
          );
        }
        return (
          <IssueChatChainOfThought
            key={`${message.id}:cot:${group.startIndex}`}
            message={message}
            cotParts={group.parts}
            agentMap={agentMap}
          />
        );
      })}
    </>
  );
});
