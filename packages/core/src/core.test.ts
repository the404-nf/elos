import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, resolveTokens, flattenTokens, validateContracts } from "./index.ts";

const RESONANT = join(import.meta.dirname, "../../../Resonant DS");

test("Resonant builds: tokens resolve, themes diff, contracts validate", () => {
  const catalog = build(RESONANT, mkdtempSync(join(tmpdir(), "elos-")));
  assert.equal(catalog.contracts.length, 36);
  assert.deepEqual(catalog.pages.map((p) => p.id), ["page.confirm-delete", "page.dashboard", "page.settings"]); // validated against the contracts
  const base = Object.fromEntries(catalog.tokens.base.map((t) => [t.path, t.value]));
  assert.equal(base["color.action.primary.background"], "#0b0b0f"); // alias resolved through semantic -> primitive (ink in light)
  assert.equal(base["space.inset.md"], "12px"); // dimension object -> css string
  const dark = Object.fromEntries(catalog.tokens.dark!.map((t) => [t.path, t.value]));
  assert.equal(dark["color.surface.canvas"], "#0f0e12");
  assert.equal(dark["color.action.primary.background"], "#f5f4f7"); // overlay flips the primary to white-ish
  assert.equal(dark["color.accent.default"], base["color.accent.default"]); // the brand pink is untouched by the overlay
});

test("broken references are reported, not guessed", () => {
  assert.throws(() => resolveTokens(flattenTokens({ a: { $value: "{b}" } })), /Unknown token reference \{b\}/);
  assert.throws(() => resolveTokens(flattenTokens({ a: { $value: "{b}" }, b: { $value: "{a}" } })), /cycle/);
  const errors = validateContracts(
    [
      {
        id: "ds.x", name: "X", version: "0.0.1", status: "draft", category: "action", description: "", semantics: { element: "div" },
        props: [{ name: "tone", description: "", type: { enum: ["a", "b"] }, required: false }],
        states: [], anatomy: { root: { tokens: { color: "{color.{tone}.fg}" } } },
        a11y: { focusVisible: false, contrast: "AA", keyboard: [], aria: [] },
        usage: { when: [], whenNot: [], intents: [], alternatives: [] }, guidelines: { do: [], dont: [] }, resources: [],
        relationships: { pairsWith: [], excludes: [], contains: ["ds.missing"], within: [] }, channels: {}, examples: [],
      },
    ],
    new Set(["color.a.fg"]),
  );
  assert.deepEqual(errors, ["ds.x: token {color.b.fg} (from {color.{tone}.fg}) does not exist", "ds.x: references unknown contract ds.missing"]);
});
