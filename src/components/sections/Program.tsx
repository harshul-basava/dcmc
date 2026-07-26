import { program, timeline } from "@/content/site";
import { ComingSoon, Eyebrow, Section, SectionHeading } from "@/components/ui";

/** Program overview and the key dates leading up to it, in one section. */
export default function Program() {
  return (
    <Section id="program">
      <Eyebrow>Program</Eyebrow>
      <SectionHeading>{program.heading}</SectionHeading>
      <p className="mt-8 max-w-3xl text-base leading-[1.75] text-muted sm:text-lg">
        {program.body}
      </p>

      <div className="mt-10 max-w-3xl">
        <ComingSoon>{program.scheduleNote}</ComingSoon>
      </div>

      <div className="mt-20">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {timeline.heading}
        </h3>
        <ol className="mt-8 max-w-2xl">
          {timeline.items.map((item) => (
            <li
              key={item.label}
              className="grid grid-cols-[8.5rem_1fr] gap-4 border-t border-rule py-5 last:border-b sm:grid-cols-[11rem_1fr]"
            >
              <span
                className={`text-sm tabular-nums ${
                  item.tba ? "text-muted/70" : "text-foreground"
                }`}
              >
                {item.date}
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">
                  {item.label}
                </span>
                {item.note ? (
                  <span className="mt-1 block text-sm text-muted">{item.note}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
