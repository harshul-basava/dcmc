import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';

function load(file, imports = {}, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  runInNewContext(outputText, {
    exports, Buffer, require: (name) => { if (name === "node:crypto" && !(name in imports)) return crypto; if (!(name in imports)) throw Error(`Unexpected import ${name}`); return imports[name]; },
    process, FormData, URLSearchParams, AbortController, setTimeout, clearTimeout, console, ...globals,
  });
  return exports;
}
const testAttendee = load('server/test-attendee.ts', { 'node:crypto': crypto }, { process: { env: { DASHBOARD_SESSION_SECRET: 'live-test-secret'.repeat(4) } } });
const types = load('server/data/types.ts');
const pairings = load('server/pairings.ts', { './data/types': types });
const roster = ['participant:recAAAAAAAAAAAAAA', 'participant:recBBBBBBBBBBBBBB', 'participant:recCCCCCCCCCCCCCC', 'guest:recDDDDDDDDDDDDDD'];

test('1:1 generator produces two distinct conflict-free rounds for even and odd rosters', () => {
  for (let n = 0; n <= 30; n++) {
    const people = Array.from({ length: n }, (_, i) => `participant:person${i}`);
    const rows = pairings.generateOneToOne({ sessionId: 'block', roster: people, preferences: [] });
    const pairs = new Set();
    for (const half of ['S1', 'S2']) {
      const round = rows.filter(r => r.group.startsWith(half));
      const expected = half === 'S2' && n === 2 ? 0 : Math.floor(n / 2) * 2;
      assert.equal(round.length, expected, `round ${half} should maximize coverage for ${n} people`);
      assert.equal(new Set(round.map(r => r.personKey)).size, round.length);
      const groups = new Map();
      for (const r of round) groups.set(r.group, [...(groups.get(r.group) ?? []), r.personKey]);
      for (const members of groups.values()) {
        assert.equal(members.length, 2);
        const key = members.sort().join('|');
        assert.ok(!pairs.has(key));
        pairs.add(key);
      }
    }
  }
});
test('1:1 generator respects each half roster and prioritizes mutual requests', () => {
  const rows = pairings.generateOneToOne({ sessionId: 'block', roster,
    rosterByHalf: { S1: roster.slice(0, 3), S2: roster },
    preferences: [{ sourceKey: roster[0], targetKey: roster[2], rank: 1 }, { sourceKey: roster[2], targetKey: roster[0], rank: 1 }],
  });
  assert.ok(!rows.some(r => r.group.startsWith('S1') && r.personKey === roster[3]));
  const first = rows.find(r => r.personKey === roster[0] && r.group.startsWith('S1'));
  assert.equal(rows.find(r => r.personKey === roster[2] && r.group.startsWith('S1')).group, first.group);
});

function feedbackHarness(data = {}) {
  return load('server/feedback.ts', {
    'node:crypto': {}, 'next/headers': {}, './data': { getSessions:async()=>[], ...data }, './people': {}, './schedule': load('server/schedule.ts'), './availability':load('server/availability.ts',{'./schedule':load('server/schedule.ts')}),
  });
}
const feedback = feedbackHarness();
const feedbackOptions = load("server/feedback-options.ts", { "./session": { sessionSecret: () => "feedback-options-test-secret" } });
const scheduleHelpers = load('server/schedule.ts');
const sessionRatings = load('server/session-ratings.ts', { './data': {}, './feedback': {}, './schedule': scheduleHelpers });
const talkSession = { id: 'talk', type: 'talk', title: 'A talk', speaker: '', day: '2026-10-23', start: '2026-10-23T10:00', end: '2026-10-23T11:00' };

function actionHarness({ open = true, preview = false, failSave = false, failSync = false, questions, conversations = [], scheduledSessions = [talkSession], participantId = 'recAAAAAAAAAAAAAA' } = {}) {
  const saved = [], synced = [], completed = [];
  const { submitFeedback } = load('app/dashboard/feedback/actions.ts', {
    'next/navigation': { redirect: (url) => { throw Object.assign(Error(url), { redirect: url }); } },
    '@/server/test-attendee': testAttendee,
    '@/server/auth': { requireParticipant: async () => ({ id: participantId, name: 'Test Attendee' }), isPreviewing: async () => preview },
    '@/server/data': { getSessions: async () => [{ id: 'talk', type: 'talk', title: 'A talk' }],
      saveFeedback: async r => { if (failSave) throw Error('offline'); saved.push(r); },
      replacePreferences: async (...args) => { if (failSync) throw Error('offline'); synced.push(args); } },
    '@/server/feedback-options': feedbackOptions,
    '@/server/session-ratings': { flattenSessionRatingOptions: sessionRatings.flattenSessionRatingOptions, sessionRatingOptions: async () => sessionRatings.buildSessionRatingOptions(scheduledSessions, conversations, 'Kuhan Jeyapragasan') },
    '@/server/people': { personLookup: async () => new Map([[roster[1], { name: 'Partner' }]]) },
    '@/server/feedback-questions': { getFeedbackQuestions: async () => questions ?? [{ key: 'comment', type: 'text', enabled: true, required: true, label: 'A question' }] },
    '@/server/feedback': { normalizePreferenceName: feedback.normalizePreferenceName, MAX_ONE_TO_ONE_PICKS: 10, REPEATABLE_FORMS: new Set(['anytime']),
      feedbackForm: key => ['goals','friday','saturday','overall','anytime'].includes(key) ? { day: key === 'friday' ? '2026-10-23' : '', label: key } : null,
      feedbackFormOpen: async () => open, markFormCompleted: async (...args) => completed.push(args),
      oneToOneCandidates: async () => [{ key: roster[1], name: 'Partner' }], oneToOneConversations: async () => conversations },
  }, { console: { error() {} } });
  return { submitFeedback, saved, synced, completed };
}
async function submit(h, values) {
  const form = new FormData();
  for (const [key,value] of Object.entries(values)) form.set(key, value);
  try { await h.submitFeedback(form); assert.fail('Expected redirect'); } catch (e) { if (!e.redirect) throw e; return e.redirect; }
}
test('virtual live test identity signs in without entering the roster or incrementing login counters', async () => {
  const fixtures = { participants: [{ id: roster[0].split(':')[1], name: 'Real attendee', shortPassword: 'real-password', accessCount: 7 }], guests: [], feedbackResponses: [], preferences: [] };
  const data = load('server/data/index.ts', {
    '../airtable': { airtableConfigured: () => false }, '../session': { safeEqual: (a,b) => a === b },
    '../test-attendee': testAttendee, './types': types, './fixtures': fixtures,
  });
  const password = testAttendee.testAttendeePassword();
  assert.ok(password.length >= 24);
  assert.equal(testAttendee.testAttendeePassword('short'), null);
  assert.ok(/^rec[A-Za-z0-9]{14}$/.test(testAttendee.TEST_PARTICIPANT_ID));
  assert.equal((await data.getParticipants()).length, 1);
  const match = await data.findPersonByPassword(password);
  assert.equal(match.id, testAttendee.TEST_PARTICIPANT_ID);
  assert.equal(match.role, 'participant');
  assert.equal((await data.getParticipant(match.id)).name, 'TEST Attendee');
  await data.recordLogin(match);
  assert.equal(fixtures.participants[0].accessCount, 7);
  assert.equal((await data.getParticipants()).length, 1);
  assert.equal(await data.findPersonByPassword('not-the-test-password'), null);
});

