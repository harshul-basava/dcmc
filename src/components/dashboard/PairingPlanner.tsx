"use client";

import { useEffect, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { generatePairings, hidePairings, publishPairings } from "@/app/dashboard/admin/actions";
import { savePairingDraft } from "@/app/dashboard/admin/pairings/actions";
import type { ConversationPreference, PersonKey } from "@/server/data/types";
import { generateOneToOne } from "@/server/pairings";
import { groupPairKeys, movePerson, type PairingGroup, type PairingPerson, type PairingPlan } from "@/lib/pairing-planner";
import PhotoSlot from "./PhotoSlot";

type Props = {
  sessionId: string;
  people: PairingPerson[];
  initial: PairingPlan;
  preferences: ConversationPreference[];
  history: { key: string; label: string }[];
  times: string[];
  storageReady: boolean;
  hasDraft: boolean;
  hasPublished: boolean;
};

export default function PairingPlanner({ sessionId, people, initial, preferences, history, times, storageReady, hasDraft, hasPublished }: Props) {
  const [plan, setPlan] = useState(initial);
  const [half, setHalf] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PersonKey | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  const round = plan[half];
  const byKey = new Map(people.map((p) => [p.key, p]));
  const assigned = new Set(round.groups.flatMap((g) => g.members));
  const unpaired = round.eligible.filter((key) => !assigned.has(key));
  const incomplete = plan.some((r) => r.groups.some((g) => g.members.length === 1));
  const totalPaired = plan.reduce((sum, r) => sum + r.groups.reduce((n, g) => n + (g.members.length >= 2 ? g.members.length : 0), 0), 0);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(update: (value: PairingPlan) => PairingPlan) {
    setPlan(update); setDirty(true); setMessage(""); setError("");
  }
  function move(key: PersonKey, destination: string, slot?: number) {
    edit((prev) => prev.map((r, i) => i === half ? movePerson(r, key, destination, slot) : r) as PairingPlan);
    setSelected(null);
  }
  function drop(e: DragEvent, destination: string, slot?: number) {
    e.preventDefault(); e.stopPropagation(); setOver(null);
    const key = e.dataTransfer.getData("text/plain") as PersonKey;
    if (byKey.has(key)) move(key, destination, slot);
  }
  function autoPair() {
    const otherPairs = new Set(plan[1 - half].groups.flatMap((g) => groupPairKeys(g.members)));
    const generated = generateOneToOne({ sessionId, roster: round.eligible, preferences });
    const candidates = ["S1", "S2"].map((prefix) => {
      const groups = new Map<string, PersonKey[]>();
      for (const row of generated.filter((r) => r.group.startsWith(prefix))) groups.set(row.group, [...(groups.get(row.group) ?? []), row.personKey]);
      return [...groups.values()];
    });
    candidates.sort((a, b) => b.length - a.length || a.filter((g) => groupPairKeys(g).some((k) => otherPairs.has(k))).length - b.filter((g) => groupPairKeys(g).some((k) => otherPairs.has(k))).length);
    const groups = candidates[0].map((members, i) => ({ id: `auto-${i}`, members, location: "NET" }));
    edit((prev) => prev.map((r, i) => i === half ? { ...r, groups } : r) as PairingPlan);
    setSelected(null);
  }
  function save() {
    setError(""); setMessage("");
    startSaving(async () => {
      try {
        const result = await savePairingDraft(sessionId, JSON.stringify(plan.map((round) => ({ ...round, groups: round.groups.map((group) => ({ ...group, location: "NET" })) }))));
        if (result.error) { setError(result.error); return; }
        setDirty(false); setMessage("Draft saved. Release it when you’re ready."); router.refresh();
      } catch { setError("The draft could not be saved. Your edits are still here; try again."); }
    });
  }
  function card(key: PersonKey, group = "") {
    const person = byKey.get(key);
    if (!person) return null;
    const matches = `${person.name} ${person.organization}`.toLowerCase().includes(query.toLowerCase().trim());
    return <article key={key} className={`pairing-person ${selected === key ? "is-selected" : ""} ${matches ? "" : "is-dimmed"}`}
      draggable={!saving && storageReady} onDragStart={(e) => { e.dataTransfer.setData("text/plain", key); e.dataTransfer.effectAllowed = "move"; setSelected(key); }} onDragEnd={() => setOver(null)}>
      <button type="button" draggable={!saving && storageReady} className="pairing-person-pick" disabled={saving || !storageReady} aria-label={`Select ${person.name} to move`} aria-pressed={selected === key} onClick={() => setSelected(selected === key ? null : key)}>
        <span className="pairing-avatar"><PhotoSlot photo={person.photo} initials={person.initials} /></span>
        <span title={`${person.name} · ${person.organization}`}><strong>{person.name}</strong><small>{key.startsWith("guest:") ? "Guest" : "Attendee"}{person.organization ? ` · ${person.organization}` : ""}</small></span><span aria-hidden="true" className="pairing-grip">⠿</span>
      </button>
      {!round.eligible.includes(key) ? <p className="pairing-warning">No longer available. Move to Unpaired.</p> : null}
      <select title={`Move ${person.name}`} aria-label={`Move ${person.name}`} value={group} disabled={saving || !storageReady} onChange={(e) => move(key, e.target.value)}>
        <option value="">Unpaired</option>{round.groups.map((g, i) => <option key={g.id} value={g.id}>Pair {String(i + 1).padStart(2, "0")}</option>)}
      </select>
    </article>;
  }
  function warnings(group: PairingGroup) {
    const keys = groupPairKeys(group.members);
    const repeats = history.filter((h) => keys.includes(h.key)).map((h) => h.label);
    if (plan[1 - half].groups.some((g) => groupPairKeys(g.members).some((key) => keys.includes(key)))) repeats.push("the other half of this block");
    return [...new Set(repeats)];
  }
  function requests(group: PairingGroup) {
    return preferences.filter((p) => group.members.includes(p.sourceKey) && group.members.includes(p.targetKey))
      .map((p) => `${byKey.get(p.sourceKey)?.name} requested ${byKey.get(p.targetKey)?.name} (#${p.rank})`);
  }
  return <div className="pairing-planner" aria-busy={saving}>
    <div className="pairing-toolbar">
      <label className="pairing-search"><span className="sr-only">Find someone in the pairing board</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find someone…" /></label>
      <button type="button" disabled={saving || !storageReady} onClick={autoPair}>Pair everyone</button>
      <button type="button" disabled={saving || !storageReady} onClick={() => { edit((prev) => prev.map((r, i) => i === half ? { ...r, groups: r.groups.map((g) => ({ ...g, members: [] })) } : r) as PairingPlan); setSelected(null); }}>Reset half</button>
      <button type="button" disabled={saving || !storageReady} onClick={() => edit((prev) => prev.map((r, i) => i === half ? { ...r, groups: [...r.groups, { id: crypto.randomUUID(), members: [], location: "NET" }] } : r) as PairingPlan)}>+ Add pair</button>
    </div>
    <p className="pairing-help">Drag people into a pair, or select a person and click an empty slot. Each card also has a Move menu. Search highlights matching people.</p>
    <div className="pairing-tabs" aria-label="Choose 1:1 half">{[0, 1].map((i) => <button key={i} type="button" aria-pressed={half === i} onClick={() => { setHalf(i); setSelected(null); }}><strong>{i === 0 ? "First half" : "Second half"}</strong><span>{times[i]}</span></button>)}</div>
    <p className="pairing-summary" role="status">{assigned.size} of {round.eligible.length} placed · {unpaired.length} unpaired{selected ? ` · Moving ${byKey.get(selected)?.name}` : ""}</p>
    <div className="pairing-workspace">
      <aside className={`pairing-roster ${over === "roster" ? "is-over" : ""}`} aria-label="Unpaired people" onDragOver={(e) => { e.preventDefault(); setOver("roster"); }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(e, "")}>
        <header><h3>Unpaired</h3><span>{unpaired.length}</span></header>
        <button type="button" className="pairing-return" disabled={!selected || saving || !storageReady} onClick={() => { if (selected) move(selected, ""); }}>Return selected person here</button>
        <div className="pairing-roster-list">{unpaired.map((key) => card(key))}{!unpaired.length ? <p className="pairing-empty">Everyone is placed in this half.</p> : null}</div>
      </aside>
      <div className="pairing-pairs">{round.groups.map((group, index) => {
        const repeats = warnings(group);
        const requestLabels = requests(group);
        return <section key={group.id} className={`pairing-pair ${repeats.length || group.members.length === 1 ? "has-warning" : ""}`} aria-label={`Pair ${index + 1}`}>
          <header><h3>Pair {String(index + 1).padStart(2, "0")}</h3><button type="button" disabled={saving || !storageReady} aria-label={`Remove pair ${index + 1}`} onClick={() => edit((prev) => prev.map((r, i) => i === half ? { ...r, groups: r.groups.filter((g) => g.id !== group.id) } : r) as PairingPlan)}>Remove</button></header>
          <div className="pairing-slots">{[0, 1, 2].map((slot) => <div key={slot} className={`pairing-slot ${over === `${group.id}-${slot}` ? "is-over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(`${group.id}-${slot}`); }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(e, group.id, slot)}>
            {group.members[slot] ? card(group.members[slot], group.id) : <button type="button" aria-disabled={!selected || saving || !storageReady} onClick={() => { if (selected && !saving && storageReady) move(selected, group.id, slot); }}>{slot === 2 ? "+ Optional third person" : `Drop person ${slot + 1} here`}</button>}
          </div>)}</div>
          {requestLabels.length ? <p className="pairing-request">{preferences.some((p) => group.members.includes(p.sourceKey) && group.members.includes(p.targetKey) && preferences.some((r) => r.sourceKey === p.targetKey && r.targetKey === p.sourceKey)) ? "Mutual requests · " : "Requested · "}{requestLabels.join("; ")}</p> : null}
          {group.members.length === 1 ? <p className="pairing-warning">Needs a partner before release.</p> : null}
          {repeats.length ? <p className="pairing-warning">Repeat pairing: also in {repeats.join("; ")}.</p> : null}
        </section>;
      })}{!round.groups.length ? <p className="pairing-empty">Add a pair to start arranging people, or use Pair everyone.</p> : null}</div>
    </div>
    <details className="pairing-preferences"><summary>Conversation requests ({preferences.length})</summary><div>{people.filter((p) => preferences.some((r) => r.sourceKey === p.key)).map((person) => <div key={person.key}><strong>{person.name}</strong><ol>{preferences.filter((p) => p.sourceKey === person.key).sort((a, b) => a.rank - b.rank).map((p) => <li key={p.id}>#{p.rank} · {byKey.get(p.targetKey)?.name ?? "Unavailable person"}</li>)}</ol></div>)}{!preferences.length ? <p>No requests submitted for this day.</p> : null}</div></details>
    <div className="pairing-save-bar"><div><strong>{dirty ? "Unsaved changes" : "Saved pairings"}</strong><p>Save both halves as a private draft, then release to schedules.</p></div><button className="pairing-primary" type="button" disabled={!storageReady || saving || !dirty} onClick={save}>{saving ? "Saving…" : "Save draft"}</button></div>
    {error ? <p role="alert" className="pairing-warning">{error}</p> : null}{message ? <p role="status" className="pairing-request">{message}</p> : null}
    {incomplete ? <p className="pairing-warning">You can save this unfinished draft and return later. Add a partner or move anyone on their own to Unpaired before releasing.</p> : null}
    <div className="pairing-release">
      <form action={generatePairings}><input type="hidden" name="sessionId" value={sessionId} /><button disabled={!storageReady || saving || dirty}>Generate new draft</button></form>
      <form action={publishPairings}><input type="hidden" name="sessionId" value={sessionId} /><button className="pairing-primary" disabled={!storageReady || saving || dirty || !hasDraft || incomplete || !totalPaired}>{hasPublished ? "Update live pairings" : "Release pairings"}</button></form>
      {hasPublished ? <form action={hidePairings}><input type="hidden" name="sessionId" value={sessionId} /><button disabled={!storageReady || saving || dirty}>Hide from schedules</button></form> : null}
      {dirty ? <button type="button" disabled={saving} onClick={() => { setPlan(initial); setDirty(false); setSelected(null); setError(""); setMessage(""); }}>Discard edits</button> : null}
    </div>
  </div>;
}
