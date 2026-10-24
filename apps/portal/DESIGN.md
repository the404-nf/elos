---
name: Elos portal (Resonant DS)
description: The look of the Elos portal, which is built from and edits Resonant DS. Every value here is a Resonant token; the portal never carries a color of its own. Dark is the default theme, light the second.
colors:
  pink: "#ff3d8b"
  pink-strong-light: "#e0106b"
  pink-strong-dark: "#ff5c9a"
  pink-link-light: "#b0124f"
  pink-link-dark: "#ff8fbd"
  pink-tint: "#ffe3ee"
  pink-wash: "#fff4f8"
  bloom-ground-dark: "#1c0a14"
  bloom-ground-light: "#ff5c9a"
  coral: "#ff7a59"
  peach: "#ffd2a8"
  ink: "#0b0b0f"
  ink-soft: "#5c5b65"
  ink-faint: "#6b6a74"
  white: "#ffffff"
  paper: "#f7f6f8"
  sunken-light: "#efeef1"
  hairline-light: "#ececef"
  hairline-default-light: "#e2e1e6"
  night: "#0f0e12"
  night-raised: "#17161b"
  night-overlay: "#1d1c22"
  night-sunken: "#222128"
  hairline-dark: "#26252c"
  hairline-default-dark: "#302f37"
  mist: "#f5f4f7"
  mist-soft: "#a9a8b3"
  mist-faint: "#93929d"
  danger-red: "#e5484d"
  danger-red-pressed: "#c73b40"
  danger-red-deep: "#a32f33"
  danger-red-soft: "#ff8b8b"
  danger-red-tint: "#fde7e8"
  success-green: "#5fd39a"
  success-green-deep: "#1f7a45"
  success-green-tint: "#e1f5e8"
  warning-amber: "#f5c451"
  warning-amber-deep: "#805600"
  warning-amber-tint: "#fdf1d6"
  info-blue: "#8fb0ff"
  info-blue-deep: "#1c3ca8"
  info-blue-tint: "#e3ecff"
typography:
  display:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "104px"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  stat:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.45
  body:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: "Albert Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  eyebrow:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.07em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sm: "6px"
  md: "10px"
  field: "12px"
  inset: "12px"
  container: "16px"
  overlay: "16px"
  header: "22px"
  control: "999px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "24": "96px"
components:
  button-primary:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.white}"
    boxShadow: "0 0 0 1px #ff3d8ba6, 0 10px 30px -8px #ff3d8bbf"
  button-secondary:
    backgroundColor: "{colors.night-sunken}"
    textColor: "{colors.mist}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "42px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.mist}"
    border: "1px solid {colors.hairline-default-dark}"
    rounded: "{rounded.control}"
  button-glass:
    backgroundColor: "#ffffff1a"
    textColor: "{colors.mist}"
    backdropFilter: "blur(8px)"
    rounded: "{rounded.control}"
  button-danger:
    backgroundColor: "{colors.danger-red-pressed}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
  badge-accent:
    backgroundColor: "#ff3d8b2b"
    textColor: "{colors.pink-link-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  card:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.mist}"
    rounded: "{rounded.container}"
    padding: "24px"
  card-glass:
    backgroundColor: "#ffffff1a"
    textColor: "{colors.mist}"
    rounded: "{rounded.container}"
    padding: "16px"
  input:
    backgroundColor: "{colors.night-overlay}"
    textColor: "{colors.mist}"
    border: "1px solid {colors.hairline-default-dark}"
    rounded: "{rounded.field}"
    height: "42px"
    padding: "0 12px"
  input-focus:
    boxShadow: "0 0 0 1.5px #ff3d8b, 0 0 0 4px #ff3d8b2b"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.mist-soft}"
    typography: "{typography.caption}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  tab-selected:
    backgroundColor: "{colors.night-overlay}"
    textColor: "{colors.mist}"
  nav-item-current:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  page-head:
    backgroundColor: "{colors.bloom-ground-dark}"
    textColor: "{colors.mist}"
    rounded: "{rounded.header}"
    padding: "32px"
