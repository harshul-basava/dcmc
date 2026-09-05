import Image from "next/image";
import { CTA, Container } from "@/components/ui";
import { conference, hero, links } from "@/content/site";

/**
 * A quiet, editorial landing composition: one message, one photograph, and
 * one restrained accent. Washington is established by the image, so the hero
 * does not need additional flag or campaign-style imagery.
 */
export default function Hero() {
  return (
    <section
      id="top"
      className="-mt-16 flex min-h-svh items-center bg-sand pb-16 pt-32 sm:pb-20 sm:pt-36 lg:pb-24 lg:pt-40"
    >
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-16 xl:gap-24">
          <div className="max-w-[44rem]">
            {/* Capped at 5.3rem, not 5.75: "AI Governance DC" needs 685px at
                92px but the column tops out at 647px, which stranded "DC" on a
                line of its own above ~1430px. */}
            <h1 className="text-balance font-display text-[clamp(2.2rem,11vw,5.3rem)] font-normal leading-[0.94] tracking-[-0.04em] text-heading sm:text-[clamp(3.25rem,6vw,5.3rem)]">
              <span className="block">AI Governance DC</span>
              <span className="block whitespace-nowrap">Mini-Conference</span>
            </h1>

            <p className="mt-8 max-w-xl text-pretty text-lg leading-[1.65] text-muted sm:text-xl">
              {hero.description}
            </p>

            <p className="mt-8 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-foreground">
              <span>{conference.dates}</span>
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CTA
                href={links.futureInterest}
                className="min-h-14 !px-9 !py-4 !text-base"
              >
                Express interest in future rounds
              </CTA>
            </div>

            <aside
              aria-label="Application status"
              className="mt-8 max-w-xl border-l-2 border-accent/60 pl-4"
            >
              <p className="text-sm font-semibold text-foreground">
                {hero.additionalSession.lead}
              </p>
              <p className="mt-1 text-pretty text-sm leading-relaxed text-muted">
                {hero.additionalSession.body}
              </p>
            </aside>
          </div>

          <figure className="relative min-h-[24rem] overflow-hidden rounded-[2px] shadow-[0_18px_50px_-28px_rgba(20,42,93,0.45)] sm:min-h-[32rem] lg:min-h-[min(68vh,42rem)]">
            <div className="absolute inset-0 overflow-hidden">
              {/*
                The portrait crop keeps the dome centred across breakpoints.
                The previous filters were tuned for a cold grey photograph;
                this one is golden-hour, so the desaturation eases off and the
                navy veil comes away.
              */}
              <Image
                src="/DCMC_Capitol_Dome.png"
                alt="The dome of the United States Capitol at golden hour"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-cover object-center brightness-[1.06] saturate-[0.95]"
              />
            </div>
            <figcaption className="sr-only">
              The United States Capitol at golden hour, the setting for a
              three-day conference on artificial intelligence policy.
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
