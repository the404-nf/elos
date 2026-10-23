# 0005. Agents emit composition trees, never markup

Status: Accepted, 2026-10-23

## Context

The product promise is that AI uses real components from the library and never hardcodes its own. Generated UI must also render on channels as different as a web page, a Slack message and a Markdown reply. Agent-to-UI protocols (OpenUI Lang, A2UI) are wanted soon but not in the MVP.

## Decision

The only thing an agent produces is a composition tree, defined as `CompositionNode` in `packages/contracts`: a node names a contract id, canonical prop values and slot contents. Contract examples use the same type. Every channel emitter renders this tree with real components. Any reference not in the catalog is refused.

OpenUI Lang and A2UI are adapters that parse into this tree. They are milestone two.

## Consequences

- Determinism holds by construction: the renderer has nothing to draw except catalog components.
- The composition schema is defined now so adding protocol adapters later changes no data model.
- Streaming rendering is a renderer concern, not a contract concern.
