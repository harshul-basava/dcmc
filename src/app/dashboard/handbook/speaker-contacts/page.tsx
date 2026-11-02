import type { Metadata } from "next";
import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import BackLink from "@/components/dashboard/BackLink";
import CopyContact from "@/components/dashboard/CopyContact";
import PhotoSlot from "@/components/dashboard/PhotoSlot";
import { getGuests } from "@/server/data";
import { initials } from "@/server/people";
import { getSpeakerContacts } from "@/server/speaker-contacts";
import { requireSpeakerContactsViewer } from "@/server/speaker-contacts-access";
import "./speaker-contacts.css";

export const metadata: Metadata = { title: "Speaker contacts — DC Mini-Conference" };

export default async function SpeakerContactsPage() {
  const session = await requireSpeakerContactsViewer();
  const admin = session.role === "admin";
  // Roster enrichment is restricted to public profile details. Its email field
  // is deliberately never read: the contact allowlist is the only source.
  const [roster, speakerContacts] = await Promise.all([getGuests(), getSpeakerContacts()]);
  const guests = new Map(roster.map((guest) => [guest.name, guest]));

  return (
    <PortalShell role={admin ? "admin" : "participant"} active={admin ? "directories" : "handbook"} framed={false}>
      <BackLink href={admin ? "/dashboard/admin/directories" : "/dashboard/handbook"}>
        {admin ? "Directories" : "Handbook"}
      </BackLink>
      <PageHeading title="Speaker contacts" />
      <p className="speaker-contacts-intro">
        Shared with permission for DCMC attendees. Please keep these details and slides within the conference community.
      </p>
      {speakerContacts.length === 0 ? <p className="text-sm text-muted">Approved speaker contacts will appear here as they are added.</p> : null}
      <ul className="speaker-contacts-list" aria-label="Speaker and guest contacts">
        {speakerContacts.map((person) => {
          const guest = guests.get(person.name);
          return (
            <li key={person.name} className="speaker-contact-card">
              <div className="speaker-contact-photo">
                <PhotoSlot photo={guest?.photo} initials={initials(person.name)} />
              </div>
              <div className="speaker-contact-heading">
                <h2>{person.name}</h2>
                {guest?.title ? <p>{guest.title}</p> : null}
                <p>{guest?.organization || person.organization}</p>
              </div>
              <dl className="speaker-contact-channels">
                <div className="speaker-contact-channel">
                  <div>
                    <dt>Email</dt>
                    <dd><a href={`mailto:${person.email}`}>{person.email}</a></dd>
                  </div>
                  <CopyContact value={person.email} label={`${person.name}’s email`} />
                </div>
                {person.signal ? (
                  <div className="speaker-contact-channel">
                    <div>
                      <dt>Signal</dt>
                      <dd>{person.signal.href ? (
                        <a href={person.signal.href} target="_blank" rel="noreferrer">{person.signal.value}</a>
                      ) : person.signal.value}</dd>
                    </div>
                    <CopyContact value={person.signal.value} label={`${person.name}’s Signal contact`} />
                  </div>
                ) : null}
                {person.shareLinkedin && guest?.linkedin ? (
                  <div className="speaker-contact-channel">
                    <div>
                      <dt>Connect</dt>
                      <dd><a href={guest.linkedin} target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></dd>
                    </div>
                  </div>
                ) : null}
              </dl>
              {person.slides ? (
                <a className="speaker-contact-slides" href={person.slides.href} download>
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M6 2.8h5.2l3.3 3.3v10a1.2 1.2 0 0 1-1.2 1.2H6a1.2 1.2 0 0 1-1.2-1.2V4a1.2 1.2 0 0 1 1.2-1.2z" />
                    <path d="M11 2.8v3.5h3.5M7.6 10.2h4.8M7.6 13h3.4" />
                  </svg>
                  <span><strong>{person.slides.title}</strong><small>Download slides · PDF{person.slides.sizeBytes ? ` · ${(person.slides.sizeBytes / 1_000_000).toFixed(1)} MB` : ""}</small></span>
                  <span aria-hidden="true">↓</span>
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
