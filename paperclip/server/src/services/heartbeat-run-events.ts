import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import {
  heartbeatRunEvents,
  heartbeatRuns,
} from "@paperclipai/db";
import { publishLiveEvent } from "./live-events.js";
import { boundHeartbeatRunEventPayloadForStorage } from "./heartbeat-run-log.js";
import {
  redactCurrentUserText,
  redactCurrentUserValue,
} from "../log-redaction.js";
import { redactEventPayload } from "../redaction.js";

type CurrentUserRedactionOptions = Awaited<ReturnType<() => Promise<{ enabled: boolean }>>>;

export interface HeartbeatRunEventInput {
  eventType: string;
  stream?: "system" | "stdout" | "stderr";
  level?: "info" | "warn" | "error";
  color?: string;
  message?: string;
  payload?: Record<string, unknown>;
}

export function createHeartbeatRunEventController(input: {
  db: Db;
  detachedProcessErrorCode: string;
  getCurrentUserRedactionOptions: () => Promise<CurrentUserRedactionOptions>;
}) {
  const { db, detachedProcessErrorCode, getCurrentUserRedactionOptions } = input;

  async function appendRunEvent(
    run: typeof heartbeatRuns.$inferSelect,
    seq: number,
    event: HeartbeatRunEventInput,
  ) {
    const currentUserRedactionOptions = await getCurrentUserRedactionOptions();
    const sanitizedMessage = event.message
      ? redactCurrentUserText(event.message, currentUserRedactionOptions)
      : event.message;
    const boundedPayload = event.payload
      ? boundHeartbeatRunEventPayloadForStorage(event.payload)
      : event.payload;
    const secretSanitizedPayload = boundedPayload ? redactEventPayload(boundedPayload) : boundedPayload;
    const sanitizedPayload = secretSanitizedPayload
      ? redactCurrentUserValue(secretSanitizedPayload, currentUserRedactionOptions)
      : secretSanitizedPayload;

    await db.insert(heartbeatRunEvents).values({
      companyId: run.companyId,
      runId: run.id,
      agentId: run.agentId,
      seq,
      eventType: event.eventType,
      stream: event.stream,
      level: event.level,
      color: event.color,
      message: sanitizedMessage,
      payload: sanitizedPayload,
    });

    publishLiveEvent({
      companyId: run.companyId,
      type: "heartbeat.run.event",
      payload: {
        runId: run.id,
        agentId: run.agentId,
        seq,
        eventType: event.eventType,
        stream: event.stream ?? null,
        level: event.level ?? null,
        color: event.color ?? null,
        message: sanitizedMessage ?? null,
        payload: sanitizedPayload ?? null,
      },
    });
  }

  async function nextRunEventSeq(runId: string) {
    const [row] = await db
      .select({ maxSeq: sql<number | null>`max(${heartbeatRunEvents.seq})` })
      .from(heartbeatRunEvents)
      .where(eq(heartbeatRunEvents.runId, runId));
    return Number(row?.maxSeq ?? 0) + 1;
  }

  async function persistRunProcessMetadata(
    runId: string,
    meta: { pid: number; processGroupId: number | null; startedAt: string },
  ) {
    const startedAt = new Date(meta.startedAt);
    return db
      .update(heartbeatRuns)
      .set({
        processPid: meta.pid,
        processGroupId: meta.processGroupId,
        processStartedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
        updatedAt: new Date(),
      })
      .where(eq(heartbeatRuns.id, runId))
      .returning()
      .then((rows) => rows[0] ?? null);
  }

  async function clearDetachedRunWarning(runId: string) {
    const updated = await db
      .update(heartbeatRuns)
      .set({
        error: null,
        errorCode: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(heartbeatRuns.id, runId),
          eq(heartbeatRuns.status, "running"),
          eq(heartbeatRuns.errorCode, detachedProcessErrorCode),
        ),
      )
      .returning()
      .then((rows) => rows[0] ?? null);
    if (!updated) return null;

    await appendRunEvent(updated, await nextRunEventSeq(updated.id), {
      eventType: "lifecycle",
      stream: "system",
      level: "info",
      message: "Detached child process reported activity; cleared detached warning",
    });
    return updated;
  }

  return {
    appendRunEvent,
    nextRunEventSeq,
    persistRunProcessMetadata,
    clearDetachedRunWarning,
  };
}
