import { conference, hero, links } from "@/content/site";
import { CTA, Container } from "@/components/ui";

export default function Hero() {
  return (
    <section id="top" className="pt-20 pb-16 sm:pt-32 sm:pb-24">
      <Container>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {hero.headline}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          {hero.subhead}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CTA href={links.apply}>APPLY NOW</CTA>
          <CTA href={links.refer} variant="secondary">
            Refer an applicant <span aria-hidden="true">→</span>
          </CTA>
        </div>

        <hr className="mt-16 border-0 border-t border-rule" />
        <p className="mt-6 text-sm tracking-wide text-muted">
          {conference.dates} <span aria-hidden="true">·</span> {conference.location}
        </p>
      </Container>
    </section>
  );
}
