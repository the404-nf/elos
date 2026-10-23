# 0009. Zag.js as the behavior engine behind Resonant's own API

Status: Accepted, 2026-10-23

## Context

Radix Primitives were the starting base, but the goal is to own the design system framework and offer it to clients closed source. Radix is React-only, which conflicts with stack-agnostic contracts. Rewriting focus management, ARIA wiring, dismissable layers and collision-aware positioning is years of accessibility bugs for no product gain.

## Decision

Own the contract model, the token model, the component API and the renderers. Rent behavior from Zag.js, MIT-licensed state machines with adapters for React, Vue, Svelte and vanilla JS. Zag exposes named anatomy parts per component (trigger, content, backdrop), which map directly onto a contract's anatomy. The machine's states and events become the logic layer's declared states and events.

Zag is an implementation detail hidden behind Resonant's own component API, so it can be swapped. A contract's `behavior` field names the machine it binds to.

## Consequences

- The renderer stays framework-agnostic at the behavior level; the React adapter is the first target only.
- Closed-source distribution is compatible with MIT dependencies.
- Components with no behavior (Card) bind to no machine and are pure anatomy.
