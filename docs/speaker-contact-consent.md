# Speaker contacts: attendee-sharing consent

Private contacts, sharing permissions, consent links, and slide attachments live
in the existing DC Mini-Conference Airtable base, in **Speaker Contact Sharing**.
The repository is public: never commit private contact details, slide PDFs, raw
email text, signed attachment URLs, screenshots containing contacts, or mailing
addresses. This applies to tests and Git history as well as application source.

The page is at `/dashboard/handbook/speaker-contacts`, linked from the attendee
handbook and Admin → Directories. The page and slide download require an attendee
or organizer dashboard session; the attendee handbook gate also applies. Guest
logins and the separate shared directory password grant no access.

## Updating the private table

Only create or enable a row after reading an affirmative attendee-sharing reply.
Store the speaker's name, the consent message link, and only the channels they
expressly choose in `Approved contacts`, a JSON object with these allowed keys:
`organization`, optional `email`, optional `signal` (`value` and optional `href`),
and optional `shareLinkedin`. At least one approved email, Signal contact, or
slide attachment is required. A slides-only card has no contact fields.
Do not import RSVP email fields or message signatures.
Set `Approved for attendees` only once verified. Unknown JSON properties cause
the row to be omitted, so postal fields cannot be silently rendered.

Store separately approved slides in the `Slides` attachment field, with their
name in `Slides title`. Each speaker's PDF is served through an authenticated
download route. Airtable's signed file URL
stays on the server and the response disables caching. Removing approval also
revokes the download. The public repository contains neither the PDF nor its URL.

Initial opt-ins were checked on November 2, 2026; subsequent organizer-approved
additions use the same private table. It contains the individual consent sources. No mailing addresses
were copied; those are solely for organizer thank-you notes.

Roster enrichment supplies profile photos, titles, organizations, and an approved
LinkedIn link, never contact emails. Without Airtable configuration the contact
sheet is empty, so local fixture mode cannot accidentally expose real contacts.
