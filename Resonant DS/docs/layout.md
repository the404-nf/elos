# Layout guide

How Resonant screens are put together: the frame, the header, page grids, spacing, cards and states. The approved screens of 2026-10-24 (kept outside the repository) show the result. This guide gives the rules behind them, so a new screen looks like it belongs.

Measurements here use tokens. The approved screens are the reference for look and composition, not for exact pixels. Where they differ from a token (14px gutters, 22px card padding), the token wins.

## Principles

- **One loud surface per screen.** The Bloom header is where the pink lives. Everything under it is calm: flat surfaces, ink or white text, pink only in small graphic marks.
- **Every screen starts with the PageHead.** It names the page, says what it's for in one sentence, and holds at most two actions. No screen starts with a toolbar or a table.
- **Hierarchy comes from size and weight, not color.** Titles are Inter Tight and heavy. Supporting text is lighter and secondary. Pink never marks importance in text.
- **One primary action per screen.** It usually sits in the header. Everything else is secondary, ghost or glass.
- **Cards are fill steps, not shadows.** A card is one surface step up from the page. Shadows are only for things that float (menus, drawers, dialogs).
- **Nothing jumps.** Hover adds light, never movement. Motion explains a change or shows that something is loading.
- **Say it in the product's words.** Titles name the thing ("Components", "What changed"), never the pattern ("Card grid").

## The frame

```
┌ page (color-surface-canvas) ─────────────────────────────┐
│ ┌ Bloom header (radius-header) ────────────────────────┐ │
│ │ nav: logo · system switcher · links · search · theme │ │
│ │                                                      │ │
│ │ EYEBROW                                              │ │
│ │ Title                                    [actions]   │ │
│ │ Lead sentence                                        │ │
│ └──────────────────────────────────────────────────────┘ │
│  content: rows of cards, gutter space-stack-md           │
└──────────────────────────────────────────────────────────┘
```

- The page has `space-4` (16px) of padding on every side. The header sits inside it, so the canvas shows around its rounded corners.
- Content starts `space-stack-md` (16px) below the header and uses the same gutter between all cards and rows.
- The maximum content width follows the window. Long text lines are capped instead: leads at 560px, empty-state copy at 340px, body copy at about 640px.
- The app nav lives inside the header, on top of the Bloom. There is no separate top bar.

## The header (PageHead)

Use `ds.page-head`. Do not rebuild the gradient.

| Part | Rule |
|---|---|
| Nav row | Top of the header, aligned with its side padding. Logo, system switcher (glass pill), links (pills, the current one is `color-action-primary-*`), then search (glass, 220px or wider), theme toggle and avatar on the right. |
| Eyebrow | Mono, 12px, uppercase, +0.07em. The system name or a status: "RESONANT DS", "DESIGN SYSTEM · DRAFT". |
| Title | `page-title` (56px) on every page, `display` (104px) on Home only. |
| Lead | `lead` (17px), one sentence, 560px max. Home uses 19px. |
| Actions | Bottom right, aligned to the lead's baseline. At most two: one primary and one glass. |
| Extras | A segmented control (date range, theme), a "Sample data" label, or stat tiles (Home). Always on `color-surface-glass`. |

Padding:

- Pages: top `space-24` (96px, room for the nav), sides `space-8`, bottom `space-8`.
- Home: top 120px (`space-24` + `space-6`), sides `space-8`, bottom `space-8`.

Home splits the header into 1.3fr and 1fr. The title, lead and two calls to action sit on the left, and a 2 by 2 grid of glass stat tiles sits on the right, aligned to the bottom.

Detail pages put a breadcrumb above the title, and can put Tabs under the lead.

## Page types and grids

Every grid uses a `space-stack-md` (16px) gap. Columns use `minmax(0, …)` so long token names truncate instead of stretching the grid.

| Page | Structure |
|---|---|
| **Home** | Row 1: three cards at 1.2fr 1fr 1fr ("What changed", the featured "Agent ready" card, Components). Row 2: two equal cards ("Pick up where you left off", Versions). |
| **Dashboard** | Four KPI cards in one row. Then a chart card and a ranked list at 2fr 1fr. Then a row of three supporting cards (contrast to fix, channel coverage, recent activity). |
| **Library** (Components) | Filter chips with counts, a "+ parts used inside these" note and a search-by-intent field on one line. Then a grid of component cards: 4 columns, 2 below 1180px, 1 below 760px. |
| **List with sidebar** (Tokens) | Sidebar 230px (groups with mono counts, sticky) and a table card. Selecting a row opens a 360px drawer over the right edge; the list stays visible. |
| **Detail** (component) | Breadcrumb and Tabs in the header. Content splits 1fr and 1.3fr, or 1.6fr and 1fr: the live preview with variants on the wide side, props, anatomy and tokens on the other. |
| **Editor** | Three panes: 240px (structure or parts), the canvas, and a 330px inspector. Below 1180px they stack. A save bar appears at the bottom when there are unsaved changes. |

