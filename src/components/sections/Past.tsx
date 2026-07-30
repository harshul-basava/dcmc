import Image from "next/image";
import { past } from "@/content/site";
import { Card, Section, SectionHeading } from "@/components/ui";

/** Social proof from the first conference: photos, partner orgs, testimonials. */
export default function Past() {
  const photoSlots =
    past.photos.length > 0
      ? past.photos
      : Array.from({ length: past.photoPlaceholderCount }, () => null);
  const partnerSlots =
    past.partners.length > 0
      ? past.partners
      : Array.from({ length: past.partnerPlaceholderCount }, () => null);
  const testimonialSlots =
    past.testimonials.length > 0 ? past.testimonials : [null, null];

  return (
    <Section id="past" tone="sand">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <SectionHeading>{past.heading}</SectionHeading>
        </div>
        <p className="max-w-xl text-base leading-[1.75] text-muted lg:pb-2">{past.intro}</p>
      </div>

      {/* Mosaic: the first photo runs large, the rest stack beside it. The
          explicit height gives the two grid rows something to divide. */}
      <ul className="mt-14 grid gap-4 sm:h-[30rem] sm:grid-cols-3 sm:grid-rows-2">
        {photoSlots.map((photo, index) => (
          <li
            key={photo?.src ?? `photo-${index}`}
            className={`placeholder-frame relative aspect-[4/3] overflow-hidden rounded-card border border-rule sm:aspect-auto sm:h-full ${
              index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
            }`}
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
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Organizations we&rsquo;ve worked with
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-5">
          {partnerSlots.map((partner, index) => (
            <li
              key={partner?.name ?? `partner-${index}`}
              className="flex h-24 items-center justify-center bg-surface px-4"
            >
              {partner?.logo ? (
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={140}
                  height={48}
                  className="max-h-9 w-auto object-contain"
                />
              ) : (
                <span className="text-center text-sm text-muted">
                  {partner?.name ?? "Logo"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-24">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          What attendees said
        </p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {testimonialSlots.map((testimonial, index) => (
            <li key={`testimonial-${index}`}>
              <Card className="h-full">
                <span aria-hidden="true" className="block text-3xl leading-none text-gold">
                  &ldquo;
                </span>
                {testimonial ? (
                  <>
                    <blockquote className="mt-4 text-base leading-[1.7] text-foreground">
                      {testimonial.quote}
                    </blockquote>
                    {testimonial.name ? (
                      <p className="mt-5 text-sm text-muted">
                        {testimonial.name}
                        {testimonial.affiliation ? `, ${testimonial.affiliation}` : ""}
                      </p>
                    ) : (
                      <p className="mt-5 text-sm text-muted">DCMC 1.0 attendee</p>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-base leading-[1.7] text-muted">
                    Testimonial to come.
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
