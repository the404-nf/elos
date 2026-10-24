# Design decisions: illustrations

Design decision records for Resonant's spot illustrations. Numbering continues from the icon decisions. Reversals are new records that supersede the old one. The working rules derived from these records are in `docs/illustrations.md`.

| DDR | Decision | Status |
|---|---|---|
| DDR-0009 | Illustrations are drawn like a spec | Accepted |
| DDR-0010 | One canvas, two weights, two sizes | Accepted |
| DDR-0011 | Five layers, colored by tokens | Accepted |
| DDR-0012 | One floating accent marks the point | Accepted |
| DDR-0013 | A soft dot grid that never runs through content | Accepted |
| DDR-0014 | Labels are data, illustrations are decorative | Accepted |
| DDR-0015 | One small, optional motion | Accepted |
| DDR-0016 | Motion and static versions through variables | Accepted |

---

## DDR-0009. Illustrations are drawn like a spec

Status: Accepted, 2026-10-24
Decided by: Leandro, brief "minimal, technical, we can work with accents" and approval of the six first illustrations

### Context

Empty states, results and confirmations need pictures. The product is a tool for designers and agents; its brand is calm on the surface with one loud pink. Illustration styles with characters, scenes or gradients would compete with the Bloom header and date quickly.

### Options considered

1. Character or scene illustrations.
2. Abstract shapes in brand colors.
3. Technical line drawings of the product's own objects, with construction lines and measurements, like a page from a spec.

### Decision

Option 3. Subjects are the product's objects: contracts, tokens, versions, catalogs, agents, swatches. No people, hands, faces or scenes.

### Consequences

- Each illustration explains the state it belongs to, instead of decorating it.
- The set stays consistent with the icons: same caps, same radii, same accent logic.
- Some states (no access, offline) need a product object to stand for them; the brief for each says which.

---

## DDR-0010. One canvas, two weights, two sizes

Status: Accepted, 2026-10-24
Decided by: proposed with the first six, accepted

### Context

Illustrations sit in empty states, dialogs and cards. They need to line up with each other and scale without redrawing, the way icons do (DDR-0002).

### Decision

- Canvas 240 by 160 units (3:2). Subject inside 24 to 216 by 16 to 144.
- Two sizes: md 240 wide, lg 360 wide. Lines scale with the drawing.
- Two line weights: 1.5 units for the subject, 1 unit for construction. Nothing else.
- Round caps and joins. Planes take 8 to 12 unit corners, pills are fully round.

### Consequences

- At lg every line is 1.5 times heavier, which keeps the drawing's density the same.
- A new weight, a third size or another aspect ratio needs a new record.

---

## DDR-0011. Five layers, colored by tokens

Status: Accepted, 2026-10-24
Decided by: proposed with the first six, accepted; tokens added when the decisions were documented

### Context

Illustrations have to work in dark and light, and anyone drawing a new one needs a closed vocabulary.

### Decision

Every element belongs to one layer, painted in this order:

1. Grid: dots every 8 units (`color-illustration-grid`).
2. Construction: dashed 3 3 guides, dimensions and connections, and solid ticks and arrowheads, 1 unit (`color-illustration-construction`).
3. Planes: 1.5 outline in `color-illustration-line`, filled with `color-illustration-plane`, one surface step above the card.
4. Lines: 1.5 in `color-illustration-line`.
5. Accent: fill or stroke in `--il-accent`, which is `color-illustration-accent` under `data-illustration="accent"` and the line color otherwise.

Labels use the construction color. Drawing classes: `.gd`, `.cs`, `.tk`, `.pl`, `.ln`, `.ac`, `.acl`, `.lb`, plus `.cut` (a line in the ground color across a pink fill) and `.gl` (large type glyphs).

### Consequences

- Every illustration works in both themes without per-theme drawings.
- A new color in an illustration means a new token and a new record.

---

## DDR-0012. One floating accent marks the point

Status: Accepted, 2026-10-24
Decided by: Leandro, approval of the six first illustrations

### Context

The icon decisions limit pink to one floating part (DDR-0005, DDR-0006). Illustrations are larger and could carry more pink, but more pink would compete with the Bloom header and with primary actions.

### Decision