---

# Design System: Elos portal (Resonant DS)

## Overview

**Creative North Star: "One loud surface, everything else calm"**

Every screen starts with the Bloom: a header where the brand pink lives as a field of soft, slowly turning lights over a dark plum ground (a bright pink ground in light). Under it the page is quiet: near-black surfaces in dark, white and soft grey in light, text in ink or white, and pink only in small graphic marks (a switch, a progress bar, a dot on a badge, a row tint). The portal is built from Resonant and edits Resonant, so the chrome is nothing more than Resonant applied to a tool: when a token changes, the portal changes with it, including the screen the edit is made on.

Hierarchy comes from size and weight, not color. Titles are Inter Tight, heavy and tight; body and controls are Albert Sans; names, values and eyebrows are JetBrains Mono. Nothing jumps: hover adds light (a glow around a button, a beam running around a card), never movement.

**Key Characteristics:**
- Dark by default, light as a switch; both from the same tokens, light as the base and dark as the overlay.
- One pink (`pink`), used through semantic tokens only; primary buttons are white in dark and ink in light.
- Three faces with one job each: Inter Tight for titles, Albert Sans for everything read, JetBrains Mono for code and support.
- Flat surfaces that step up in fill (canvas, raised, overlay, sunken); shadows only on things that float.
- Tokens, not values: the portal's CSS binds to the `--color-*`, `--space-*`, `--radius-*`, `--type-*` and `--gradient-*` variables Resonant emits.

## Colors

A warm-grey ramp from near-black to white, one brand pink with a ramp around it, coral and peach that appear only at the end of a pink gradient, and status hues as tint-plus-deep pairs.

### Primary
- **Pink** (`pink`): graphics only: switch on, progress (`pink-strong-*` on a light track), selection dots, chart lines, the draft marker, hover tints. Pink text is allowed in three places: links (`pink-link-*`), the accent badge label on its tint, and display gradient text at 24px and up.
- **Bloom ground** (`bloom-ground-dark`, `bloom-ground-light`): the page head's ground, with `pink`, `pink-strong-dark`, `coral` and `peach` as the lights over it.

### Neutral
- **Ink** (`ink`): primary text in light, the primary button in light, the inverse surface in dark.
- **Mist** (`mist`, `mist-soft`, `mist-faint`): primary, secondary and tertiary text in dark; `mist` is also the primary button in dark.
- **Night** (`night`, `night-raised`, `night-overlay`, `night-sunken`): the dark canvas, cards, wells and fields, tracks and secondary buttons.
- **Paper** (`white`, `paper`, `sunken-light`): the light canvas, cards and tracks.
- **Hairlines** (`hairline-*`, `hairline-default-*`): subtle dividers and card edges in light (cards have no border in dark); default on fields and ghost buttons.

### Status
- **Danger**, **success**, **warning**, **info**: a soft foreground on a translucent tint in dark; a deep foreground on a pale tint in light. Always with a word.

### Named Rules
**The Three Pinks Rule.** Pink text only in links, the accent badge label and display gradient words. Everything else is ink or white.

**The One Loud Surface Rule.** The Bloom header is the only gradient field on a screen; below it at most one featured card carries the gradient edge and glow.

## Typography

**Display Font:** Inter Tight 800 for display (104), page titles (56) and stats (44); 700 for titles (22) and headings (17).
**Body Font:** Albert Sans: lead 17/500, body 15/400, label 14/600, caption 13/500.
**Label/Mono Font:** JetBrains Mono: eyebrows 12/500 uppercase at +0.07em; code 12/400.

**Character:** Big type is tight but not jammed (-0.03em at display, 0.92 to 0.98 leading). The scale jumps at the top and stays close at the bottom, so a screen reads as one title, one sentence, and quiet detail.