test('signed test participant can open every closed attendee page but cannot access admin', async () => {
  const secret = 'signed-live-test-secret'.repeat(3);
  const session = load('server/session.ts', { 'node:crypto': crypto }, { Buffer, process: { env: { DASHBOARD_SESSION_SECRET: secret } } });
  let token = session.createSessionToken({ role: 'participant', participantId: testAttendee.TEST_PARTICIPANT_ID }, secret);
  const auth = load('server/auth.ts', {
    'next/headers': { cookies: async () => ({ get: name => name === session.SESSION_COOKIE ? { value: token } : undefined }) },
    'next/navigation': { redirect: url => { throw Error(`redirect:${url}`); }, notFound: () => { throw Error('not-found'); } },
    './session': session, './test-attendee': testAttendee,
    './data': { getParticipant: async id => ({ ...testAttendee.TEST_PARTICIPANT, id }) },
    './portal-pages': { portalPageOpen: async () => false, portalHome: async () => '/dashboard/closed' },
  }, { Buffer, process: { env: { DASHBOARD_SESSION_SECRET: secret } } });
  for (const page of ['schedule', 'profile', 'directory', 'guests', 'feedback', 'readings', 'handbook']) {
    assert.equal((await auth.requireParticipant(page)).id, testAttendee.TEST_PARTICIPANT_ID);
  }
  assert.equal((await auth.requireDirectoryViewer()).participantId, testAttendee.TEST_PARTICIPANT_ID);
  assert.equal(await auth.isPreviewing(), false);
  await assert.rejects(auth.requireAdmin(), /not-found/);
  token = session.createSessionToken({ role: 'participant', participantId: roster[0].split(':')[1] }, secret);
  await assert.rejects(auth.requireParticipant('feedback'), /redirect:\/dashboard\/closed/);
});

test('closed forms cannot write feedback', async () => {
  for (const options of [{ open: false }]) {
    const h = actionHarness(options);
    assert.equal(await submit(h, { form: 'goals', comment: 'hello' }), '/dashboard/feedback');
    assert.equal(h.saved.length, 0);
  }
});
test('admin feedback tests validate closed forms without saving, syncing preferences, or marking completion', async () => {
  const questions = [{ key: 'one-on-one-picks', type: 'ranked', enabled: true, required: true, label: 'Requests' }];
  const h = actionHarness({ open: false, preview: true, questions });
  assert.equal(await submit(h, { form: 'friday', 'one-on-one-picks': roster[1] }), '/dashboard/feedback/friday?tested=1');
  assert.equal(h.saved.length, 0);
  assert.equal(h.synced.length, 0);
  assert.equal(h.completed.length, 0);
  assert.equal(await submit(h, { form: 'friday' }), '/dashboard/feedback/friday?error=1');
  const anytime = actionHarness({ preview: true });
  assert.equal(await submit(anytime, { form: 'anytime', comment: 'Test comment' }), '/dashboard/feedback?tested=1');
  assert.equal(anytime.saved.length, 0);
  const required = actionHarness({ preview: true });
  assert.equal(await submit(required, { form: 'goals' }), '/dashboard/feedback/goals?error=1');
  assert.equal(required.saved.length, 0);
});
test('live test attendee submits closed feedback through storage, stays marked when anonymous is checked, and never changes pairings', async () => {
  const h = actionHarness({ open: false, participantId: testAttendee.TEST_PARTICIPANT_ID });
  assert.equal(await submit(h, { form: 'anytime', comment: 'Live storage check', anonymous: 'on' }), '/dashboard/feedback?saved=1');
  assert.equal(h.saved[0].isTest, true);
  assert.equal(h.saved[0].participantId, '');
  assert.equal(h.saved[0].participantName, '');
  const friday = actionHarness({ open: false, participantId: testAttendee.TEST_PARTICIPANT_ID,
    questions: [{ key: 'one-on-one-picks', type: 'ranked', enabled: true, required: true }] });
  assert.match(await submit(friday, { form: 'friday', 'one-on-one-picks': 'Partner' }), /saved=1/);
  assert.equal(friday.saved.length, 1);
  assert.equal(friday.saved[0].preferenceTargets[0], roster[1]);
  assert.equal(friday.synced.length, 0);
});

test('required answers are checked on the server', async () => {
  const h = actionHarness();
  assert.match(await submit(h, { form: 'goals', comment: '   ' }), /error=1/);
  assert.equal(h.saved.length, 0);
});
test('anonymous anytime feedback removes identity and never marks complete', async () => {
  const h = actionHarness();
  assert.match(await submit(h, { form: 'anytime', comment: 'hello', anonymous: 'on' }), /saved=1/);
  assert.equal(h.saved[0].participantId, '');
  assert.equal(h.saved[0].participantName, '');
  assert.equal(h.completed.length, 0);
});
test('feedback remains successful if secondary preference sync fails', async () => {
  const h = actionHarness({ failSync: true, questions: [{ key: 'one-on-one-picks', type: 'ranked', enabled: true, required: true, label: 'Requests' }] });
  assert.match(await submit(h, { form: 'friday', 'one-on-one-picks': `${roster[1]}\n${roster[1]}\ninvalid` }), /saved=1/);
  assert.equal(h.saved[0].preferenceTargets.join(','), roster[1]);
  assert.equal(h.completed.length, 1);
});
test('written 1:1 requests preserve unmatched names and resolve numbered and bulleted names', async () => {
  const h = actionHarness({ questions: [{ key: 'one-on-one-picks', type: 'ranked', enabled: true, required: true, label: 'Requests' }] });
  const written = '1. Partner\n2. Yashvardan Sharma\n• Partner';
  assert.match(await submit(h, { form: 'friday', 'one-on-one-picks': written }), /saved=1/);
  assert.equal(h.saved[0].answers['one-on-one-picks'], written);
  assert.equal(h.saved[0].preferenceTargets.join(','), roster[1]);
  const unmatched = actionHarness({ questions: [{ key: 'one-on-one-picks', type: 'ranked', enabled: true, required: true, label: 'Requests' }] });
  assert.match(await submit(unmatched, { form: 'friday', 'one-on-one-picks': 'Someone missing from the roster' }), /saved=1/);
  assert.equal(unmatched.saved[0].answers['one-on-one-picks'], 'Someone missing from the roster');
});
test('daily guest options use organizer lists and directory bios without requiring headshots', async () => {
  const guests = feedback.ONE_TO_ONE_GUESTS.saturday
    .filter(name => name !== 'Yashvardan Sharma').map((name, i) => ({
      id: `guest${i}`, name: name === 'Geneva Kirk-Drayson' ? 'Geneva Kirk Drayson ' : name,
      bio: `Bio for ${name}`, title: '', organization: '', hidden: name === 'Kuhan Jeyapragasan',
      email: 'private@example.com', shortPassword: 'private phrase',
    }));
  const f = feedbackHarness({ getGuests: async () => guests, getParticipants: async () => [
    { id: 'self', name: 'Self', bio: '' }, { id: 'other', name: 'Other Attendee', bio: '' },
  ] });
  for (const day of ['friday']) {
    const options = await f.oneToOneGuestOptions(day);
    assert.equal(options.map(g => g.name).join('|'), feedback.ONE_TO_ONE_GUESTS.saturday.join('|'));
    for (const option of options) {
      if (option.name === 'Yashvardan Sharma') { assert.equal(option.person, undefined); continue; }
      assert.equal(option.person.bio, `Bio for ${option.name}`);
      assert.equal(option.person.email, undefined);
      assert.equal(option.person.shortPassword, undefined);
    }
  }
  const candidates = await f.oneToOneCandidates('self', 'friday');
  assert.ok(candidates.some(p => p.name === 'Other Attendee'));
  assert.ok(candidates.some(p => p.name === 'Kuhan Jeyapragasan'));
  assert.ok(!candidates.some(p => p.name === 'Self' || p.name === 'Ben Hayum'));
  assert.equal((await f.oneToOneGuestOptions('saturday')).length, 0);
  assert.equal((await f.oneToOneCandidates('self', 'saturday')).length, 0);
});
test('primary storage failures return an error and never mark feedback complete', async () => {
  const h = actionHarness({ failSave: true });
  assert.match(await submit(h, { form: 'goals', comment: 'hello' }), /error=save/);
  assert.equal(h.completed.length, 0);
});
test('0–10 ratings preserve zero and reject out-of-range required values', async () => {
  const h = actionHarness({ questions: [{ key: 'scale-value', type: 'rating', scale: '0-10', enabled: true, required: true, label: 'Value' }] });
  assert.match(await submit(h, { form: 'overall', 'scale-value': '0' }), /saved=1/);
  assert.equal(h.saved[0].ratings.value, 0);
  assert.match(await submit(h, { form: 'overall', 'scale-value': '11' }), /error=1/);
});
test('overall session ratings accept only actual options and allow every rating to be skipped', async () => {
  const questions = [{ key: 'session-ratings', type: 'sessions', enabled: true }];
  const conversations = [{ id: 'own', partner: 'Partner', day: 'Saturday', date: '2026-10-24', start: '2026-10-24T09:00', timeLabel: '9–9:30' }];
  const h = actionHarness({ questions, conversations });
  await submit(h, { form: 'overall', 'rating-conv-own': '5', 'rating-conv-forged': '1', 'comment-conv-forged': 'junk', 'rating-informal-socializing': '4' });
  assert.equal(h.saved[0].sessions.find(s => s.sessionId === 'conv-own').rating, 5);
  assert.match(h.saved[0].sessions.find(s => s.sessionId === 'conv-own').title, /Partner/);
  assert.ok(!h.saved[0].sessions.some(s => s.sessionId === 'conv-forged'));
  assert.equal(h.saved[0].sessions.find(s => s.sessionId === 'informal-socializing').rating, 4);
  const skipped = actionHarness({ questions, conversations });
  assert.match(await submit(skipped, { form: 'overall', 'rating-conv-own': '' }), /saved=1/);
  assert.ok(skipped.saved[0].sessions.every(s => s.rating === null));
  const hidden = actionHarness({ questions: [{ ...questions[0], enabled: false }], conversations });
  await submit(hidden, { form: 'overall', 'rating-conv-own': '5' });
  assert.equal(hidden.saved[0].sessions.length, 0);
});

