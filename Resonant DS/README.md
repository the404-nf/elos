# Resonant DS

Resonant is the design system of the platform that stores design systems for people and AI agents, and the system its portal is built with. Every component is a JSON contract; the tokens, assets and documents here are the visual layer those contracts bind to. Dark is the default theme, light is the second.

## Principles

- **The contract is the component.** Props, anatomy, token bindings, states, accessibility and usage live in the contract. Each component page here documents its contract field by field, and lists the changes this system makes to it under "Changes in this system".
- **Bind to semantic tokens.** Components use `color-text-primary`, `radius-control`, `space-inset-lg`. Never a primitive like `color-pink-500` or a raw value.
- **One loud surface per screen.** The Bloom header is where the pink lives as a field. Everything under it is calm: near-black surfaces in dark, white and soft grey in light.
- **Nothing jumps.** Hover adds light (a glow, a beam), never movement. Things move only to explain a change: a switch flipping, a chart drawing, a timeline flowing.

## Voice

- Plain sentences, sentence case, action verbs on buttons: "Publish v0.2.0", "Copy for agent", "Save to draft".
- No exclamation marks, no emoji in product copy.
- Titles name the thing or the decision: "Delete project?", "What changed", never "Confirmation dialog".
- Numbers as numbers: "4 changes", "58 of 62 pairs pass".
- Meta lines join facts with a middle dot: "4 variants · 3 sizes".

## Color

