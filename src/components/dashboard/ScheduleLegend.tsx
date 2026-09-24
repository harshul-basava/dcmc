const KINDS: { type: string; label: string }[] = [
  { type: "talk", label: "Talk" },
  { type: "panel", label: "Panel" },
  { type: "workshop", label: "Workshop" },
  { type: "one-to-one", label: "One-on-one" },
  { type: "small-group", label: "Small group" },
  { type: "meal", label: "Meal" },
  { type: "social", label: "Social" },
];

export default function ScheduleLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {KINDS.map(({ type, label }) => (
        <li key={type} className="flex items-center gap-2 text-xs text-muted">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-[2px] border-l-[3px]"
            style={{
              background: `var(--block-${type})`,
              borderLeftColor: `var(--block-${type}-edge)`,
            }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
