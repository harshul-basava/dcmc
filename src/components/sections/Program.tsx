import { program, timeline } from "@/content/site";
import { ComingSoon, Section, SectionHeading, Subheading } from "@/components/ui";

/** Program overview on the left, the run-up dates as a rail on the right. */
export default function Program() {
  return (
    <Section id="program" tone="surface">
      <SectionHeading>{program.heading}</SectionHeading>

      <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-base leading-[1.8] text-muted sm:text-lg">{program.body}</p>
          <div className="mt-10">
            <ComingSoon>{program.scheduleNote}</ComingSoon>
          </div>
        </div>

        <div>
          <Subheading>{timeline.heading}</Subheading>
          <ol className="mt-8 border-l border-rule">
            {timeline.items.map((item) => (
              <li key={item.label} className="relative py-5 pl-8">
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-7 h-2 w-2 -translate-x-1/2 rounded-full ${
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
      </div>
    </Section>
  );
}
