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
