// 4-question business brief that runs after the founder describes the idea.
// Mirrors screenshots/03-business-brief/.

export type BriefOption = {
  key: string;
  label: string;
  description?: string;
  recommended?: boolean;
};

export type BriefQuestion = {
  id: string;
  prompt: string;
  options: BriefOption[];
  allowCustom?: boolean;
};

export type BriefAnswer = {
  questionId: string;
  optionKey: string;
  custom?: string;
};

export const QUESTIONS: BriefQuestion[] = [
  {
    id: "icp",
    prompt: "Who is the primary person or team you are building this for?",
    allowCustom: true,
    options: [
      {
        key: "lenders",
        label: "Lenders & underwriters",
        description:
          "Mortgage brokers, loan officers, or fintechs that need formatted statements for credit decisions.",
        recommended: true,
      },
      {
        key: "accountants",
        label: "Accountants & bookkeepers",
        description:
          "Professionals who receive raw bank data and need clean, standardized PDF reports.",
      },
      {
        key: "consumers",
        label: "Individual consumers",
        description:
          "People who want a clean PDF of their own bank statements for renting, visas, or proof of funds.",
      },
      {
        key: "smb",
        label: "SMBs & finance teams",
        description:
          "Small businesses reconciling accounts or preparing financials for audits.",
      },
    ],
  },
  {
    id: "input_format",
    prompt: "What is the primary input format the tool will convert from?",
    allowCustom: true,
    options: [
      { key: "csv_excel", label: "CSV / Excel exports", recommended: true },
      { key: "pdf_scrape", label: "PDF screenshots / scrapes" },
      { key: "api_feed", label: "Direct API feed (Plaid / banking API)" },
      { key: "manual", label: "Manual paste / form entry" },
    ],
  },
  {
    id: "pricing",
    prompt: "How do you plan to charge for this?",
    allowCustom: true,
    options: [
      {
        key: "subscription",
        label: "Subscription",
        description: "Monthly or annual plans tiered by volume.",
        recommended: true,
      },
      {
        key: "per_doc",
        label: "Per-document",
        description: "Pay per generated PDF.",
      },
      { key: "self_hosted", label: "Self-hosted license" },
      { key: "free_freemium", label: "Free with paid add-ons" },
    ],
  },
  {
    id: "differentiator",
    prompt:
      "What is the main reason a user would choose your tool over a free online converter or building it in-house?",
    allowCustom: true,
    options: [
      {
        key: "branded_output",
        label: "Bank-branded, professional output",
        description: "PDFs that look exactly like official bank statements.",
        recommended: true,
      },
      {
        key: "accuracy",
        label: "Accuracy & data validation",
        description: "Automated checks that catch errors or missing transactions.",
      },
      {
        key: "speed",
        label: "Speed & bulk processing",
        description: "Handles large volumes or batches instantly.",
      },
      {
        key: "compliance",
        label: "Compliance & audit trail",
        description:
          "Built-in security, encryption, and audit logging for regulated industries.",
      },
    ],
  },
];
