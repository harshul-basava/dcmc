import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import WipNotice from "@/components/dashboard/WipNotice";
import PairingPlanner from "@/components/dashboard/PairingPlanner";
import { requireAdmin } from "@/server/auth";
import { getAssignments, getPairingDraftSlots, getGuests, getParticipants, getPreferences, getSessions } from "@/server/data";
import { PAIRING_EXCLUDED } from "@/server/data/types";
import { initials } from "@/server/people";
import { formatRange, longDayLabel } from "@/server/schedule";
import { pairingRoster } from "@/server/pairing-roster";
import { groupPairKeys, type PairingGroup, type PairingPlan } from "@/lib/pairing-planner";
import { airtableConfigured, ASSIGNMENTS_TABLE } from "@/server/airtable";

export default async function AdminPairings({ searchParams }: {
  searchParams: Promise<{ session?: string; generated?: string; published?: string; hidden?: string; error?: string }>;
}) {
  await requireAdmin();
  const flags = await searchParams;
  const [sessions, assignments, participants, guests] = await Promise.all([getSessions(), getAssignments(), getParticipants(), getGuests()]);
  const blocks = sessions.filter((s) => s.type === "one-to-one");
  const selectedId = flags.session ?? flags.generated ?? flags.published ?? flags.hidden;
  const session = blocks.find((s) => s.id === selectedId) ?? blocks[0];
  const storageReady = !airtableConfigured() || Boolean(ASSIGNMENTS_TABLE);
  const rowsFor = (id: string) => assignments.filter((a) => a.sessionId === id && a.group !== PAIRING_EXCLUDED);
  const workingFor = (id: string) => {
    const rows = rowsFor(id);
    return rows.some((a) => a.state === "draft") ? rows.filter((a) => a.state === "draft") : rows.filter((a) => a.state === "published");
  };
  const roster = session ? pairingRoster(session, participants, guests, assignments) : null;
  const draftSlots = session ? await getPairingDraftSlots(session.id) : null;
  const working = session ? (draftSlots ? rowsFor(session.id).filter((a) => a.state === "draft") : workingFor(session.id)) : [];
  const initial = roster?.halves.map((eligible, half) => {
    const groups = new Map<string, PairingGroup>();
    for (const row of working.filter((a) => (a.group.startsWith("S2") ? 1 : 0) === half)) {
      if (!groups.has(row.group)) groups.set(row.group, { id: row.group, members: [], location: row.location });
      // Keep unavailable assignments visible so the organizer can correct them;
      // the server refuses to save them against current availability.
      groups.get(row.group)!.members.push(row.personKey);
    }
    if (draftSlots) return { eligible, groups: Array.from({ length: draftSlots[half] }, (_, i) => {
      const id = `S${half + 1} · 1:1 ${String(i + 1).padStart(2, "0")}`;
      return groups.get(id) ?? { id, members: [], location: "NET" };
    }) };
    const minimum = Math.ceil(eligible.length / 2);
    for (let i = groups.size; i < minimum; i++) groups.set(`empty-${i}`, { id: `empty-${i}`, members: [], location: session?.location ?? "" });
    return { eligible, groups: [...groups.values()] };
  }) as PairingPlan | undefined;
  const people = [
    ...participants.map((p) => ({ key: `participant:${p.id}` as const, name: p.name, organization: p.organization, photo: p.photo, initials: initials(p.name) })),
    ...guests.map((p) => ({ key: `guest:${p.id}` as const, name: p.name, organization: p.organization, photo: p.photo, initials: initials(p.name) })),
  ];
  const preferences = session ? await getPreferences(session.day) : [];
  const history = blocks.filter((s) => s.id !== session?.id).flatMap((s) => {
    const groups = new Map<string, string[]>();
    for (const row of workingFor(s.id)) groups.set(row.group, [...(groups.get(row.group) ?? []), row.personKey]);
    return [...groups].flatMap(([group, members]) => groupPairKeys(members).map((key) => ({ key, label: `${s.title}, ${longDayLabel(s.day)}, ${group.startsWith("S2") ? "second" : "first"} half` })));
  });
  return <PortalShell role="admin" active="pairings">
    <PageHeading title="Pairings" lead="Arrange 1:1 conversations visually. Review both halves, save a private draft, then release it to attendee schedules. Guests appear during their submitted availability." />
    {!storageReady ? <WipNotice>Pairing storage needs to be connected before drafts can be saved or released.</WipNotice> : null}
    {flags.error ? <p role="alert" className="pairing-warning mb-6">{flags.error === "roster" ? "Check the roster and guest availability. Each pair needs two or three available people; the live pairings have not changed." : flags.error === "session" ? "Choose a 1:1 session from the schedule." : "Generate or save a draft before releasing pairings."}</p> : null}
    {flags.published ? <p role="status" className="pairing-request mb-6">Released. That block is now on participant schedules.</p> : null}
    {flags.hidden ? <p role="status" className="mb-6 text-sm text-muted">Hidden from participant schedules. The draft is untouched.</p> : null}
    {flags.generated ? <p role="status" className="mb-6 text-sm text-muted">Draft saved. Review the pairs before releasing.</p> : null}
    {!blocks.length ? <p className="text-sm text-muted">No 1:1 blocks yet. Add a session with type “1:1s” on the <a href="/dashboard/admin/schedule" className="text-accent underline">schedule</a> to start pairing.</p> : null}
    <nav aria-label="Choose a pairing block" className="pairing-blocks">{blocks.map((block) => {
      const live = rowsFor(block.id).some((a) => a.state === "published");
      return <a key={block.id} href={`/dashboard/admin/pairings?session=${encodeURIComponent(block.id)}`} aria-current={session?.id === block.id ? "page" : undefined}><strong>{block.title}</strong><span>{longDayLabel(block.day)}</span><small className={live ? "pairing-live" : ""}>{live ? "● Live" : "○ Private"}</small></a>;
    })}</nav>
    {session && roster && initial ? <section className="pairing-session">
      <div className="pairing-session-heading"><div><h2>{session.title}</h2><p>{longDayLabel(session.day)} · {formatRange(roster.times[0][0], roster.times[1][1])}</p></div><span>{rowsFor(session.id).some((a) => a.state === "published") ? "Live version on schedules" : "Private · not released"}</span></div>
      <PairingPlanner key={`${session.id}-${JSON.stringify(working)}-${JSON.stringify(roster.halves)}-${JSON.stringify(draftSlots)}`} sessionId={session.id} people={people} initial={initial} preferences={preferences} history={history} times={roster.times.map(([start, end]) => formatRange(start, end))} storageReady={storageReady} hasDraft={Boolean(draftSlots) || rowsFor(session.id).some((a) => a.state === "draft")} hasPublished={rowsFor(session.id).some((a) => a.state === "published")} />
    </section> : null}
  </PortalShell>;
}
