import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSystem } from "@elos/core";
import { ElosProvider, Render, createComponent, type Node } from "./index.ts";
import { zagBehaviors } from "./behaviors.ts";

const catalog = loadSystem(join(import.meta.dirname, "../../../Resonant DS"));
const render = (tree: Node) => renderToStaticMarkup(h(ElosProvider, { catalog, behaviors: zagBehaviors }, h(Render, { tree })));
const example = (id: string, name: string) => catalog.contracts.find((c) => c.id === id)!.examples.find((e) => e.name === name)!.tree;

test("card example renders anatomy, data attributes and nested buttons from the contract", () => {
  const html = render(catalog.contracts.find((c) => c.id === "ds.card")!.examples[0]!.tree);
  assert.match(html, /^<article class="ds-card__root" data-padding="xl" data-heading="h3" data-tone="raised">/);
  assert.match(html, /<h3 class="ds-card__header">Weekly report<\/h3>/);
  assert.match(html, /<button class="ds-button__root" data-variant="ghost" data-size="md"[^>]*><span class="ds-button__label">Dismiss<\/span><\/button>/);
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
  assert.throws(() => render({ component: "ds.nope", props: {} }), /Unknown component ds.nope/);
});

test("behaviors: Zag props land on the right parts, including a decorated slotted trigger", () => {
  const dialog = render(example("ds.dialog", "Confirm delete"));
  assert.match(dialog, /<button class="ds-button__root" data-variant="danger" data-size="md"[^>]*aria-haspopup="dialog"/); // slotted trigger decorated
  assert.match(dialog, /<div class="ds-dialog__trigger"><button/); // the wrapper itself carries no trigger props
  assert.match(dialog, /<div class="ds-dialog__content" [^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(dialog, /<div class="ds-dialog__positioner" [^>]*hidden=""/); // closed by default
  assert.match(dialog, /<button class="ds-button__root" data-variant="ghost"[^>]*>(<span[^>]*>)?Close/); // close part is a referenced Button

  const tabs = render(example("ds.tabs", "Component page"));
  assert.match(tabs, /<div class="ds-tabs__list" [^>]*role="tablist"/);
  assert.match(tabs, /<button class="ds-tab__root" [^>]*role="tab"[^>]*aria-selected="true"[^>]*data-selected=""[^>]*>Preview/);
  assert.match(tabs, /<div class="ds-tab-panel__root" [^>]*role="tabpanel"[^>]*hidden=""[^>]*>.*The JSON contract/);

  const sw = render(example("ds.switch", "On"));
  assert.match(sw, /<input class="ds-switch__input" [^>]*type="checkbox"[^>]*role="switch"/);
  assert.match(sw, /<span class="ds-switch__thumb" [^>]*data-state="checked"/);

  assert.throws(() => render({ component: "ds.tab", props: { value: "x", label: "Orphan" } }), /must be placed inside ds.tabs/);
});

test("element from a prop, attributes from props", () => {
  assert.match(render(example("ds.text", "Title")), /^<h1 class="ds-text__root" data-as="h1" data-variant="title" data-tone="primary">Design systems/);
  assert.match(render(example("ds.input", "Invalid email")), /<input class="ds-input__root" [^>]*type="email"[^>]*placeholder="you@example.com"[^>]*aria-invalid="true"/);
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

test("createComponent passes DOM props to the root; elements map swaps an element for a host component", () => {
  const Button = createComponent<{ label: string; onClick?: () => void; "aria-label"?: string; id?: string }>("ds.button");
  const html = renderToStaticMarkup(h(ElosProvider, { catalog }, h(Button, { label: "Go", onClick: () => {}, "aria-label": "Go now", id: "go" })));
  assert.match(html, /<button class="ds-button__root"[^>]*aria-label="Go now"[^>]*id="go"/);
  assert.doesNotMatch(html, /data-aria|data-id/); // never treated as contract props
  const Card = createComponent<{ title: string }>("ds.card");
  assert.match(renderToStaticMarkup(h(ElosProvider, { catalog }, h(Card, { title: "Weekly" }))), /<h3 class="ds-card__header">Weekly<\/h3>/); // a contract prop named like a DOM attribute stays a prop
  const Nav = createComponent<{ label: string; list: unknown }>("ds.nav");
  const NavItem = createComponent<{ href: string; label: string; current?: boolean }>("ds.nav-item");
  const nav = renderToStaticMarkup(h(ElosProvider, { catalog }, h(Nav, { label: "Areas", list: h(NavItem, { href: "/x", label: "Tokens", current: true }) })));
  assert.match(nav, /<nav class="ds-nav__root" aria-label="Areas" data-orientation="vertical"><div class="ds-nav__list"><a class="ds-nav-item__root" data-selected="true" href=[^>]*aria-current="true">Tokens/); // a slot named like a DOM attribute stays a slot
  const RouterLink = (p: { href: string; children?: unknown }) => h("a", { ...p, "data-router": "" });
  const linked = renderToStaticMarkup(h(ElosProvider, { catalog, elements: { a: RouterLink } }, h(Render, { tree: example("ds.link", "Inline") })));
  assert.match(linked, /<a class="ds-link__root"[^>]*href="\/resonant\/tokens"[^>]*data-router=""/);
});
