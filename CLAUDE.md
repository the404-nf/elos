# Elos

Elos stores design systems in a form people and AI agents use deterministically. Resonant DS is its own design system and its first customer. Read in this order when starting a session: this file, `docs/vision.md`, `docs/roadmap.md`, `docs/architecture.md`, then the ADR that covers the area you touch (`docs/adr/`). `docs/research/ux-references.md` holds the UX patterns the portal follows.

## Non-negotiables

- Contracts are the source of truth. A component is a JSON contract; nothing is inferred from code. Agents emit composition trees, never markup, and every tree is validated against the catalog.
- One spine: a design system is a directory of files with Zod schemas (`system.json`, `tokens/`, `themes/`, `contracts/`, `pages/`, `assets/`). The catalog is built from it. Drafts and versions are snapshots of it. No area gets its own storage or format. A new capability is first a schema for a file, then a catalog field, then a Serve surface (REST, MCP, exports), then a screen in the portal.
- Tokens: DTCG, three tiers (primitive, semantic, component). Components bind to semantic tokens. Editors write tokens and bindings, never raw CSS values. Token CSS emits aliases as `var()`.
- Behavior is rented from Zag.js behind Resonant's own API. Static components use native elements.
- The portal is built from Resonant and edits Resonant. When a portal screen needs a component Resonant lacks, add the contract, do not hand-write markup.
- Decisions get an ADR. Reversals are new ADRs that supersede.

## Layout

| Path | What |
|---|---|
| `packages/contracts` | Zod schemas: Contract, tokens, CompositionNode, PageExample, SystemManifest, Catalog |
| `packages/core` | `buildCatalog(files)` (pure, in `./catalog`), CSS emitters (`./css`), composition checks (`./composition`), Markdown emitter (`./markdown`); node entry reads a directory |
| `packages/react` | Data-driven renderer (`Render`, `ElosProvider`, `createComponent`), Zag adapters in `./behaviors`, static preview and Design System artifact export scripts |
| `packages/mcp` | Read-only MCP server over a catalog; stdio entry in `src/server.ts` |
| `apps/portal` | Next.js 15 portal: Drizzle on PGlite (`.data/`, gitignored) or Postgres via `DATABASE_URL`; REST at `/api/<ds>/catalog` and `/css`; MCP at `POST /api/<ds>/mcp` |
| `apps/playground` | Vite gallery of every example with behavior |
| `Resonant DS/` | The design system: manifest, tokens, themes, contracts, pages, assets (icons, illustrations), docs, brand book (README), cover |

## Commands

```bash
pnpm install
pnpm run build:resonant      # catalog.json, tokens.css, components.css, schemas into "Resonant DS/dist"
pnpm test                    # node:test across packages; must stay green
pnpm run typecheck           # packages; the portal has its own tsconfig: cd apps/portal && npx tsc --noEmit -p tsconfig.json
pnpm run portal              # portal on :3000; first run seeds the Resonant directory into the embedded database
pnpm run playground          # :5173
pnpm run export:resonant <out> --by <name>   # Design System artifact tree
```

Node 24 runs the TypeScript directly: explicit `.ts` import extensions, no enums, no bundler in packages. `.claude/launch.json` has `portal` and `playground` for the browser pane.

## Working rules

- Ponytail: the smallest change that is correct. No speculative abstractions. One self-check per non-trivial piece of logic in `*.test.ts` using `node:test`.
- Verify in the browser before claiming a portal change works. The pane sometimes goes off screen; when screenshots time out, verify through the DOM with the script tool and say so.
- The portal's dev database is seeded once from `Resonant DS/`. After adding files to the directory, delete `apps/portal/.data` and restart, or the draft will not have them.
- Commit per milestone with a message that lists what changed by package; push to `origin main`. End commit messages with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Keep `docs/roadmap.md` current: when a roadmap item lands, mark it; when a new one is agreed, add it to its phase.
- The founder is the400-nf (Lê). Decisions and feedback rounds are summarized in the memory directory as well as in the docs.

## Current state (update when it changes)

Phase 0 of the roadmap is done. Phase 1 is in progress. Resonant has 39 contracts (forms, navigation, layout, data display, feedback, overlays, media: `ds.icon` over 119 SVG icons and `ds.illustration` over 22 spot illustrations in `assets/`, and `ds.page-head`, the Bloom header). Its look is the one approved in the Claude Design round of 2026-10-24 (ADR 0015): dark by default with a light overlay, one brand pink through semantic tokens only, three faces (Inter Tight, Albert Sans, JetBrains Mono) listed in `system.json` and imported by the emitted CSS, nine `gradient.*` tokens, per-part `animation` with contract `keyframes`. The design system's own documents are in `Resonant DS/docs/` (layout guide, gradients, Bloom and motion, icon and illustration guides, decision records). The portal is composed from Resonant through the typed wrappers in `apps/portal/src/components/elos-client.tsx` (ADR 0014); every screen starts with `PageHead` (`ds.page-head` with the nav row inside). `apps/portal/DESIGN.md` plus `.impeccable/design.json` record the look. The next items are the scale sliders on the canvas panel and the themes page. After adding contracts, tokens or assets, delete `apps/portal/.data` so the portal draft reseeds; the draft column is `json` (not `jsonb`) because part order matters.

Portal chrome rules: compose screens from the wrappers (`Card`, `Stack`, `Text`, `Button`, `Table`, `Field`, `Nav`, `Dialog`, ...), never from hand-written elements; start every screen with `PageHead`; the only portal CSS is the structure between components in `globals.css`, bound to token variables. A wrapper forwards handlers, aria-*, data-*, id, title, style, list, defaultValue and inert to the root element; a contract prop or slot of the same name wins. `.claude/launch.json` has `portal-3001`, a second portal on its own database (`PGLITE_DIR`) for when :3000 is taken by another session, and `outputs`, a static server on :5180 over `Claude outputs/` (the untracked Claude Design material the look came from).

Impeccable (user-scope plugin `impeccable@impeccable`, 4.7.0) is installed and initialized. `PRODUCT.md` at the repo root is the product record it reads; run its commands from `apps/portal` (the UI target) so the launcher resolves the portal and finds `apps/portal/DESIGN.md`. Live mode (`apps/portal/.impeccable/live/config.json`) is ready. The critique and audit of 2026-10-23 and what was done about them are summarized in ADR 0014. `docs/architecture.md` was `docs/design.md`; it was renamed so Impeccable does not mistake it for its visual DESIGN.md. Image generation is not available in this harness, so Impeccable builds code-first.
