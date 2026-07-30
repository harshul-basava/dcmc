import Image from "next/image";
import { past } from "@/content/site";
import { Card, Section, SectionHeading } from "@/components/ui";

/** Bolds the highlighted phrase, if any, inside a testimonial quote. */
function emphasize(quote: string, highlight?: string) {
  if (!highlight || !quote.includes(highlight)) return quote;
  const [before, after] = quote.split(highlight, 2);
  return (
    <>
      {before}
      <strong className="font-semibold">{highlight}</strong>
      {after}
    </>
  );
}

/** Social proof from the first conference: photos, partner orgs, testimonials. */
export default function Past() {
  const photoSlots = past.photos.length > 0 ? past.photos : [null, null, null];
  const testimonialSlots =
    past.testimonials.length > 0 ? past.testimonials : [null, null];

  return (
    <Section id="past" tone="sand">
      <SectionHeading>{past.heading}</SectionHeading>

      {/* Mosaic: the first photo runs large; with exactly two, the second
          fills the whole right column. The explicit height gives the grid
          rows something to divide. */}
      <ul className="mt-14 grid gap-4 sm:h-[30rem] sm:grid-cols-3 sm:grid-rows-2">
        {photoSlots.map((photo, index) => (
          <li
            key={photo?.src ?? `photo-${index}`}
            className={`placeholder-frame relative aspect-[4/3] overflow-hidden rounded-card border border-rule sm:aspect-auto sm:h-full ${
              index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
            } ${index > 0 && photoSlots.length === 2 ? "sm:row-span-2" : ""}`}
          >
            {photo ? (
              <Image
                src={photo.src}
                alt={photo.caption}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-muted">
                Photo to come
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-24">
        <ul className="grid gap-6 sm:grid-cols-2">
          {testimonialSlots.map((testimonial, index) => (
            <li key={`testimonial-${index}`}>
              {/* flex column + mt-auto pins the attribution to the card's
                  bottom, so both cards' bylines align however long the quote. */}
              <Card className="flex h-full flex-col">
                {testimonial ? (
                  <>
                    <blockquote className="text-lg leading-[1.7] text-foreground sm:text-xl">
                      {emphasize(testimonial.quote, testimonial.highlight)}
                    </blockquote>
                    <p className="mt-auto pt-6 text-sm text-muted">
                      {testimonial.name ?? "DCMC 1.0 attendee"}
                      {testimonial.affiliation ? `, ${testimonial.affiliation}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-lg leading-[1.7] text-muted">Testimonial to come.</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-24">
        <p className="text-center text-sm uppercase tracking-[0.2em] text-muted">
          Including guests from
        </p>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-10">
          {past.partners.map((partner) => (
            <li key={partner.name}>
              {/* unoptimized: several of these are SVGs, which the image
                  optimizer refuses; they're tiny files anyway. */}
              <Image
                src={partner.logo}
                alt={partner.name}
                title={partner.name}
                width={200}
                height={64}
                unoptimized
                className="h-9 w-auto object-contain sm:h-10"
              />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
