export type TranscriptMode = "nice" | "raw";
export type TranscriptDensity = "comfortable" | "compact";

export type TranscriptBlock =
  | {
      type: "message";
      role: "assistant" | "user";
      ts: string;
      text: string;
      streaming: boolean;
    }
  | {
      type: "thinking";
      ts: string;
      text: string;
      streaming: boolean;
    }
  | {
      type: "tool";
      ts: string;
      endTs?: string;
      name: string;
      toolUseId?: string;
      input: unknown;
      result?: string;
      isError?: boolean;
      status: "running" | "completed" | "error";
    }
  | {
      type: "activity";
      ts: string;
      activityId?: string;
      name: string;
      status: "running" | "completed";
    }
  | {
      type: "command_group";
      ts: string;
      endTs?: string;
      items: Array<{
        ts: string;
        endTs?: string;
        input: unknown;
        result?: string;
        isError?: boolean;
        status: "running" | "completed" | "error";
      }>;
    }
  | {
      type: "tool_group";
      ts: string;
      endTs?: string;
      items: Array<{
        ts: string;
        endTs?: string;
        name: string;
        input: unknown;
        result?: string;
        isError?: boolean;
        status: "running" | "completed" | "error";
      }>;
    }
  | {
      type: "stderr_group";
      ts: string;
      endTs?: string;
      lines: Array<{ ts: string; text: string }>;
    }
  | {
      type: "system_group";
      ts: string;
      endTs?: string;
      lines: Array<{ ts: string; text: string }>;
    }
  | {
      type: "stdout";
      ts: string;
      text: string;
    }
  | {
      type: "event";
      ts: string;
      label: string;
      tone: "info" | "warn" | "error" | "neutral";
      text: string;
      detail?: string;
    }
  | {
      type: "diff_group";
      ts: string;
      endTs?: string;
      filePath?: string;
      hunks: Array<{
        changeType: "add" | "remove" | "context" | "hunk" | "file_header" | "truncation";
        text: string;
      }>;
    };
