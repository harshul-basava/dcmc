import type { Metadata } from "next";
import { connection } from "next/server";
import Directory from "@/components/dashboard/Directory";
import { getParticipants } from "@/server/data";
import { profileComplete } from "@/server/people";
import { hasDirectoryAccess } from "@/server/directory-access";
import DirectoryPortal from "./DirectoryPortal";
import AutoRefresh from "../schedule/AutoRefresh";

export const metadata: Metadata = {
  title: "Attendee Directory — DC Mini-Conference",
  description: "Meet the attendees of the DC Mini-Conference.",
  alternates: { canonical: "/directory" },
  robots: { index: false, follow: false },
};

export default async function PublicDirectory({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const { error } = await searchParams;
  const unlocked = await hasDirectoryAccess();

  return (
    <DirectoryPortal active="directory" unlocked={unlocked} error={error}>
      {unlocked ? <DirectoryContent /> : null}
    </DirectoryPortal>
  );
}

/** Only rendered after the server verifies the directory access cookie. */
async function DirectoryContent() {
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
    <>
      <AutoRefresh />
      <div id="directory">
        <Directory people={people} anchor="#directory" />
      </div>
    </>
  );
}
