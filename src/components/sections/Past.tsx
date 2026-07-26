import Image from "next/image";
import { past } from "@/content/site";
import { Eyebrow, Section, SectionHeading } from "@/components/ui";

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

  return (
    <Section id="past">
      <Eyebrow>Last time</Eyebrow>
      <SectionHeading>{past.heading}</SectionHeading>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">{past.intro}</p>

      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {photoSlots.map((photo, index) => (
          <li
            key={photo?.src ?? `photo-${index}`}
            className="placeholder-frame relative aspect-[4/3] overflow-hidden rounded-sm border border-rule"
          >
            {photo ? (
              <Image
                src={photo.src}
                alt={photo.caption}
                fill
                sizes="(max-width: 640px) 90vw, 30vw"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.18em] text-muted">
                Photo to come
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-20">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
          Organizations we&rsquo;ve worked with
        </h3>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {partnerSlots.map((partner, index) => (
            <li
              key={partner?.name ?? `partner-${index}`}
              className="flex h-16 items-center justify-center rounded-sm border border-dashed border-rule px-3"
            >
              {partner?.logo ? (
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={120}
                  height={40}
                  className="max-h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-center text-xs text-muted">
                  {partner?.name ?? "Logo"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-20">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
          What attendees said
        </h3>
        {past.testimonials.length > 0 ? (
          <ul className="mt-8 grid gap-8 sm:grid-cols-2">
            {past.testimonials.map((testimonial) => (
              <li key={testimonial.name} className="border-t border-rule pt-6">
                <blockquote className="text-base leading-relaxed text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <p className="mt-4 text-sm text-muted">
                  {testimonial.name}
                  {testimonial.affiliation ? `, ${testimonial.affiliation}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-8 grid gap-8 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <li
                key={index}
                className="rounded-sm border border-dashed border-rule px-6 py-10 text-center text-sm text-muted"
              >
                Testimonial to come
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
