import { program, timeline } from "@/content/site";
import { ComingSoon, Section, SectionHeading, Subheading } from "@/components/ui";

/** Program overview, then the run-up dates as a horizontal track beneath it. */
export default function Program() {
  return (
    <Section id="program" tone="surface">
      <SectionHeading>{program.heading}</SectionHeading>

      <p className="mt-10 max-w-3xl text-base leading-[1.8] text-muted sm:text-lg">
        {program.body}
      </p>

      <div className="mt-10 max-w-3xl">
        <ComingSoon>{program.scheduleNote}</ComingSoon>
      </div>

      <div className="mt-24">
        <Subheading>{timeline.heading}</Subheading>

        {/*
         * One column per date on desktop, with the rule carried by the list so
         * it runs unbroken behind the markers. Stacks to a plain dated list on
         * narrow screens, where each row carries its own rule instead.
         */}
        <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-5 sm:border-t sm:border-rule">
          {timeline.items.map((item) => (
            <li
              key={item.label}
              className="relative border-t border-rule pt-6 sm:border-t-0 sm:pt-9"
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0 hidden h-2 w-2 -translate-y-1/2 rounded-full sm:block ${
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
              <span className="mt-2 block text-base font-medium text-foreground">
                {item.label}
              </span>
              {item.note ? (
                <span className="mt-1 block text-sm leading-relaxed text-muted">
                  {item.note}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
