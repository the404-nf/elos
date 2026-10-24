# Design decisions: icons

Design decision records for the Resonant icon set. Each record states one decision, the context it was made in, the options that were weighed and what follows from it. Reversals are new records that supersede the old one; records are never edited after acceptance except to mark them superseded. The working rules derived from these records are in `docs/icons.md`.

| DDR | Decision | Status |
|---|---|---|
| DDR-0001 | Resonant draws its own icons | Accepted |
| DDR-0002 | A 24 grid with a 2-unit stroke that scales with size | Accepted |
| DDR-0003 | Five icon sizes, 12 to 32 | Accepted |
| DDR-0004 | Icon shapes follow the system's radii | Accepted |
| DDR-0005 | Mono and accent through one variable | Accepted |
| DDR-0006 | Accent parts never meet mono strokes | Accepted |
| DDR-0007 | Spacing, fills and minimum sizes | Accepted |
| DDR-0008 | Design-tool icons join the set | Accepted |

---

## DDR-0001. Resonant draws its own icons

Status: Accepted, 2026-10-24
Decided by: Leandro, in the icon style review

### Context

The first Resonant mockups used outline glyphs in the style of a popular open-source set. The platform is a design-system product: its own icons are part of what it sells, and an agent composing screens from the catalog needs icons that belong to the same system as the components and tokens.

### Options considered

1. Adopt an open-source icon package and theme it.
2. Draw a custom set in the same visual language as the components.

### Decision

Draw our own set. No pre-existing packages, no third-party glyphs, no emoji.

### Consequences

- Every icon is designed against the same rules, so the set can grow without visual drift.
- The set has to be maintained: new needs mean drawing, not installing. The Icon style guide and the agent brief exist to make that cheap.
- Icons ship as files in `assets/icons/` and are documented on the Icon contract (`ds.icon`), like any other part of the system.

---

## DDR-0002. A 24 grid with a 2-unit stroke that scales with size

Status: Accepted, 2026-10-24
Decided by: Leandro, after comparing stroke weights side by side

### Context

Icons appear from 12px (badges) to 32px (empty states). A fixed pixel stroke looks heavy when small and thin when large; redrawing per size multiplies the work.

### Options considered

1. Fixed pixel stroke with per-size drawings.
2. Stroke in grid units, so it scales with the rendered size. Weights compared: 1.75, 2, 2.25 and 2.5 units.

### Decision

Every icon is drawn on a 24 by 24 grid with a live area of 2 to 22. The stroke is 2 grid units, one weight per icon, and scales with the icon: 1px at 12, 1.33 at 16, 1.67 at 20, 2 at 24, 2.67 at 32. The token is `icon-stroke`.

### Consequences

- One drawing per icon serves every size.
- `vector-effect: non-scaling-stroke` and pixel stroke widths are not allowed.
- 2 units read closest to the weight of the type in buttons and nav. 2.25 was closer to the first mockups at 16px but heavier at 32.

---

## DDR-0003. Five icon sizes, 12 to 32

Status: Accepted, 2026-10-24
Decided by: Leandro

### Context

The components need icons in dense places (badges, tables), in controls (buttons, nav, menus, fields) and as large marks (cards, empty states).

### Decision

Five sizes as tokens: `icon-size-xs` 12, `icon-size-sm` 16, `icon-size-md` 20 (the default), `icon-size-lg` 24, `icon-size-xl` 32. Menus and fields use sm, buttons and nav use md.

### Consequences

- Detailed icons that do not survive 12px are listed in the style guide and must be used at 16 or larger.
- No in-between sizes. A layout that wants 18px picks 16 or 20.

---

## DDR-0004. Icon shapes follow the system's radii

Status: Accepted, 2026-10-24
Decided by: Leandro, asked for in the brief ("keep in mind our radii")

### Context

Resonant is built from pills (buttons, chips, badges) and softly rounded containers (16px cards). Icons with sharp corners or square ends would read as a different family.

### Decision

- Round caps and round joins everywhere.
- Closed shapes take a 3-unit corner, the icon version of `radius-container`.
- Small inner parts (doors, rows, handles, bars, objects in align icons) are pills.
- Keyline shapes: circle 18 across, square 16, portrait 14 by 18, landscape 18 by 14, all with 3-unit corners.

