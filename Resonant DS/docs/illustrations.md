# Illustration style guide

How Resonant's spot illustrations are drawn: minimal, technical, like a drawing in a spec. Use it to draw new ones by hand or to brief an agent, and to review them before they ship. Six illustrations set the style (empty components, agent connected, published, no results, contrast check, token chain); every new one follows the same rules. The decisions behind them are recorded as DDR-0009 to DDR-0016 in `docs/decisions/illustrations.md`.

## The set

- **States** (Empty, missing, blocked and broken.): `empty-components`, `no-results`, `no-access`, `offline`, `not-found`, `error`
- **Design systems** (Building and checking a system: directory, tokens, themes, blocks, audit.): `contrast-check`, `token-chain`, `import-directory`, `themes`, `blocks`, `audit-passed`, `new-system`
- **Versions** (Publishing, comparing and going back.): `published`, `diff-versions`, `rollback`
- **Serve and marketplace** (How the system reaches agents and channels, and the governed assets teams consume.): `agent-connected`, `channels`, `principles`
- **Canvas** (Composing screens with your own model and your own API.): `compose`, `openapi-binding`, `journey`

Files are in `assets/illustrations/`; every new one is added to its group there and on the Illustration contract (`ds.illustration`).

## The decisions, and why

| Decision | Value | Why |
|---|---|---|
| Canvas | 240 by 160 units (3:2) | One frame for every illustration, so they line up in empty states and dialogs. |
| Sizes | md 240 wide, lg 360 wide | Two sizes only. Lines scale with the drawing, like the icons. |
| Line weights | 1.5 for the subject, 1 for construction | Two weights, nothing else. |
| Caps and joins | Round | Matches the icons and the pill shapes. |
| Corners | 8 to 12 units on planes, pills fully round | Drawn from our radii: the drawing feels like the UI it lives in. |
| Subject | The product's own objects | Contracts, tokens, versions, agents, catalogs, swatches. No people, hands, faces or scenes. |
| Accent | One part, in `--il-accent` | The pink marks the point of the picture: the new tile, the check, the semantic token. Mono when `--il-accent` is unset. |
| Accent rule | The accent floats | It never crosses an ink line, the same as icon accents. Construction lines may cross anything. |
| Explaining | Grey construction | Guides, dimensions and connections are dashed grey lines with tick ends. They carry the "technical" feel. |
| Labels | JetBrains Mono (`font-family-mono`), 7 units, uppercase, grey | Names and numbers only ("v0.2.0", "7.2:1", "0 results"). Never sentences. |
| Grid | Dots every 8 units, fading out from the center | A soft texture that says "drawing board". |
| Grid strength | White at 20% in dark, ink at 14% in light | Tuned so both themes read equally soft. Earlier values were too strong in light and too weak in dark. |
| Knockout | Open shapes and labels block the grid | The grid never runs through copy or empty outlines. |
| Motion | Optional, one small thing | A dot travels along a construction line, a check drops in. Off under reduced motion. |
| Accessibility | Always `aria-hidden` | The heading and text next to it carry the message. |

## The five layers

Every element belongs to exactly one layer. Paint order is the list order.

| Layer | Class | Look | Token |
|---|---|---|---|
| Grid | `.gd` | Dots r 0.65 every 8 units, radial fade | `color-illustration-grid` |
| Construction | `.cs` (dashed), `.tk` (ticks, arrowheads) | 1 unit, dashed 3 3, round caps | `color-illustration-construction` |
| Plane | `.pl` | 1.5 ink outline, filled one surface step up | `color-illustration-line`, `color-illustration-plane` |
| Line | `.ln` | 1.5 ink, no fill | `color-illustration-line` |
| Accent | `.ac` (fill), `.acl` (stroke) | Pink, or ink when mono | `color-illustration-accent` through `--il-accent` |
| Label | `.lb` | JetBrains Mono 7, uppercase, +0.06em, grey, haloed in the ground color | `color-illustration-construction` |

Two helpers: `.cut` draws a line in the ground color across a pink fill (the plus on the new tile, the check on the badge), and `.gl` sets large glyphs like "Aa" in Inter Tight 800 (`font-family-display`) when the subject is type.

## Classes

```css
.il .ln  { fill: none; stroke: var(--color-illustration-line); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.il .pl  { fill: var(--color-illustration-plane); stroke: var(--color-illustration-line); stroke-width: 1.5; stroke-linejoin: round; }
.il .cs  { fill: none; stroke: var(--color-illustration-construction); stroke-width: 1; stroke-dasharray: 3 3; stroke-linecap: round; }
.il .tk  { fill: none; stroke: var(--color-illustration-construction); stroke-width: 1; stroke-linecap: round; }
.il .ac  { fill: var(--il-accent, var(--color-illustration-line)); }
.il .acl { fill: none; stroke: var(--il-accent, var(--color-illustration-line)); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.il .cut { fill: none; stroke: var(--il-ground); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.il .lb  { font: 500 7px var(--font-family-mono); letter-spacing: .06em; text-transform: uppercase; fill: var(--color-illustration-construction);
           paint-order: stroke; stroke: var(--il-ground); stroke-width: 3px; stroke-linejoin: round; }
.il .gl  { font: 800 22px var(--font-family-display); letter-spacing: -.03em; }
.il rect.cs, .il rect.acl, .il circle.acl { fill: var(--il-ground); }
.gd      { fill: var(--color-illustration-grid); }
[data-illustration="accent"] { --il-accent: var(--color-illustration-accent); }
```

`--il-ground` is the surface the illustration sits on: set it on the container (`var(--color-surface-overlay)` inside a card well or dialog, `var(--color-surface-raised)` on a card).