A new page type picks the closest one above. If none fits, write it down here before building it.

## Spacing

| Where | Token | Value |
|---|---|---|
| Page padding | `space-4` | 16px |
| Gutter between cards and rows | `space-stack-md` | 16px |
| Card padding | `space-inset-xl` | 24px |
| Card padding, dense (sidebars, panes, inspector) | `space-inset-lg` | 16px |
| Card title to content | `space-stack-md` | 16px |
| Between groups inside a card | `space-stack-lg` | 24px |
| Rows in a list or table | 10 to 12px vertical, `space-inset-lg` horizontal, a hairline (`color-border-subtle`) between rows | |
| Controls in a toolbar or chip row | `space-2` | 8px |
| Header internals: eyebrow to title, title to lead | `space-3` | 12px |
| Section break on long pages | `space-12` | 48px |

Use only these steps. If something needs 14 or 18, it takes the nearest token.

## Cards

- **Default:** `color-surface-raised`, `radius-container`, `space-inset-xl` padding, no border in dark, a 1px `color-border-subtle` inset line in light.
- **Title row:** card title (Inter Tight 15/700, sentence case) on the left, then on the right a quiet link ("View diff", "All versions") or a count. The link is Albert Sans 14/500 in `color-text-secondary`.
- **Wells:** content inside a card that needs its own ground (previews, code, mini components) sits on `color-surface-overlay` with `radius-inset`.
- **Interactive card:** a card that is a link gets the beam on hover and focus. No lift, no outside shadow. Don't put buttons inside a card that is a link.
- **Featured card:** one per view at most. It gets `gradient-edge` and `gradient-glow` and usually holds the agent or "what's next" message.
- **KPI card:** label (14/500 secondary), the number in `stat`, then one line of change in a status color with a word ("+18% vs last 30 days", "4 dark pairs fail").
- **Component card** (Library): a preview well, about 140px tall, on top. Then the name, one line of description, and a meta line ("4 variants · 3 sizes") with a status badge on the right.

## Tables and lists

- Tables live inside a card, with no outer border of their own.
- The header row is 12.5px, 600, secondary. Rows have a hairline on top.
- Names and values are mono. Values align right.
- Hover and selected rows tint with `color-accent-subtle` and get a 3px pink inset line on the left. The line is a graphic, not text color.
- Group rows (sticky sublabels like "Color · semantic") sit on `color-surface-overlay` with a count on the right.

## States

| State | Pattern |
|---|---|
| Empty | `.rs-empty` inside the card: an illustration (md, accent), a heading, one secondary sentence (340px max), one action. |
| Loading | Skeletons (`gradient-shimmer`) shaped like the real content. Charts show the loading wave and a mono "Loading …" label, then draw in. |
| Error | An Alert at the top of the affected card, with what happened and what to do. Never a full-page error for one failing card. |
| Unsaved changes | A save bar slides in at the bottom of the editor: a count of changes, "Discard" (ghost) and "Save to draft" (primary). |
| Draft | A pink "Draft" badge and the eyebrow "· DRAFT" in the header. |

## Responsive

- **Above 1180px:** full grids.
- **760 to 1180px:**
  - Three-column rows become two.
  - KPI rows become 2 by 2.
  - The editor stacks its panes.
  - The Tokens sidebar turns into a row of chips above the table.
- **Below 760px:**
  - Everything is one column.
  - The header title drops to about 40px (Home to about 56px).
  - Header actions move under the lead.
  - The nav links collapse into a menu.
- Gutters and card padding stay the same at every width. Only the columns change.

## Checklist for a new screen

- [ ] Starts with the PageHead: eyebrow, title, one-sentence lead, at most two actions
- [ ] One primary action on the screen
- [ ] Uses one of the page types, or this guide was updated first
- [ ] All gaps 16px (`space-stack-md`), card padding 24px or 16px when dense
- [ ] Cards are fill steps; shadows only on floating things
- [ ] At most one featured card, one gradient beyond the header
- [ ] Text is ink or white; pink only in the three allowed cases
- [ ] Names and values in mono; titles in Inter Tight; everything else Albert Sans
- [ ] Empty, loading and error states designed, not left blank
- [ ] Checked in dark and light, and at 1180 and 760px
