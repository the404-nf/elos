# 0002. TypeScript monorepo on native Node

Status: Accepted, 2026-10-23

## Context

The portal, the MCP server, the catalog build and every renderer share the contract schema. The MCP ecosystem is TypeScript-first. Node 24 runs TypeScript sources directly through type stripping.

## Decision

One pnpm workspace at the repository root. Platform code lives in `packages/*` and `apps/*`. Design systems live in their own directories (`Resonant DS/`). TypeScript throughout, run directly by Node with no bundler. The `tsconfig` enables `erasableSyntaxOnly` so sources stay strippable: no enums, no parameter properties, explicit `.ts` import extensions.

Tests use `node:test`. One self-check per non-trivial piece of logic, no framework.

## Consequences

- Zero build tooling until a package is published to clients, at which point a build step is added for that package only.
- Zod is the only runtime dependency of the foundation.
- Workspace packages are consumed by source through `exports` pointing at `src/index.ts`.
