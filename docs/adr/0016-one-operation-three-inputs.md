# 0016. The canvas edits through one operation with three inputs: mouse, values, agent

Status: Accepted, 2026-10-24

## Context

The founder wants Elos to have what their company calls Kanvas: editing with the granularity of a design tool's mouse control, inside the product, first on components and later on whole screens, with an agent as one of the ways to edit. The portal already edits components through values (the inspector: fields with completion, sliders that snap to a token scale, selects for motion) and selects a part by clicking it on the canvas. Claude Design edits free HTML in an agent loop that sees and corrects its own output; Elos edits contracts, where every value is a token and every structure is checked.

## Decision

1. **One operation.** Every edit to a component is the same record: a part, a property, a token reference (or, for a state, a part, a state, a property, a token reference). The editor applies it in one place (`update`), the preview re-renders from the modified contract, the emitter and the validator see nothing but a contract, and Save to draft validates the whole system as before. The operation log is the undo history.
2. **Three inputs produce it.** Values: the inspector as it is. Mouse: the selected part gets handles on the canvas; dragging an edge changes a padding or height binding, dragging a corner a radius binding, and the handle moves in stops, the siblings of the bound token sorted by value, so a drag never writes a pixel, only the nearest token. Agent: a chat beside the canvas with tools that read the contract, propose operations and render the result in both themes; its proposals are shown as a diff and applied through the same `update`. The agent comes after the operations are stable.
3. **Tokens, not pixels, at every input.** Colors are picked from semantic tokens, dimensions from their scale. A value that is not a token cannot be produced by the canvas; it can only be typed in the literal styles rows, which stay the exception.
4. **Screens use the same mechanism.** A screen is a composition tree (ADR 0005); its operation is a node path, a prop or slot, a value. The same canvas, inspector and chat apply, with handles that move nodes between slots and adjust layout props. Components come first because the surface is smaller and half of it exists.

## Consequences

- Handles, the range inputs and the color field stay native elements in the portal for now, as ADR 0014 allowed for the pickers; they become contracts when a second screen needs them.
- Undo is per editing session, not persisted; Save to draft is the durable step, and versions remain the history.
- The agent needs write tools the MCP server does not expose (`patch_part`, later `patch_node`), which belong to the portal's own agent, not to the read-only MCP served to outside agents.
- Roadmap Phase 4 item 5 (editing generated screens with the same canvas) is now the stated path, and the component canvas is its first implementation.
