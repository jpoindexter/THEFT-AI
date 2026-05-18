import type { ThreadMessage } from "@assistant-ui/react";
import type { StableThreadMessageCacheEntry } from "./types";
import { fingerprintThreadMessage } from "./timing";

export function stabilizeThreadMessages(
  messages: readonly ThreadMessage[],
  previousMessages: readonly ThreadMessage[],
  previousById: ReadonlyMap<string, StableThreadMessageCacheEntry>,
) {
  const nextById = new Map<string, StableThreadMessageCacheEntry>();
  let sameSequence = previousMessages.length === messages.length;

  const stabilizedMessages = messages.map((message, index) => {
    const fingerprint = fingerprintThreadMessage(message);
    const cached = previousById.get(message.id);
    const stableMessage =
      cached && cached.fingerprint === fingerprint
        ? cached.message
        : message;
    nextById.set(message.id, {
      fingerprint,
      message: stableMessage,
    });
    if (sameSequence && previousMessages[index] !== stableMessage) {
      sameSequence = false;
    }
    return stableMessage;
  });

  return {
    messages: sameSequence ? previousMessages : stabilizedMessages,
    cache: nextById,
  };
}
