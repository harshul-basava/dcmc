import { timeline } from "@/content/site";
import { Section, SectionHeading } from "@/components/ui";

/** The full run-up as one compact horizontal track on desktop. */
export default function Timeline() {
  return (
    <Section id="timeline" tone="surface" className="!py-16 sm:!py-20 lg:!py-24">
      <SectionHeading>{timeline.heading}</SectionHeading>

      <div className="mt-10 lg:mt-12">
        {/*
         * There are six milestones, so desktop receives exactly six columns.
         * The prior five-column grid pushed the conference itself onto a second
         * row, visually separating the destination from the run-up.
         */}
        <ol className="grid gap-x-4 gap-y-6 md:grid-cols-5 md:border-t md:border-rule xl:gap-x-6">
          {timeline.items.map((item) => (
            <li
              key={item.label}
              className="relative border-t border-rule pt-5 md:border-t-0 md:pt-7"
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0 hidden h-2 w-2 -translate-y-1/2 rounded-full md:block ${
                  item.tba ? "bg-rule" : "bg-gold"
                }`}
              />
              <span
                className={`block text-xs font-medium uppercase tracking-[0.16em] tabular-nums ${
                  item.tba ? "text-muted/70" : "text-gold"
                }`}
              >
                {item.date}
              </span>
              <span className="mt-2 block text-[0.9375rem] font-medium leading-snug text-foreground lg:text-base">
                {item.label}
              </span>
              {item.note ? (
                <span className="mt-1 block text-sm leading-snug text-muted">
                  {item.note}
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <aside
          aria-label="Possible additional conference session"
          className="mt-8 grid gap-2 bg-sand px-5 py-4 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06)] sm:grid-cols-[minmax(12rem,0.6fr)_minmax(0,1.4fr)] sm:items-center sm:gap-8"
        >
          <p>
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {timeline.additionalSession.label}
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              {timeline.additionalSession.date}
            </span>
          </p>
          <p className="text-pretty text-sm leading-relaxed text-muted">
            {timeline.additionalSession.body}
          </p>
        </aside>
      </div>
    </Section>
  );
}
