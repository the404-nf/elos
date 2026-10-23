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

1. **Visual pass on the portal.** Build the portal chrome from Resonant tokens and components, then tune Resonant itself in the portal. Use the Impeccable design skills for the pass. This is the next item.
2. Scale sliders on the canvas panel for padding, gap, radius and size bindings.
3. Component cards with static scaled renders and counts.
4. Themes page: list overlays, re-theme a page per theme, clone into a brand overlay, generate a starting overlay from one brand color.
5. Blocks area: composition trees stored as `blocks/*.block.json`, rendered on every channel, searchable by intent, Copy for agent.
6. Import and sync from a directory, so a system kept in git round-trips with the portal.
7. Authentication and API keys; organizations and membership.
8. Audit and reports v1: contrast per pair per theme, hit area and keyboard coverage, token and component usage, drift between draft, versions and consumers.

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
