/** Marks an admin page that is built but not finished. */
export default function WipNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-card border border-dashed border-[color:var(--warning)] bg-[color:var(--warning-bg)] p-4 text-sm text-foreground">
      <span className="rounded-full bg-[color:var(--warning)] px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">
        Work in progress
      </span>
      <span className="text-muted">{children}</span>
    </p>
  );
}
