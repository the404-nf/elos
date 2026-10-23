---
name: Elos portal (Resonant DS)
description: The incumbent look of the Elos portal, which is built from and edits Resonant DS. Every value here is a Resonant token; the portal never carries a color of its own.
colors:
  action-blue: "#3161ff"
  action-blue-pressed: "#244dd6"
  action-blue-deep: "#1c3ca8"
  action-blue-tint: "#e3ecff"
  ink: "#1a1a21"
  ink-soft: "#5c5c69"
  ink-faint: "#9a9aa6"
  slate: "#2a2a33"
  hairline: "#d9d9df"
  hairline-strong: "#8a8a96"
  sunken: "#ececef"
  canvas: "#f7f7f8"
  paper: "#ffffff"
  night: "#0b0b0d"
  danger-red: "#e5484d"
  danger-red-pressed: "#c73b40"
  danger-red-deep: "#a32f33"
  danger-red-tint: "#fde7e8"
  success-green-deep: "#1f7a45"
  success-green-tint: "#e1f5e8"
  warning-amber-deep: "#9a6700"
  warning-amber-tint: "#fdf1d6"
typography:
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.5
  heading:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "4px"
  control: "8px"
  container: "12px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-pressed}"
  button-secondary:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.hairline}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-ghost-hover:
    backgroundColor: "{colors.sunken}"
  button-danger:
    backgroundColor: "{colors.danger-red-pressed}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-danger-hover:
    backgroundColor: "{colors.danger-red-deep}"
  badge-neutral:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.slate}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    padding: "12px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    padding: "8px 12px"
  tab-selected:
    textColor: "{colors.ink}"
---

# Design System: Elos portal (Resonant DS)

## Overview

**Creative North Star: "The Calibrated Workbench"**

The portal is a bench where a designer tunes a design system against real pages. Everything on it is an instrument or the thing being measured, so the chrome recedes and the catalog reads. Resonant describes itself as calm, precise and unhurried: neutral surfaces, one blue for action, status colors only where a state must be read, small radii, hairline borders, generous inset. The portal is built from Resonant and edits Resonant, so the portal's own look is nothing more than Resonant applied to a tool; when the system changes, the chrome changes with it.

Density is moderate: tables and lists run dense, editing panels stay roomy. Hierarchy comes from weight and surface, not size; the four type roles sit within a 13 to 20px band. Light is the base theme; dark is an overlay that swaps surfaces, text, borders and status tints and leaves the action blue alone.

**Key Characteristics:**
- One family (Inter), four roles, weight does the hierarchy work.
- One blue, used for actions, focus and the current selection only.
- Flat surfaces separated by hairlines; a shadow appears only under overlays.
- Tokens, not values: the portal's CSS binds to `--color-*`, `--space-*`, `--radius-*` variables that Resonant emits.

## Colors

A gray scale with a single cool action blue; status hues exist as tint-plus-deep pairs and never as decoration.

### Primary
- **Action blue** (`action-blue`): primary buttons, focus outlines, the selected tab's underline, inline links. Pressed state darkens to `action-blue-pressed`; `action-blue-deep` is the info foreground on the light tint; `action-blue-tint` is the info badge and alert background.

### Neutral
- **Ink** (`ink`): primary text, and the inverse surface for tooltips.
- **Ink soft** (`ink-soft`): secondary text, table headers, inactive navigation.
- **Ink faint** (`ink-faint`): secondary text in dark mode only; never on light surfaces.
- **Hairline** (`hairline`): every border and divider. One width, 1px.
- **Sunken** (`sunken`): secondary buttons, skeletons, table header rows, inline code.
- **Canvas** (`canvas`): page background and preview canvases.
- **Paper** (`paper`): cards, panels, inputs, the sidebar's current item.
- **Slate** and **Night** (`slate`, `night`): dark-mode raised surface and canvas.

### Status
- **Danger red** (`danger-red`, pressed `danger-red-pressed`, deep `danger-red-deep`, tint `danger-red-tint`): invalid borders use `danger-red`; danger buttons use `danger-red-pressed` at rest (the only step with 4.5:1 under white text) and `danger-red-deep` on hover; error text and danger badges use `danger-red-deep` on the tint.
- **Hairline strong** (`hairline-strong`): the boundary of inputs, selects and textareas, 3:1 against paper and canvas in both themes. Every other border stays `hairline`.
- **Success green** (`success-green-deep` on `success-green-tint`): stable status, success alerts.
- **Warning amber** (`warning-amber-deep` on `warning-amber-tint`): warnings and "needs review".

### Named Rules
**The One Blue Rule.** The action blue marks what the user can do next or where they are: primary action, focus, selection, link. It never tints a heading, a panel or a decoration.

**The Pair Rule.** A status color is always a background and foreground pair from the same hue; text on a tint is the hue's deep step, never gray.

## Typography

