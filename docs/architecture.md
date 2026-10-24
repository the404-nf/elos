# Elos design doc

Status: living document. The direction is set in [vision.md](vision.md) and the phases in [roadmap.md](roadmap.md). Decisions are recorded individually in [adr/](adr/); this doc explains how they fit together.

## What Elos is

A platform that stores design systems like a CMS and serves them to humans and AI agents. A design system in Elos is consumed through a web portal, a REST API and an MCP server, and rendered on several channels. Resonant DS is Elos's own design system. The portal is built with it, so Elos is its own first customer.

Elos is closed source and offered to clients as a base, the way Radix is offered as a base, with the difference that clients get a governed, versioned, AI-readable system rather than a component package.

## The three layers

| Layer | Holds | Form | Owner |
|---|---|---|---|
| Contracts | What each component and token means: props, anatomy, token bindings, slots, accessibility, usage rules, relationships, channel support | JSON validated by Zod, one file per component | Elos, stack-agnostic |
| Logic | Headless behavior and adaptation: state machines, composition evaluation, prompt generation, channel degradation | TypeScript runtime over the catalog | Elos, stack-agnostic |
| Render | Tokens as CSS variables and components per target | React renderer first, more targets later | Per target |

Beyond structure, a contract carries the guidance a pattern library would: category, when and when not to use, intents, alternatives ("choose this vs that"), do and don't guidelines, part descriptions, keyboard and ARIA notes, and resources. [UX Patterns for Devs](https://uxpatterns.dev) is the reference for which guidance a component should carry. Everything is short and enumerable so an agent can match on it deterministically.

The contracts are the only source of truth. The logic layer derives everything else from them. The render layer is a set of emitters that consume the built catalog. Nothing is inferred from component source code.

## The catalog

`packages/core` reads a design system directory and emits `catalog.json`: the manifest, every contract, and every token resolved per theme. REST, MCP, the portal preview and every renderer read this one artifact, so they cannot drift from each other. The build refuses a token reference that does not resolve for every variant, and any reference to an unknown contract.

## A design system on disk

```
system.json              manifest: id, name, version, token files, themes, contracts folder
tokens/*.json            DTCG token files, merged in order; the base is the default (light) theme
themes/*.json            partial token overlays, each with a kind (mode or brand) and a CSS selector
contracts/*.contract.json
```

This directory is the storage format in the portal's database, the export format on deploy, the self-hosting format, and the target format for a future importer of existing component libraries.

## Page examples

`pages/*.page.json` are composed screens built only from the system's components, validated against the catalog at build time like any composition. They are what token edits are previewed against in the portal, few-shot material served to agents through the `list_pages` MCP tool, and the seed of the blocks area.

## Themes

A theme is an overlay. Overlays compose in order, so a brand overlay plus a dark-mode overlay is two files, no special casing. The CSS emitter writes the base under `:root` and only the differing variables under each theme's selector.

## Composition

An agent never emits markup. It emits a composition tree: a node names a contract id, canonical prop values and slot contents. Every channel renders that tree with real components. Anything not in the catalog is refused. OpenUI Lang and A2UI are adapters that produce this tree, planned for milestone two.

## Channels

The listed channels collapse into three emitters:

| Emitter | Serves |
|---|---|
| HTML | Web portal, and the HTML widget that ChatGPT Apps and Claude Desktop MCP Apps render in an iframe |
| Slack Block Kit | Slack as an output channel, including rendered reports |
| Markdown | Claude Code and Codex, which have no UI; the contract itself is the render |

Each contract declares, per channel, whether support is native, degraded or unsupported, and what the component becomes. The portal preview runs every emitter on the draft contract and shows them side by side, so an editor sees what a change does on every channel.

## Portal

Next.js with the App Router, Postgres through Drizzle, Better Auth, and the official TypeScript MCP SDK over stateless Streamable HTTP, all in one deploy. The portal is the Storybook: it renders tokens and components from the draft catalog at runtime, so edits preview without a rebuild. Tokens and components are separate top-level areas in the navigation and on the page, with their own listing, detail and editing views. Editing a token shows it applied live inside real compositions, not a swatch: the components and examples that bind to it are rendered from the draft catalog, so the user sees the effect of a change in context before saving. The catalog already knows which components bind to each token, which is what drives that preview.

Direct manipulation on the canvas is planned as the next step of component editing: dragging a padding, gap, radius or size handle snaps to the nearest token on that scale and writes the binding, never a raw value. Resizing and moving are only meaningful where the contract has a dimension binding, so the handles come from the anatomy, not from a free canvas. A visual pass on the portal's own look, likely with the Impeccable design skills, comes once more of Resonant exists to style it with.

Editing works on contracts through forms, not on component source code. Two editing modes are planned: a visual canvas where the user adjusts a component directly, and an advanced mode with inputs and sliders for padding, radius, color, stroke and similar values. Both write token bindings and contract fields, never raw values, so relationships and themes stay intact. Resonant itself will be tuned this way in the portal.

Self-hosting is a requirement, so the portal depends on Postgres only. No vendor-specific storage, queues or functions.

## Data model

Organization, design system, draft, version. Tenancy exists from the first migration. A version is an immutable full snapshot of the directory format. Diffs between versions are computed on demand. Publishing can happen per change or as a bundle; both only decide when a snapshot is cut. Rolling back a component copies its contract from an older snapshot into the draft. Rolling back the system republishes an older snapshot as a new version. History is never rewritten and clients pin versions.

## MCP

`packages/mcp` serves a catalog over MCP with five read-only tools: list components (the menu), get component, find component by intent, list tokens, validate composition. Ranking is deterministic keyword matching over the contract's enumerable guidance; no model runs on the server. The server instructions tell agents the workflow: find, get, compose, validate, and never invent. The stdio entry point serves Claude Code and Codex today; the portal will mount the same server over Streamable HTTP.

## Access

API keys for the MVP. OAuth for the remote MCP server once ChatGPT and Claude Desktop connect to private systems.

## Milestones

1. Foundation: contracts, tokens, catalog build. Done.
2. React renderer, data-driven from the catalog, Button and Card first. Done.
3. MCP server over the catalog (stdio). Done. REST and HTTP transport arrive with the portal.
4. Grow Resonant to what the portal needs: Dialog, Tabs and Switch on Zag.js, Input, Select, Text, Stack, Badge, a Vite playground, and the export of the catalog as a Design System artifact that design mode builds on. Done.
5. Portal skeleton. Done in its first form: tokens and components as separate areas; token editing with the value applied live in every composition that binds to it; component editing with a canvas (click a part, edit its bindings and styles) and an advanced JSON mode; versions with publish, per-file and whole rollback, and diffs; REST catalog and CSS; remote MCP over Streamable HTTP. Runs on PGlite locally and Postgres through `DATABASE_URL`. Not yet: authentication, API keys, multi-channel preview panels, editing props, slots and usage through forms, Markdown rendering for the brand book.
6. Slack emitter, HTML widget bundle. The Markdown emitter exists as `contractToMarkdown`.
7. Composition language adapters (OpenUI Lang, A2UI), OAuth, client onboarding.

## Deferred with room left

Figma sync (tokens are DTCG so plugins can read them), importing existing component libraries (the directory format is the target), multiplayer editing, and structured schemas for principles, DDRs and skills, which will become more files in the same directory.

## Glossary

ADR: an architecture decision record for building Elos, kept in `docs/adr/`. DDR: a design decision record, a product feature where clients record their own design decisions. The two are different things.
