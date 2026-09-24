/** A single headline number. `tint` is the soft orb in the corner. */
export default function MetricCard({
  label,
  value,
  detail,
  tint,
}: {
  label: string;
  value: string | number;
  detail?: string;
  tint?: string;
}) {
  return (
    <div className="metric-card">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 font-display text-[2.35rem] leading-none text-foreground">{value}</p>
      {detail ? <p className="mt-2 text-xs text-muted">{detail}</p> : null}
      {tint ? (
        <span aria-hidden="true" className="metric-orb" style={{ background: tint }} />
      ) : null}
    </div>
  );
}
