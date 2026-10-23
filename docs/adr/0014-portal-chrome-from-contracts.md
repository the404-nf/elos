# 0014. The portal chrome is composed from Resonant contracts

Status: Accepted, 2026-10-23

## Context

Roadmap Phase 1 item 1 asked for a visual pass on the portal with Impeccable. The critique scored the incumbent chrome 21/40 on Nielsen's heuristics and called it generic; the audit found that only color bound to tokens, that the components list broke hydration (cards were links wrapping live examples with their own links), that two Resonant pairs failed WCAG AA (white on red.500 at 3.9:1, amber.700 on its tint at 4.3:1), and that hand-written buttons, selects and chips had drifted from the contracts. The rule since ADR 0011 is that the portal is built from Resonant and edits Resonant; the chrome had not caught up with it.

## Decision

1. Portal screens are composed from typed wrappers over contracts (`createComponent` in `@elos/react`), one per contract the chrome needs, exported from `apps/portal/src/components/elos-client.tsx`. When a screen needs a component Resonant lacks, the contract is added first: this pass added `ds.nav` and `ds.nav-item`, and gave Button a `type`, Select, Input and Textarea a `value`, Stack an `xs` gap and Card a `heading` level.
2. A wrapper forwards host concerns to the root element: event handlers, `aria-*`, `data-*`, `id`, `title`, `form`, `style`, `list`, `defaultValue` and `inert`. A contract prop or slot with the same name wins, so `title` on Card and `list` on Nav stay what the contract says. A wrapper merges the decoration a parent slot gives it, so a wrapped Button still works as a dialog trigger.
3. `ElosProvider` takes an `elements` map from element name to host component. The portal maps `a` to Next's `Link`, so every contract anchor (links, breadcrumbs, nav items) is a soft navigation without any portal-side markup.
4. The only portal CSS is the structure between components (shell, grid, canvas, editor columns, prose) and it binds to token variables; the `:root` block in `globals.css` is a fallback for the one screen outside a system. Status, error and code colors come from tokens, so the dark overlay re-maps them.
5. The draft and version `files` columns are `json`, not `jsonb`. `jsonb` sorts object keys, which reordered anatomy parts (a card's body before its header) and slots. The directory format is order-sensitive.
6. Resonant is tuned where the critique showed it, in tokens: the danger action moved to red.600 with red.700 hover, warning text to a new amber.800, controls got `color.border.strong` (gray.500, 3:1 on both surfaces), and `font.family.mono` and `space.stack.xs` were added for the chrome.

`apps/portal/DESIGN.md` and `.impeccable/design.json` record the resulting look for Impeccable and for agents generating screens.

## Consequences

- Editing a contract in the portal changes the portal, including the panel the edit is made in. The part-selection outline is scoped to the preview canvas for that reason.
- The preview canvas, the color picker and the range slider in the token editor are still native elements; they become contracts when the roadmap's scale sliders land.
- Drafts seeded before this change were stored as `jsonb` and must be deleted (`apps/portal/.data`) so they reseed under the new column type.
- Left for later: search and filter over components and tokens, a keyboard shortcut for Save, the catalog CSS served as a linked stylesheet instead of an inline style per navigation, self-hosted Inter.
