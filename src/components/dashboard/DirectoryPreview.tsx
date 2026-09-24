import Directory from "@/components/dashboard/Directory";

type Person = {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  photo?: string;
  linkedin?: string;
};

/**
 * One card exactly as the directory will render it.
 *
 * Built from the real `Directory` rather than a mock-up, so the preview
 * cannot drift from the thing it is previewing.
 */
export default function DirectoryPreview({
  person,
  lead = "Your card, and the profile that opens when someone selects it.",
}: {
  person: Person;
  lead?: string;
}) {
  return (
    <section aria-labelledby="preview" className="content-start">
      <h2 id="preview" className="font-display text-lg tracking-tight text-foreground">
        Directory preview
      </h2>
      <p className="mt-2 text-sm text-muted">{lead}</p>

      <div id="profile-preview" className="mt-5">
        <Directory
          people={[{ ...person, bio: person.bio || "No description yet." }]}
          anchor="#profile-preview"
        />
      </div>
    </section>
  );
}
