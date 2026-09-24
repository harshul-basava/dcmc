import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import { requireAdmin } from "@/server/auth";
import { getGuests, getParticipants } from "@/server/data";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusMark from "@/components/dashboard/StatusMark";
import { hasBio, hasHeadshot, profileComplete } from "@/server/people";
import { changeAccessCount } from "../actions";

export default async function AdminPeople() {
  await requireAdmin();
  const [participants, guests] = await Promise.all([getParticipants(), getGuests()]);

  // Progress is measured over attendees only: guests have no profile editor
  // yet, so counting them would make the numbers unreachable.
  const headshots = participants.filter(hasHeadshot).length;
  const bios = participants.filter(hasBio).length;
  const ready = participants.filter(profileComplete).length;
  const signedIn = participants.filter((p) => p.accessCount > 0).length;
  const signIns = participants.reduce((sum, p) => sum + p.accessCount, 0);

  const rows = [
    ...participants.map((p) => ({ ...p, role: "participant" as const, extra: p.school })),
    ...guests.map((g) => ({ ...g, role: "guest" as const, extra: g.organization })),
  ];

  return (
    <PortalShell role="admin" active="people">
      <PageHeading title="People" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Attendees"
          value={participants.length}
          detail={`${guests.length} speakers and guests`}
          tint="var(--blue-100)"
        />
        <MetricCard
          label="Headshots"
          value={`${headshots} / ${participants.length}`}
          detail={headshots === participants.length ? "All in" : `${participants.length - headshots} to go`}
          tint="var(--success-bg)"
        />
        <MetricCard
          label="Bios"
          value={`${bios} / ${participants.length}`}
          detail={bios === participants.length ? "All in" : `${participants.length - bios} to go`}
          tint="var(--warning-bg)"
        />
        <MetricCard
          label="In the directory"
          value={`${ready} / ${participants.length}`}
          detail={`${signedIn} signed in · ${signIns} sign-ins`}
          tint="var(--red-50)"
        />
      </div>

      <div className="overflow-x-auto rounded-card border border-rule bg-card">
        <table className="w-full min-w-[60rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule text-left">
              {["Name", "Role", "Affiliation", "Headshot", "Bio", "Password", "Sign-ins", ""].map((head) => (
                <th key={head} scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((person) => (
              <tr key={person.id} className="border-b border-rule last:border-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    {/* Gradient plate only — no monogram until real headshots land. */}
                    <span className="plate h-9 w-7 shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="block font-medium text-foreground">{person.name}</strong>
                      <span className="text-xs text-muted">{person.title}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {person.role === "guest" ? "Guest" : "Participant"}
                </td>
                <td className="px-4 py-3 text-muted">{person.extra}</td>
                <td className="px-4 py-3">
                  <StatusMark
                    done={hasHeadshot(person)}
                    label={hasHeadshot(person) ? "Headshot uploaded" : "No headshot yet"}
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusMark
                    done={hasBio(person)}
                    label={hasBio(person) ? "Bio written" : "No bio yet"}
                  />
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-[color:var(--neutral-100)] px-2 py-1 text-xs text-foreground">
                    {person.shortPassword}
                  </code>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{person.accessCount}</td>
                <td className="px-4 py-3">
                  <form action={changeAccessCount} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={person.id} />
                    <input type="hidden" name="role" value={person.role} />
                    <input type="hidden" name="current" value={person.accessCount} />
                    {(
                      [
                        ["decrement", "−"],
                        ["increment", "+"],
                        ["reset", "Reset"],
                      ] as const
                    ).map(([action, label]) => (
                      <button
                        key={action}
                        type="submit"
                        name="action"
                        value={action}
                        className="rounded border border-rule px-2 py-1 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
                      >
                        {label}
                      </button>
                    ))}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