## Composition

- Center the subject on the canvas. Keep it inside 24 to 216 by 16 to 144; let the grid and construction lines run to the edges.
- One subject, one idea. Two or three objects at most, joined by construction lines.
- Planes are the objects; lines inside them are their content (rows as short pills, a circle, a mini shape). Content lines keep 6 units from the plane's edge.
- Explain with grey: a dimension line with ticks over a row of tiles, an arrow between tokens, a crosshair behind a lens.
- Labels sit on construction lines or just under objects, never on top of an ink line.
- The accent is the answer to "what is this picture about". If two parts compete, the picture is about two things: split it or pick one.

### Examples from the approval rounds

| Illustration | Accent | What explains it |
|---|---|---|
| empty-components | The new tile with a cut-out plus | Dimension line "contracts · 0", dashed empty slots |
| agent-connected | The dot travelling on the connection | Dashed link labelled "mcp" between catalog and agent |
| published | The check badge, floating off the corner | The older version as a dashed plane behind |
| no-results | The empty ring in the lens | Crosshair guides, label "0 results" |
| contrast-check | The pill around the ratio | Dimension line between the two swatches |
| token-chain | The semantic token | Arrows from primitive to semantic to component |

## Reference source

The token chain, as drawn. Every new illustration starts from this skeleton.

```svg
<svg class="il" viewBox="0 0 240 160" aria-hidden="true">
  <defs>
    <pattern id="il-dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle class="gd" cx="4" cy="4" r=".65"/></pattern>
    <radialGradient id="il-fade"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <mask id="il-mask"><rect width="240" height="160" fill="url(#il-fade)"/></mask>
  </defs>
  <rect width="240" height="160" fill="url(#il-dots)" mask="url(#il-mask)"/>
  <circle class="pl" cx="46" cy="76" r="18"/><circle class="ln" cx="46" cy="76" r="6"/>
  <path class="cs" d="M70 76h26"/><path class="tk" d="m91 72 5 4-5 4"/>
  <rect class="ac" x="102" y="58" width="36" height="36" rx="9"/><circle class="cut" cx="120" cy="76" r="6"/>
  <path class="cs" d="M144 76h26"/><path class="tk" d="m165 72 5 4-5 4"/>
  <rect class="pl" x="176" y="54" width="44" height="44" rx="10"/><rect class="ln" x="185" y="70" width="26" height="12" rx="6"/>
  <text class="lb" x="46" y="112" text-anchor="middle">primitive</text>
  <text class="lb" x="120" y="112" text-anchor="middle">semantic</text>
  <text class="lb" x="198" y="112" text-anchor="middle">component</text>
  <text class="lb" x="120" y="42" text-anchor="middle">color.accent</text>
</svg>
```

When several illustrations share a page, give the pattern, gradient and mask unique ids (or define them once in a hidden sprite).

## Motion

- At most one moving thing, and it moves along construction: a dot on a dashed path (CSS `offset-path`, class `il-travel`), or a badge dropping 6 units into place once (class `il-drop`).
- Loops last 2 to 3 seconds and ease in and out. Entrances run once.
- Motion is CSS, never SVG animation (`<animate>`, `<animateMotion>`), so variables control it: `--il-travel` and `--il-drop` hold the animation name or `none`. `data-motion="static"` sets both to `none`; reduced motion always does.
- Every moving illustration has a static version that makes sense on its own: a travelling dot rests at `--il-rest` (halfway by default), a dropped badge sits in place.

## Adding an illustration

1. Name it after the state it explains, kebab-case: `no-access`, `import-directory`, `audit-passed`.
2. Write one sentence: what the screen says, and which product object shows it.
3. Sketch the objects as planes on the grid, then the content lines, then the construction that explains them.
4. Choose the one accent. Float it at least 3 units from any ink line.
5. Add labels last, only names and numbers.
6. Render at 240 and 360 in dark and light, accent and mono, next to two existing illustrations.

## Review checklist

- [ ] 240 by 160 viewBox, subject inside 24 to 216 by 16 to 144
- [ ] Only the six classes plus `.cut` and `.gl`; no other colors, weights or dashes
- [ ] Two line weights: 1.5 and 1
- [ ] Planes 8 to 12 unit corners, pills fully round
- [ ] Exactly one accent, floating, the point of the picture
- [ ] Grid behind, knocked out by open shapes and labels
- [ ] Labels are mono names or numbers, grey, never sentences, never pink text
- [ ] No people, hands, faces, scenes, brand marks or third-party objects
- [ ] At most one motion, in CSS (`il-travel` or `il-drop`), with a static version that reads on its own
- [ ] Reads in dark and light, and still makes sense in mono

## Brief for an agent

> Draw a Resonant spot illustration named `<name>` for `<the screen and its message>`. 240 by 160 viewBox, subject centered inside 24 to 216 by 16 to 144. Use only these classes: `.pl` (planes: 1.5 ink outline, filled one surface up, 8 to 12 unit corners), `.ln` (1.5 ink lines, round caps), `.cs` (1 unit dashed 3 3 grey construction: guides, dimensions, connections), `.tk` (1 unit grey ticks and arrowheads), one accent element as `.ac` (fill) or `.acl` (stroke) that marks the point of the picture and stays 3 units from every ink line, `.cut` for lines cut through the accent, and `.lb` labels (JetBrains Mono 7, uppercase, names and numbers only). Start from the reference source in the illustration guide, keep its dot grid. Subjects are product objects (contracts, tokens, versions, catalogs, agents); no people. Optional: one motion along a construction line. Return the SVG and one sentence on what the accent marks.
