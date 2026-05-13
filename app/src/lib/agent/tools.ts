// Tools the Operator agent can call. Each tool has:
//   - server-only execution (mutates the org state) OR
//   - client-pause (e.g. ask_user_question — server returns and waits)
//
// All tool definitions are JSON-Schema Anthropic tool-use objects.

import type Anthropic from "@anthropic-ai/sdk";

export type OperatorTool = Anthropic.Tool;

export const OPERATOR_TOOLS: OperatorTool[] = [
  {
    name: "ask_user_question",
    description:
      "Pause and ask the user a multiple-choice question. Use this whenever you need a decision from the user. The user will answer and the conversation resumes. Provide 3-5 options, mark exactly one as recommended, and write a one-sentence description for each.",
    input_schema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question to ask the user.",
        },
        options: {
          type: "array",
          description: "Multiple-choice options.",
          items: {
            type: "object",
            properties: {
              key: { type: "string", description: "kebab-case identifier" },
              label: { type: "string" },
              description: { type: "string" },
              recommended: { type: "boolean" },
            },
            required: ["key", "label"],
          },
        },
        allow_custom: {
          type: "boolean",
          description: "Allow user to type a freeform answer.",
        },
      },
      required: ["question", "options"],
    },
  },
  {
    name: "set_business_plan",
    description:
      "Save the structured business plan for this company. Call this after enough questions are answered. Once called, the workspace activates departments and the founder can move on.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string" },
        icp: { type: "string" },
        business_model: { type: "string" },
        mission: { type: "string" },
        differentiator: { type: "string" },
        go_to_market: { type: "string" },
      },
      required: ["product", "icp"],
    },
  },
  {
    name: "delegate_to_department",
    description:
      "Hand off a task to a department agent. The task will appear in that department's queue.",
    input_schema: {
      type: "object",
      properties: {
        department_slug: {
          type: "string",
          enum: [
            "engineering",
            "design",
            "marketing",
            "sales",
            "operations",
            "finance",
            "legal",
            "support",
          ],
        },
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["department_slug", "title"],
    },
  },
  {
    name: "set_tech_tree_node_status",
    description:
      "Mark a tech tree node as complete, in_progress, or available.",
    input_schema: {
      type: "object",
      properties: {
        node_slug: { type: "string" },
        status: {
          type: "string",
          enum: ["available", "in_progress", "complete"],
        },
      },
      required: ["node_slug", "status"],
    },
  },
  {
    name: "write_artifact",
    description:
      "Save a piece of work to the Library — markdown, json, code, or other text content.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        kind: {
          type: "string",
          enum: [
            "markdown",
            "json",
            "code",
            "business_plan",
            "brand_kit",
            "other",
          ],
        },
        content: { type: "string" },
        department_slug: { type: "string" },
      },
      required: ["name", "kind", "content"],
    },
  },
  {
    name: "complete_onboarding",
    description:
      "Signal that the onboarding flow is done — the founder has a clear-enough business plan to start running departments.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "write_skill",
    description:
      "Save a reusable procedure as a skill so future agents load it instead of re-deriving it. Call this after completing a repeatable task — competitor research, outreach sequences, pricing models, etc. Each skill reduces token cost on every future run of the same task type.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Kebab-case identifier (e.g. 'competitor-research', 'outreach-sequence').",
        },
        title: {
          type: "string",
          description: "Human-readable title shown in the skill list.",
        },
        body: {
          type: "string",
          description: "Markdown content: what the skill does, step-by-step procedure, examples, and what output to expect. Be concrete — future agents follow this verbatim.",
        },
      },
      required: ["name", "title", "body"],
    },
  },
  {
    name: "web_search",
    description:
      "Search the web for current information. Use ONLY when the answer is not already known from context. Use for competitor research, market data, news, or pricing that requires live data.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query." },
        max_results: {
          type: "number",
          description: "Number of results to return (default 5, max 10).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "web_fetch",
    description:
      "Fetch the text content of a URL. Use to read landing pages, documentation, articles, or any public web page.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to fetch." },
        max_chars: {
          type: "number",
          description: "Max characters to return (default 8000).",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "read_file",
    description:
      "Read a file from the company Library. Use to retrieve previously written artifacts (plans, brand kits, research, code, etc.).",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The artifact name (exact or partial match).",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "list_files",
    description:
      "List files in the company Library. Returns artifact names and kinds. Optionally filter by department.",
    input_schema: {
      type: "object",
      properties: {
        department_slug: {
          type: "string",
          description: "Filter to a specific department's artifacts.",
        },
      },
    },
  },
];

// Tool input/output types for narrowing
export type AskUserQuestionInput = {
  question: string;
  options: {
    key: string;
    label: string;
    description?: string;
    recommended?: boolean;
  }[];
  allow_custom?: boolean;
};

export type SetBusinessPlanInput = {
  product: string;
  icp: string;
  business_model?: string;
  mission?: string;
  differentiator?: string;
  go_to_market?: string;
};

export type DelegateInput = {
  department_slug: string;
  title: string;
  description?: string;
};

export type SetTechTreeStatusInput = {
  node_slug: string;
  status: "available" | "in_progress" | "complete";
};

export type WriteArtifactInput = {
  name: string;
  kind: string;
  content: string;
  department_slug?: string;
};

export type WebSearchInput = {
  query: string;
  max_results?: number;
};

export type WebFetchInput = {
  url: string;
  max_chars?: number;
};

export type ReadFileInput = {
  name: string;
};

export type ListFilesInput = {
  department_slug?: string;
};

export type WriteSkillInput = {
  name: string;
  title: string;
  body: string;
};
