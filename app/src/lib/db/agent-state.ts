// Persisted Cofounder agent conversation state per org.
// Stores the full Anthropic message history + a flat list of UI turns so we
// can replay the conversation without re-running the LLM.

import { promises as fs } from "node:fs";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import type { AgentTurn } from "@/lib/agent/run";

const DATA_DIR =
  process.env.THEFT_DATA_DIR ?? path.join(process.cwd(), ".theft-data");

export type AgentState = {
  organization_id: string;
  history: Anthropic.Messages.MessageParam[];
  turns: AgentTurn[];
  paused: PauseState | null;
};

export type PauseState = {
  tool_use_id: string;
  tool: "ask_user_question";
  input: unknown;
};

const file = (orgId: string) =>
  path.join(DATA_DIR, "agent-state", `${orgId}.json`);

export async function loadAgentState(orgId: string): Promise<AgentState> {
  try {
    const raw = await fs.readFile(file(orgId), "utf8");
    return JSON.parse(raw) as AgentState;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { organization_id: orgId, history: [], turns: [], paused: null };
    }
    throw e;
  }
}

export async function saveAgentState(state: AgentState): Promise<void> {
  await fs.mkdir(path.dirname(file(state.organization_id)), {
    recursive: true,
  });
  await fs.writeFile(file(state.organization_id), JSON.stringify(state, null, 2));
}

export async function resetAgentState(orgId: string): Promise<void> {
  try {
    await fs.unlink(file(orgId));
  } catch {
    /* ignore */
  }
}
