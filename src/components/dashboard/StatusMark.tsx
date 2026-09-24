/** A done / not-done marker for a single profile requirement. */
export default function StatusMark({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
        done
          ? "bg-[color:var(--success-bg)] text-[color:var(--color-success)]"
          : "bg-[color:var(--error-bg)] text-[color:var(--color-error)]"
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {done ? <path d="M3.5 8.5l3 3 6-7" /> : <path d="M4 4l8 8M12 4l-8 8" />}
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
