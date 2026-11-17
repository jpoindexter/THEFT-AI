// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Issue } from "@paperclipai/shared";
import { TasksMissionHeader } from "./TasksMissionHeader";
import type { FounderTaskBuckets } from "@/lib/issuesPage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function issue(input: Partial<Issue>): Issue {
  return {
    id: input.id ?? "issue-1",
    identifier: input.identifier ?? "THE-1",
    title: input.title ?? "Launch task",
    status: input.status ?? "todo",
    assigneeAgentId: input.assigneeAgentId ?? null,
    updatedAt: input.updatedAt ?? new Date("2026-05-25T08:00:00Z"),
  } as Issue;
}

function renderHeader(props: React.ComponentProps<typeof TasksMissionHeader>) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<TasksMissionHeader {...props} />);
  });

  return { container, root };
}

describe("TasksMissionHeader", () => {
  let root: Root | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";
  });

  it("routes Operator panel quick actions to the supplied prompt handler", () => {
    const onOperatorPrompt = vi.fn();
    const activeIssue = issue({
      id: "blocked",
      identifier: "THE-9",
      title: "Unblock launch page",
      status: "blocked",
    });
    const buckets: FounderTaskBuckets = {
      needsAction: [activeIssue],
      ongoing: [],
      todo: [],
      done: [],
    };
    const rendered = renderHeader({
      buckets,
      isLoading: false,
      issueLinkState: {},
      onOperatorPrompt,
    });
    root = rendered.root;

    const routeButton = Array.from(rendered.container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Route this to a department"));
    act(() => {
      routeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onOperatorPrompt).toHaveBeenCalledWith("route", activeIssue);
  });
});
