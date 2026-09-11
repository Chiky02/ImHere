export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "late";
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warn"
        ? "bg-amber-100 text-amber-900"
        : tone === "late"
          ? "bg-orange-100 text-orange-900"
          : "bg-stone-100 text-stone-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="display text-3xl text-ink">{title}</h1>
      {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
    </div>
  );
}