### Consequences

- Icons and components share one shape language at every size.
- Shapes that are sharp by nature (play, warning, cursor) keep round joins, which softens their points.

---

## DDR-0005. Mono and accent through one variable

Status: Accepted, 2026-10-24
Decided by: Leandro ("keep the mono and accent versions as variables")

### Context

The brand pink is used for graphics, never for body text. Icons were reviewed in two versions: all in the text color, and with one part in pink. Both were wanted, for different contexts.

### Options considered

1. Two separate files per icon, mono and accent.
2. One file per icon, with the accent part reading a CSS variable.

### Decision

One file per icon. Mono parts use `currentColor`. At most one part per icon is the accent and reads `--icon-accent`, which falls back to `currentColor`. Setting `data-icon="accent"` on any ancestor turns it to `color-icon-accent` (the brand pink). Both modes work in dark and light.

### Consequences

- 119 files, not 238.
- Dense UI (menus, tables) stays mono by default; the accent is turned on per context, one or two icons per view at most.
- In `<img>` the icons render black; they are meant to be inlined.

---

## DDR-0006. Accent parts never meet mono strokes

Status: Accepted, 2026-10-24
Decided by: Leandro, in the review of the home, edit and settings icons

### Context

In the first draft, pink and white lines crossed: the pink door of `home` ran into the white floor, a pink band crossed the `edit` pencil, the pink knobs of `settings` sat on the white rails. At small sizes the crossings read as mistakes.

### Options considered

1. Allow crossings.
2. Let an accent part meet mono strokes end to end, by extending the accent along the outline. Tried on `home` by making the floor under the door pink as well.
3. Make accent parts float: they never cross, touch or end on a mono stroke.

### Decision

Option 3. Accent parts float, with at least 1 unit of air from every mono stroke. If a part has to connect to the outline, it stays mono.

- `home`: open floor. The walls curve into the floor and stop; the pink door stands in the gap. Option 2 was rejected because pink and white still met end to end, which left a visible seam at 12 and 16px.
- `edit`: the pink part became the eraser cap, floating off the pencil body. Leandro chose the eraser over the tip.
- `settings`: each rail stops short of its knob.

### Consequences

- Icons whose meaning needs a line through objects (the six align icons) stay fully mono; distribute icons put the accent on the free-standing middle object.
- `chart-line` is fully mono, because its arrowhead has to touch the line.
- The same rule applies to illustrations (see the illustration decisions).

---

## DDR-0007. Spacing, fills and minimum sizes

Status: Accepted, 2026-10-24
Decided by: proposed with the full set, accepted without changes

### Context

A 2-unit stroke leaves little room at 12px. Some subjects (an eraser cap, dots) close up if drawn as outlines.

### Decision

- At least 1 unit of air between any two strokes: centerlines 3 units apart.
- Fills only for small marks: dots, and caps like the pencil's eraser that would close up if stroked. No solid icon variants.
- Icons that need 16px or more are listed in the style guide: `keyboard`, `command`, `markdown`, `calendar`, `chat`, `gradient`, `opacity`, `palette`, `hand`.

### Consequences

- Every icon is checked at 12, 16, 20, 24 and 32 before it ships.
- The list of 16px-and-up icons grows with the set and is part of the review.

---

## DDR-0008. Design-tool icons join the set

Status: Accepted, 2026-10-24
Decided by: Leandro ("we'll need them, being a designers' platform")

### Context

The first full set (79 icons) covered the portal: navigation, actions, status, content and foundations. The platform's features serve designers: canvas work, layout, style properties, components and variants, review, breakpoints.

### Decision

Add 40 icons in five groups: Canvas, Layout, Style, System and Devices, for a set of 119. They follow DDR-0002 to DDR-0007 without exceptions. `component` is our own mark (a diamond with a pink dot), not the four-diamond mark known from Figma. `slot` is the only dashed icon, to read as an empty place to fill.

### Consequences

- New feature areas (libraries, theming, prototyping, publishing to design tools) are expected to add icons the same way.
- Group names are part of the documentation and of the asset order.
