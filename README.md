# Elos

Elos stores design systems and makes them usable by humans and AI agents alike. A design system in Elos has three layers: contracts (the source of truth), logic (headless behavior and channel adaptation) and render (tokens and components per target). Resonant DS is Elos's own design system and the first one it stores.

- [Design doc](docs/design.md): architecture, layers, data model, channels, milestones.
- [Decision records](docs/adr/): one file per decision, numbered in the order taken.

## Layout

| Path | What |
|---|---|
| `packages/contracts` | Zod schemas for contracts, tokens, compositions, manifests and the built catalog |
| `packages/core` | Loads a design system directory, validates it, resolves tokens, emits `catalog.json`, `tokens.css`, `components.css` and JSON Schemas |
| `packages/react` | Data-driven React renderer: draws any composition tree from the catalog using contract anatomy; behavior seam for Zag.js machines |
| `Resonant DS/` | The Resonant design system: `system.json`, `tokens/`, `themes/`, `contracts/` |

## Commands

```bash
pnpm install
pnpm run build:resonant   # emits Resonant DS/dist
pnpm run preview:resonant # emits Resonant DS/dist/preview.html, every example in every theme
pnpm test
pnpm run typecheck
```

Node 24 runs the TypeScript sources directly. There is no bundler.
