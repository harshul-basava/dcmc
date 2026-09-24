import type { ReactNode } from "react";

/** A free-text question. `aside` sits right-aligned on the label row. */
export default function TextQuestion({
  name,
  label,
  required = false,
  rows = 4,
  placeholder,
  defaultValue,
  aside,
}: {
  name: string;
  label: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  defaultValue?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <label htmlFor={name} className="text-sm text-foreground">
          {label}
          {/* The input carries `required`, so this is decoration for sighted
              readers rather than the accessible signal. */}
          {required ? (
            <span aria-hidden="true" className="text-accent">
              {" "}*
            </span>
          ) : null}
        </label>
        {aside}
      </span>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-card border border-rule bg-surface p-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.10)]"
      />
    </div>
  );
}
