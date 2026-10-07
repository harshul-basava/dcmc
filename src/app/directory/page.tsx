import type { Metadata } from "next";
import { connection } from "next/server";
import Directory from "@/components/dashboard/Directory";
import { getParticipants } from "@/server/data";
import { profileComplete } from "@/server/people";
import AutoRefresh from "../schedule/AutoRefresh";
import "../dashboard/dashboard.css";

export const metadata: Metadata = {
  title: "Attendee Directory — DC Mini-Conference",
  description: "Meet the attendees of the DC Mini-Conference.",
  alternates: { canonical: "/directory" },
  robots: { index: false, follow: false },
};

export default async function PublicDirectory() {
  await connection();
  const participants = (await getParticipants()).filter(profileComplete);
  // Explicitly select profile fields: never serialize emails, login phrases,
  // sign-in counts, or any other private roster fields to this public page.
  const people = participants.map((person) => ({
    id: person.id,
    name: person.name,
    title: person.title,
    organization: person.organization,
    bio: person.bio,
    photo: person.photo,
    linkedin: person.linkedin,
  }));

  return (
    <main id="top" className="portal mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">DC Mini-Conference Attendee Directory</h1>
      </header>
      <AutoRefresh />
      <div id="directory">
        <Directory people={people} anchor="#directory" />
      </div>
    </main>
  );
}
