import { about, whoShouldApply } from "@/content/site";
import { Eyebrow, Section, SectionHeading } from "@/components/ui";

export default function About() {
  return (
    <Section id="about" divided={false}>
      <Eyebrow>About</Eyebrow>
      <SectionHeading>{about.heading}</SectionHeading>
      <p className="mt-8 max-w-3xl text-base leading-[1.75] text-muted sm:text-lg">
        {about.body}
      </p>

      <div className="mt-20">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {whoShouldApply.heading}
        </h3>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {whoShouldApply.intro}
        </p>

        <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {whoShouldApply.columns.map((column) => (
            <li key={column.title} className="border-t border-rule pt-5">
              <h4 className="text-base font-medium text-foreground">{column.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">{column.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
