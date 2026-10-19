import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// The schedule builder has only type imports. Test the actual TypeScript
// module without requiring a separate test runner or a Next.js server.
const source = readFileSync(new URL("../src/server/schedule.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
});
const exportsUnderTest = {};
runInNewContext(outputText, { exports: exportsUnderTest, process });
const { buildPublicSchedule, buildSchedule } = exportsUnderTest;

const session = {
  id: "private-session-id",
  title: "The AI policy landscape in Washington",
  day: "2026-10-23",
  start: "2026-10-23T09:00",
  end: "2026-10-23T10:00",
  type: "talk",
  track: "Private track",
  status: "tentative",
  location: "Private room",
  speaker: "Private Speaker",
  description: "Private description",
  slidoUrl: "https://example.com/private-qa",
  personalized: false,
  futurePrivateField: "Private future field",
};

test("public payload includes session titles while excluding private fields", () => {
  const days = buildPublicSchedule([session]);
  const payload = JSON.stringify(days);
  for (const field of ["id", "track", "location", "speaker", "description", "slidoUrl", "futurePrivateField"]) {
    assert.equal(payload.includes(session[field]), false, `${field} leaked`);
  }
  const block = days[0].blocks[0];
  assert.equal(block.title, session.title);
  assert.equal(block.startMinutes, 540);
  assert.equal(block.endMinutes, 600);
  assert.equal(block.speaker, "");
  assert.equal(block.mine, false);
  assert.equal(session.speaker, "Private Speaker", "must not mutate shared data");
});

test("later edits to private details do not change the public schedule", () => {
  const updated = { ...session, speaker: "Another speaker", description: "New details", location: "Another room" };
  assert.equal(JSON.stringify(buildPublicSchedule([updated])), JSON.stringify(buildPublicSchedule([session])));
});

test("public schedule reflects updated titles without exposing speakers", () => {
  const updated = { ...session, title: "An updated talk title", speaker: "Updated speaker" };
  const days = buildPublicSchedule([updated]);
  assert.equal(days[0].blocks[0].title, updated.title);
  assert.equal(JSON.stringify(days).includes(updated.speaker), false);
});

test("protected schedule retains updated session details", () => {
  const updated = { ...session, speaker: "Updated speaker", description: "Updated description" };
  const block = buildSchedule({ sessions: [updated], assignments: [], people: new Map() })[0].blocks[0];
  assert.equal(block.title, session.title);
  assert.equal(block.speaker, updated.speaker);
  assert.equal(block.detail.speaker, updated.speaker);
  assert.equal(block.detail.description, updated.description);
  assert.equal(block.detail.location, session.location);
  assert.equal(block.detail.slidoUrl, session.slidoUrl);
});

test("public personalized sessions remain generic without assignment details", () => {
  for (const type of ["one-to-one", "small-group"]) {
    const block = buildPublicSchedule([{ ...session, type, personalized: true }])[0].blocks[0];
    assert.equal(block.mine, false);
    assert.equal(block.detail.assignmentValue, undefined);
    assert.equal(block.speaker, "");
    assert.equal(block.endMinutes - block.startMinutes, 60);
  }
});
