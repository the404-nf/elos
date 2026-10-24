# Canvas

The third area of the platform ([vision](vision.md)), where a team builds product screens and journeys with a design system. It is a building surface in the manner of Figma, Paper, Pen or Claude Design: one large board, tools, a library, an inspector, a chat. It is not a tab of a design system ([ADR 0017](adr/0017-canvas-is-its-own-area.md)). This document is the design, written before the code. Nothing here is built yet.

## The promise

Figma's feel, Elos's output. Everything the user places, resizes or asks for ends as a composition tree per screen ([ADR 0005](adr/0005-agents-emit-composition-trees.md)), validated against the catalog of the design system the project is bound to. The board has free geometry only for frames; inside a frame there are no pixels, only components, their props and their slots, with dimensions that are tokens or layout props. That is what makes a screen render identically on the web, in Slack and in Markdown, and what makes an agent and a mouse interchangeable as inputs ([ADR 0016](adr/0016-one-operation-three-inputs.md)).

## Model

A Canvas **project** is a directory of files with schemas, stored, drafted, versioned and served like a design system directory but as its own kind:

| File | What |
|---|---|
| `project.json` | id, name, the bound design system (`system: { id, version }`; `version` is a published version or `"draft"` while the team works against the system's draft), the channels it targets |
| `screens/<slug>.screen.json` | id (`screen.<slug>`), name, description, `frame` (x, y, width, height on the board, plus a viewport preset name), `tree` (a `CompositionNode`) |
| `journeys/<slug>.journey.json` | id, name, an ordered list of screen ids and the transitions between them (from screen, trigger as a node path and event, to screen) |
| `bindings/<name>.binding.json` | later: an OpenAPI document reference and the named queries and mutations a screen uses |

A project's catalog is the bound system's catalog plus the project's own files validated against it. Changing the bound version re-validates every screen and reports what broke. Versions of a project are snapshots of its directory, with diffs and rollback, the same mechanism as today's design system versions.

Storage in the portal: a second kind of row beside design systems and their drafts and versions, same tables shape, a `kind` column or a parallel table set, decided when the first migration is written. Nothing is written into the design system's directory, catalog or MCP server.

## The surface

One route per project, full-screen, no design system chrome. From the Elos home, Canvas lists projects beside Design Systems and Marketplace.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ◀ Projects   Acme Web · Resonant DS v0.4.0 ▾      Undo  100% ▾   Preview ▾  Publish │
├───┬────────────────────────────────────────────────────────────┬───────────────┤
│ V │                                                            │  Inspector    │
│ H │   ┌─ Checkout ─────────────┐   ┌─ Confirmation ──────┐    │  card         │
│ F │   │ [page-head]            │   │ [page-head]         │    │  title  ____  │
│ C │   │ [stack]                │──▶│ [alert]             │    │  padding  lg  │
│ T │   │  [card] [card]         │   │ [button]            │    │  slots        │
│   │   │  [button Pay]          │   └─────────────────────┘    │   body  2 ↑↓× │
│ ▦ │   └────────────────────────┘                              │   actions 1   │
│   │                                                            ├───────────────┤
│   │                 (infinite board, zoom and pan)             │  Chat         │
│   │                                                            │  > make the   │
│   │                                                            │    summary a  │
│   │                                                            │    card       │
│   │                                                            │  [Apply 3]    │
└───┴────────────────────────────────────────────────────────────┴───────────────┘
```

**Top bar.** Back to projects; project name; the bound system and version as a chip (switching re-validates); Undo; zoom with presets and fit; Preview per channel (web, Slack, Markdown, from the emitters); Publish (a project version).

**Left toolbar.** Select (V), Hand (H), Frame (F) to draw a new screen on the board with a viewport preset, Component (C) to open the library, Text (T) to add a text node into the selected slot, and the library drawer (▦): the bound system's components by category, searchable by intent with the same ranking as `find_component`; click to place into the selected slot, or drag onto the board where valid slots light up.

**Board.** The stage already built for the component editor (zoom, pan, fit, crisp transform) holds frames. A frame is a screen: a name label, a viewport preset, resize handles for the frame only. Inside, every node root carries its path (`data-node`), a click picks the node, the selection is an overlay. Handles on a selected container adjust its layout props in token steps, like the component canvas; dragging a node to another slot is a slot operation. Journeys are arrows between frames, drawn from a node that triggers the transition.

**Inspector.** Derived from the node's contract: enum props as selects with the default named, booleans as checkboxes, text and numbers as inputs, slots with their items, what they accept and their maximum, add, remove, move. For a frame: name, viewport, position.

**Chat.** The agent beside the board with `place`, `patch_node`, `remove`, `render` (the tree with its validation and, later, a screenshot); proposals shown as operations with Apply and Discard; the same mock when no key is set; later the user's own model through the bring-your-own gateway.

## One operation, as before

A screen edit is `{ path, prop, value }` or `{ path, slot, items }` applied by one pure function with an undo log; a frame edit is `{ screen, frame }`. Mouse, inspector and chat all produce these. Save validates the project against the bound catalog; an invalid intermediate tree keeps the last valid render and disables Save. The pure functions and the inspector were built once and reverted with commit 438362b; they return from history at step 1 below.

## Build order

1. **Project and board.** Project files and schemas, storage, the Canvas list on the Elos home, the full-screen route, the board with frames (New frame = new screen), placement from the library into a selected slot, the inspector, undo, Save, both themes. Reuses from history: `compose.ts` and its test, the `path` on `Render`, the inspector.
2. **Direct manipulation.** Frame resize and viewport presets, drag a node between slots with valid targets lit, token-stepped layout handles on containers, keyboard (arrows, delete, duplicate).
3. **Chat.** The agent with `place`, `patch_node`, `remove`, `render`; mock first; proposals and Apply.
4. **Journeys.** Transitions drawn between frames, stored as files, a play mode that walks them.
5. **Data.** OpenAPI bindings as files, named queries and mutations on a screen, validated against the spec; the bring-your-own model gateway; OpenUI Lang and A2UI as adapters that produce trees.
6. **Serve for Canvas.** REST under the project, an MCP server per project, exports per channel, publish and versions.

## Open questions for the founder

- Does a project bind to a published version only, or may it follow a system's draft while both are in flux? The design above allows both and defaults to a published version.
- Where does the chat dock, under the inspector or as a bottom panel that can be hidden?
- Is the architecture image the source for the home: three cards, Design Systems, Marketplace, Canvas, with Serve as a status line? It should be committed under `docs/` so the layout is on record.
