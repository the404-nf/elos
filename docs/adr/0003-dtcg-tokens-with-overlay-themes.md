# 0003. DTCG tokens with overlay themes

Status: Accepted, 2026-10-23

## Context

Tokens must be readable by design tools later (Figma plugins read the DTCG format), must support light and dark modes now, and must support multi-brand clients without a redesign. DTCG has no native concept of modes.

## Decision

Tokens are DTCG JSON in three tiers: primitive, semantic, component. Aliases use `{group.path}`. Dimensions use the `{ value, unit }` object form; colors use hex strings.

The base token files are the default theme (light). A theme is an overlay: a partial token file with a `kind` (`mode` or `brand`) and a CSS selector, listed in `system.json`. Overlays compose in order, so brand plus dark mode is two overlays. The CSS emitter writes the base under `:root` and only the differing variables under each theme selector.

## Consequences

- Multi-brand is a second overlay kind, already modeled, with no code change.
- Token references in contracts may substitute enum props (`{color.action.{variant}.background}`); the build checks every expansion resolves.
- The current token values are placeholders until the visual reference arrives.
