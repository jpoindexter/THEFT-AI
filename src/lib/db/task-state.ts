import { promises as fs } from "node:fs";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import type { AgentTurn } from "@/lib/agent/run";

const DATA_DIR =
  process.env.THEFT_DATA_DIR ?? path.join(process.cwd(), ".theft-data");

export type TaskRunState = {
  task_id: string;
  history: Anthropic.Messages.MessageParam[];
  turns: AgentTurn[];
  paused: TaskPauseState | null;
};

export type TaskPauseState = {
  tool_use_id: string;
  tool: "ask_user_question";
  input: unknown;
};

const file = (taskId: string) =>
  path.join(DATA_DIR, "task-state", `${taskId}.json`);

export async function loadTaskState(taskId: string): Promise<TaskRunState> {
  try {
    const raw = await fs.readFile(file(taskId), "utf8");
    return JSON.parse(raw) as TaskRunState;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { task_id: taskId, history: [], turns: [], paused: null };
    }
    throw e;
  }
}

export async function saveTaskState(state: TaskRunState): Promise<void> {
  await fs.mkdir(path.dirname(file(state.task_id)), { recursive: true });
  await fs.writeFile(file(state.task_id), JSON.stringify(state, null, 2));
}