test('rotating Q&A session and guest ratings save independently with stable ids and optional omissions', async () => {
  const scheduledSessions = [{ ...talkSession, id: 'qa', title: 'Rotating Q&As', type: 'small-group', speaker: 'Guest A, Guest B' }];
  const questions = [{ key: 'session-ratings', type: 'sessions', enabled: true }];
  const h = actionHarness({ questions, scheduledSessions });
  await submit(h, { form: 'overall', 'rating-qa': '4', 'rating-qa-guest-guesta': '5', 'rating-qa-guest-forged': '2' });
  const rows = h.saved[0].sessions;
  assert.equal(rows.find(s => s.sessionId === 'qa').rating, 4);
  assert.equal(rows.find(s => s.sessionId === 'qa-guest-guesta').rating, 5);
  assert.equal(rows.find(s => s.sessionId === 'qa-guest-guestb').rating, null);
  assert.ok(!rows.some(s => s.sessionId === 'qa-guest-forged'));
  const guestOnly = actionHarness({ questions, scheduledSessions });
  await submit(guestOnly, { form: 'overall', 'rating-qa-guest-guestb': '3' });
  assert.equal(guestOnly.saved[0].sessions.find(s => s.sessionId === 'qa').rating, null);
  assert.equal(guestOnly.saved[0].sessions.find(s => s.sessionId === 'qa-guest-guestb').rating, 3);
});

test('new overall experience questions validate and store food, venue, and written answers', async () => {
  const q = load('server/feedback-questions.ts', { './data': {} });
  const questions = q.defaultFeedbackQuestions('overall').filter(item => q.OVERALL_EXPERIENCE_KEYS.includes(item.key));
  const h = actionHarness({ questions });
  assert.match(await submit(h, { form: 'overall' }), /error=1/);
  assert.equal(h.saved.length, 0);
  assert.match(await submit(h, { form: 'overall', 'scale-food': '1', 'scale-venue': '5',
    'best-things': 'Useful sessions', 'worst-things': 'Too little time', 'conference-conversations': 'Attendees and guests' }), /saved=1/);
  assert.equal(h.saved[0].ratings.food, 1);
  assert.equal(h.saved[0].ratings.venue, 5);
  assert.equal(h.saved[0].answers['conference-conversations'], 'Attendees and guests');
});

test('session rating options consolidate Thursday, exclude logistics, and split rotating Q&A and published 1:1s', () => {
  const make = (id, title, type = 'talk', day = '2026-10-23', speaker = '') => ({ ...talkSession, id, title, type, day, speaker, start: `${day}T10:00`, end: `${day}T11:00` });
  const sessions = [
    make('thurs-arrival', 'Arrival', 'logistics', '2026-10-22'),
    make('thurs-dinner', 'Welcome dinner', 'meal', '2026-10-22'),
    make('thurs-games', 'Board Game Night', 'social', '2026-10-22'),
    make('breakfast', 'Informal Breakfast and Coworking', 'meal'),
    make('reflection', 'Daily Reflection', 'working-session'),
    make('morning', 'Morning Reflection', 'working-session'),
    make('transition', 'Q&A / Transition Period'),
    make('break', 'Break'), make('long-break', 'Long break', 'break'),
    make('monument', 'Optional Monument Trip and Headshots', 'social'),
    make('talk', 'A talk'), make('lunch', 'Lunch', 'meal'),
    make('dinner', 'Dinner', 'meal'), make('untyped-dinner', 'Dinner', 'social'),
    make('prep', 'Happy Hour Prep Session', 'working-session'),
    make('photo', 'Group Photo', 'social'), make('happy-hour', 'Happy Hour', 'social'),
    make('qa-intro', 'Rotating Q&A Introductions and Norms', 'panel'),
    make('pairs', '1:1s', 'one-to-one'),
    make('qa-fri', 'Rotating Q&As', 'small-group', '2026-10-23', 'Guest A, Guest B'),
    make('qa-sat', 'Rotating Q&As', 'small-group', '2026-10-24', 'Guest C, Guest D'),
  ];
  const conversations = ['S1', 'S2'].map((half, i) => ({ id: half, sessionId: 'pairs', date: '2026-10-23', start: `2026-10-23T10:${i ? '30' : '00'}`, day: 'Friday', timeLabel: i ? '10:30–11' : '10–10:30', partner: `Partner ${i + 1}` }));
  const options = sessionRatings.buildSessionRatingOptions(sessions, conversations, 'Kuhan Jeyapragasan');
  const titles = options.map(s => s.title);
  assert.equal(titles.filter(t => t === 'Thursday evening dinner and activities').length, 1);
  assert.ok(titles.includes('Informal socializing'));
  assert.ok(!titles.includes('Lunch'));
  assert.ok(!titles.includes('Dinner'));
  assert.ok(!titles.includes('Happy Hour Prep Session'));
  assert.ok(!titles.includes('Group Photo'));
  assert.ok(!titles.includes('Rotating Q&A Introductions and Norms'));
  assert.ok(titles.includes('Happy Hour'));
  assert.ok(!titles.some(t => /break|reflection|transition|monument|welcome dinner|board game|^1:1s$/i.test(t)));
  assert.equal(titles.filter(t => t.startsWith('1:1 with ')).length, 2);
  assert.equal(options.filter(s => s.guests).length, 2);
  assert.equal(options.find(s => s.id === 'qa-fri').guests.length, 2);
  assert.equal(options.find(s => s.id === 'qa-sat').guests.length, 3);
  const flat = sessionRatings.flattenSessionRatingOptions(options);
  assert.equal(flat.filter(s => s.title.startsWith('Rotating Q&A with ')).length, 5);
  assert.ok(flat.some(s => s.title === 'Rotating Q&A with Kuhan Jeyapragasan' && s.timeLabel.startsWith('Saturday')));
  assert.ok(options.some(s => s.id === 'qa-fri'));
  assert.ok(options.some(s => s.id === 'qa-sat'));
  assert.equal(new Set(options.map(s => s.id)).size, options.length);
  assert.equal(sessions.find(s => s.id === 'qa-sat').speaker, 'Guest C, Guest D', 'private addition never mutates the schedule');
});

