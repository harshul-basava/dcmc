import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const { outputText } = ts.transpileModule(readFileSync(new URL('../src/lib/pairing-planner.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const planner = {};
runInNewContext(outputText, { exports: planner });
const alice = 'participant:alice', bob = 'participant:bob';
const guestA = 'guest:ga', guestB = 'guest:gb';
const times = ['11:30am – 12pm', '12pm – 12:30pm'];
const round = (...groups) => ({ eligible: [alice, bob, guestA, guestB], groups: groups.map((members, i) => ({ id: `pair-${i}`, members, location: 'NET' })) });
const flags = (plan, history = []) => planner.findGuestTimeWarnings(plan, history, times);

test('a second distinct guest in another half flags both affected pairs with the other guest and time', () => {
  const plan = [round([alice, guestA]), round([alice, guestB])];
  const issues = flags(plan);
  assert.equal(issues.length, 2);
  for (const issue of issues) { assert.equal(issue.participantKey, alice); assert.equal(issue.guestCount, 2); }
  assert.equal(issues[0].otherMeetings[0].guestKey, guestB);
  assert.match(issues[0].otherMeetings[0].label, /12pm – 12:30pm/);
  assert.equal(issues[1].otherMeetings[0].guestKey, guestA);
  const updated = [plan[0], planner.movePerson(plan[1], alice, '')];
  assert.equal(flags(updated).length, 0, 'removing the new conversation clears the flag immediately');
});

test('other-day history flags an attendee meeting another guest, deduplicates saved history, and names the right slot', () => {
  const earlier = { key: planner.pairingKey(alice, guestA), label: 'Friday, Oct 23 · 1:30pm – 2pm' };
  const plan = [round([alice, guestB], [bob, guestA]), round()];
  const issues = flags(plan, [earlier, earlier, { key: planner.pairingKey(guestA, guestB), label: 'Guest conversation' }]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].participantKey, alice);
  assert.equal(issues[0].guestCount, 2);
  assert.equal(issues[0].otherMeetings.length, 1);
  assert.equal(issues[0].otherMeetings[0].label, earlier.label);
});

test('a first guest conversation, attendee-only pairs and repeated same-guest meetings do not raise additional-guest flags', () => {
  assert.equal(flags([round([alice, guestA]), round([bob, guestB])]).length, 0);
  assert.equal(flags([round([alice, bob]), round([guestA, guestB])]).length, 0);
  const sameGuest = [round([alice, guestA]), round([alice, guestA])];
  assert.equal(flags(sameGuest).length, 0);
  assert.equal(planner.findPairingRepeats(sameGuest, [], times).length, 2, 'existing same-partner warnings remain independent');
  assert.equal(flags([round([alice], [guestA]), round()]).length, 0, 'unfinished placements do not count as conversations');
});

test('three-person groups assess each attendee independently and flag multiple guests in one group', () => {
  const history = [{ key: planner.pairingKey(alice, guestA), label: 'Friday' }];
  const issues = flags([round([alice, bob, guestB]), round()], history);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].participantKey, alice);
  const twoGuests = flags([round([alice, guestA, guestB]), round()]);
  assert.equal(twoGuests.length, 1);
  assert.equal(twoGuests[0].guestCount, 2);
  assert.equal(twoGuests[0].otherMeetings.length, 0, 'UI describes multiple guests within the current pair');
});