**Display Font:** none; the title role is Inter 600 at 20px.
**Body Font:** Inter (with system-ui, sans-serif)
**Label/Mono Font:** Inter 500 for controls; the platform monospace stack for token paths and code only.

**Character:** One family at close sizes. The scale ratio is roughly 1.15, so hierarchy reads through weight (400 body, 500 controls, 600 headings) and tone (ink versus ink soft) rather than size jumps.

### Hierarchy
- **Title** (600, 20px, 1.5): one per screen; the screen's name.
- **Heading** (600, 17px, 1.5): sections and panel titles.
- **Body** (400, 15px, 1.5): everything readable; prose measure 72ch.
- **Caption** (400, 13px, 1.5): descriptions, table headers, help text, metadata.
- **Label** (500, 15px): buttons and tabs; 13px in small controls.

### Named Rules
**The Close Sizes Rule.** No text on the portal is larger than 24px or smaller than 12px. Emphasis is weight or tone, never size.

## Layout

A sticky left sidebar (232px) on the paper tone with a hairline right edge holds the system's name and draft badge, the five areas as a Nav, and the theme switch at the foot; the main column sits on the canvas tone with a 24px inset and a 1280px cap. Below 760px the sidebar becomes a wrapping band (name, areas in a row, theme) and the grid collapses to one column. Every screen opens with the same header: breadcrumb when nested, title, one-line description, actions on the right. Editing screens are two columns: the component editor puts the preview first and a sticky panel at 280 to 360px on the right; the token editor puts the sticky Value and Chain panels first (280 to 340px) and the per-theme previews on the right; both collapse under 1100px. Listing screens use a card grid with 280px minimum columns and a 16px gap; component cards carry a 96px thumbnail canvas so rows align. Spacing follows the 4px scale: stack extra small 4, inset small 8, medium 12, large 16; stack small 8, medium 16, large 24.

## Elevation & Depth

Flat by default. Surfaces are distinguished by three tones (canvas, paper, sunken) and 1px hairlines; nothing at rest casts a shadow. Preview canvases are the canvas tone with a dashed hairline so a rendered component sits on the same ground it would ship on.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 8px 24px #0b0b0d26`): popovers, menus, toasts. Dialogs use a backdrop (`#0b0b0d99`) instead.

### Named Rules
**The Hairline Rule.** Depth is a 1px border or a tone step. A shadow means the element floats above the page and can be dismissed.

## Shapes

Three radii: 8px on controls (buttons, inputs, selects, tabs' hover), 12px on containers (cards, panels, dialogs, canvases), and a full pill on badges and switches. The 4px step is reserved for inline code and link focus outlines. Borders are 1px hairline everywhere; the only thicker stroke is the 2px focus outline, offset 2px, in action blue.

## Components

### Buttons
- **Shape:** 8px radius, 8px by 12px inset at medium, label at 500 weight.
- **Primary:** action blue with paper text; one per view.
- **Secondary:** sunken background with ink text.
- **Ghost:** transparent, sunken on hover; for inline and tertiary actions.
- **Danger:** danger red with paper text; never auto-focused.
- **Hover / Focus:** background steps one tone darker over 150ms; focus is the shared 2px outline. Disabled is 0.5 opacity on the whole control.

### Badges
- **Style:** pill, 13px at 500 weight, tint background with the hue's deep foreground; the label carries the meaning, never the color alone.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** paper on canvas.
- **Shadow Strategy:** none; hairline border.
- **Internal Padding:** 12px (medium) or 16px (large), 16px stack gap.

### Inputs / Fields
- **Style:** paper background, strong hairline border, 8px radius, 8px by 12px inset, body size; placeholder in ink soft.
- **Focus:** border turns action blue plus the 2px outline.
- **Error / Disabled:** border turns danger red with a caption-size message beneath; disabled is 0.5 opacity.

### Navigation
- **Sidebar (Nav):** five items at body size and 500 weight, ink soft at rest, sunken on hover, sunken plus ink at 600 when current, with `aria-current`; 8px radius, 36px tall.
- **Tabs:** 500 weight, ink soft, ink plus a 1px action-blue underline when selected; no background.
- **Breadcrumb:** caption size, ink soft, the current page unlinked.

### Preview canvas (signature)
A dashed hairline rectangle in the canvas tone that contains rendered components and pages. Clicking a part outlines it with a 2px dashed action-blue outline, which is how the editor selects anatomy.

## Do's and Don'ts

### Do:
- **Do** bind every color, space, radius and type value in the portal to a Resonant token variable.
- **Do** keep one primary button per screen and put it last in a row of actions.
- **Do** show the current place twice: the sidebar item and the breadcrumb or title.
- **Do** separate groups with spacing first and a hairline only when they still blur.

### Don't:
- **Don't** write a raw color or pixel value into portal styles; add a token to Resonant instead.
- **Don't** use the action blue for anything that is not an action, focus, selection or link.
- **Don't** add shadows to resting surfaces or nest cards inside cards.
- **Don't** use exclamation marks, emoji or a component's name as a title in product copy.
