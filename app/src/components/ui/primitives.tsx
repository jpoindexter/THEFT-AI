import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line/70 bg-paper",
        className,
      )}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: DivProps) {
  return <div className={cn("p-4 space-y-3", className)} {...rest} />;
}

export function Stack({
  gap = 3,
  className,
  ...rest
}: DivProps & { gap?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const map = {
    1: "space-y-1",
    2: "space-y-2",
    3: "space-y-3",
    4: "space-y-4",
    5: "space-y-5",
    6: "space-y-6",
  } as const;
  return <div className={cn(map[gap], className)} {...rest} />;
}

export function Eyebrow({ className, ...rest }: DivProps) {
  return (
    <div
      className={cn(
        "text-2xs uppercase tracking-[0.14em] text-ink-soft",
        className,
      )}
      {...rest}
    />
  );
}

export function PageTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("text-xl tracking-tight text-ink", className)}
      {...rest}
    />
  );
}

export function SectionTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-md font-medium tracking-tight text-ink",
        className,
      )}
      {...rest}
    />
  );
}

export function Hint({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-ink-muted", className)} {...rest} />
  );
}

type Tone = "neutral" | "sage" | "mustard" | "brick";

const toneClass: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-muted border border-line",
  sage: "bg-canvas text-ink border border-line",
  mustard: "bg-canvas text-ink border border-line",
  brick: "bg-canvas text-ink-muted border border-line",
};

export function Pill({
  tone = "neutral",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-2xs uppercase tracking-wider rounded px-1.5 py-0.5",
        toneClass[tone],
        className,
      )}
      {...rest}
    />
  );
}

type ButtonSize = "sm" | "md";

const SIZE_CLS: Record<ButtonSize, string> = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1.5",
};

export function ButtonPrimary({
  className,
  size = "md",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-md bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 inline-flex items-center justify-center gap-1",
        SIZE_CLS[size],
        className,
      )}
      {...rest}
    />
  );
}

export function ButtonGhost({
  className,
  size = "md",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-md border border-line bg-paper hover:border-line-strong transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-1",
        SIZE_CLS[size],
        className,
      )}
      {...rest}
    />
  );
}

type StatTone = "sage" | "mustard" | "brick" | "neutral";

const STAT_TONE_TEXT: Record<StatTone, string> = {
  sage: "text-ink",
  mustard: "text-ink",
  brick: "text-ink-muted",
  neutral: "text-ink",
};

export function StatCard({
  label,
  value,
  tone = "neutral",
  className,
  Icon,
}: {
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
  className?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-line/70 bg-paper p-3",
        className,
      )}
    >
      <div className="text-2xs uppercase tracking-wider text-ink-soft inline-flex items-center gap-1">
        {Icon && <Icon className="size-3" />}
        {label}
      </div>
      <div
        className={cn(
          "text-base font-medium tracking-tight mt-0.5",
          STAT_TONE_TEXT[tone],
        )}
      >
        {value}
      </div>
    </div>
  );
}
