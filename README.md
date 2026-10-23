# Elos

Elos stores design systems and makes them usable by humans and AI agents alike. A design system in Elos has three layers: contracts (the source of truth), logic (headless behavior and channel adaptation) and render (tokens and components per target). Resonant DS is Elos's own design system and the first one it stores.

- [Vision](docs/vision.md): the official direction. Four areas: Design Systems, Marketplace, Canvas, Serve.
- [Roadmap](docs/roadmap.md): phases with exit criteria.
- [Architecture doc](docs/architecture.md): architecture, layers, data model, channels, milestones.
- [Decision records](docs/adr/): one file per decision, numbered in the order taken.
- [UX references](docs/research/ux-references.md): what fifteen design system sites do well, and what the portal takes from them.

## Layout

| Path | What |
|---|---|
| `packages/contracts` | Zod schemas for contracts, tokens, compositions, manifests and the built catalog |
| `packages/core` | Loads a design system directory, validates it, resolves tokens, emits `catalog.json`, `tokens.css`, `components.css` and JSON Schemas |
| `packages/react` | Data-driven React renderer: draws any composition tree from the catalog using contract anatomy; `behaviors` maps Zag.js machines (dialog, tabs, switch) onto anatomy parts |
| `packages/mcp` | Read-only MCP server over a catalog: list, get, find by intent, tokens, validate composition |
| `apps/playground` | Vite app rendering every contract example in every theme with real behavior |
| `apps/portal` | The Elos portal: Next.js, Drizzle on PGlite (or Postgres via `DATABASE_URL`). Tokens and components areas, token editing previewed in real compositions, component canvas and advanced editing, versions with publish and rollback, REST (`/api/<ds>/catalog`, `/api/<ds>/css`) and remote MCP (`POST /api/<ds>/mcp`) |
| `Resonant DS/` | The Resonant design system: `system.json`, `tokens/`, `themes/`, `contracts/` |

## Commands

```bash
pnpm install
pnpm run build:resonant   # emits Resonant DS/dist
pnpm run preview:resonant # emits Resonant DS/dist/preview.html, static, every example in every theme
pnpm run playground       # builds the catalog and serves the interactive playground on :5173
pnpm run export:resonant <out-dir> --by <name>   # Design System artifact file tree for Claude's design mode
pnpm run portal           # the portal on :3000; first run seeds the Resonant DS directory into an embedded database (apps/portal/.data)
pnpm test
pnpm run typecheck
```

Node 24 runs the TypeScript sources directly. There is no bundler.