// Exercise the real data mapper and HTTP client; the fake service keeps Airtable
// field-ID response semantics, including pagination and POST/PATCH round trips.
function airtableHarness() {
  const records = [];
  const env = { AIRTABLE_API_TOKEN: 'test-token', AIRTABLE_CACHE_TTL_SECONDS: '0' };
  let settingsPage = 0;
  const airtable = load('server/airtable.ts', {}, { process: { env }, fetch: async (url, init) => {
    const u = new URL(url);
    let result;
    if (u.pathname.includes('tblhmi9HvNpiwh8Dm')) {
      settingsPage++;
      result = u.searchParams.has('offset') ? { records: [{ id: 'second', fields: {} }] } : { records: [{ id: 'first', fields: {} }], offset: 'next' };
    } else if (init.method === 'POST') {
      result = { records: JSON.parse(init.body).records.map((r,i) => ({ ...r, id: `rec${records.length+i}` })) };
      records.push(...result.records);
    } else if (init.method === 'PATCH') {
      const row = records.find(r => r.id === u.pathname.split('/').at(-1));
      row.fields = JSON.parse(init.body).fields; result = row;
    } else result = { records };
    return { ok: true, json: async () => result };
  } });
  const data = load('server/data/index.ts', { '../airtable': airtable, '../test-attendee': testAttendee, '../session': {}, './types': types, './fixtures': {} });
  return { airtable, data, records, settingsPages: () => settingsPage };
}
test('all six feedback forms round-trip answers, ratings, labels, targets through Airtable fields', async () => {
  const h = airtableHarness();
  for (const form of ['goals','friday','saturday','overall','one-on-ones','anytime']) {
    await h.data.saveFeedback({ form, participantId: 'test-person', participantName: 'Test', date: '',
      answers: { question: 'Multiline\n## literal separator', 'one-on-one-picks': '1. Partner' },
      ratings: { day: 4, satisfaction: 0 }, questionLabels: { question: 'Original wording' }, preferenceTargets: [roster[1]],
      sessions: [{ sessionId: 'talk', title: 'Title', rating: 5, comment: 'Useful' }], submittedAt: '2026-10-19T12:00:00Z' });
  }
  const responses = await h.data.getFeedback();
  assert.equal(responses.length, 6);
  for (const r of responses) {
    assert.equal(r.answers.question, 'Multiline\n## literal separator');
    assert.equal(r.ratings.satisfaction, 0);
    assert.equal(r.questionLabels.question, 'Original wording');
    assert.equal(r.preferenceTargets[0], roster[1]);
    assert.equal(r.sessions[0].comment, 'Useful');
  }
  const update = { ...responses.find(r => r.form === 'goals'), answers: { question: 'Updated goal' } };
  await h.data.saveFeedback(update);
  assert.equal(h.records.length, 6, 'goal updates replace existing response');
  assert.equal((await h.data.getFeedback()).find(r => r.form === 'goals').answers.question, 'Updated goal');
});
test('Airtable round trip marks live test feedback and excludes it from normal reads', async () => {
  const h = airtableHarness();
  await h.data.saveFeedback({ form: 'overall', isTest: true, participantId: testAttendee.TEST_PARTICIPANT_ID,
    participantName: 'TEST Attendee', date: '', answers: { 'overall-thoughts': 'Live test' }, ratings: { food: 4 },
    sessions: [{ sessionId: 'talk', title: 'Talk', rating: 5, comment: '' }], preferenceTargets: [roster[1]], submittedAt: '2026-10-20T22:00:00Z' });
  assert.equal((await h.data.getFeedback()).length, 0);
  const saved = (await h.data.getFeedback({ includeTests: true }))[0];
  assert.equal(saved.isTest, true);
  assert.equal(saved.answers['overall-thoughts'], 'Live test');
  assert.equal(saved.ratings.food, 4);
  assert.equal(saved.sessions[0].rating, 5);
  assert.ok(!('__isTest' in saved.answers));
  assert.ok(Object.values(h.records[0].fields).some(value => typeof value === 'string' && value.startsWith('TEST ·')));
});

test('settings pagination reads form toggles past the first 100 rows', async () => {
  const h = airtableHarness();
  assert.equal((await h.airtable.fetchSettings()).length, 2);
  assert.equal(h.settingsPages(), 2);
});
test('question editor definitions persist and restore order, scale, required and visibility', async () => {
  const settings = [];
  const q = load('server/feedback-questions.ts', { './data': {
    getPortalPageSettings: async () => settings,
    savePortalPageSetting: async (audience,key,label,enabled) => settings.push({ audience,key,label,enabled }),
  } });
  const questions = q.defaultFeedbackQuestions('goals');
  assert.equal(questions.length, 5);
  questions[0].label = 'Updated blocker question'; questions[0].enabled = false;
  questions[1].type = 'rating'; questions[1].scale = '0-10';
  await q.saveFeedbackQuestions('goals', questions);
  const restored = await q.getFeedbackQuestions('goals');
  assert.equal(restored[0].label, 'Updated blocker question');
  assert.equal(restored[0].enabled, false);
  assert.equal(restored[1].scale, '0-10');
  assert.equal(restored[1].required, true);
  assert.equal(q.validateQuestions([{...questions[0], type:'ranked'}], 'goals'), null);
});

test('only Friday requests Saturday 1:1s, including when stored Saturday questions still have the old field', async () => {
  const settings = [];
  const q = load('server/feedback-questions.ts', { './data': {
    getPortalPageSettings: async () => settings, savePortalPageSetting: async () => {},
  } });
  const friday = q.defaultFeedbackQuestions('friday');
  const saturday = q.defaultFeedbackQuestions('saturday');
  assert.equal(friday.filter(q => q.type === 'ranked').length, 1);
  assert.match(friday.find(q => q.type === 'ranked').label, /Saturday/);
  assert.equal(saturday.filter(q => q.type === 'ranked').length, 0);
  assert.equal(q.validateQuestions(friday, 'saturday'), null);
  settings.push({ audience: 'all', key: 'questions:saturday', label: JSON.stringify([
    { ...saturday[0], label: 'Custom Saturday question' }, friday.find(q => q.type === 'ranked'),
  ]) });
  const restored = await q.getFeedbackQuestions('saturday');
  assert.equal(restored[0].label, 'Custom Saturday question');
  assert.equal(restored.length, 1);
  const h = actionHarness({ questions: [{ key: 'comment', type: 'text', enabled: true, required: true }] });
  await submit(h, { form: 'saturday', comment: 'Saturday reflection', 'one-on-one-picks': 'Partner' });
  assert.equal(h.synced.length, 0);
  assert.equal(h.saved[0].preferenceTargets.length, 0);
  assert.equal(h.saved[0].answers['one-on-one-picks'], undefined);
});

