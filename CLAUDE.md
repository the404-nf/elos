# Elos

Elos stores design systems in a form people and AI agents use deterministically. Resonant DS is its own design system and its first customer. Read in this order when starting a session: this file, `docs/vision.md`, `docs/roadmap.md`, `docs/architecture.md`, then the ADR that covers the area you touch (`docs/adr/`). `docs/research/ux-references.md` holds the UX patterns the portal follows.

## Non-negotiables

- Contracts are the source of truth. A component is a JSON contract; nothing is inferred from code. Agents emit composition trees, never markup, and every tree is validated against the catalog.
- One spine: a design system is a directory of files with Zod schemas (`system.json`, `tokens/`, `themes/`, `contracts/`, `pages/`). The catalog is built from it. Drafts and versions are snapshots of it. No area gets its own storage or format. A new capability is first a schema for a file, then a catalog field, then a Serve surface (REST, MCP, exports), then a screen in the portal.
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
| `Resonant DS/` | The design system: manifest, tokens, themes, contracts, pages, brand book, cover |

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

Phase 0 of the roadmap is done. Phase 1 is in progress. Resonant has 34 contracts (forms, navigation, layout, data display, feedback, overlays) and motion tokens with per-part transition bindings. The next item is the visual pass on the portal, to be done with the Impeccable design skills once installed, building the chrome from Resonant tokens and components and tuning Resonant inside the portal. After adding contracts, delete `apps/portal/.data` so the portal draft reseeds.
