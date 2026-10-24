import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "@elos/contracts";
import { applyOp, checkOp, render, vocabulary } from "./operate.ts";

const catalog = JSON.parse(readFileSync(join(import.meta.dirname, "../../../../Resonant DS/dist/catalog.json"), "utf8")) as Catalog;
const button = catalog.contracts.find((c) => c.id === "ds.button")!;

test("the one operation: check, apply, render per theme", () => {
  assert.match(checkOp(button, catalog, { part: "nope", property: "padding", token: "{space.1}" })!, /No part "nope"/);
  assert.match(checkOp(button, catalog, { part: "root", property: "padding", token: "12px" })!, /not a token reference/);
  assert.match(checkOp(button, catalog, { part: "root", property: "padding", token: "{space.99}" })!, /No token/);
  assert.equal(checkOp(button, catalog, { part: "root", property: "gap", token: "{space.inset.md}" }), null);

  const patched = applyOp(button, { part: "root", property: "gap", token: "{space.inset.md}" });
  assert.equal(patched.anatomy.root!.layout?.gap, "{space.inset.md}");
  const removed = applyOp(applyOp(button, { part: "root", property: "outline-offset", token: "{space.1}" }), { part: "root", property: "outline-offset", token: "" });
  assert.equal(removed.anatomy.root!.tokens?.["outline-offset"], undefined);

  const out = render(patched, catalog, "root");
  assert.match(out, /^Themes: base \| dark/);
  assert.match(out, /gap \{space.inset.md\} = 12px \| 12px/);
  assert.ok(vocabulary(catalog).startsWith("{color."), "semantic tokens come first");
});
