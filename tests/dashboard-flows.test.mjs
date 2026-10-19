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

function actionHarness({ open = true, preview = false, failSave = false, failSync = false, questions, conversations = [] } = {}) {
  const saved = [], synced = [], completed = [];
  const { submitFeedback } = load('app/dashboard/feedback/actions.ts', {
    'next/navigation': { redirect: (url) => { throw Object.assign(Error(url), { redirect: url }); } },
    '@/server/auth': { requireParticipant: async () => ({ id: 'recAAAAAAAAAAAAAA', name: 'Test Attendee' }), isPreviewing: async () => preview },
    '@/server/data': { getSessions: async () => [{ id: 'talk', type: 'talk', title: 'A talk' }],
      saveFeedback: async r => { if (failSave) throw Error('offline'); saved.push(r); },
      replacePreferences: async (...args) => { if (failSync) throw Error('offline'); synced.push(args); } },
    '@/server/people': { personLookup: async () => new Map([[roster[1], { name: 'Partner' }]]) },
    '@/server/feedback-questions': { getFeedbackQuestions: async () => questions ?? [{ key: 'comment', type: 'text', enabled: true, required: true, label: 'A question' }] },
    '@/server/feedback': { MAX_ONE_TO_ONE_PICKS: 10, REPEATABLE_FORMS: new Set(['anytime']),
      feedbackForm: key => ['goals','friday','saturday','overall','one-on-ones','anytime'].includes(key) ? { day: key === 'friday' ? '2026-10-23' : '', label: key } : null,
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
test('closed forms and admin previews cannot write feedback', async () => {
  for (const options of [{ open: false }, { preview: true }]) {
    const h = actionHarness(options);
    assert.equal(await submit(h, { form: 'goals', comment: 'hello' }), '/dashboard/feedback');
    assert.equal(h.saved.length, 0);
  }
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
test('conversation ratings only accept actual published conversations and save partner labels', async () => {
  const h = actionHarness({ questions: [{ key: 'conversation-ratings', type: 'conversations', enabled: true }],
    conversations: [{ id: 'own', partner: 'Partner', day: 'Saturday', timeLabel: '9–9:30' }] });
  await submit(h, { form: 'one-on-ones', 'scale-conv-own': '5', 'scale-conv-forged': '1', 'conv-comment-forged': 'junk' });
  assert.equal(h.saved[0].ratings['conv-own'], 5);
  assert.equal(h.saved[0].ratings['conv-forged'], undefined);
  assert.equal(h.saved[0].answers['conv-comment-forged'], undefined);
  assert.match(h.saved[0].questionLabels['conv-own'], /Partner/);
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
