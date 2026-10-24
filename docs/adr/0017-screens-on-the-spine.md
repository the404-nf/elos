# 0017. Screens are files on the spine, edited on the composition canvas

Status: Accepted, 2026-10-24

## Context

The vision's Canvas pillar is where users compose product screens from their system, with their own model, and version them. ADR 0005 fixed the only thing an agent or an editor produces: a composition tree. ADR 0016 fixed how the portal edits: one operation from three inputs, with the note that a screen's operation is a node path, a prop or slot, a value. Pages (`pages/*.page.json`) already hold composition trees, but they are the system's own documentation: what tokens are previewed against, what agents learn from. A product screen is the customer's, not the system's, and it will later carry data bindings (OpenAPI) and belong to journeys.

## Decision

1. **A screen is a file.** `screens/<slug>.screen.json`, schema `Screen` in `packages/contracts`: an id with the `screen.` prefix, a name, a description, a `CompositionNode` tree. The manifest names the folder (`screens`, by default). The catalog gains `screens`, built and validated against the contracts exactly as pages are, so an invalid tree never reaches the draft. Versions, diffs and rollback cost nothing: the directory is already what is snapshotted.
2. **Pages stay what they are.** Same tree type, different purpose and prefix. Pages document the system; screens are product. Nothing moves between the two folders automatically.
3. **Serve exposes them as data.** The REST catalog carries `screens`; the MCP server gains `list_screens`, read-only like every other tool. Editing stays in the portal.
4. **The canvas is the component canvas's mechanism applied to a tree.** The renderer, given a root `path`, writes each node's path to `data-node` on its root element; a click on the canvas resolves to the nearest node; the selection is an overlay measured from the DOM. The operation is `{ path, prop, value }` or `{ path, slot, items }`, applied in one pure function (`applyScreenOp`) with an undo log; add, remove and move are slot operations. The inspector derives every control from the node's contract: enum props as selects with the default named, booleans as checkboxes, text and numbers as inputs, slots with what they accept. An invalid intermediate tree keeps the last valid render on the canvas and disables Save. Save validates the whole system through the same `saveDraftFile` as a contract.
5. **The agent follows.** The chat beside the canvas (ADR 0016) applies to screens with `patch_node` and the same `render`; it is not built yet. Neither are data bindings and journeys (roadmap Phase 4, items 3 and 4).

## Consequences

- `apps/portal/src/lib/compose.ts` holds the screen operation; `apps/portal/src/lib/operate.ts` the component one. Both are pure and tested; the editors only call them.
- Adding a node seeds it with its contract's first example props, so it validates immediately; slot limits (`max`) and `restrict` lists are honored by the inspector.
- Dragging nodes on the canvas is deferred: the tree pane and the slot rows move nodes today. When drag arrives it produces the same slot operation.
- Resonant ships one screen, `screen.project-overview`, as the first customer's first screen and the test fixture for both the catalog and the portal libraries.