test('overall feedback retires duplicate conversation sections and preserves customized questions', async () => {
  const settings = [];
  const q = load('server/feedback-questions.ts', { './data': {
    getPortalPageSettings: async () => settings, savePortalPageSetting: async () => {},
  } });
  const defaults = q.defaultFeedbackQuestions('overall');
  assert.equal(defaults.filter(q => q.type === 'conversations').length, 0);
  assert.equal(defaults.filter(q => q.type === 'sessions').length, 1);
  settings.push({ audience: 'all', key: 'questions:overall', label: JSON.stringify([
    { ...defaults[0], label: 'Custom overall question', position: 10 },
    { ...defaults[0], key: 'conversation-ratings', type: 'conversations', position: 11 },
    { ...defaults[0], key: 'one-on-ones-overall', type: 'text', required: true, position: 11 },
    { ...defaults.find(q => q.type === 'sessions'), enabled: false, position: 12 },
  ]) });
  const migrated = await q.getFeedbackQuestions('overall');
  assert.equal(migrated[0].label, 'Custom overall question');
  assert.equal(migrated.filter(q => q.type === 'conversations').length, 0);
  assert.equal(migrated.find(q => q.type === 'sessions').enabled, false);
  assert.ok(!migrated.some(q => q.key === 'one-on-ones-overall'));
  assert.ok(!defaults.some(q => q.key === 'one-on-ones-overall'));
  assert.equal(defaults[0].key, 'overall-thoughts');
  assert.equal(defaults[0].required, true);
  assert.equal(migrated.filter(q => q.key === 'overall-thoughts').length, 1);
  for (const key of q.OVERALL_EXPERIENCE_KEYS) {
    assert.equal(migrated.filter(item => item.key === key).length, 1);
    assert.equal(defaults.find(item => item.key === key).required, true);
  }
  assert.equal(defaults.find(q => q.key === 'scale-food').scale, '1-5');
  assert.equal(defaults.find(q => q.key === 'scale-venue').scale, '1-5');
  const clarity = migrated.filter(q => q.key.startsWith('scale-clarity-'));
  assert.equal(clarity.length, 2);
  assert.ok(clarity.every(q => q.type === 'rating' && q.scale === '0-10' && q.required));
  clarity[0].label = 'Custom clarity wording';
  clarity[0].enabled = false;
  settings[0].label = JSON.stringify(migrated);
  const restored = await q.getFeedbackQuestions('overall');
  assert.equal(restored.filter(q => q.key.startsWith('scale-clarity-')).length, 2);
  assert.equal(restored.find(q => q.key === clarity[0].key).label, 'Custom clarity wording');
  assert.equal(restored.find(q => q.key === clarity[0].key).enabled, false);
  assert.equal(restored[0].label, 'Custom overall question');
  for (const key of q.OVERALL_EXPERIENCE_KEYS) assert.equal(restored.filter(item => item.key === key).length, 1);
});

test('admin generation respects availability/exclusions, drafts stay private, and release/hide preserve the draft', async () => {
  const schedule = [{ id: 'block', type: 'one-to-one', day: '2026-10-24', start: '2026-10-24T10:00', end: '2026-10-24T11:00', location: 'Meeting area' },
    { id: 'sgd', type: 'small-group' }];
  let assignments = [{ id:'excluded', sessionId:'block', personKey:roster[2], group:types.PAIRING_EXCLUDED, state:'draft', kind:'1:1', location:'' }];
  const replacements = [];
  const actions = load('app/dashboard/admin/actions.ts', {
    'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect: url => { throw Object.assign(Error(url), { redirect: url }); } },
    'next/headers': {}, '@/server/test-attendee': testAttendee, '@/server/auth': { requireAdmin: async () => {} },
    '@/server/data': { getSessions: async () => schedule, getParticipants: async () => roster.slice(0,3).map(key => ({ id:key.split(':')[1] })),
      getGuests: async () => [{ id:roster[3].split(':')[1], availability:'date,start,end\n2026-10-24,10:30,11:00' }],
      getAssignments: async () => assignments, getPreferences: async () => [],
      replaceAssignments: async (ids, rows, state) => {
        replacements.push({ ids,rows,state });
        assignments = assignments.filter(a => !ids.includes(a.sessionId) || a.state !== state || a.group === types.PAIRING_EXCLUDED)
          .concat(rows.map((r,i) => ({...r, id:`${state}-${i}`, state })));
      } },
    '@/server/availability': { parseAvailability: () => [{ date:'2026-10-24', start:630, end:660 }] },
    '@/server/schedule': { SLOT_MINUTES:15, minutesOf: value => Number(value.slice(11,13))*60 + Number(value.slice(14,16)) },
    '@/server/data/types': types, '@/server/portal-pages': {}, '@/server/session': {}, '@/server/feedback': {}, '@/server/pairings':pairings, '@/lib/pairing-planner':planner, '@/server/pairing-roster':pairingRosterHelpers,
  });
  async function call(action, sessionId = 'block') {
    const form = new FormData(); form.set('sessionId',sessionId);
    try { await action(form); assert.fail('Expected redirect'); } catch(e) { if (!e.redirect) throw e; return e.redirect; }
  }
  assert.match(await call(actions.generatePairings), /generated=/);
  assert.ok(!assignments.some(a => a.state === 'published'));
  assert.ok(!replacements[0].rows.some(r => r.personKey === roster[2]));
  assert.ok(!replacements[0].rows.some(r => r.personKey === roster[3] && r.group.startsWith('S1')));
  assert.match(await call(actions.publishPairings), /published=/);
  assert.ok(assignments.some(a => a.state === 'published'));
  assert.ok(!assignments.some(a => a.state === 'published' && a.group === types.PAIRING_EXCLUDED));
  assert.match(await call(actions.hidePairings), /hidden=/);
  assert.ok(!assignments.some(a => a.state === 'published'));
  assert.ok(assignments.some(a => a.state === 'draft' && a.group !== types.PAIRING_EXCLUDED));
  assert.match(await call(actions.generatePairings,'sgd'), /error=session/);
});

const planner = load('lib/pairing-planner.ts');
const availability = load('server/availability.ts', { './schedule': scheduleHelpers });
const pairingRosterHelpers = load('server/pairing-roster.ts', { './pairings': pairings, './availability': availability, './schedule': scheduleHelpers });

test('visual moves displace occupied slots, preserve the roster, and do not erase a neighbor on a self-drop', () => {
  const round = { eligible: roster, groups: [
    { id: 'a', members: [roster[0], roster[1]], location: 'Lobby' },
    { id: 'b', members: [roster[2], roster[3]], location: 'Garden' },
  ] };
  assert.equal(planner.movePerson(round, roster[0], 'a', 0), round);
  const moved = planner.movePerson(round, roster[0], 'b', 1);
  assert.deepEqual(Array.from(moved.groups[1].members), [roster[2], roster[0]]);
  assert.deepEqual(Array.from(moved.groups[0].members), [roster[1]]);
  assert.equal(moved.groups[1].location, 'Garden');
  assert.equal(new Set(moved.groups.flatMap(g => g.members)).size, 3);
  assert.equal(round.groups[0].members.length, 2, 'input remains unchanged');
  assert.equal(planner.movePerson(round, 'guest:unknown', 'a'), round);
  const unavailable = { ...round, eligible: roster.slice(1) };
  assert.ok(!planner.movePerson(unavailable, roster[0], '').groups.some(g => g.members.includes(roster[0])));
});

test('manual draft validates eligibility per half, capacity, duplicate assignments, and canonical labels', () => {
  const groups = [
    { groups: [{ members: [roster[0], roster[1]], location: 'Lobby' }] },
    { groups: [{ members: [roster[0], roster[2], roster[3]], location: 'Garden' }] },
  ];
  const eligible = [roster.slice(0, 3), roster];
  const rows = planner.planAssignments(groups, 'block', eligible);
  assert.equal(rows.length, 5);
  assert.equal(rows[0].group, 'S1 · 1:1 01');
  assert.equal(rows[4].group, 'S2 · 1:1 01');
  assert.equal(rows[4].location, 'Garden');
  const bad = value => assert.equal(planner.planAssignments(value, 'block', eligible), null);
  bad(null); bad([{}]);
  bad([{ groups: [{ members: [roster[0], roster[3]], location: '' }] }, groups[1]]);
  bad([{ groups: [{ members: [roster[0]], location: '' }] }, groups[1]]);
  bad([{ groups: [{ members: roster, location: '' }] }, groups[1]]);
  bad([{ groups: [{ members: [roster[0], roster[0]], location: '' }] }, groups[1]]);
  bad([{ groups: [groups[0].groups[0], groups[0].groups[0]] }, groups[1]]);
});

