import Directory from "./Directory";
import type { Guest } from "@/server/data/types";

/** Shared by the attendee page and the private organizer preview. */
export default function GuestDirectory({ guests }: { guests: Guest[] }) {
  return (
    <Directory
      people={guests.map(({ id, name, title, organization, photo, linkedin }) => ({
        id, name, title, organization, photo, linkedin, bio: "",
      }))}
    />
  );
}
