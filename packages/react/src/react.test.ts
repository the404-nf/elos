import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSystem } from "@elos/core";
import { ElosProvider, Render, createComponent, type Node } from "./index.ts";

const catalog = loadSystem(join(import.meta.dirname, "../../../Resonant DS"));
const render = (tree: Node) => renderToStaticMarkup(h(ElosProvider, { catalog }, h(Render, { tree })));

test("card example renders anatomy, data attributes and nested buttons from the contract", () => {
  const html = render(catalog.contracts.find((c) => c.id === "ds.card")!.examples[0]!.tree);
  assert.match(html, /^<article class="ds-card__root" data-padding="md">/);
  assert.match(html, /<h3 class="ds-card__header">Weekly report<\/h3>/);
  assert.match(html, /<button class="ds-button__root" data-variant="ghost" data-size="md"><span class="ds-button__label">Dismiss<\/span><\/button>/);
});

test("optional parts disappear when empty; disabled sets the native attribute", () => {
  const html = render({ component: "ds.card", slots: { body: ["Just text"] } });
  assert.doesNotMatch(html, /ds-card__header|ds-card__actions/);
  assert.match(render({ component: "ds.button", props: { label: "Go", disabled: true } }), /data-disabled="" disabled=""/);
});

test("refuses what the contract forbids instead of guessing", () => {
  assert.throws(() => render({ component: "ds.button" }), /"label" is required/);
  assert.throws(() => render({ component: "ds.button", props: { label: "x", variant: "loud" } }), /must be one of/);
  assert.throws(() => render({ component: "ds.card", slots: { actions: [{ component: "ds.card" }] } }), /accepts only ds.button/);
  assert.throws(() => render({ component: "ds.toast", props: {} }), /Unknown component ds.toast/);
});

test("createComponent maps children and named slots", () => {
  const Card = createComponent<{ title?: string; actions?: unknown }>("ds.card");
  const Button = createComponent<{ label: string; variant?: string }>("ds.button");
  const html = renderToStaticMarkup(
    h(ElosProvider, { catalog }, h(Card, { title: "Hi", actions: h(Button, { label: "Ok" }) }, "body text")),
  );
  assert.match(html, /<div class="ds-card__body">body text<\/div>/);
  assert.match(html, /<footer class="ds-card__actions"><button/);
});
