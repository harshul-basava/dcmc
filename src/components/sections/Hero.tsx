import Image from "next/image";
import { conference } from "@/content/site";

/**
 * Bare landing image, full-bleed where the hero used to be. The text, CTAs,
 * and dissolve effects are stripped for now; the copy still lives in
 * src/content/site.ts if they come back. Pulls up under the sticky header
 * (-mt-16) so the photo runs to the top edge while the bar is transparent.
 */
export default function Hero() {
  return (
    <section id="top" data-tone="sand" className="relative -mt-16 h-svh overflow-hidden">
      {/* 10% side margins; the vw type size is tuned so the line spans the
          remaining 80% of the page. */}
      <h1 className="absolute inset-x-[10%] top-24 z-10 whitespace-nowrap text-center font-display text-[7.6vw] font-medium leading-none tracking-[-0.015em] text-white [text-shadow:0_2px_24px_rgb(0_0_0/45%)]">
        {conference.name}
      </h1>

      <Image
        src="/capitol2.jpg"
        alt="Aerial view of the United States Capitol"
        fill
        priority
        sizes="100vw"
        className="origin-top scale-[1.15] object-cover translate-x-[2.5%]"
      />
    </section>
  );
}