test('manual save requires admin, uses current guest availability and exclusions, saves only draft, and retains edits on failure', async () => {
  const block = { id: 'block', type: 'one-to-one', day: '2026-10-24', start: '2026-10-24T10:00', end: '2026-10-24T11:00' };
  const assignments = [{ sessionId: 'block', personKey: roster[2], group: types.PAIRING_EXCLUDED }];
  let authorized = true, checks = 0, fail = false;
  const writes = [];
  const { savePairingDraft } = load('app/dashboard/admin/pairings/actions.ts', {
    'next/cache': { revalidatePath() {} }, '@/server/auth': { requireAdmin: async () => { checks++; if (!authorized) throw Error('Unauthorized'); } },
    '@/server/data': {
      getSessions: async () => [block], getParticipants: async () => roster.slice(0,3).map(key => ({ id: key.split(':')[1] })),
      getGuests: async () => [{ id: roster[3].split(':')[1], availability: 'date,start,end\n2026-10-24,10:30,11:00' }],
      getAssignments: async () => assignments,
      replaceAssignments: async (...args) => { if (fail) throw Error('offline'); writes.push(args); },
    }, '@/server/pairing-roster': pairingRosterHelpers, '@/lib/pairing-planner': planner,
  });
  const plan = [
    { groups: [{ members: [roster[0], roster[1]], location: 'Lobby' }] },
    { groups: [{ members: [roster[0], roster[3]], location: 'Garden' }] },
  ];
  assert.equal((await savePairingDraft('block', JSON.stringify(plan))).saved, true);
  assert.equal(writes.length, 1); assert.equal(writes[0][2], 'draft');
  const invalid = structuredClone(plan); invalid[0].groups[0].members[1] = roster[3];
  assert.ok((await savePairingDraft('block', JSON.stringify(invalid))).error, 'guest unavailable in first half');
  invalid[0].groups[0].members[1] = roster[2];
  assert.ok((await savePairingDraft('block', JSON.stringify(invalid))).error, 'excluded attendee');
  assert.ok((await savePairingDraft('missing', JSON.stringify(plan))).error);
  assert.ok((await savePairingDraft('block', 'bad-json')).error);
  assert.equal((await savePairingDraft('block', JSON.stringify([{ groups: [{members:[roster[0]],location:'NET'}] }, { groups: [] }]))).saved,true);
  assert.equal(writes[1][1].length,1);
  assert.equal((await savePairingDraft('block', JSON.stringify([{ groups: [] }, { groups: [] }]))).saved,true);
  assert.equal(writes.length, 3);
  assert.deepEqual(Array.from(writes[2][3]),[0,0]);
  fail = true; assert.match((await savePairingDraft('block', JSON.stringify(plan))).error, /edits are still here/);
  authorized = false;
  await assert.rejects(savePairingDraft('block', JSON.stringify(plan)), /Unauthorized/);
  assert.equal(checks, 9);
});

function assignmentStorageHarness() {
  const records = [];
  let sequence = 0, creates = 0, failCreate = 0, failDelete = false, onWrite;
  const airtable = load('server/airtable.ts', {}, {
    process: { env: { AIRTABLE_API_TOKEN: 'test-token', AIRTABLE_CACHE_TTL_SECONDS: '0' } },
    fetch: async (url, init) => {
      const u = new URL(url);
      if (init.method === 'POST') {
        creates++;
        if (creates === failCreate) return { ok: false, status: 503 };
        const added = JSON.parse(init.body).records.map(r => ({ ...r, id: `row-${++sequence}` }));
        records.push(...added);
        if (onWrite) await onWrite();
        return { ok: true, json: async () => ({ records: added }) };
      }
      if (init.method === 'DELETE') {
        if (failDelete) return { ok: false, status: 503 };
        const ids = u.searchParams.getAll('records[]');
        for (let i = records.length - 1; i >= 0; i--) if (ids.includes(records[i].id)) records.splice(i, 1);
        return { ok: true, json: async () => ({ records: ids.map(id => ({ id, deleted: true })) }) };
      }
      return { ok: true, json: async () => ({ records: records.map(r => ({ ...r, fields: { ...r.fields } })) }) };
    },
  });
  const data = load('server/data/index.ts', { '../airtable': airtable, '../test-attendee': testAttendee, '../session': {}, './types': types, './fixtures': {} }, { console: { error() {} } });
  return { records, data, failCreateAfter: batches => { failCreate = creates + batches; }, failDeletes: value => { failDelete = value; }, observe: callback => { onWrite = callback; } };
}
const assignmentRow = (personKey, group = 'S1 · 1:1 01', location = 'Lobby') => ({ sessionId: 'block', personKey, group, location, kind: '1:1' });

test('Airtable revisions expose old or complete new pairings during batched saves, including guest rows and empty hides', async () => {
  const h = assignmentStorageHarness();
  h.records.push(...roster.slice(0,2).map((key,i) => ({ id: `legacy-${i}`, fields: {
    Assignment: `Old assignment ${i}`, Session: ['block'], Attendee: [key.split(':')[1]], Group: 'S1 · 1:1 01', Kind: '1:1', State: 'published', Location: 'Old room',
  } })));
  const replacement = Array.from({ length: 24 }, (_,i) => assignmentRow(`participant:person${i}`, `S1 · 1:1 ${Math.floor(i/2)+1}`, 'New room'));
  replacement.push(assignmentRow(roster[3], 'S2 · 1:1 01'), assignmentRow(roster[0], 'S2 · 1:1 01'));
  const observed = [];
  h.observe(async () => observed.push((await h.data.getAssignments()).filter(a => a.state === 'published')));
  await h.data.replaceAssignments(['block'], replacement, 'published');
  assert.ok(observed.slice(0,-1).every(rows => rows.length === 2 && rows.every(r => r.location === 'Old room')), 'partially written revisions never appear');
  assert.equal(observed.at(-1).length, 26);
  assert.equal((await h.data.getPublishedAssignmentsFor(roster[3])).length, 1);
  assert.equal((await h.data.getGroupMembers('block', 'S2 · 1:1 01')).length, 2);
  await h.data.replaceAssignments(['block'], replacement.slice(0,2), 'draft');
  await h.data.replaceAssignments(['block'], [], 'published');
  assert.equal((await h.data.getPublishedAssignmentsFor(roster[3])).length, 0);
  assert.equal((await h.data.getAssignments()).filter(a => a.state === 'draft').length, 2);
  assert.ok(!(await h.data.getAssignments()).some(a => a.group === '__PAIRING_COMMIT__'));
});

test('failed batches and failed commits preserve the previous release; failed cleanup cannot duplicate partners', async () => {
  const h = assignmentStorageHarness();
  const previous = roster.slice(0,2).map(key => assignmentRow(key));
  await h.data.replaceAssignments(['block'], previous, 'published');
  h.failCreateAfter(2);
  const big = Array.from({length:24}, (_,i) => assignmentRow(`participant:p${i}`, `S1 · 1:1 ${Math.floor(i/2)+1}`));
  await assert.rejects(h.data.replaceAssignments(['block'], big, 'published'), /503/);
  assert.equal((await h.data.getAssignments()).length, 2);
  h.failCreateAfter(2); // Staging succeeds; commit fails.
  await assert.rejects(h.data.replaceAssignments(['block'], [assignmentRow(roster[0]), assignmentRow(roster[3])], 'published'), /503/);
  assert.deepEqual(Array.from((await h.data.getAssignments()).map(r=>r.personKey)).sort(), previous.map(r=>r.personKey).sort());
  h.failDeletes(true);
  await h.data.replaceAssignments(['block'], [assignmentRow(roster[0]), assignmentRow(roster[3])], 'published');
  const latest = await h.data.getAssignments();
  assert.equal(latest.length, 2, 'retired rows remain invisible when Airtable cleanup fails');
  assert.ok(latest.some(r => r.personKey === roster[3]));
  await h.data.replaceAssignments(['block'], [], 'published');
  assert.equal((await h.data.getAssignments()).length, 0, 'empty committed release does not fall back to older pairings');
});

