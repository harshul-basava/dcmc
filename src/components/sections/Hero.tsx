import { hero, links } from "@/content/site";
import { CTA, Container } from "@/components/ui";

export default function Hero() {
  return (
    <section id="top" data-tone="sand" className="relative overflow-hidden">
      <div aria-hidden="true" className="hero-motif absolute inset-0" />

      <Container className="relative">
        <div className="flex min-h-[calc(100svh-4rem)] flex-col justify-center py-20 sm:py-28">
          <h1 className="max-w-[19ch] text-[clamp(2.5rem,6.2vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-foreground">
            {hero.headline}
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-[1.65] text-muted sm:text-xl">
            {hero.subhead}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <CTA href={links.apply}>APPLY NOW</CTA>
            <CTA href={links.refer} variant="secondary">
              Refer an applicant <span aria-hidden="true">→</span>
            </CTA>
          </div>

          <dl className="mt-20 grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-3">
            {hero.facts.map((fact) => (
              <div key={fact.label} className="bg-sand px-6 py-5">
                <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                  {fact.label}
                </dt>
                <dd className="mt-2 text-base font-medium text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