### Named Rules
**The Title Face Rule.** Inter Tight only on titles, numbers and headings. Never on body, labels or controls.

## Layout

The page pads 16px on every side; the Bloom header sits inside it with the app nav row on top (Elos, the system, the areas as pills, the theme toggle at the right), then eyebrow, title, lead and at most two actions, with glass tiles or tabs as extras. Content follows at a 16px gutter: rows of cards, each padded 24px (16px when dense). Page types from the layout guide: home (1.2fr 1fr 1fr, then 1.6fr 1fr), library (4 columns of component cards, 2 below 1180px, 1 below 760px), list with sidebar (tokens), detail (preview beside props), editor (structure, canvas, inspector). Columns change with width; gutters and padding do not.

## Elevation & Depth

Flat by default. A card is one fill step above the page; wells inside a card are one more. `shadow-overlay` is for menus, popovers, dialogs and drawers. The hover glows (`shadow-glow`, `shadow-glow-soft`) and the beam are light, not elevation.

### Named Rules
**The Fill Step Rule.** Depth is a surface step. A shadow means the element floats and can be dismissed.

## Shapes

Pills for everything you press or read as a tag (buttons, chips, badges, segmented tabs, nav items, switch, progress). 16px for containers (cards, panels, menus, dialogs). 12px for what sits inside a container and for fields. 22px for the Bloom header only. The focus ring is a solid 2px outline, offset 2px, white in dark and ink in light: never pink.

## Components

### Buttons
- **Shape:** pill, 42px tall (34 small, 50 large), Albert Sans 600.
- **Primary:** mist in dark, ink in light; glows pink on hover.
- **Secondary:** sunken fill; soft glow on hover.
- **Ghost:** transparent with a default hairline; for inline and tertiary actions.
- **Glass:** translucent with a blur; for actions on the Bloom header.
- **Danger:** danger red with white text; no glow.
- **Press:** scales to 0.97; nothing moves on hover.

### Badges
- **Style:** pill, 13px at 600, tint background with the hue's foreground; an optional 4px dot in the tone color; the accent tone is for product states (draft, MCP).

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** raised; glass on the Bloom header.
- **Shadow Strategy:** none; a subtle hairline in light only.
- **Internal Padding:** 24px (16px dense), 16px stack gap.
- **Interactive:** the beam, a light running around the border on hover and focus. No lift.

### Inputs / Fields
- **Style:** overlay surface, default hairline, 12px radius, 42px tall; placeholder in secondary text.
- **Focus:** a pink 1.5px edge with a soft halo, plus the shared focus ring on keyboard focus.
- **Error / Disabled:** danger border and a caption-size message; disabled is 0.5 opacity.

### Navigation
- **Nav row:** pills at 14/600, secondary at rest, sunken on hover; the current area is an inverted pill (primary background and foreground).
- **Tabs:** a segmented control: a sunken track, the selected tab raised to the overlay surface.
- **Breadcrumb:** caption size, secondary, the current page unlinked.

### Page head (signature)
The Bloom header, from `ds.page-head`: ground, four turning lights (48s per turn, dimmed to 62% in dark), grain, the nav row, eyebrow, title (display on home, page-title elsewhere), lead capped at 560px, actions bottom right, glass extras. Text on it is `color-text-on-bloom` only.

## Do's and Don'ts

### Do:
- **Do** start every screen with the page head: eyebrow, title, one-sentence lead, at most two actions.
- **Do** bind every color, space, radius and type value in the portal to a Resonant token variable.
- **Do** keep one primary button per screen.
- **Do** put names and values in mono, titles in Inter Tight, everything else in Albert Sans.

### Don't:
- **Don't** write a raw color or pixel value into portal styles; add a token to Resonant instead.
- **Don't** use pink for text, importance or state; pink is a graphic.
- **Don't** move anything on hover, or shadow a resting surface.
- **Don't** stack two Bloom headers or put one inside a card.
