import Image from "next/image";
import { hero } from "@/content/site";

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
      <div className="relative h-[30%] w-full shrink-0 md:h-full md:w-[38.2%]">
        <Image
          src="/capitol_pattern.png"
          alt="The United States Capitol behind a field of stars"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 39vw"
          className="object-cover"
        />
      </div>

      <div className="@container relative flex flex-1 flex-col">
        {hero.lines.map((line, index) => {
          const onRed = index % 2 === 0;
          return (
            <div
              key={line.text || `blank-${index}`}
              className={`flex flex-1 items-center px-[3.5cqw] ${
                onRed ? "bg-flag-red text-white" : "bg-white text-heading"
              } ${line.align === "right" ? "justify-end" : ""}`}
            >
              {/* leading-none centres the line box, which leaves the glyphs
                  riding high; the nudge drops the cap block onto the stripe's
                  centre line (measured against the artwork). */}
              <span className="translate-y-[0.11em] font-display text-[min(11cqw,12.7svh)] leading-none tracking-[-0.005em]">
                {line.text}
              </span>
            </div>
          );
        })}

        <Badge>{hero.badge}</Badge>
      </div>
    </section>
  );
}

/** Navy starburst seal sitting across the second and third stripes. */
function Badge({ children }: { children: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[38.5%] top-[27%] w-[min(23.7svh,26cqw)] -translate-x-1/2 -translate-y-1/2"
    >
      <svg viewBox="0 0 100 100" className="w-full">
        <polygon points={starburst(20, 50, 41)} fill="var(--heading)" />
        {/*
          Explicit baseline rather than dominant-baseline, which browsers
          disagree on: digits are cap-height 0.68em, so a baseline at 61.5
          centres them on 50. x is pulled left of centre because textAnchor
          balances the advance width, not the italic's visual mass.
        */}
        <text
          x="48"
          y="61.5"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="var(--font-newsreader), serif"
          fontSize="34"
          fontStyle="italic"
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
