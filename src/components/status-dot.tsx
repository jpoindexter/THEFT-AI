type Tone = "sage" | "mustard" | "brick" | "neutral" | "ink";

const TONE: Record<Tone, string> = {
  sage: "bg-sage-ink",
  mustard: "bg-mustard-ink",
  brick: "bg-brick-ink",
  ink: "bg-ink",
  neutral: "bg-line-strong",
};

export default function StatusDot({
  tone = "neutral",
  pulsing = false,
}: {
  tone?: Tone;
  pulsing?: boolean;
}) {
  return (
    <span className="relative inline-flex size-2">
      {pulsing && (
        <span
          className={`absolute inset-0 rounded-full ${TONE[tone]} opacity-60 animate-ping`}
        />
      )}
      <span
        className={`relative inline-flex size-2 rounded-full ${TONE[tone]}`}
      />
    </span>
  );
}
