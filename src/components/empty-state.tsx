import Link from "next/link";

type Action = { label: string; href: string; primary?: boolean };

export default function EmptyState({
  Icon,
  title,
  body,
  actions = [],
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  actions?: Action[];
}) {
  return (
    <div className="rounded-lg border border-line/70 bg-paper p-8 text-center flex flex-col items-center gap-2">
      <span className="size-10 rounded-md bg-cream inline-flex items-center justify-center text-ink-muted">
        <Icon className="size-4" />
      </span>
      <div className="text-base font-medium tracking-tight text-ink">
        {title}
      </div>
      <p className="text-xs text-ink-muted max-w-sm mx-auto">{body}</p>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={
                a.primary
                  ? "text-xs rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
                  : "text-xs rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
              }
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
