import { getSpeakerSlides } from "@/server/speaker-contacts";
import { requireSpeakerContactsViewer } from "@/server/speaker-contacts-access";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireSpeakerContactsViewer();
  const slides = await getSpeakerSlides("caleb-knapp");
  if (!slides) return new Response("Slides not available", { status: 404 });
  const upstream = await fetch(slides.url, { cache: "no-store", signal: AbortSignal.timeout(20000), redirect: "error" });
  if (!upstream.ok) return new Response("Slides temporarily unavailable", { status: 502 });
  // Stream the original PDF: buffering this deck would exceed Vercel's 4.5 MB response limit.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Caleb Knapp - Overview of the AI Policy Landscape.pdf"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
