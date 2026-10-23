# 0011. The portal is the Storybook

Status: Accepted, 2026-10-23

## Context

Users must view, tweak and edit tokens and components live, see the result at once, save, and deploy into a version. Storybook renders stories from code and needs a rebuild to reflect changes; it cannot preview a contract edit.

## Decision

The portal renders tokens and components from the draft catalog at runtime. Editing a token injects new CSS variables. Editing a contract rerenders from the new data. No bundler runs in the browser. The same runtime renderer is what clients install, so there is one implementation; static code generation is a later optimization.

Editing works on contracts through forms: props, variants, anatomy, token bindings, usage rules, channel support. Editing component source code in the browser is out of scope.

The preview shows every channel emitter's output side by side (ADR 0006).

## Consequences

- Storybook is not adopted. If a story-style gallery is ever needed, it is a portal page over the catalog.
- The renderer must be data-driven, which is also what makes it portable across design systems stored in Elos.
