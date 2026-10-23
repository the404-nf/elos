import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { loadSystem } from "@elos/core";
import { createServer, findComponents } from "./index.ts";

const catalog = loadSystem(join(import.meta.dirname, "../../../Resonant DS"));

async function connect() {
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await createServer(catalog).connect(serverT);
  const client = new Client({ name: "test", version: "0" });
  await client.connect(clientT);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const r = (await client.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
    return { data: JSON.parse(r.content[0]!.text), isError: r.isError ?? false };
  };
  return { client, call };
}

test("tools expose the menu, contracts, tokens and validation over MCP", async () => {
  const { client, call } = await connect();
  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ["find_component", "get_component", "list_components", "list_tokens", "validate_composition"]);

  const menu = await call("list_components", { category: "action" });
  assert.deepEqual(menu.data.map((c: { id: string }) => c.id), ["ds.button"]);
  assert.ok(menu.data[0].props.includes("label*: text"));

  assert.equal((await call("get_component", { id: "ds.card" })).data.anatomy.root.parts.actions.slot.max, 3);
  assert.equal((await call("get_component", { id: "ds.nope" })).isError, true);

  const dark = await call("list_tokens", { theme: "dark", prefix: "color.surface" });
  assert.deepEqual(dark.data.map((t: { cssVar: string }) => t.cssVar), ["--color-surface-canvas", "--color-surface-raised"]);

  const bad = await call("validate_composition", { tree: { component: "ds.card", slots: { actions: [{ component: "ds.card" }] } } });
  assert.equal(bad.isError, true);
  assert.match(bad.data.errors[0], /accepts only ds.button/);
  const good = await call("validate_composition", { tree: catalog.contracts.find((c) => c.id === "ds.card")!.examples[0]!.tree });
  assert.deepEqual(good.data, { valid: true, errors: [] });
});

test("find_component ranks by intent and flags when-not rules", () => {
  const r = findComponents(catalog, "summarize the weekly report with a delete action");
  assert.equal(r[0]!.id, "ds.card");
  assert.deepEqual(r.find((x) => x.id === "ds.button")!.matched, ["delete", "action"]);
  const nav = findComponents(catalog, "navigating to another page");
  assert.deepEqual(nav[0]!.caution, ["navigating to another page"]);
  assert.deepEqual(findComponents(catalog, "zebra"), []);
});
