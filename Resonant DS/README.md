# Resonant DS

Resonant is the design system of Elos, a platform that stores design systems and serves them to people and AI agents alike. Resonant is the first system Elos stores and the one the Elos portal is built with. It is also offered to clients as a base to build their own system on.

## Principles

- **The contract is the component.** Every component is a JSON contract: props, anatomy, token bindings, states, accessibility, when to use it and when not. Renderers draw from the contract; nothing is hand-written per component.
- **Deterministic for agents.** Guidance is short and enumerable, never prose. An agent finds a component by intent, reads its contract, composes a tree of real components and validates it. Anything not in the catalog is refused, not improvised.
- **Omnichannel by declaration.** Each component says how it degrades on every channel: web, chat widgets, Slack, plain Markdown. Nothing is assumed.
- **Calm, precise, unhurried.** Neutral surfaces, one blue for action, status colors only where a state must be read. Small radii, hairline borders, generous inset.

## Voice

Plain sentences, sentence case, action verbs on buttons. No exclamation marks, no emoji in product copy. Titles name the thing or the decision ("Delete project?"), never the component.

## Tokens

Three tiers. Primitives (`color-gray-900`, `space-4`) are raw values and are never used directly by components. Semantic tokens (`color-text-primary`, `space-inset-md`, `radius-control`) carry meaning and are what components bind to. Component tokens (`switch-track-width`, `dialog-width`) exist only where a component needs a dimension nothing else shares.

Light is the base theme. Dark is an overlay that changes surfaces, text, borders and status tints and leaves the action blue alone. Every text token is legible on `color-surface-canvas` and `color-surface-raised` in both themes.

Keyboard focus is a 2px outline in `color-border-focus` with a 2px offset. Disabled is `opacity-disabled` on the whole control, never a separate color.

## Type

One family, Inter, in four roles: title, heading, body, caption. Weight does the hierarchy work; sizes stay close. Line height 1.5 everywhere.

## Components

Action: Button. Form: Input, Select, Switch. Navigation: Tabs. Layout: Card, Stack. Overlay: Dialog. Feedback: Badge. Data display: Text. Dialog, Tabs and Switch get their behavior from Zag.js state machines behind Resonant's own API; everything else is a native element styled by its contract.

Composition rules live in the contracts: a Card's actions take at most three Buttons, a Dialog's trigger is exactly one Button, Tabs contain Tab and Tab panel only.

## Using this system

Read a component's guidelines before using it: the "When not to use" and "Don't" lists are rules, not suggestions. Bind to semantic tokens, never to primitives or raw values. Keep one primary Button per view.
