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
  neutral: "bg-cream text-ink-muted",
  sage: "bg-sage/30 text-sage-ink",
  mustard: "bg-mustard/30 text-mustard-ink",
  brick: "bg-brick/15 text-brick-ink",
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

export function ButtonPrimary({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-40",
        className,
      )}
      {...rest}
    />
  );
}

export function ButtonGhost({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong transition-colors",
        className,
      )}
      {...rest}
    />
  );
}
