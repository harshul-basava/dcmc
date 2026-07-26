import Image from "next/image";
import { conference, hero, links } from "@/content/site";
import { CTA, Container } from "@/components/ui";

/**
 * Split hero: the Capitol on the left bleeding into the page colour, the title
 * block set right against it. Below 768px the photo moves above the text.
 */
export default function Hero() {
  return (
    <section id="top" data-tone="sand" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/*
         * The photo is nudged left inside its panel rather than by moving the
         * panel: the mask lives on the panel, so shifting that would drag the
         * fade along with it. Scale and vertical crop stay as they are.
         */}
        <div className="hero-photo absolute left-0 top-0 h-[52%] w-full md:inset-y-0 md:h-full md:w-[70%]">
          <Image
            src="/capitol.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 70vw"
            className="object-cover object-[50%_38%] saturate-[0.82] md:-translate-x-[4%]"
          />
        </div>
        <div className="hero-veil absolute inset-0" />
      </div>

      <Container className="relative">
        <div className="flex min-h-[calc(100svh-4rem)] flex-col justify-end pb-14 pt-[30vh] md:min-h-[calc(100svh-4rem)] md:items-end md:justify-center md:pb-24 md:pt-24 md:text-right">
          <h1 className="font-display text-[clamp(2.75rem,6.2vw,5.1rem)] font-light leading-[1.02] tracking-[-0.015em] text-accent">
            {conference.name.replace(" 2.0", "")}
          </h1>

          <p className="mt-3 max-w-xl font-display text-xl leading-[1.4] text-foreground sm:mt-4 sm:text-2xl md:ml-auto">
            {hero.headline}
          </p>

          <p className="mt-3 font-display text-sm uppercase tracking-[0.16em] text-muted sm:mt-4">
            {conference.dates}. {conference.location}
          </p>

          <div className="mt-9 flex flex-wrap sm:mt-12 items-center gap-4 md:justify-end">
            <CTA href={links.apply}>Apply now</CTA>
            <CTA href={links.refer} variant="secondary">
              Refer an applicant
            </CTA>
          </div>
        </div>
      </Container>
    </section>
  );
}
