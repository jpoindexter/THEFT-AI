"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  ButtonPrimary,
} from "@/components/ui/primitives";

const STARTER_BODY = `# When to use this skill

Describe the situation that should pull this skill in. One sentence.

# How to use

- Concrete instruction one
- Concrete instruction two

# Don't

- The thing the agent should explicitly avoid
`;

export default function NewSkillPage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState(STARTER_BODY);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/skills`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to skills
        </Link>

        <header>
          <Eyebrow>Skills</Eyebrow>
          <PageTitle>New skill</PageTitle>
          <Hint>
            A skill is a single Markdown file that any agent can attach. Keep
            the body short — it's prepended to the system prompt.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(autoSlug(e.target.value));
                }}
                placeholder="e.g. ICP Brief Author"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
              />
            </Field>
            <Field label="Slug" hint="Lowercase, dashes only. Becomes the directory name.">
              <input
                value={slug}
                onChange={(e) => setSlug(autoSlug(e.target.value))}
                placeholder="icp-brief-author"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm font-mono focus:outline-none focus:border-line-strong"
              />
            </Field>
            <Field label="Description">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One-liner shown on the skill card."
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>SKILL.md</Eyebrow>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full mt-2 rounded-md border border-line bg-canvas px-3 py-2 text-xs font-mono leading-relaxed focus:outline-none focus:border-line-strong"
            />
            <Hint>
              Front-matter is generated from name + description. Avoid pasting
              long context here — link to artifacts in the workspace instead.
            </Hint>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Link
            href={`/${params.org}/skills`}
            className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </Link>
          <ButtonPrimary
            disabled={!name || !slug || !description}
            onClick={() => router.replace(`/${params.org}/skills/${slug}`)}
          >
            Create skill
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-ink">{label}</div>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}
