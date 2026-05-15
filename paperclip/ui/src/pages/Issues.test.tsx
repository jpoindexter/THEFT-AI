import { describe, expect, it } from "vitest";
import type { Issue } from "@paperclipai/shared";
import {
  buildFounderTaskBuckets,
  buildIssuesSearchUrl,
  getNextIssuesPageOffset,
  mergeIssuePagesStable,
  needsFounderAction,
} from "./Issues";

function createIssue(id: string, title: string, overrides: Partial<Issue> = {}): Issue {
  return {
    id,
    title,
    status: "todo",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  } as Issue;
}

describe("buildIssuesSearchUrl", () => {
  it("preserves trailing spaces in the synced search param", () => {
    expect(buildIssuesSearchUrl("http://localhost:3100/issues?q=bug", "bug ")).toBe("/issues?q=bug+");
  });

  it("removes the search param when the input is cleared", () => {
    expect(buildIssuesSearchUrl("http://localhost:3100/issues?q=bug#details", "")).toBe("/issues#details");
  });

  it("returns null when the URL already matches the current search", () => {
    expect(buildIssuesSearchUrl("http://localhost:3100/issues?q=bug+", "bug ")).toBeNull();
  });
});

describe("issues page pagination helpers", () => {
  it("advances to the next offset when the current page is full", () => {
    expect(getNextIssuesPageOffset(500, 0)).toBe(500);
    expect(getNextIssuesPageOffset(500, 500)).toBe(1000);
    expect(getNextIssuesPageOffset(1000, 2000, 1000)).toBe(3000);
  });

  it("stops requesting issue pages when the current page is partial", () => {
    expect(getNextIssuesPageOffset(499, 0)).toBeUndefined();
    expect(getNextIssuesPageOffset(999, 2000, 1000)).toBeUndefined();
  });

  it("dedupes overlapping pages without moving the original issue position", () => {
    const first = createIssue("issue-1", "Original first");
    const second = createIssue("issue-2", "Second");
    const duplicateFirst = createIssue("issue-1", "Duplicate first");
    const third = createIssue("issue-3", "Third");

    expect(mergeIssuePagesStable([[first, second], [duplicateFirst, third]])).toEqual([
      first,
      second,
      third,
    ]);
  });
});

describe("founder task buckets", () => {
  it("treats blocked, reviewable, stalled, and handoff-required work as founder action", () => {
    expect(needsFounderAction(createIssue("blocked", "Blocked", { status: "blocked" }))).toBe(true);
    expect(needsFounderAction(createIssue("review", "Review", { status: "in_review" }))).toBe(true);
    expect(needsFounderAction(createIssue("handoff", "Handoff", { successfulRunHandoff: { required: true } as Issue["successfulRunHandoff"] }))).toBe(true);
    expect(needsFounderAction(createIssue("attention", "Attention", {
      blockerAttention: { state: "needs_attention" } as Issue["blockerAttention"],
    }))).toBe(true);
    expect(needsFounderAction(createIssue("stalled", "Stalled", {
      blockerAttention: { state: "stalled" } as Issue["blockerAttention"],
    }))).toBe(true);
    expect(needsFounderAction(createIssue("progress", "Progress", { status: "in_progress" }))).toBe(false);
  });

  it("sorts founder buckets by newest activity while preserving queue meaning", () => {
    const olderBlocked = createIssue("blocked-old", "Older blocked", {
      status: "blocked",
      updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    });
    const newerReview = createIssue("review-new", "Newer review", {
      status: "in_review",
      updatedAt: new Date("2026-05-03T00:00:00.000Z"),
    });
    const ongoing = createIssue("ongoing", "Ongoing", { status: "in_progress" });
    const todo = createIssue("todo", "Todo", { status: "todo" });
    const done = createIssue("done", "Done", { status: "done" });

    const buckets = buildFounderTaskBuckets([olderBlocked, ongoing, done, newerReview, todo]);

    expect(buckets.needsAction.map((issue) => issue.id)).toEqual(["review-new", "blocked-old"]);
    expect(buckets.ongoing.map((issue) => issue.id)).toEqual(["ongoing"]);
    expect(buckets.todo.map((issue) => issue.id)).toEqual(["todo"]);
    expect(buckets.done.map((issue) => issue.id)).toEqual(["done"]);
  });
});