The brand pink is `color-pink-500` (#ff3d8b). It appears through semantic tokens only:

- `color-accent` for graphics: switch on, progress, selection dots, chart lines, slider fills, the draft marker. `color-accent-strong` where the pink needs one more step of weight (progress on a light track, chart strokes).
- `color-accent-soft` and `color-accent-subtle` for tinted fills: accent badges, row hover, icon chips.
- `color-bloom-*` for the header gradient only.
- `color-gradient-*` are the stops of the system's gradients. The gradients themselves are `gradient.*` tokens; where each one goes is in `docs/gradients.md`. Pink always leads; coral and peach never appear on their own.

**Text is ink or white.** Body, labels, titles and buttons use `color-text-primary`, `color-text-secondary`, `color-text-tertiary`, `color-text-inverse` or `color-text-on-bloom`. Pink text is allowed in three cases only:

1. Inline links: `color-text-link`.
2. The accent badge label on its own tint: `color-status-accent-foreground` on `color-status-accent-background`.
3. Display gradient text at 24px and up: `color-gradient-text-start` to `color-gradient-text-end`. Never on labels or body.

Primary actions are ink in light and white in dark (`color-action-primary-*`), not pink: white text on the brand pink only reaches 3.3:1. When text must sit on a pink fill, use `color-text-on-accent` (ink).

Surfaces step up in this order: `color-surface-canvas` (the page), `color-surface-raised` (cards), `color-surface-overlay` (wells inside cards, fields, menus, dialogs), `color-surface-sunken` (tracks, secondary buttons). `color-surface-inverse` is for toasts and tooltips. On the Bloom header, controls sit on `color-surface-glass`.

Status colors (`color-status-{neutral|accent|info|success|warning|danger}-*`) always come with a word. A badge says "Fails", not just red.

## Type

Three families, each with one job:

- **Inter Tight** (`font-family-display`) for titles: display, page titles, big numbers, section, card and dialog titles.
- **Albert Sans** (`font-family-sans`) for everything else that is read: body, labels, buttons, nav, fields.
- **JetBrains Mono** (`font-family-mono`) for code and support: token names, values, eyebrows, kbd, chart axes.

All three load from Google Fonts: `system.json` lists the faces and the emitted `tokens.css` imports them.

- Hierarchy is weight and size together: `display` (104/800) on the home hero only, `page-title` (56/800) on the Bloom header, `stat` (44/800) for big numbers, `title` (22/700), `heading` (17/700), `lead` (17/500), `body` (15/400), `label` (14/600), `caption` (13/500).
- Large type is tight but not jammed: `display` at -0.03em, `page-title` and `stat` at -0.025em, with 0.92 to 0.98 leading.
- Card titles stay in sentence case. Mono caps are for eyebrows only.
- Eyebrows are JetBrains Mono, 12px, uppercase, +0.07em: "DESIGN SYSTEM · DRAFT".

## Spacing and layout

- A 4px scale: `space-1` (4) to `space-6` (24), then `space-8` (32), `space-12` (48), `space-24` (96).
- Cards pad `space-inset-xl` (24). Gutters between cards are `space-stack-md` (16). Rows inside cards are 11px tall padding with a hairline.
- The Bloom header sits inside the page with a `space-4` (16px) inset from the frame and `space-8` side padding.
- How screens are composed (header anatomy, page types and grids, spacing, cards, states, responsive) is in `layout.md`.

## Radius

- Pills for everything you press or read as a tag: buttons, chips, badges, segmented controls, nav items, switch, progress (`radius-control`, `radius-pill`).
- 16px for containers: cards, panels, menus, dialogs (`radius-container`, `radius-overlay`).
- 12px for what sits inside a container and for fields: wells, previews, code blocks, inputs (`radius-inset`, `radius-field`).
- 22px for the Bloom header only (`radius-header`). Never larger.

## Elevation

- Flat by default. Cards are a fill step, not a shadow.
- `shadow-overlay` for menus, popovers, dialogs and drawers.
- `shadow-glow` and `shadow-glow-soft` are hover states, not elevation.

## Motion

- Hover: color plus light. Primary buttons get `shadow-glow` (pink ring and glow); secondary, ghost and glass get `shadow-glow-soft`. Interactive cards get the beam: a light that runs around the border once every `motion-duration-beam`. No lift, no translate, no outside shadow.
- Press: buttons scale to 0.97 for `motion-duration-fast`.
- State: `motion-duration-fast` with `motion-easing-standard` for color; `motion-easing-spring` only for the switch thumb and segment indicators.
- Data: charts show a loading wave with a moving shimmer, then draw their line over `motion-duration-draw` with the fill revealed in step, then a pulsing end point. Timelines pulse the current dot and run a short light down the line.
- Ambient: the Bloom gradient turns once every `motion-duration-ambient` (48s).
- Everything stops under `prefers-reduced-motion`.

The recipes are in `docs/bloom-and-motion.md`.

## States

- Focus: a solid 2px `color-border-focus` outline with a 2px offset, white in dark and ink in light. Never pink, which disappears on the header and on accent fills.
- Field focus adds `shadow-field-focus`, a pink edge and soft halo, on top of the focus ring when focus came from the keyboard.
- Disabled is `opacity-disabled` (0.5) on the whole control.
- Invalid fields take a 1.5px `color-border-danger` edge plus an error line in `color-text-danger`.
- Selected rows and hovered rows tint with `color-accent-subtle`.

## Iconography

- Resonant draws its own icons: 119 of them, under `assets/icons/` and documented on the Icon contract (`ds.icon`). No third-party set, ever.
- 24 grid, stroke `icon-stroke` (2 grid units) that scales with size. Five sizes: `icon-size-xs` 12, `sm` 16, `md` 20 (default), `lg` 24, `xl` 32.
- Round caps and joins, 3-unit corners on closed shapes, pills for small inner parts, at least 1 unit of air between strokes.
- Icons are `currentColor`. One part per icon may be an accent: it turns `color-icon-accent` under `data-icon="accent"` and stays mono otherwise. Accent parts float and never touch mono strokes.
- No emoji.
- The full drawing rules, approval examples, file format, checklist and a brief for agents are in `docs/icons.md`.

## Illustrations

- Spot illustrations are drawn like a spec: product objects as planes and lines on a 240 by 160 grid, dashed grey construction that explains them, a soft dot grid, short mono labels, and one floating pink accent that marks the point of the picture.
- Colors come from `color-illustration-*` tokens, so they work in dark and light. The accent turns on with `data-illustration="accent"`.
- No people, hands or scenes. Always `aria-hidden`; the copy next to the illustration carries the message.
- 22 illustrations live in `assets/illustrations/` and on the Illustration contract (`ds.illustration`), grouped by States, Design systems, Versions, Serve and marketplace, and Canvas. Use them with the Empty state layout (`.rs-empty`) or a Dialog, one per view.
- The layers, classes, reference source, checklist and agent brief are in `docs/illustrations.md`.

## Logo

No logo is part of this system yet. Set the product name in Inter Tight 800 (`font-family-display`), tight tracking, in `color-text-primary` or `color-text-on-bloom`, next to a ring mark: a circle with a 6px border in the same color.

## Components

Action: Button. Form: Field, Input, Textarea, Select with Option, Checkbox, Radio group with Radio, Switch. Navigation: Link, Tabs with Tab and Tab panel, Breadcrumb with Breadcrumb item, Nav with Nav item. Layout: Card, Stack, Separator. Data display: Text, Avatar, Table with Table row and Table cell. Feedback: Badge, Alert, Toast, Progress, Skeleton. Overlay: Dialog, Tooltip, Popover, Menu with Menu item. Foundations: Gradient (the eight gradients). Media and layout: Page head (the Bloom header, `ds.page-head`), Icon (the 119-icon set, `ds.icon`) and Illustration (22 spot illustrations, `ds.illustration`).

Dialog, Tabs, Switch, Tooltip, Popover and Menu take their behavior from Zag.js behind the contract's API. Everything else is a native element.

## Using this system

- Read the component's contract before using it. "When not to use" and "Don't" are rules.
- Load the emitted `dist/tokens.css` and `dist/components.css`, or serve them from the portal (`/api/resonant/css`). Classes are `.ds-<component>__<part>`, props are `data-*` attributes, states are ARIA attributes.
- Set `data-theme="dark"` or `data-theme="light"` on the root. Light is the base the tokens describe; the portal opens in dark.
- One primary Button per view. At most one Page head per screen.
- Contract token paths map to CSS variables by replacing dots with dashes: `{color.action.primary.background}` is `var(--color-action-primary-background)`.
- Screens are composed with `docs/layout.md`: start with the Page head, pick a page type, use its grid and spacing, run the checklist.
- The decisions behind the icons and illustrations are design decision records in `docs/decisions/`; decisions about Elos itself are ADRs in the repository's `docs/adr/`.
