# Roadmap

Phases, not dates. Each phase has exit criteria that are observable in the product. The order follows the [vision](vision.md): Design Systems, then Serve hardening, then Marketplace, then Canvas, then scale. A phase can start before the previous one fully exits when the spine allows it.

## Phase 0: Foundation. Done

- Contracts, tokens, themes, page examples as files with schemas; the catalog built and validated from them.
- Data-driven React renderer with Zag.js behaviors; Resonant with thirteen components and three pages.
- MCP server over stdio and Streamable HTTP; REST catalog and CSS.
- Portal: tokens and components areas, in-context token editing with typed controls and the chain view, component canvas and contract form, versions with publish and rollback, Pages area.
- Design System artifact export for Claude's design mode.

## Phase 1: Design Systems area complete

Exit: a designer can shape Resonant entirely inside the portal, and the portal looks like a product.

1. **Visual pass on the portal.** Done (2026-10-23): the chrome is composed from Resonant through typed wrappers (`ds.nav` and `ds.nav-item` added; Button, Select, Input, Textarea, Stack and Card gained the props the chrome needed), every chrome value binds to a token variable, and Resonant was tuned where the Impeccable critique and audit showed it (danger action on red.600, warning text on amber.800, `color.border.strong` on controls, `font.family.mono`, `space.stack.xs`). `apps/portal/DESIGN.md` records the look; [ADR 0014](adr/0014-portal-chrome-from-contracts.md) records the mechanism. Left for later: search and filter over components and tokens, a keyboard shortcut for Save, the catalog CSS as a linked stylesheet, contracts for the preview canvas and the color and range pickers.
   **Visual direction** (2026-10-24): the look approved in the Claude Design round is Resonant's: tokens converted into the tiers, 28 contract edits, `ds.page-head`, `ds.icon` and `ds.illustration`, gradients and animation in the schema, fonts and assets in the manifest, the portal opening in the Bloom in dark. [ADR 0015](adr/0015-resonant-visual-layer-from-claude-design.md). The design system's own documents (brand book, layout guide, icon and illustration guides, decision records) live in `Resonant DS/docs/`.
2. **Motion.** Done: motion tokens (`motion.duration.*`, `motion.easing.*`), a per-part `motion` field binding CSS properties to a duration and easing token, the emitter writing `transition` with a `prefers-reduced-motion` guard. Not yet: enter and leave animation of overlays, which needs `transition-behavior: allow-discrete` and `@starting-style` in the emitter.
2b. **Core component set.** Done: 34 contracts covering forms, navigation, layout, data display, feedback and overlays, with Tooltip, Popover and Menu on Zag.js. Not yet: Combobox, Date picker, Data grid, Command palette, Carousel, File upload, Rich text, and a toaster region that stacks and times Toasts.
3. Scale sliders on the canvas panel for padding, gap, radius and size bindings.
4. Component cards with static scaled renders and counts. Done: each card shows the first example on a preview well, the description, variant and example counts, channel support and the status badge.
5. Themes page: list overlays, re-theme a page per theme, clone into a brand overlay, generate a starting overlay from one brand color.
6. Blocks area: composition trees stored as `blocks/*.block.json`, rendered on every channel, searchable by intent, Copy for agent.
7. Import and sync from a directory, so a system kept in git round-trips with the portal. First source format seen: a Claude Design artifact export (flat tokens, hand-written CSS, per-component READMEs); the conversion of 2026-10-24 was a one-off script, the case is on record in ADR 0015.
8. Authentication and API keys; organizations and membership.
9. Audit and reports v1: contrast per pair per theme, hit area and keyboard coverage, token and component usage, drift between draft, versions and consumers.

## Phase 2: Serve hardening

Exit: an agent in Claude Desktop, Claude Code, ChatGPT or Codex can use a private system end to end.

1. OAuth for the remote MCP server.
2. Generated agent skills (SKILL.md) and llms.txt from the catalog, per system and per version.
3. Markdown emitter as a channel output; Slack Block Kit emitter; HTML widget bundle for ChatGPT Apps and Claude Desktop MCP Apps.
4. Versioned package publishing for client codebases, pinned by version.
5. Access log: which agent or key read which version of what.

## Phase 3: Marketplace

Exit: a team consumes principles, DDRs, skills and agents from Elos instead of from documents.

1. Schemas for principles, design decision records, skills and agents as files in the directory; catalog fields; MCP and REST surfaces.
2. Organization-level base assets inherited by systems.
3. Review and approval flow before an asset is published; attribution and history.
4. Governance reports: which systems follow which principles, which decisions are stale.

## Phase 4: Canvas

Exit: a user composes a screen with their own model, binds it to their API, publishes it as a version and sees it on every channel.

1. Composition language adapters: OpenUI Lang and A2UI parse into the composition tree.
2. Bring-your-own model gateway: the user's provider and key, the catalog and OpenAPI vocabularies as the prompt, validation of every tree before render.
3. Screens as `screens/*.screen.json` with versions, diffs and rollback; journeys as ordered screens with transitions.
4. OpenAPI binding: named queries and mutations on a screen, validated against the spec.
5. Editing of generated screens with the same canvas as components.

## Phase 5: Scale

Exit: Elos runs for several organizations, in the cloud and self-hosted.

1. Multi-tenant onboarding and billing.
2. Self-host packaging: one image plus Postgres, upgrade path, backups.
3. Figma sync of tokens and themes as variable modes.
4. Import of existing component libraries into contracts.
5. Multiplayer editing of a draft.

## Deferred on purpose

Listed in [ADR 0012](adr/0012-deferred-with-room-left.md). Nothing there needs a change to the spine when it is taken up.
