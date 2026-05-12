// Tools the Cofounder agent can call. Each tool has:
//   - server-only execution (mutates the org state) OR
//   - client-pause (e.g. ask_user_question — server returns and waits)
//
// All tool definitions are JSON-Schema Anthropic tool-use objects.

import type Anthropic from "@anthropic-ai/sdk";

export type CofounderTool = Anthropic.Tool;

export const COFOUNDER_TOOLS: CofounderTool[] = [
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