Exactly one accent element per illustration. It marks the point of the picture: the new tile in an empty library, the check on a published version, the semantic token in a chain, the dot travelling between catalog and agent. It floats: at least 3 units from any ink line. Construction lines may cross anything, the accent included. Pink is never used for text.

### Consequences

- If two parts compete for the accent, the picture is about two things and is split or simplified.
- In mono mode the accent turns the line color and the drawing still reads.

---

## DDR-0013. A soft dot grid that never runs through content

Status: Accepted, 2026-10-24
Decided by: Leandro, over two review rounds

### Context

The first version drew the grid at full strength and it ran through labels and open shapes. The first fix lowered it, but a scoping mistake meant the dots ignored the theme and stayed black: too strong in light, nearly invisible in dark.

### Options considered

1. Drop the grid.
2. Keep it behind the large illustrations only.
3. Keep it behind every illustration, tuned per theme, and block it behind content.

### Decision

Option 3.

- Dots every 8 units, radius 0.65, fading out from the center.
- Strength per theme: white at 20% in dark, ink at 14% in light, chosen so both read equally soft.
- Open shapes (dashed slots, outlined pills and rings) are filled with the ground color, and labels get a 3px halo in the ground color, so the grid stops at anything drawn.

### Consequences

- The container sets `--il-ground` to the surface the illustration sits on.
- The grid's color is a token, `color-illustration-grid`; changing its strength is a token edit, not a redraw.

---

## DDR-0014. Labels are data, illustrations are decorative

Status: Accepted, 2026-10-24
Decided by: proposed with the first six; kept by default after review, not objected to

### Context

Small mono labels ("v0.2.0", "7.2:1", "0 results") give the drawings their blueprint feel. They are also text that has to be kept true and could be mistaken for content.

### Decision

- Labels are set in the mono family (`font-family-mono`; Geist Mono when decided, JetBrains Mono since the type update), 7 units, uppercase, +0.06em, in the construction color. Names and numbers only, never sentences.
- Every illustration is `aria-hidden`. The heading and text next to it carry the message; labels repeat nothing essential.

### Consequences

- Labels at 7 units are small on purpose and are not held to text contrast, because they are not read by assistive technology and carry no unique information.
- If a label ever needs to be read, it moves into the copy next to the illustration.

---

## DDR-0015. One small, optional motion

Status: Accepted, 2026-10-24
Decided by: proposed with the first six, accepted

### Context

The system already uses motion to explain changes (the chart draw, the timeline light, the hover beam). Illustrations could move too, but busy loops next to copy are distracting.

### Decision

At most one moving thing per illustration, and it moves along construction: a dot travelling on a connection (2 to 3 second loop, eased), or a badge dropping 6 units into place once with `motion-easing-spring`. Everything stops under `prefers-reduced-motion`, and the still frame must make sense on its own.

### Consequences

- Motion is a property of the illustration, not of the page around it.
- The motion toggle on review pages and the reduced-motion preference both show the still frame.

---

## DDR-0016. Motion and static versions through variables

Status: Accepted, 2026-10-24
Decided by: Leandro ("deal with this motion issue with variables, one version with motion and one static")
Refines: DDR-0015

### Context

The first moving illustrations used SVG animation (`<animateMotion>`, `<animateTransform>`). CSS cannot stop SVG animation, so honoring reduced motion needed a script, and there was no simple way to ask for a still version.

### Options considered

1. Keep SVG animation and ship a pause script.
2. Ship two files per moving illustration, one animated and one still.
3. Move the motion to CSS (`offset-path` for travelling dots, a keyframed transform for drops) and switch it with variables.

### Decision

Option 3. Motion lives in CSS classes (`il-travel`, `il-drop`) whose animation names come from `--il-travel` and `--il-drop`. `data-motion="static"` on any ancestor sets both to `none` and shows the static version; `prefers-reduced-motion: reduce` always does. The static version is a designed frame: a travelling dot rests at `--il-rest` (halfway along its path), a dropped badge sits in place.

### Consequences

- One file per illustration, two versions, no script.
- New moving illustrations must use the two classes and define a meaningful rest position.
- Through `<img>`, some browsers show the first frame of the animation rather than the rest frame; inline the SVG where the still frame matters.
