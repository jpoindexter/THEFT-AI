import type { OnboardingStage } from "./onboarding-context";

export interface DepartmentSeedSpec {
  key: string;
  agentName: string;
  role: string;
  title: string;
  desiredSkills: string[];
  taskTitleByStage: Record<OnboardingStage, string>;
  taskDescriptionByStage: Record<OnboardingStage, string>;
}

const STAGES: OnboardingStage[] = [
  "pre-idea",
  "idea",
  "validating",
  "building",
  "launched",
  "revenue",
  "scaling",
  "existing-business",
];

function stageMap(values: string[]) {
  const out = {} as Record<OnboardingStage, string>;
  STAGES.forEach((stage, index) => {
    out[stage] = values[index] ?? values[values.length - 1] ?? "";
  });
  return out;
}

export const DEPARTMENT_SEED_SPECS: DepartmentSeedSpec[] = [
  {
    key: "engineering",
    agentName: "Engineering Lead",
    role: "cto",
    title: "Engineering",
    desiredSkills: [
      "theft/skills/dev-workflow",
      "theft/skills/gic-coding-agent-skills",
      "theft/skills/supabase",
    ],
    taskTitleByStage: stageMap([
      "Define MVP architecture constraints",
      "Draft MVP build scope and timeline",
      "Stabilize core build for validation loop",
      "Break roadmap into shippable engineering slices",
      "Harden reliability and bug triage loop",
      "Improve performance and delivery velocity",
      "Codify engineering standards for scale",
      "Audit current stack and modernization priorities",
    ]),
    taskDescriptionByStage: stageMap([
      "Document the smallest technical shape needed to test demand.",
      "Turn product assumptions into concrete engineering milestones.",
      "Reduce friction in build-test-learn cycle and surface blockers.",
      "Prioritize the next two weeks of implementation work.",
      "Set up launch reliability checklist and issue response rhythm.",
      "Target the biggest technical drag on revenue outcomes.",
      "Define quality gates and handoff protocols as volume grows.",
      "Map current systems and list fastest engineering upgrades.",
    ]),
  },
  {
    key: "design",
    agentName: "Design Lead",
    role: "designer",
    title: "Design",
    desiredSkills: [
      "theft/skills/web-design-guidelines",
      "theft/skills/huashu-design",
      "theft/skills/hyperframes",
    ],
    taskTitleByStage: stageMap([
      "Frame problem-first messaging and visual direction",
      "Create a lightweight validation landing concept",
      "Refine onboarding and conversion touchpoints",
      "Design core product workflows for daily use",
      "Tighten launch UX and reduce user confusion",
      "Improve retention-critical user journeys",
      "Build reusable design system for team scale",
      "Modernize brand and product UI consistency",
    ]),
    taskDescriptionByStage: stageMap([
      "Create a first-pass visual language matched to the target pain.",
      "Ship a clear first impression to test resonance quickly.",
      "Improve clarity between promise, action, and outcome.",
      "Prioritize usability in highest-frequency flows.",
      "Address launch feedback on friction and comprehension.",
      "Focus design effort on adoption and expansion moments.",
      "Codify primitives so output stays consistent across contributors.",
      "Assess current UX debt and propose phased design upgrades.",
    ]),
  },
  {
    key: "marketing",
    agentName: "Marketing Lead",
    role: "cmo",
    title: "Marketing",
    desiredSkills: [
      "theft/skills/content-engine",
      "theft/skills/last30days-research",
      "theft/skills/company-naming",
    ],
    taskTitleByStage: stageMap([
      "Identify ideal audience and positioning thesis",
      "Build first outreach narrative and channel plan",
      "Turn validation insights into repeatable messaging",
      "Launch weekly demand generation cadence",
      "Convert launch proof into distribution momentum",
      "Improve qualified pipeline from current channels",
      "Scale acquisition system with clear owner metrics",
      "Reboot growth playbook for existing business goals",
    ]),
    taskDescriptionByStage: stageMap([
      "Define who to target first and why they should care now.",
      "Ship concrete copy and channel tests for first conversions.",
      "Distill what message converts and remove weak narratives.",
      "Set a repeatable content and distribution operating rhythm.",
      "Amplify what worked at launch and cut low-signal efforts.",
      "Focus on channels with strongest revenue correlation.",
      "Assign metrics, owners, and review cycle for growth loops.",
      "Map current marketing baseline and highest-return improvements.",
    ]),
  },
  {
    key: "sales",
    agentName: "Sales Lead",
    role: "pm",
    title: "Sales",
    desiredSkills: [
      "theft/skills/last30days-research",
      "theft/skills/content-engine",
      "theft/skills/stripe-app-builder",
    ],
    taskTitleByStage: stageMap([
      "Define first sales conversation script",
      "Run first 10 outbound conversations",
      "Standardize qualification and close criteria",
      "Build simple pipeline review cadence",
      "Tighten deal follow-up after launch interest",
      "Improve conversion rate by stage",
      "Document scalable sales handoff process",
      "Rework existing pipeline for predictable close motion",
    ]),
    taskDescriptionByStage: stageMap([
      "Write a clear discovery and offer script for early calls.",
      "Schedule outreach and capture objections in structured notes.",
      "Clarify what qualifies a deal and when to disqualify.",
      "Track stage movement and next actions weekly.",
      "Systematize follow-ups while launch attention is high.",
      "Find bottlenecks and fix the highest-loss stage first.",
      "Define roles and tooling before adding more sales capacity.",
      "Assess current deal flow and prioritize fastest conversion fixes.",
    ]),
  },
  {
    key: "operations",
    agentName: "Operations Lead",
    role: "devops",
    title: "Operations",
    desiredSkills: [
      "theft/skills/ops-agent-skills",
      "theft/skills/debugging-vercel-builds",
      "theft/skills/supabase",
    ],
    taskTitleByStage: stageMap([
      "Set baseline operating cadence and ownership",
      "Define weekly execution checklist and handoffs",
      "Capture repeat bottlenecks in validation operations",
      "Systematize build and delivery workflow",
      "Stabilize launch operations and escalation paths",
      "Improve operational throughput and SLA discipline",
      "Scale cross-team coordination with clear controls",
      "Audit operational debt and remediation plan",
    ]),
    taskDescriptionByStage: stageMap([
      "Define recurring tasks, owner assignments, and review rhythm.",
      "Create a weekly operator checklist tied to outcomes.",
      "Log recurring friction and propose process fixes.",
      "Reduce context switching and execution blockers.",
      "Set clear incident response and handoff paths.",
      "Track throughput, response times, and process drift.",
      "Introduce structure that survives higher task volume.",
      "Map existing ops stack and prioritize critical fixes.",
    ]),
  },
  {
    key: "finance",
    agentName: "Finance Lead",
    role: "cfo",
    title: "Finance",
    desiredSkills: [
      "theft/skills/finance-agent-skills",
      "theft/skills/ops-agent-skills",
      "theft/skills/stripe-app-builder",
    ],
    taskTitleByStage: stageMap([
      "Define initial cost and pricing assumptions",
      "Build first unit-economics model",
      "Validate margin assumptions from early signals",
      "Set spend guardrails for current build phase",
      "Track launch spend versus return",
      "Improve cash conversion and revenue quality",
      "Install scale-ready finance reporting cadence",
      "Assess existing financial controls and gaps",
    ]),
    taskDescriptionByStage: stageMap([
      "Document baseline assumptions for cost, price, and runway.",
      "Translate first customer data into simple unit economics.",
      "Pressure-test assumptions against real outcomes.",
      "Create lightweight governance for discretionary spend.",
      "Tie launch expenses to pipeline and revenue signals.",
      "Identify leakage and improve conversion-to-cash cycle.",
      "Set reporting rhythm, owners, and review thresholds.",
      "Map current finance process and quick control upgrades.",
    ]),
  },
  {
    key: "legal",
    agentName: "Legal Lead",
    role: "security",
    title: "Legal",
    desiredSkills: [
      "theft/skills/gic-skills",
    ],
    taskTitleByStage: stageMap([
      "List immediate legal risks and decisions",
      "Prepare starter contract and policy checklist",
      "Document legal assumptions used in validation",
      "Review delivery terms and risk controls",
      "Harden customer terms after launch learning",
      "Reduce legal friction in revenue operations",
      "Define legal escalation and review process",
      "Audit existing legal docs and liabilities",
    ]),
    taskDescriptionByStage: stageMap([
      "Identify top legal unknowns that could block progress.",
      "Draft baseline templates for customer agreements.",
      "Capture where legal ambiguity may distort learnings.",
      "Ensure operational choices match legal obligations.",
      "Incorporate launch feedback into clearer terms.",
      "Prioritize legal improvements tied to revenue impact.",
      "Define who reviews what and when as volume grows.",
      "Review current legal posture and priority remediation.",
    ]),
  },
  {
    key: "support",
    agentName: "Support Lead",
    role: "general",
    title: "Support",
    desiredSkills: [
      "theft/skills/gic-skills",
      "theft/skills/content-engine",
    ],
    taskTitleByStage: stageMap([
      "Define support intake and response model",
      "Create first FAQ and response scripts",
      "Capture recurring user objections from validation",
      "Build lightweight support triage playbook",
      "Stabilize launch support workflows",
      "Improve support quality and turnaround",
      "Scale support handoffs and knowledge base",
      "Audit existing support operations and pain points",
    ]),
    taskDescriptionByStage: stageMap([
      "Define channels, response target, and ownership.",
      "Create reusable replies for early user questions.",
      "Track repeated objections and escalate insights.",
      "Set triage categories and clear next actions.",
      "Improve support reliability during launch volume.",
      "Measure and improve response time and resolution quality.",
      "Codify support documentation and escalation paths.",
      "Review current support bottlenecks and remediation plan.",
    ]),
  },
];
