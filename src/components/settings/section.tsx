export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1 mb-6">
      <h1 className="text-xl tracking-tight">{title}</h1>
      {description && (
        <p className="text-[13px] text-stone-500">{description}</p>
      )}
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200/80 bg-white p-5 mb-4 space-y-4">
      {(title || description) && (
        <div className="space-y-0.5">
          {title && <h2 className="text-[14px] font-medium">{title}</h2>}
          {description && (
            <p className="text-[12px] text-stone-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-0.5">
        <div className="text-[13px]">{label}</div>
        {hint && <p className="text-[11px] text-stone-500">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
