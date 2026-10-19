import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { jsx, jsxs } from "react/jsx-runtime";

function load(path, dependencies) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  runInNewContext(outputText, { exports, require: (name) => dependencies[name] });
  return exports;
}

test("guest directory stays closed until explicitly released", async () => {
  let settings = [];
  const pages = load("../src/server/portal-pages.ts", {
    "./data": { getPortalPageSettings: async () => settings },
  });
  assert.equal(await pages.portalPageOpen("participant", "guests"), false);
  assert.equal(await pages.portalPageOpen("participant", "directory"), true);
  settings = [{ audience: "participant", key: "guests", enabled: false }];
  assert.equal(await pages.portalPageOpen("participant", "guests"), false);
  settings = [{ audience: "participant", key: "guests", enabled: true }];
  assert.equal(await pages.portalPageOpen("participant", "guests"), true);
});

test("guest cards include organizations without requiring photos or exposing bios or account fields", () => {
  const { default: GuestDirectory } = load("../src/components/dashboard/GuestDirectory.tsx", {
    "react/jsx-runtime": { jsx, jsxs },
    "./Directory": { default: () => null },
  });
  const card = GuestDirectory({ guests: [{
    id: "guest-id", name: "Guest Name", title: "", organization: "Example Organization",
    bio: "Private biography", email: "private@example.org", shortPassword: "private-phrase",
    accessCount: 12, availability: "Private availability",
  }] });
  assert.equal(card.props.people.length, 1);
  assert.equal(card.props.people[0].organization, "Example Organization");
  assert.equal(card.props.people[0].bio, "");
  for (const field of ["email", "shortPassword", "accessCount", "availability"]) {
    assert.equal(field in card.props.people[0], false);
  }
});

test("guest directory honors organizer hiding without requiring a complete profile", async () => {
  const visible = { id: "visible", name: "Visible guest", organization: "Example", bio: "", hidden: false };
  const hidden = { ...visible, id: "hidden", hidden: true };
  const GuestDirectory = () => null;
  const { default: Page } = load("../src/app/dashboard/guests/page.tsx", {
    "react/jsx-runtime": { jsx, jsxs },
    "@/components/dashboard/PortalShell": { default: () => null },
    "@/components/dashboard/PageHeading": { default: () => null },
    "@/components/dashboard/GuestDirectory": { default: GuestDirectory },
    "@/server/auth": { requireParticipant: async () => {} },
    "@/server/data": { getGuests: async () => [visible, hidden] },
  });
  const page = await Page();
  const directory = page.props.children.props.children.find((child) => child.type === GuestDirectory);
  assert.equal(directory.props.guests.length, 1);
  assert.equal(directory.props.guests[0].id, "visible");
});

test("organizer profile status respects hidden guests even though guest profiles need no bio", () => {
  const { default: ProfileStatus } = load("../src/components/dashboard/ProfileStatus.tsx", {
    "react/jsx-runtime": { jsx, jsxs },
    "@/components/dashboard/StatusMark": { default: () => null },
    "@/server/people": { hasBio: () => false, hasHeadshot: () => false, profileComplete: () => false },
  });
  const status = ProfileStatus({ person: { bio: "" }, directory: "guest directory", guest: true, hidden: true });
  assert.match(status.props.children[0].props.children, /is hidden from the guest directory/);
  const visible = ProfileStatus({ person: { bio: "" }, directory: "guest directory", guest: true });
  assert.match(visible.props.children[0].props.children, /is ready for the guest directory/);
});
