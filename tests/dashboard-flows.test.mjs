import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function load(file, imports = {}, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  runInNewContext(outputText, {
    exports, require: (name) => { if (!(name in imports)) throw Error(`Unexpected import ${name}`); return imports[name]; },
    process, FormData, URLSearchParams, AbortController, setTimeout, clearTimeout, console, ...globals,
  });
  return exports;
}
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
    'node:crypto': {}, 'next/headers': {}, './data': data, './people': {}, './schedule': {},
  });
}
const feedback = feedbackHarness();
const scheduleHelpers = load('server/schedule.ts');
const sessionRatings = load('server/session-ratings.ts', { './data': {}, './feedback': {}, './schedule': scheduleHelpers });
const talkSession = { id: 'talk', type: 'talk', title: 'A talk', speaker: '', day: '2026-10-23', start: '2026-10-23T10:00', end: '2026-10-23T11:00' };

function actionHarness({ open = true, preview = false, failSave = false, failSync = false, questions, conversations = [] } = {}) {
  const saved = [], synced = [], completed = [];
  const { submitFeedback } = load('app/dashboard/feedback/actions.ts', {
    'next/navigation': { redirect: (url) => { throw Object.assign(Error(url), { redirect: url }); } },
    '@/server/auth': { requireParticipant: async () => ({ id: 'recAAAAAAAAAAAAAA', name: 'Test Attendee' }), isPreviewing: async () => preview },
    '@/server/data': { getSessions: async () => [{ id: 'talk', type: 'talk', title: 'A talk' }],
      saveFeedback: async r => { if (failSave) throw Error('offline'); saved.push(r); },
      replacePreferences: async (...args) => { if (failSync) throw Error('offline'); synced.push(args); } },
    '@/server/session-ratings': { sessionRatingOptions: async () => sessionRatings.buildSessionRatingOptions([talkSession], conversations, 'Kuhan Jeyapragasan') },
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
  assert.ok(titles.includes('Happy Hour'));
  assert.ok(!titles.some(t => /break|reflection|transition|monument|welcome dinner|board game|^1:1s$/i.test(t)));
  assert.equal(titles.filter(t => t.startsWith('1:1 with ')).length, 2);
  assert.equal(titles.filter(t => t.startsWith('Rotating Q&A with ')).length, 5);
  assert.ok(options.some(s => s.title === 'Rotating Q&A with Kuhan Jeyapragasan' && s.timeLabel.startsWith('Saturday')));
  assert.ok(!options.some(s => s.id === 'qa-fri' || s.id === 'qa-sat'));
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
  const data = load('server/data/index.ts', { '../airtable': airtable, '../session': {}, './types': types, './fixtures': {} });
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
});

test('admin generation respects availability/exclusions, drafts stay private, and release/hide preserve the draft', async () => {
  const schedule = [{ id: 'block', type: 'one-to-one', day: '2026-10-24', start: '2026-10-24T10:00', end: '2026-10-24T11:00', location: 'Meeting area' },
    { id: 'sgd', type: 'small-group' }];
  let assignments = [{ id:'excluded', sessionId:'block', personKey:roster[2], group:types.PAIRING_EXCLUDED, state:'draft', kind:'1:1', location:'' }];
  const replacements = [];
  const actions = load('app/dashboard/admin/actions.ts', {
    'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect: url => { throw Object.assign(Error(url), { redirect: url }); } },
    'next/headers': {}, '@/server/auth': { requireAdmin: async () => {} },
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
    '@/server/data/types': types, '@/server/portal-pages': {}, '@/server/session': {}, '@/server/feedback': {}, '@/server/pairings':pairings,
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
