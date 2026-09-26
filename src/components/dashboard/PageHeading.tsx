import type { ReactNode } from "react";

/** The standard heading block at the top of every dashboard page. */
export default function PageHeading({
  title,
  lead,
  actions,
}: {
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
      <div>
        <h1 className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-normal leading-[1.1] tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        {/* `text-pretty` keeps the last word off a line of its own; the wider
            cap gives a sentence like the directory's pending-profiles note
            room to sit on one line. */}
        {lead ? (
          <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-muted">{lead}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
