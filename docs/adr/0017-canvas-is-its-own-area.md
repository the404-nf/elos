# 0017. Canvas is its own area: a design system never contains product screens

Status: Accepted, 2026-10-24. Replaces the reverted draft "Screens on the spine" (commit 438362b, reverted in 8135f9e).

## Context

The vision shows three areas users see, Design Systems, Marketplace and Canvas, over one invisible Serve. On 2026-10-24 a first cut of screens was built as a sixth tab inside a design system, with `screens/*.screen.json` in the system's directory and a `screens` field on its catalog. The founder stopped the work: screens and journeys are Canvas, not Design Systems. A screen consumes a system; it does not belong to one. Mixing them would put a customer's product inside the artifact that Serve hands to every agent as "the design system", and it would tie a screen to one system's draft instead of to a version the product chose.

## Decision

1. **Canvas is a top-level area**, reached from the Elos home beside Design Systems and Marketplace, with its own chrome. Nothing about screens, journeys or bindings appears inside a design system's pages, catalog or MCP server.
2. **A Canvas project binds to a design system by id and version.** The project is the unit of work and of versioning: its own directory of files with schemas (`project.json`, `screens/`, `journeys/`, later `bindings/`), stored, snapshotted and served by the same mechanism as a design system but as a different kind of directory. The design system's directory and catalog do not change when a project does.
3. **The Canvas is a building surface.** One large zoomable board with tools, in the manner of Figma, Paper, Pen or Claude Design: frames are screens, components are placed from the bound system, things are resized with handles, and a chat drives an agent. What it produces is still only a composition tree per screen (ADR 0005), validated against the bound system's catalog, edited through one operation (ADR 0016: node path, prop or slot, value). Free geometry exists only for frames on the board; inside a frame every dimension is a token or a layout prop.
4. **Canvas gets its own Serve surface** when it needs one: REST under its own route, an MCP server per project with read tools and, for the portal's own agent, write tools. The design system's MCP stays read-only and knows nothing of projects.
5. **The design is written before the code**: `docs/canvas.md` holds the model, the surface and the build order. Code that was reverted (the screen operation in `compose.ts`, the `data-node` path on `Render`, the contract-derived inspector) is area-neutral and comes back under Canvas when its step arrives, from git history, not rewritten from memory.

## Consequences

- Phase 4 of the roadmap is rewritten as the Canvas build order; the word "Screens" leaves the design system portal.
- `pages/*.page.json` remain the design system's own examples. They are not screens and do not migrate.
- A new capability still follows the spine rule (schema, catalog field, Serve, screen), but the first question is which area's spine it belongs to. For anything a customer builds with a system rather than something that defines the system, the answer is Canvas.
