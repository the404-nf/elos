import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "@elos/contracts";
import { applyScreenOp, getNode, nodeList, parsePath, slotsOf } from "./compose.ts";

const catalog = JSON.parse(readFileSync(join(import.meta.dirname, "../../../../Resonant DS/dist/catalog.json"), "utf8")) as Catalog;
const tree = catalog.pages.find((p) => p.id === "page.dashboard")!.tree; // a composition tree is a composition tree; pages serve as the fixture

test("screen operations: paths, props, slots", () => {
  const badge = getNode(tree, "/root/0/root/0/body/1")!;
  assert.equal(badge.component, "ds.badge");
  assert.deepEqual(parsePath("/root/0/root/0/body/1"), { parent: "/root/0/root/0", slot: "body", index: 1 });
  assert.equal(parsePath(""), null);

  const relabeled = applyScreenOp(tree, { path: "/root/0/root/0/body/1", prop: "label", value: "beta" });
  assert.equal(getNode(relabeled, "/root/0/root/0/body/1")!.props!.label, "beta");
  assert.equal(getNode(tree, "/root/0/root/0/body/1")!.props!.label, "stable", "the original tree is untouched");

  const removed = applyScreenOp(tree, { path: "/root/0/root/0/body/1", prop: "tone" });
  assert.equal(getNode(removed, "/root/0/root/0/body/1")!.props!.tone, undefined);

  const emptied = applyScreenOp(tree, { path: "/root/0", slot: "root", items: [] });
  assert.equal(nodeList(emptied).length, nodeList(tree).length - 9, "three cards with two children each leave the row");
  assert.equal(nodeList(tree)[0]!.path, "");

  const card = catalog.contracts.find((c) => c.id === "ds.card")!;
  assert.deepEqual(slotsOf(card).map((s) => s.name), ["meta", "body", "actions"]);
  assert.deepEqual(slotsOf(card)[2]!.accepts, ["ds.button"]);
});
