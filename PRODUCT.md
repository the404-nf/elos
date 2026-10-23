# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Today the portal has one user: Lê (the404-nf), the founder, tuning Resonant DS inside the portal that is built from it. There are no external clients, pilots or evaluators yet; Elos is its own first customer.

The users the product is built for arrive in order:

- Design-system maintainers at client teams (designers and design engineers) who govern a system: inspect every token and component, edit them against real pages, publish versions, roll back.
- AI agents (Claude Code, Claude Desktop, ChatGPT, Codex) that read a system through MCP and REST and compose screens from it. They never see the portal; they see the catalog.
- Later: product teams composing screens and journeys on the Canvas with their own model, and organizations consuming governed assets from the Marketplace.

## Product Purpose

Elos stores design systems in a form that people and AI agents use deterministically, and grows from there into the place where teams govern design decisions and compose product screens with them. Resonant DS is Elos's own design system and the first one it stores.

Success for the current phase (roadmap Phase 1) is observable: a designer can shape Resonant entirely inside the portal, and the portal looks like a product. Longer term: an agent in any major harness uses a private system end to end; teams consume principles, decisions, skills and agents from Elos instead of documents; a user composes a screen with their own model, binds it to their API, publishes it as a version and sees it on every channel.

## Positioning

A component is a JSON contract, and the contract is the only source of truth; nothing is inferred from code. Agents never emit markup: they emit composition trees validated against a finite catalog of components and tokens, so any model that follows the catalog produces consistent screens. Everything (tokens, components, pages, later assets and screens) is a versioned file in one directory, snapshotted immutably, diffed on demand, rolled back by republishing. Self-hostable on Postgres alone.

That is what a component package or a Storybook cannot truthfully claim: a governed, versioned, AI-readable system rather than code to copy.

## Operating Context

- The portal (`apps/portal`, Next.js 15 App Router) is the Storybook: it renders tokens, components and page examples from the draft catalog at runtime, so edits preview live. Areas: tokens, components, pages, versions, per design system. REST serves the catalog and CSS; MCP is mounted over Streamable HTTP.
- The portal is built from Resonant and edits Resonant. When a portal screen needs a component Resonant lacks, the contract is added first; markup is never hand-written.
- Editing works on contracts through forms and typed token controls, never on component source. Editors write tokens and bindings, never raw CSS values.
- A design system on disk is a directory: `system.json`, `tokens/` (DTCG, three tiers), `themes/` (overlays with a selector), `contracts/`, `pages/`. The catalog is built from it; drafts and versions are snapshots of it. The dev database is seeded once from `Resonant DS/`.
- Agents work through MCP (stdio locally, remote over HTTP): find a component by intent, get its contract, compose a tree, validate it. Ranking is deterministic keyword matching; no model runs on the server.
- Channels: HTML (portal and chat widgets), Slack Block Kit, Markdown (coding agents). Each contract declares per channel whether support is native, degraded or unsupported.
- Exports: the Design System artifact for Claude's design mode, DTCG tokens, Markdown guidelines, generated skills.
- Development: `pnpm run portal` on :3000, `pnpm run playground` on :5173 (Vite gallery of every example), `pnpm test`, `pnpm run build:resonant`. Node 24 runs TypeScript directly.

## Capabilities and Constraints

Confirmed and built:

- Contracts, tokens, themes and page examples as files with Zod schemas; the catalog built and validated from them. 34 Resonant contracts, 3 page examples, light base plus a dark overlay.
- Data-driven React renderer; behavior rented from Zag.js behind Resonant's own API; static components use native elements.
- Portal: token listing with previews, token editor with every theme live side by side and the chain view, component canvas with binding and style editing, contract form with code toggle, page examples, versions with publish, per-file and whole rollback, diffs, Markdown rendered everywhere.
- MCP server with read-only tools over the catalog; REST catalog and CSS.
- Design System artifact export.
- Motion: `motion.duration.*` and `motion.easing.*` tokens, per-part motion bindings in contracts, the CSS emitter writing transitions with a reduced-motion guard. Bound on Button, Switch, Tab and Input so far.

Agreed and not yet built (roadmap Phase 1): the visual pass on the portal using Resonant tokens and components; scale sliders on the canvas; component cards with counts; themes page; blocks area; directory import and sync; authentication and API keys; audit and reports.

Hard constraints:

- One spine. No area gets its own storage or format. A new capability is first a schema for a file, then a catalog field, then a Serve surface, then a portal screen.
- Components bind to semantic tokens, never primitives or raw values. Token CSS emits aliases as `var()`.
- Direct manipulation on the canvas means sliders that snap to the token scale, not free dragging.
- Decisions get an ADR; reversals are new ADRs that supersede.
- The smallest correct change; no speculative abstractions.

Terminology: contract, catalog, composition tree, draft, version, overlay (theme), channel, Serve. ADR is an architecture decision for building Elos; DDR is a design decision record clients keep as a product feature.

Undecided: authentication provider and organization model details beyond "tenancy from the first migration"; brand overlays beyond dark; pricing, licensing and deployment offer.

## Brand Commitments

- Names: Elos (the platform), Resonant DS (its design system, also offered to clients as a base).
- Voice (from the Resonant brand book): plain sentences, sentence case, action verbs on buttons, no exclamation marks, no emoji in product copy. Titles name the thing or the decision ("Delete project?"), never the component.
- Incumbent visual facts recorded as they stand, not expanded here: Resonant describes itself as calm, precise and unhurried; one type family (Inter) in four roles; light is the base theme and dark an overlay; focus is a 2px outline with offset; disabled is opacity on the whole control. The founder considers the current look unfinished and wants it tuned inside the portal; that work belongs to the visual pass, not to this record.
- The Resonant brand book is `Resonant DS/README.md` and the cover is `Resonant DS/cover.html`.

## Evidence on Hand

- `Resonant DS/`: manifest, tokens (primitive, semantic, component), dark overlay, 34 contracts, 3 page examples (dashboard, settings, confirm-delete), brand book, cover, built `dist/`.
- `docs/vision.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/adr/0001` to `0013`, `docs/research/ux-references.md` (review of 15 design-system sites with the patterns the portal follows).
- The published Design System artifact for Claude's design mode.
- Absent, and not to be fabricated: customers, testimonials, case studies, press, benchmarks, pricing, usage numbers.

## Product Principles

- Contracts are the source of truth. Nothing is inferred from code.
- Agents never emit markup. They emit trees validated against finite vocabularies.
- Everything is versioned the same way: draft, immutable snapshots, computed diffs, rollback by republishing.
- Elos is its own first customer. The portal is built from Resonant and edited in the portal.
- Design once, serve everywhere. Every area publishes through Serve; one catalog, one access model, one audit trail.

## Accessibility & Inclusion

WCAG 2.2 AA for the portal and for Resonant: 4.5:1 text and 3:1 UI contrast on every token pair in every theme, visible focus, 24px minimum targets, full keyboard operation. Contracts carry hit area, keyboard and ARIA declarations; the planned audit layer reports contrast per pair per theme and keyboard coverage from the catalog. Motion must honor `prefers-reduced-motion`.
