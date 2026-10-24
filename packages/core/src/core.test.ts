import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, resolveTokens, flattenTokens, validateContracts, emitComponentCss, emitCss } from "./index.ts";
import { Contract, SystemManifest } from "@elos/contracts";

const RESONANT = join(import.meta.dirname, "../../../Resonant DS");

test("Resonant builds: tokens resolve, themes diff, contracts validate", () => {
  const catalog = build(RESONANT, mkdtempSync(join(tmpdir(), "elos-")));
  assert.equal(catalog.contracts.length, 39);
  assert.deepEqual(catalog.pages.map((p) => p.id), ["page.confirm-delete", "page.dashboard", "page.settings"]); // validated against the contracts
  assert.deepEqual(catalog.screens.map((s) => s.id), ["screen.project-overview"]); // screens/*.screen.json, validated the same way
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

test("gradients resolve to var() stops, keyframes and fonts are emitted", () => {
  const flat = flattenTokens({
    color: { $type: "color", a: { $value: "#ff3d8b" }, none: { $value: "#00000000" } },
    gradient: {
      $type: "gradient",
      fade: { $value: { kind: "linear", angle: "180deg", stops: [{ color: "{color.a}", alpha: 0.34, position: "0%" }, { color: "{color.none}", position: "100%" }] } },
      lights: { $value: [{ kind: "radial", size: "18% 18%", at: "32% 42%", stops: [{ color: "{color.a}" }, { color: "{color.none}" }] }, { kind: "conic", stops: [{ color: "{color.none}" }, { color: "{color.a}", position: "72%" }] }] },
    },
  });
  const byPath = Object.fromEntries(resolveTokens(flat).map((t) => [t.path, t.value]));
  assert.equal(byPath["gradient.fade"], "linear-gradient(180deg, color-mix(in srgb, var(--color-a) 34%, transparent) 0%, var(--color-none) 100%)");
  assert.equal(byPath["gradient.lights"], "radial-gradient(18% 18% at 32% 42%, var(--color-a), var(--color-none)), conic-gradient(from 0deg at center, var(--color-none), var(--color-a) 72%)");
  assert.throws(() => resolveTokens(flattenTokens({ g: { $type: "gradient", $value: { kind: "linear", stops: [{ color: "{nope}" }, { color: "{nope}" }] } } })), /Unknown token reference \{nope\}/);

  const contract = {
    id: "ds.x", name: "X", version: "0.0.1", status: "draft", category: "layout", description: "", semantics: { element: "div" }, props: [], states: ["hover"],
    anatomy: { root: { parts: { beam: { element: "span", animation: { keyframes: "spin", duration: "{motion.duration.beam}", easing: "{motion.easing.linear}", iterations: "infinite", on: "hover" } } } } },
    keyframes: { spin: { to: { transform: "rotate(360deg)", color: "{color.a}" } } },
    a11y: { focusVisible: false, contrast: "AA", keyboard: [], aria: [] }, usage: { when: [], whenNot: [], intents: [], alternatives: [] },
    guidelines: { do: [], dont: [] }, resources: [], relationships: { pairsWith: [], excludes: [], contains: [], within: [] }, channels: {}, examples: [],
  } as const;
  const css = emitComponentCss(Contract.parse(contract));
  assert.match(css, /\.ds-x__root:hover \.ds-x__beam, \[data-preview-state="hover"\] \.ds-x__root \.ds-x__beam \{\n  animation: ds-x-spin var\(--motion-duration-beam\) var\(--motion-easing-linear\) infinite;/); // the editor previews a state through a wrapper attribute
  assert.match(css, /@keyframes ds-x-spin \{\n  to \{ transform: rotate\(360deg\); color: var\(--color-a\); \}\n\}/);
  assert.deepEqual(validateContracts([Contract.parse({ ...contract, anatomy: { root: { animation: { keyframes: "nope", duration: "{d}", easing: "{e}" } } } })], new Set(["d", "e", "color.a"])), ["ds.x: animation runs unknown keyframes nope"]);

  const system = SystemManifest.parse({ id: "s", name: "S", version: "0.0.1", tokens: ["t.json"], fonts: [{ family: "Albert Sans", url: "https://fonts.googleapis.com/css2?family=Albert+Sans" }] });
  const head = emitCss({ system, builtAt: "", tokens: { base: [] }, contracts: [], pages: [], screens: [], assets: {} });
  assert.ok(head.startsWith('@import url("https://fonts.googleapis.com/css2?family=Albert+Sans");'));
});
