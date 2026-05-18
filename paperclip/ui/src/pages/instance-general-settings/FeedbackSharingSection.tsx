import type { PatchInstanceGeneralSettings } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";

type FeedbackPreference = "prompt" | "allowed" | "not_allowed";

type FeedbackSharingSectionProps = {
  preference: FeedbackPreference;
  termsUrl: string;
  disabled: boolean;
  onUpdate: (patch: PatchInstanceGeneralSettings) => void;
};

const feedbackOptions = [
  {
    value: "allowed",
    label: "Always allow",
    description: "Share voted AI outputs automatically.",
  },
  {
    value: "not_allowed",
    label: "Don't allow",
    description: "Keep voted AI outputs local only.",
  },
] as const;

export function FeedbackSharingSection({
  preference,
  termsUrl,
  disabled,
  onUpdate,
}: FeedbackSharingSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold">AI feedback sharing</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Control whether thumbs up and thumbs down votes can send the voted AI output to THEFT Labs. Votes are always
            saved locally.
          </p>
          {termsUrl ? (
            <a
              href={termsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Read our terms of service
            </a>
          ) : null}
        </div>
        {preference === "prompt" ? (
          <div className="rounded-lg border border-border/70 bg-accent/20 px-3 py-2 text-sm text-muted-foreground">
            No default is saved yet. The next thumbs up or thumbs down choice will ask once and then save the answer
            here.
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {feedbackOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={preference === option.value ? "default" : "outline"}
              disabled={disabled}
              className="h-auto flex-col items-start py-2 text-left"
              onClick={() => onUpdate({ feedbackDataSharingPreference: option.value })}
            >
              <span>{option.label}</span>
              <span className="text-xs font-normal opacity-80">{option.description}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          To retest the first-use prompt in local dev, remove the <code>feedbackDataSharingPreference</code> key from
          the <code>instance_settings.general</code> JSON row for this instance, or set it back to <code>"prompt"</code>.
          Unset and <code>"prompt"</code> both mean no default has been chosen yet.
        </p>
      </div>
    </section>
  );
}
