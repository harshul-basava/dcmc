import Image from "next/image";
import { hero, links } from "@/content/site";

/**
 * Landing: the Capitol-and-stars panel on the left, a flag-stripe field on the
 * right carrying one line of the title per stripe. Proportions follow the
 * approved artwork — a 38.2% photo panel and seven equal stripes, red first,
 * with ink flipping white-on-red and navy-on-white.
 *
 * Type is sized `min(cqw, svh)` against the stripe field: the width term keeps
 * long lines inside a narrow field, the height term keeps them inside their
 * stripe on a short, wide viewport. Below 768px the panel moves above the
 * stripes.
 */
export default function Hero() {
  return (
    <section
      id="top"
      className="relative -mt-16 flex h-svh flex-col overflow-hidden md:flex-row"
    >
      {/*
        The stars-over-Capitol panel, composited here rather than baked into a
        flat asset. Same stack as the source artwork: a white ground, the
        photograph at 70%, then the star field at 30% — the white showing
        through is what gives the panel its washed, pale cast. The tile is
        sized to the panel width so five stars span it, as in the original.
      */}
      <div className="relative h-[30%] w-full shrink-0 overflow-hidden bg-white md:h-full md:w-[38.2%]">
        <Image
          src="/Capitol.webp"
          alt="The United States Capitol"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 39vw"
          className="landing-photo translate-x-[3%] translate-y-[4%] scale-125 object-cover"
        />
        <div
          aria-hidden="true"
          className="landing-stars absolute inset-0"
          style={{ backgroundImage: "url(/Stars.webp)", backgroundSize: "100% auto" }}
        />
      </div>

      <div className="@container relative flex flex-1 flex-col">
        {hero.lines.map((line, index) => {
          const onRed = index % 2 === 0;
          return (
            <div
              key={line.cta ? "cta" : line.text || `blank-${index}`}
              className={`flex flex-1 items-center px-[3.5cqw] ${
                onRed ? "bg-flag-red text-white" : "bg-white text-heading"
              } ${line.align === "right" || line.cta ? "justify-end" : ""}`}
            >
              {line.cta ? (
                <div className="landing-type flex items-center gap-[1.8cqw]">
                  <StripeButton href={links.apply}>Apply now</StripeButton>
                  <StripeButton href={links.refer}>Refer an applicant</StripeButton>
                </div>
              ) : (
                /* leading-none centres the line box, which leaves the glyphs
                   riding high; the nudge drops the cap block onto the stripe's
                   centre line. Lines with a descender get a smaller drop so the
                   tail clears the stripe below. */
                <span
                  className={`landing-type font-display text-[min(11cqw,12.7svh)] leading-none tracking-[-0.005em] ${
                    line.descends ? "translate-y-[0.04em]" : "translate-y-[0.11em]"
                  }`}
                >
                  {line.text}
                </span>
              )}
            </div>
          );
        })}

        <Badge>{hero.badge}</Badge>
      </div>
    </section>
  );
}

/**
 * Outline button for the empty stripe: white rule on the red ground, filling
 * to white with red ink on hover. Padding is em-based so it tracks the
 * container-sized type.
 */
function StripeButton({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="whitespace-nowrap border border-white px-[1.7em] py-[0.75em] font-display text-[min(2.4cqw,2.9svh)] uppercase leading-none tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-flag-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </a>
  );
}

/** Navy starburst seal sitting across the second and third stripes. */
function Badge({ children }: { children: string }) {
  return (
    <div
      aria-hidden="true"
      className="landing-type absolute left-[38.5%] top-[27%] w-[min(23.7svh,26cqw)] -translate-x-1/2 -translate-y-1/2"
    >
      <svg viewBox="0 0 100 100" className="w-full">
        <polygon points={starburst(20, 50, 41)} fill="var(--heading)" />
        {/*
          Explicit baseline rather than dominant-baseline, which browsers
          disagree on: digits are cap-height 0.68em, so at 44 a baseline of
          64.9 centres them on 50.
        */}
        <text
          x="50"
          y="64.9"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="var(--font-newsreader), serif"
          fontSize="44"
        >
          {children}
        </text>
      </svg>
    </div>
  );
}

/** Points for a `count`-pointed star, alternating outer and inner radii. */
function starburst(count: number, outer: number, inner: number) {
  return Array.from({ length: count * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / count - Math.PI / 2;
    return `${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`;
  }).join(" ");
}