test('conversation identities survive rerelease, renumbering and location changes but distinguish different partners', async () => {
  const h = assignmentStorageHarness();
  const session = { id:'block', title:'1:1s', type:'one-to-one', personalized:true, day:'2026-10-23', start:'2026-10-23T13:30', end:'2026-10-23T14:30', location:'NET', speaker:'', description:'' };
  const people = new Map(roster.map((key,i) => [key, {name:['Alice','Bob','Cara','Guest'][i]}]));
  const conversations = load('server/feedback.ts', {
    'node:crypto':crypto, 'next/headers':{}, './data': { ...h.data, getSessions:async()=>[session] },
    './people': { personLookup:async()=>people }, './schedule':scheduleHelpers, './availability':availability,
  });
  const show = async key => scheduleHelpers.buildSchedule({ sessions:[session], assignments:await h.data.getAssignments(), people, viewerKey:key }).flatMap(d=>d.blocks);
  await h.data.replaceAssignments(['block'], [assignmentRow(roster[0]), assignmentRow(roster[3])], 'draft');
  assert.equal((await conversations.oneToOneConversations(roster[0].split(':')[1])).length, 0);
  await h.data.replaceAssignments(['block'], [assignmentRow(roster[0]), assignmentRow(roster[3])], 'published');
  const first = (await conversations.oneToOneConversations(roster[0].split(':')[1]))[0];
  assert.equal(first.partner, 'Guest');
  assert.ok((await show(roster[3])).some(b=>b.title === '1:1 with Alice'));
  await h.data.replaceAssignments(['block'], [assignmentRow(roster[0], 'S1 · 1:1 03','Garden'), assignmentRow(roster[3], 'S1 · 1:1 03','Garden')], 'published');
  const second = (await conversations.oneToOneConversations(roster[0].split(':')[1]))[0];
  assert.equal(first.id, second.id);
  assert.ok((await show(roster[0])).some(b=>b.detail.location === 'Garden'));
  await h.data.replaceAssignments(['block'], [assignmentRow(roster[0]), assignmentRow(roster[1]), assignmentRow(roster[2])], 'published');
  const third = (await conversations.oneToOneConversations(roster[0].split(':')[1]))[0];
  assert.notEqual(third.id, first.id);
  assert.equal(third.partner, 'Bob and Cara');
  assert.ok(!(await show(roster[3])).some(b=>b.mine));
  await h.data.replaceAssignments(['block'], [], 'published');
  assert.equal((await conversations.oneToOneConversations(roster[0].split(':')[1])).length, 0);
});

test('feedback opened before a pairing change keeps the actual conversation and rating and refuses forged snapshots', async () => {
  const options = [{ id:'conv-original-conversation', title:'1:1 with Guest', speaker:'', timeLabel:'Friday · 1:30pm – 2pm', sortKey:'2026-10-23T13:30' }];
  const token = feedbackOptions.signFeedbackOptions('recAAAAAAAAAAAAAA', options);
  assert.equal(feedbackOptions.readFeedbackOptions(token, 'someone-else'), null);
  assert.equal(feedbackOptions.readFeedbackOptions(token + 'tampered', 'recAAAAAAAAAAAAAA'), null);
  const h = actionHarness({ questions:[{ key:'sessions', type:'sessions', enabled:true, required:false, label:'Sessions' }], conversations:[{
    id:'replacement', partner:'New Guest', day:'Friday', date:'2026-10-23', start:'2026-10-23T13:30', timeLabel:'1:30pm – 2pm',
  }] });
  assert.match(await submit(h, {form:'overall','session-options':token,'rating-conv-original-conversation':'5','comment-conv-original-conversation':'Great conversation'}), /saved=1/);
  assert.equal(h.saved[0].sessions.length, 1);
  assert.equal(h.saved[0].sessions[0].title, '1:1 with Guest');
  assert.equal(h.saved[0].sessions[0].rating, 5);
  assert.equal(h.saved[0].sessions[0].comment, 'Great conversation');
  assert.match(await submit(h, {form:'overall','session-options':token+'tampered'}), /error=options/);
  assert.equal(h.saved.length, 1);
});

