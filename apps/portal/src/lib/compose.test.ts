import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "@elos/contracts";
import { applyScreenOp, getNode, nodeList, parsePath, slotsOf } from "./compose.ts";

const catalog = JSON.parse(readFileSync(join(import.meta.dirname, "../../../../Resonant DS/dist/catalog.json"), "utf8")) as Catalog;
const screen = catalog.screens.find((s) => s.id === "screen.project-overview")!;

test("screen operations: paths, props, slots", () => {
  const badge = getNode(screen.tree, "/root/0/root/1")!;
  assert.equal(badge.component, "ds.badge");
  assert.deepEqual(parsePath("/root/0/root/1"), { parent: "/root/0", slot: "root", index: 1 });
  assert.equal(parsePath(""), null);

  const relabeled = applyScreenOp(screen.tree, { path: "/root/0/root/1", prop: "label", value: "beta" });
  assert.equal(getNode(relabeled, "/root/0/root/1")!.props!.label, "beta");
  assert.equal(getNode(screen.tree, "/root/0/root/1")!.props!.label, "live", "the original tree is untouched");

  const removed = applyScreenOp(screen.tree, { path: "/root/0/root/1", prop: "dot" });
  assert.equal(getNode(removed, "/root/0/root/1")!.props!.dot, undefined);

  const emptied = applyScreenOp(screen.tree, { path: "/root/0", slot: "root", items: [] });
  assert.equal(nodeList(emptied).length, nodeList(screen.tree).length - 2);
  assert.equal(nodeList(screen.tree)[0]!.path, "");

  const card = catalog.contracts.find((c) => c.id === "ds.card")!;
  assert.deepEqual(slotsOf(card).map((s) => s.name), ["meta", "body", "actions"]);
  assert.deepEqual(slotsOf(card)[2]!.accepts, ["ds.button"]);
});
