import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Card, CardBody, Eyebrow, Hint, PageTitle } from "@/components/ui/primitives";
import { db } from "@/lib/db/store";

const DEFAULT_JUDGE_PROMPT =
  `You are evaluating whether an AI agent's output correctly handles the given input.

Input:
{{input}}

Agent output:
{{output}}

Respond with JSON:
{
  "pass": true | false,
  "reasoning": "one sentence explaining your verdict"
}`;

export default async function JudgePage({
  params,
}: {
  params: Promise<{ org: string; suite: string }>;
}) {
  const { org, suite } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  const suites = await db.listEvalSuites(o.id);
  const s = suites.find((x) => x.id === suite);
  if (!s) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <Link
          href={`/${org}/evals/${suite}`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to {s.name}
        </Link>

        <header>
          <Eyebrow className="inline-flex items-center gap-1">
            <FlaskConical className="size-3" /> Judge prompt
          </Eyebrow>
          <PageTitle>{s.name}</PageTitle>
          <Hint>
            This prompt scores each case. The judge receives the input and the
            agent&apos;s output, then returns pass/fail + reasoning.
          </Hint>
        </header>

        <form action="#">
          <Card>
            <CardBody>
              <label className="text-xs text-ink-muted font-medium" htmlFor="judge-prompt">
                Prompt
              </label>
              <textarea
                id="judge-prompt"
                name="judge_prompt"
                defaultValue={DEFAULT_JUDGE_PROMPT}
                rows={12}
                spellCheck={false}
                className="w-full rounded-lg border border-line/70 bg-canvas font-mono text-xs text-ink p-3 resize-y focus:outline-none focus:border-line-strong"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
                >
                  Save changes
                </button>
              </div>
            </CardBody>
          </Card>
        </form>

        <Card>
          <CardBody>
            <Eyebrow>How variables work</Eyebrow>
            <Hint className="mt-1">
              Use <code className="font-mono bg-canvas px-1 rounded">{"{{input}}"}</code> to
              insert the case&apos;s input and{" "}
              <code className="font-mono bg-canvas px-1 rounded">{"{{output}}"}</code> to insert
              the agent&apos;s response. Both are replaced verbatim before the prompt is sent to
              the judge model.
            </Hint>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <Eyebrow>Test prompt</Eyebrow>
            <Hint>Paste a case input and a sample output to preview the judge&apos;s verdict.</Hint>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted font-medium" htmlFor="test-input">
                Input
              </label>
              <textarea
                id="test-input"
                rows={3}
                placeholder="Paste the case input here…"
                className="w-full rounded-lg border border-line/70 bg-canvas text-xs text-ink p-3 resize-y focus:outline-none focus:border-line-strong placeholder:text-ink-soft"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted font-medium" htmlFor="test-output">
                Agent output
              </label>
              <textarea
                id="test-output"
                rows={3}
                placeholder="Paste the agent's response here…"
                className="w-full rounded-lg border border-line/70 bg-canvas text-xs text-ink p-3 resize-y focus:outline-none focus:border-line-strong placeholder:text-ink-soft"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
              >
                Test against this case
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