test('admin lifecycle saves, releases, adds people, swaps partners and hides without rewriting feedback or leaking drafts', async () => {
  const session = { id:'block', title:'1:1s', type:'one-to-one', personalized:true, day:'2026-10-23', start:'2026-10-23T13:30', end:'2026-10-23T14:30', location:'NET', speaker:'', description:'' };
  const fixtures = { sessions:[session], assignments:[], participants:roster.slice(0,3).map((key,i)=>({id:key.split(':')[1],name:['Alice','Bob','Cara'][i]})),
    guests:[{id:roster[3].split(':')[1],name:'Guest',availability:'date,start,end\n2026-10-23,14:00,14:30'}], feedbackResponses:[], portalPageSettings:[] };
  const data = load('server/data/index.ts', { '../airtable':{airtableConfigured:()=>false}, '../test-attendee':testAttendee, '../session':{}, './types':types, './fixtures':fixtures });
  const redirect = url => { throw Object.assign(Error(url), { redirect:url }); };
  const admin = load('app/dashboard/admin/actions.ts', {
    'next/cache':{revalidatePath(){}}, 'next/navigation':{redirect}, 'next/headers':{}, '@/server/test-attendee':testAttendee,
    '@/server/auth':{requireAdmin:async()=>{}}, '@/server/data':data, '@/server/availability':availability, '@/server/schedule':scheduleHelpers,
    '@/server/data/types':types, '@/server/portal-pages':{}, '@/server/session':{}, '@/server/feedback':{}, '@/server/pairings':pairings,
    '@/lib/pairing-planner':planner, '@/server/pairing-roster':pairingRosterHelpers,
  });
  const draftAction = load('app/dashboard/admin/pairings/actions.ts', {
    'next/cache':{revalidatePath(){}}, '@/server/auth':{requireAdmin:async()=>{}}, '@/server/data':data,
    '@/server/pairing-roster':pairingRosterHelpers, '@/lib/pairing-planner':planner,
  });
  const peopleHelpers = load('server/people.ts', {'./data':data});
  const f = load('server/feedback.ts', { 'node:crypto':crypto, 'next/headers':{}, './data':data, './people':peopleHelpers, './schedule':scheduleHelpers, './availability':availability });
  const ownId = roster[0].split(':')[1];
  const conversations = () => f.oneToOneConversations(ownId);
  const currentTitle = async () => scheduleHelpers.buildSchedule({ sessions:[session], assignments:await data.getAssignments(), people:await peopleHelpers.personLookup(), viewerKey:roster[0] }).flatMap(d=>d.blocks).find(b=>b.key==='block-S1').title;
  const plan = (a,b) => [{groups:a.map(members=>({members,location:'Lobby'}))},{groups:b.map(members=>({members,location:'Garden'}))}];
  async function call(action) { const form=new FormData(); form.set('sessionId','block'); try { await action(form); assert.fail('Expected redirect'); } catch(e) { if(!e.redirect) throw e; return e.redirect; } }
  const original = plan([[roster[0],roster[1]]], [[roster[0],roster[3]]]);
  assert.equal((await draftAction.savePairingDraft('block',JSON.stringify(original))).saved,true);
  assert.equal((await conversations()).length,0);
  assert.match(await call(admin.publishPairings),/published=/);
  assert.equal(await currentTitle(),'1:1 with Bob');
  const shown = sessionRatings.buildSessionRatingOptions([session],await conversations(),'Kuhan');
  const signed = feedbackOptions.signFeedbackOptions(ownId,shown);
  const ratedConversation = shown.find(o=>o.title==='1:1 with Bob');
  await data.saveFeedback({form:'overall',participantId:ownId,participantName:'Alice',date:'',sessions:[{sessionId:ratedConversation.id,title:ratedConversation.title,rating:5,comment:'Original feedback'}],answers:{},ratings:{},submittedAt:'2026-10-23T18:00:00Z'});
  const guestKey='guest:recEEEEEEEEEEEEEE', attendeeKey='participant:recFFFFFFFFFFFFFF';
  fixtures.guests.push({id:guestKey.split(':')[1],name:'New Guest',availability:'date,start,end\n2026-10-23,13:30,14:30'});
  fixtures.participants.push({id:attendeeKey.split(':')[1],name:'New Attendee'});
  const edited = plan([[roster[0],guestKey],[roster[1],roster[2],attendeeKey]], [[roster[0],attendeeKey],[roster[1],roster[3]]]);
  assert.equal((await draftAction.savePairingDraft('block',JSON.stringify(edited))).saved,true);
  assert.equal(await currentTitle(),'1:1 with Bob','saving edits after release leaves existing live schedules intact');
  fixtures.guests.at(-1).availability='';
  assert.match(await call(admin.publishPairings),/error=roster/,'release rechecks changed availability');
  assert.equal(await currentTitle(),'1:1 with Bob');
  fixtures.guests.at(-1).availability='date,start,end\n2026-10-23,13:30,14:30';
  assert.match(await call(admin.publishPairings),/published=/);
  assert.equal(await currentTitle(),'1:1 with New Guest');
  assert.ok((await conversations()).some(c=>c.partner==='New Attendee'));
  assert.ok((await data.getPublishedAssignmentsFor(attendeeKey)).length===2);
  const fresh = sessionRatings.buildSessionRatingOptions([session],await conversations(),'Kuhan');
  assert.ok(fresh.some(o=>o.title==='1:1 with New Guest'));
  assert.ok(!fresh.some(o=>o.title==='1:1 with Bob'));
  assert.ok(feedbackOptions.readFeedbackOptions(signed,ownId).some(o=>o.title==='1:1 with Bob'),'an already-open form retains its own verified conversation labels');
  assert.equal((await data.getFeedback())[0].sessions[0].title,'1:1 with Bob');
  assert.equal((await data.getFeedback())[0].sessions[0].rating,5);
  assert.match(await call(admin.hidePairings),/hidden=/);
  assert.equal((await conversations()).length,0);
  assert.ok(!(await data.getAssignments()).some(a=>a.state==='published'));
  assert.ok((await data.getAssignments()).some(a=>a.state==='draft'));
  assert.match(await call(admin.publishPairings),/published=/);
  assert.equal(await currentTitle(),'1:1 with New Guest');
});

test('new guests enabled for a Saturday 1:1 half become Friday request options with their real directory profiles', async () => {
  const f = feedbackHarness({ getGuests:async()=>[
    {id:'new',name:'New Guest',availability:'date,start,end\n2026-10-24,12:00,12:30',bio:'New profile',organization:'New organization'},
    {id:'partial',name:'Too brief',availability:'date,start,end\n2026-10-24,12:15,12:30'},
    {id:'wrong-day',name:'Friday only',availability:'date,start,end\n2026-10-23,11:30,12:30'},
  ], getSessions:async()=>[{type:'one-to-one',day:'2026-10-24',start:'2026-10-24T11:30',end:'2026-10-24T12:30'}] });
  const options=await f.oneToOneGuestOptions('friday');
  assert.equal(options.find(o=>o.name==='New Guest').person.key,'guest:new');
  assert.equal(options.find(o=>o.name==='New Guest').person.bio,'New profile');
  assert.ok(!options.some(o=>o.name==='Too brief'||o.name==='Friday only'));
});

test('unfinished and entirely empty drafts retain their slot layout while the existing release remains unchanged', async () => {
  const h=assignmentStorageHarness();
  const released=[assignmentRow(roster[0]),assignmentRow(roster[1])];
  await h.data.replaceAssignments(['block'],released,'published');
  const unfinished=[{groups:[{members:[],location:'NET'},{members:[roster[0]],location:'NET'},{members:[],location:'NET'}]},{groups:[{members:[],location:'NET'}]}];
  assert.equal(planner.planAssignments(unfinished,'block',[roster,roster]),null,'unfinished pairs cannot be released');
  const rows=planner.planAssignments(unfinished,'block',[roster,roster],{allowIncomplete:true});
  assert.equal(rows.length,1);
  assert.equal(rows[0].group,'S1 · 1:1 02');
  await h.data.replaceAssignments(['block'],rows,'draft',[3,1]);
  assert.deepEqual(Array.from(await h.data.getPairingDraftSlots('block')),[3,1]);
  assert.equal((await h.data.getAssignments()).filter(a=>a.state==='draft').length,1);
  assert.equal((await h.data.getPublishedAssignmentsFor(roster[0])).length,1);
  await h.data.replaceAssignments(['block'],[],'draft',[4,2]);
  assert.deepEqual(Array.from(await h.data.getPairingDraftSlots('block')),[4,2]);
  assert.equal((await h.data.getAssignments()).filter(a=>a.state==='draft').length,0);
  assert.equal((await h.data.getPublishedAssignmentsFor(roster[0])).length,1);
  await h.data.replaceAssignments(['block'],released,'draft');
  assert.equal(await h.data.getPairingDraftSlots('block'),null,'regenerated drafts replace saved empty-slot metadata');
});

test('final feedback lists each released 1:1 half as a session for that attendee and keeps unfinished drafts private', async () => {
  const h=assignmentStorageHarness();
  const session={id:'block',title:'1:1s',type:'one-to-one',personalized:true,day:'2026-10-23',start:'2026-10-23T13:30',end:'2026-10-23T14:30',location:'NET',speaker:'',description:''};
  const people=new Map(roster.map((key,i)=>[key,{name:['Alice','Bob','Cara','Guest'][i]}]));
  const f=load('server/feedback.ts',{'node:crypto':crypto,'next/headers':{},'./data':{...h.data,getSessions:async()=>[session]},'./people':{personLookup:async()=>people},'./schedule':scheduleHelpers,'./availability':availability});
  const options=async id=>sessionRatings.buildSessionRatingOptions([session],await f.oneToOneConversations(id),'Kuhan').filter(o=>o.id.startsWith('conv-'));
  await h.data.replaceAssignments(['block'],[assignmentRow(roster[0])],'draft',[1,1]);
  assert.equal((await options(roster[0].split(':')[1])).length,0);
  await h.data.replaceAssignments(['block'],[assignmentRow(roster[0]),assignmentRow(roster[1]),assignmentRow(roster[0],'S2 · 1:1 01'),assignmentRow(roster[3],'S2 · 1:1 01')],'published');
  const sessions=await options(roster[0].split(':')[1]);
  assert.equal(sessions.length,2);
  assert.equal(sessions[0].title,'1:1 with Bob');
  assert.equal(sessions[1].title,'1:1 with Guest');
  assert.equal(sessions[0].timeLabel,'Friday · 1:30pm – 2pm');
  assert.equal(sessions[1].timeLabel,'Friday · 2pm – 2:30pm');
  assert.equal((await options(roster[2].split(':')[1])).length,0);
});
