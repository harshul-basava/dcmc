import Image from "next/image";

/**
 * Bare landing image, full-bleed where the hero used to be. The text, CTAs,
 * and dissolve effects are stripped for now; the copy still lives in
 * src/content/site.ts if they come back. Pulls up under the sticky header
 * (-mt-16) so the photo runs to the top edge while the bar is transparent.
 */
export default function Hero() {
  return (
    <section id="top" data-tone="sand" className="relative -mt-16 h-svh">
      <Image
        src="/capitol2.jpg"
        alt="Aerial view of the United States Capitol"
        fill
        priority
        sizes="100vw"
        className="scale-[1.06] object-cover translate-x-[2.5%]"
      />
    </section>
  );
}
